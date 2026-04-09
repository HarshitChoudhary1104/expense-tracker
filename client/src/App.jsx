// client/src/App.jsx
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  PlusCircle, Trash2, TrendingUp, DollarSign,
  Filter, AlertTriangle, LayoutDashboard
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CATEGORY_COLORS = {
  Food:          '#6366f1',
  Travel:        '#06b6d4',
  Bills:         '#f59e0b',
  Shopping:      '#ec4899',
  Health:        '#10b981',
  Entertainment: '#8b5cf6',
  Education:     '#3b82f6',
  Other:         '#6b7280',
};

const CATEGORIES = Object.keys(CATEGORY_COLORS);

// ── Sub-components ──────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function AddExpenseForm({ onAdd }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [form, setForm] = useState({
    amount: '', category: 'Food', date: today, note: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.amount || Number(form.amount) <= 0)
      return setError('Enter a valid amount.');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/expenses`, {
        ...form, amount: parseFloat(form.amount)
      });
      onAdd(data);
      setForm({ amount: '', category: 'Food', date: today, note: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add expense.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <PlusCircle size={20} className="text-indigo-500" />
        Add Expense
      </h2>

      {error && (
        <div className="mb-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Amount */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Amount (₹)
            </label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Date
          </label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Note (optional)
          </label>
          <input
            type="text"
            name="note"
            value={form.note}
            onChange={handleChange}
            placeholder="e.g. Dinner with team"
            maxLength={120}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
        >
          {loading ? 'Adding...' : 'Add Expense'}
        </button>
      </form>
    </div>
  );
}

function ExpenseList({ expenses, onDelete }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Recent Expenses</h2>
      </div>

      {expenses.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-400 text-sm">
          No expenses yet. Add one above!
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {expenses.map(exp => (
            <li key={exp.id}
              className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: CATEGORY_COLORS[exp.category] || '#6b7280' }}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {exp.note || exp.category}
                  </p>
                  <p className="text-xs text-gray-400">
                    {exp.category} · {format(parseISO(exp.date), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-800">
                  ₹{Number(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <button
                  onClick={() => onDelete(exp.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function InsightsDashboard({ insights }) {
  if (!insights) return null;
  const { byCategory, monthly, stats, alerts } = insights;

  const donutData = {
    labels: byCategory.map(c => c.category),
    datasets: [{
      data: byCategory.map(c => c.total),
      backgroundColor: byCategory.map(c => CATEGORY_COLORS[c.category] || '#6b7280'),
      borderWidth: 0,
    }]
  };

  const barData = {
    labels: monthly.map(m => m.month),
    datasets: [{
      label: 'Monthly Spend (₹)',
      data: monthly.map(m => m.total),
      backgroundColor: '#6366f133',
      borderColor: '#6366f1',
      borderWidth: 2,
      borderRadius: 6,
    }]
  };

  const fmt = n =>
    Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <div className="space-y-5">
      {/* Budget Alerts */}
      {alerts?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
            <AlertTriangle size={16} /> Budget Alerts
          </p>
          {alerts.map(a => (
            <div key={a.category} className="flex justify-between text-xs text-amber-700">
              <span>{a.category}</span>
              <span>{a.percentage}% of ₹{fmt(a.limit)} limit {a.over_budget ? '⚠️ Over!' : ''}</span>
            </div>
          ))}
        </div>
      )}

      {/* Category Doughnut */}
      {byCategory.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Spending by Category</h3>
          <div className="max-w-xs mx-auto">
            <Doughnut data={donutData} options={{
              plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
              cutout: '68%'
            }} />
          </div>
        </div>
      )}

      {/* Monthly Bar */}
      {monthly.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Trend</h3>
          <Bar data={barData} options={{
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { color: '#f3f4f6' } }, x: { grid: { display: false } } }
          }} />
        </div>
      )}

      {/* Category breakdown table */}
      {byCategory.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Category Breakdown</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-50">
                <th className="px-5 py-2 text-left font-medium">Category</th>
                <th className="px-5 py-2 text-right font-medium">Txns</th>
                <th className="px-5 py-2 text-right font-medium">Total</th>
                <th className="px-5 py-2 text-right font-medium">Avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {byCategory.map(c => (
                <tr key={c.category} className="hover:bg-gray-50">
                  <td className="px-5 py-2.5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block"
                      style={{ background: CATEGORY_COLORS[c.category] }} />
                    {c.category}
                  </td>
                  <td className="px-5 py-2.5 text-right text-gray-500">{c.count}</td>
                  <td className="px-5 py-2.5 text-right font-medium">₹{fmt(c.total)}</td>
                  <td className="px-5 py-2.5 text-right text-gray-500">₹{fmt(c.average)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main App ────────────────────────────────────────────────────

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [insights, setInsights] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [activeTab, setActiveTab] = useState('expenses');
  const [filters, setFilters] = useState({ search: '', category: '', from: '', to: '' });

  const fetchExpenses = useCallback(async () => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v)
    );
    const { data } = await axios.get(`${API}/expenses`, { params });
    setExpenses(data.expenses);
    setTotalAmount(data.total_amount);
  }, [filters]);

  const fetchInsights = useCallback(async () => {
    const { data } = await axios.get(`${API}/insights`);
    setInsights(data);
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  const handleAdd = (expense) => {
    setExpenses(prev => [expense, ...prev]);
    setTotalAmount(prev => prev + expense.amount);
    fetchInsights();
  };

  const handleDelete = async (id) => {
    const expense = expenses.find(e => e.id === id);
    await axios.delete(`${API}/expenses/${id}`);
    setExpenses(prev => prev.filter(e => e.id !== id));
    if (expense) setTotalAmount(prev => prev - expense.amount);
    fetchInsights();
  };

  const fmt = n =>
    Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard size={22} className="text-indigo-600" />
          <h1 className="text-lg font-bold text-gray-900">ExpenseIQ</h1>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full">
          <DollarSign size={14} className="text-indigo-600" />
          <span className="text-sm font-semibold text-indigo-700">
            Total: ₹{fmt(totalAmount)}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={DollarSign} label="Total Spent" color="bg-indigo-500"
            value={`₹${fmt(totalAmount)}`} />
          <StatCard icon={TrendingUp} label="Transactions" color="bg-emerald-500"
            value={expenses.length} />
          <StatCard icon={Filter} label="Categories Used" color="bg-violet-500"
            value={new Set(expenses.map(e => e.category)).size} />
          <StatCard icon={TrendingUp} label="Avg Transaction" color="bg-amber-500"
            value={expenses.length ? `₹${fmt(totalAmount / expenses.length)}` : '—'} />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
          {['expenses', 'insights'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-1.5 rounded-lg text-sm font-medium capitalize transition-all
                ${activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'expenses' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left: Add Form */}
            <div className="lg:col-span-1 space-y-4">
              <AddExpenseForm onAdd={handleAdd} />

              {/* Search & Filter */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
                <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Filter size={15} /> Filter
                </h2>
                <input
                  type="text"
                  placeholder="Search notes or category..."
                  value={filters.search}
                  onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <select
                  value={filters.category}
                  onChange={e => setFilters(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">All categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={filters.from}
                    onChange={e => setFilters(p => ({ ...p, from: e.target.value }))}
                    className="px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <input type="date" value={filters.to}
                    onChange={e => setFilters(p => ({ ...p, to: e.target.value }))}
                    className="px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                {Object.values(filters).some(v => v) && (
                  <button
                    onClick={() => setFilters({ search: '', category: '', from: '', to: '' })}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Right: Expense List */}
            <div className="lg:col-span-2">
              <ExpenseList expenses={expenses} onDelete={handleDelete} />
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <InsightsDashboard insights={insights} />
        )}
      </main>
    </div>
  );
}
