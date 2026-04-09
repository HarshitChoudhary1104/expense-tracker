require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3001;

// Environment-aware CORS configuration
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

// Production-safe SQLite path
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'expenses.db');
const db = new Database(DB_PATH);

// TODO: Add routes here

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
