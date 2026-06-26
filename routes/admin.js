import { Router } from 'express';
import crypto from 'crypto';
import supabase from '../db/supabase.js';

const router = Router();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

const sessions = new Map();

function requireAuth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.admin = sessions.get(token);
  next();
}

/* ───── Login / Logout ───── */

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });

  const { data: admins, error } = await supabase
    .from('admin_accounts')
    .select('*');

  if (error) return res.status(500).json({ error: 'Database error' });

  const user = username
    ? admins.find(a => a.username === username)
    : admins.find(a => a.password_hash === hashPassword(password));

  if (!user || user.password_hash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken();
  sessions.set(token, { id: user.id, username: user.username, role: user.role });
  res.json({ status: true, token, user: { id: user.id, username: user.username, role: user.role } });
});

router.post('/logout', requireAuth, (req, res) => {
  const token = req.headers['x-admin-token'] || req.query.token;
  sessions.delete(token);
  res.json({ status: true });
});

/* ───── Seed (auto-create master if no admins exist) ───── */

async function ensureMasterAdmin() {
  const { data: admins } = await supabase.from('admin_accounts').select('id').limit(1);
  if (admins && admins.length === 0) {
    const masterHash = process.env.ADMIN_PASSWORD_HASH || hashPassword('rarehooks2024');
    await supabase.from('admin_accounts').insert([
      { id: 'master', username: 'master', password_hash: masterHash, role: 'superadmin' }
    ]);
    console.log('Master admin account created');
  }
}

async function seedProducts() {
  const { data: existing } = await supabase.from('products').select('id').limit(1);
  if (existing && existing.length === 0) {
    const defaults = [
      { id: 'jungle-green', name: 'Jungle Green', price: 2500, tag: 'Ready-Made', stock: 10 },
      { id: 'blue-dream', name: 'Blue Dream', price: 2500, tag: 'Made to Order', stock: 5 },
      { id: 'cream-la', name: 'Cream LA', price: 2500, tag: 'Made to Order', stock: 5 },
      { id: 'pink-haze', name: 'Pink Haze', price: 2500, tag: 'Made to Order', stock: 5 },
      { id: 'bronx', name: 'Bronx', price: 2500, tag: 'Ready-Made', stock: 8 },
      { id: 'blood-blue', name: 'Blood & Blue', price: 4500, tag: 'Bundle', stock: 3 },
    ];
    const { error } = await supabase.from('products').insert(defaults);
    if (!error) console.log('Default products seeded');
  }
}

ensureMasterAdmin();
seedProducts();

/* ───── Admin Account Management ───── */

router.get('/accounts', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('admin_accounts').select('id, username, role, created_at').order('created_at');
  if (error) return res.status(500).json({ error: 'Database error' });
  res.json({ status: true, accounts: data });
});

router.post('/accounts', requireAuth, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const { data: existing } = await supabase.from('admin_accounts').select('id').eq('username', username).limit(1);
  if (existing && existing.length > 0) return res.status(400).json({ error: 'Username already exists' });

  const { data, error } = await supabase.from('admin_accounts').insert([
    { id: generateId(), username, password_hash: hashPassword(password), role: 'admin' }
  ]).select('id, username, role, created_at').single();

  if (error) return res.status(500).json({ error: 'Failed to create account' });
  res.json({ status: true, account: data });
});

router.patch('/accounts/:id/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const { data: admin } = await supabase.from('admin_accounts').select('*').eq('id', req.admin.id).single();
  if (!admin) return res.status(404).json({ error: 'Account not found' });
  if (admin.password_hash !== hashPassword(currentPassword)) return res.status(401).json({ error: 'Current password is incorrect' });

  const { error } = await supabase.from('admin_accounts').update({ password_hash: hashPassword(newPassword) }).eq('id', req.admin.id);
  if (error) return res.status(500).json({ error: 'Failed to update password' });

  res.json({ status: true, message: 'Password updated' });
});

router.post('/accounts/:id/reset-password', requireAuth, async (req, res) => {
  if (req.admin.role !== 'superadmin') return res.status(403).json({ error: 'Only master admin can reset passwords' });

  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const { error } = await supabase.from('admin_accounts').update({ password_hash: hashPassword(newPassword) }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: 'Failed to reset password' });

  res.json({ status: true, message: 'Password reset successful' });
});

router.delete('/accounts/:id', requireAuth, async (req, res) => {
  if (req.admin.role !== 'superadmin') return res.status(403).json({ error: 'Only master admin can delete accounts' });
  if (req.params.id === 'master') return res.status(400).json({ error: 'Cannot delete master account' });

  const { error } = await supabase.from('admin_accounts').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: 'Failed to delete account' });

  res.json({ status: true });
});

/* ───── Products ───── */

router.get('/products', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('products').select('*').order('created_at');
  if (error) return res.status(500).json({ error: 'Database error' });
  res.json({ status: true, products: data });
});

router.post('/products', requireAuth, async (req, res) => {
  const { id, name, price, currency, tag, stock, image, description } = req.body;
  if (!id || !name || !price) return res.status(400).json({ error: 'id, name, price are required' });

  const { data, error } = await supabase.from('products').insert([
    { id, name, price: Number(price), currency: currency || 'KES', tag: tag || 'New', stock: Number(stock) || 0, image: image || '', description: description || '' }
  ]).select('*').single();

  if (error && error.code === '23505') return res.status(400).json({ error: 'Product ID already exists' });
  if (error) return res.status(500).json({ error: 'Failed to create product' });

  res.json({ status: true, product: data });
});

router.patch('/products/:id', requireAuth, async (req, res) => {
  const updates = {};
  for (const key of ['name', 'price', 'currency', 'tag', 'stock', 'image', 'description']) {
    if (req.body[key] !== undefined) updates[key] = (key === 'price' || key === 'stock') ? Number(req.body[key]) : req.body[key];
  }

  const { data, error } = await supabase.from('products').update(updates).eq('id', req.params.id).select('*').single();
  if (error) return res.status(404).json({ error: 'Product not found' });

  res.json({ status: true, product: data });
});

router.delete('/products/:id', requireAuth, async (req, res) => {
  const { error } = await supabase.from('products').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: 'Failed to delete product' });

  res.json({ status: true });
});

/* ───── Orders ───── */

router.get('/orders', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Database error' });

  res.json({ status: true, orders: data });
});

router.patch('/orders/:id', requireAuth, async (req, res) => {
  const updates = {};
  if (req.body.status) updates.status = req.body.status;
  if (req.body.notes) updates.admin_notes = req.body.notes;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('orders').update(updates).eq('id', req.params.id).select('*').single();
  if (error) return res.status(404).json({ error: 'Order not found' });

  res.json({ status: true, order: data });
});

/* ───── Contact Messages ───── */

router.get('/messages', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Database error' });

  res.json({ status: true, messages: data });
});

router.patch('/messages/:id/read', requireAuth, async (req, res) => {
  const { error } = await supabase.from('contact_messages').update({ read: true }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: 'Database error' });

  res.json({ status: true });
});

export default router;