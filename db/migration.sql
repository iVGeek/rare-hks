-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- Creates all tables needed for RAREHOOKS store

-- Products
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  currency TEXT DEFAULT 'KES',
  tag TEXT DEFAULT 'New',
  stock INTEGER DEFAULT 0,
  image TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  product_name TEXT,
  amount INTEGER,
  currency TEXT DEFAULT 'KES',
  payment_reference TEXT DEFAULT '',
  shipping JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin accounts
CREATE TABLE IF NOT EXISTS admin_accounts (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default products (skip if already exist)
INSERT INTO products (id, name, price, currency, tag, stock, image, description)
VALUES
  ('jungle-green', 'Jungle Green', 2500, 'KES', 'Ready-Made', 10, '', ''),
  ('blue-dream', 'Blue Dream', 2500, 'KES', 'Made to Order', 5, '', ''),
  ('cream-la', 'Cream LA', 2500, 'KES', 'Made to Order', 5, '', ''),
  ('pink-haze', 'Pink Haze', 2500, 'KES', 'Made to Order', 5, '', ''),
  ('bronx', 'Bronx', 2500, 'KES', 'Ready-Made', 8, '', ''),
  ('blood-blue', 'Blood & Blue', 4500, 'KES', 'Bundle', 3, '', '')
ON CONFLICT (id) DO NOTHING;
