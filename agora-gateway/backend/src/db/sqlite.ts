import Database from 'better-sqlite3';
import path from 'path';

// Resolve relative to this file so Claude Desktop finds the right DB regardless of CWD
const dbPath = path.resolve(__dirname, '../../agora_gateway.db');
const db = new Database(dbPath, { verbose: console.log });

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS merchants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    base_url TEXT NOT NULL,
    endpoints_json TEXT NOT NULL,
    fields_mapping_json TEXT NOT NULL,
    upsell_rules_json TEXT,
    is_smb INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS smb_orders (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL,
    items_json TEXT NOT NULL,
    status TEXT DEFAULT 'Processing',
    tracking_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Virtual table for semantic similarity routing (FTS5 BM25)
  CREATE VIRTUAL TABLE IF NOT EXISTS merchant_fts USING fts5(
    merchant_id UNINDEXED,
    name,
    description,
    categories
  );

  CREATE TABLE IF NOT EXISTS ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    agent_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    intent_rationale TEXT,
    merchant_id TEXT,
    policy_check_status TEXT,
    details JSON,
    razorpay_order_id TEXT,
    razorpay_payment_link TEXT
  );

  CREATE TABLE IF NOT EXISTS mandates (
    token TEXT PRIMARY KEY,
    cart_token TEXT NOT NULL,
    merchant_id TEXT NOT NULL,
    items_json TEXT NOT NULL,
    quoted_total INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    approved INTEGER DEFAULT 0,
    razorpay_link TEXT,
    shipping_address TEXT
  );
`);

export default db;
