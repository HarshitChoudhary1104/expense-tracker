// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@libsql/client/http');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// ── Database Setup (Turso) ──────────────────────────────────────
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Create tables on startup
async function initDB() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS expenses (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      amount      REAL    NOT NULL CHECK(amount > 0),
      category    TEXT    NOT NULL,
      date        TEXT    NOT NULL,
      note        TEXT    DEFAULT '',
      created_at  TEXT    DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS budgets (
      category    TEXT PRIMARY KEY,
      monthly_limit REAL NOT NULL
    )
  `);
  console.log('✅ Database tables initialized');
}

initDB().catch(err => {
  console.error('⚠️ DB init warning:', err.message);
  console.log('Will retry on first request...');
});

// ── Constants ───────────────────────────────────────────────────
const VALID_CATEGORIES = [
  'Food', 'Travel', 'Bills', 'Shopping',
  'Health', 'Entertainment', 'Education', 'Other'
];

// ── Helper Functions ────────────────────────────────────────────
function buildFilters(query) {
  const conditions = [];
  const args = {};

  if (query.category) {
    conditions.push('category = :category');
    args.category = query.category;
  }
  if (query.from) {
    conditions.push('date >= :from');
    args.from = query.from;
  }
  if (query.to) {
    conditions.push('date <= :to');
    args.to = query.to;
  }
  if (query.search) {
    conditions.push('(note LIKE :search OR category LIKE :search)');
    args.search = `%${query.search}%`;
  }

  return {
    clause: conditions.length ? 'WHERE ' + conditions.join(' AND ') : '',
    args
  };
}

// ── Routes ──────────────────────────────────────────────────────

// GET /api/expenses — list with optional filters
app.get('/api/expenses', async (req, res) => {
  try {
    const { clause, args } = buildFilters(req.query);
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const offset = parseInt(req.query.offset) || 0;

    const result = await db.execute({
      sql: `SELECT * FROM expenses ${clause}
            ORDER BY date DESC, created_at DESC
            LIMIT :limit OFFSET :offset`,
      args: { ...args, limit, offset }
    });

    const total = await db.execute({
      sql: `SELECT COUNT(*) as count, SUM(amount) as sum
            FROM expenses ${clause}`,
      args
    });

    res.json({
      expenses: result.rows,
      total_count: total.rows[0].count,
      total_amount: total.rows[0].sum || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/expenses — create a new expense
app.post('/api/expenses', async (req, res) => {
  const { amount, category, date, note } = req.body;

  if (!amount || !category || !date)
    return res.status(400).json({ error: 'amount, category, and date are required' });

  if (!VALID_CATEGORIES.includes(category))
    return res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });

  if (isNaN(amount) || Number(amount) <= 0)
    return res.status(400).json({ error: 'Amount must be a positive number' });

  try {
    const result = await db.execute({
      sql: `INSERT INTO expenses (amount, category, date, note)
            VALUES (?, ?, ?, ?)`,
      args: [Number(amount), category, date, note || '']
    });

    const newExpense = await db.execute({
      sql: 'SELECT * FROM expenses WHERE id = ?',
      args: [result.lastInsertRowid]
    });

    res.status(201).json(newExpense.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/expenses/:id — remove an expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM expenses WHERE id = ?',
      args: [req.params.id]
    });

    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Expense not found' });

    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/insights — category summaries + monthly breakdown
app.get('/api/insights', async (req, res) => {
  try {
    // Category-wise totals
    const byCategory = await db.execute(`
      SELECT category,
             COUNT(*)        as count,
             SUM(amount)     as total,
             AVG(amount)     as average,
             MAX(amount)     as max_expense
      FROM expenses
      GROUP BY category
      ORDER BY total DESC
    `);

    // Monthly totals (last 6 months)
    const monthly = await db.execute(`
      SELECT strftime('%Y-%m', date) as month,
             SUM(amount)             as total,
             COUNT(*)                as count
      FROM expenses
      WHERE date >= date('now', '-6 months')
      GROUP BY month
      ORDER BY month ASC
    `);

    // Weekly totals (last 8 weeks)
    const weekly = await db.execute(`
      SELECT strftime('%Y-W%W', date) as week,
             SUM(amount)              as total,
             COUNT(*)                 as count
      FROM expenses
      WHERE date >= date('now', '-56 days')
      GROUP BY week
      ORDER BY week ASC
    `);

    // Overall stats
    const stats = await db.execute(`
      SELECT COUNT(*)    as total_count,
             SUM(amount) as total_spent,
             AVG(amount) as avg_transaction,
             MAX(amount) as largest_expense,
             MIN(amount) as smallest_expense
      FROM expenses
    `);

    // Budget alerts
    const budgets = await db.execute(`
      SELECT b.category,
             b.monthly_limit,
             COALESCE(SUM(e.amount), 0) as spent_this_month
      FROM budgets b
      LEFT JOIN expenses e
        ON e.category = b.category
        AND strftime('%Y-%m', e.date) = strftime('%Y-%m', 'now')
      GROUP BY b.category
    `);

    const alerts = budgets.rows
      .filter(b => b.spent_this_month >= b.monthly_limit * 0.8)
      .map(b => ({
        category: b.category,
        limit: b.monthly_limit,
        spent: b.spent_this_month,
        percentage: Math.round((b.spent_this_month / b.monthly_limit) * 100),
        over_budget: b.spent_this_month > b.monthly_limit
      }));

    res.json({
      byCategory: byCategory.rows,
      monthly: monthly.rows,
      weekly: weekly.rows,
      stats: stats.rows[0],
      alerts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/budgets — set a monthly budget for a category
app.post('/api/budgets', async (req, res) => {
  const { category, monthly_limit } = req.body;
  if (!category || !monthly_limit)
    return res.status(400).json({ error: 'category and monthly_limit are required' });

  try {
    await db.execute({
      sql: `INSERT INTO budgets (category, monthly_limit)
            VALUES (?, ?)
            ON CONFLICT(category) DO UPDATE SET monthly_limit = excluded.monthly_limit`,
      args: [category, Number(monthly_limit)]
    });

    res.json({ success: true, category, monthly_limit: Number(monthly_limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/categories — return valid categories
app.get('/api/categories', (_, res) => {
  res.json({ categories: VALID_CATEGORIES });
});

// ── Start Server ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
