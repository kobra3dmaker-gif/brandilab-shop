-- ============================================================================
-- BrandiLab Customer Portal — Cloudflare D1 (SQLite) Logical & Physical Schema
-- Principle: Historical Immutability (Snapshotting) & Zero-Trust Query Scoping
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. USERS (Account Clienti)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. USER_ADDRESSES (Rubrica Indirizzi per ordini futuri)
-- Modificare o eliminare un indirizzo qui NON altera mai gli ordini passati.
CREATE TABLE IF NOT EXISTS user_addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Casa',
  recipient_name TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT DEFAULT '',
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  province TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'IT',
  phone TEXT DEFAULT '',
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);

-- 3. PASSWORD_RESET_TOKENS (Token monouso salvati solo come SHA-256 hash)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_hash ON password_reset_tokens(token_hash);

-- 4. ORDERS (Testata Ordine con Snapshot immutabili di indirizzo e pagamento)
-- Stati ammessi (FSM):
-- 'RICEVUTO' | 'IN_LAVORAZIONE' | 'SPEDITO' | 'IN_CONSEGNA' | 'CONSEGNATO' | 'PROBLEMA_CONSEGNA' | 'ANNULLATO'
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  user_id TEXT DEFAULT NULL,
  customer_email TEXT NOT NULL COLLATE NOCASE,
  status TEXT NOT NULL DEFAULT 'RICEVUTO',
  currency TEXT NOT NULL DEFAULT 'eur',
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  shipping_address_json TEXT NOT NULL,
  billing_address_json TEXT DEFAULT NULL,
  payment_method_summary TEXT DEFAULT 'Carta di credito / Stripe',
  stripe_session_id TEXT UNIQUE DEFAULT NULL,
  carrier_name TEXT DEFAULT NULL,
  tracking_number TEXT DEFAULT NULL,
  tracking_url TEXT DEFAULT NULL,
  estimated_delivery TEXT DEFAULT NULL,
  receipt_number TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id_date ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- 5. ORDER_ITEMS (Righe Ordine con Snapshot storico di nome, SKU, foto e prezzo)
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT DEFAULT NULL,
  sku_snapshot TEXT NOT NULL,
  title_snapshot TEXT NOT NULL,
  image_url_snapshot TEXT DEFAULT '',
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  total_price_cents INTEGER NOT NULL CHECK (total_price_cents >= 0),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 6. ORDER_STATUS_HISTORY (Audit Trail / Event Log per la Timeline Dinamica)
CREATE TABLE IF NOT EXISTS order_status_history (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  author TEXT NOT NULL DEFAULT 'system',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id, created_at ASC);
