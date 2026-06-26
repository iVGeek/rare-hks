import { Router } from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
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

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* ───── Email transport ───── */

function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass || pass === 'your_gmail_app_password_here') return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

async function sendEmail(to, subject, html) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject} | Body: ${html.replace(/<[^>]*>/g, ' ').trim().substring(0, 200)}`);
    return false;
  }
  try {
    await transporter.sendMail({ from: `"RAREHOOKS Admin" <${process.env.GMAIL_USER}>`, to, subject, html });
    return true;
  } catch (err) {
    console.error('Email send error:', err.message);
    return false;
  }
}

/* ───── In-memory password reset store ───── */
const resetCodes = new Map(); // email -> { code, expiresAt }

const sessions = new Map();

/* ───── In-memory fallback (used when Supabase tables don't exist yet) ───── */
let dbReady = false;

async function initDB() {
  try {
    const { error } = await supabase.from('admin_accounts').select('id').limit(1);
    if (error) throw error;

    const { data: admins } = await supabase.from('admin_accounts').select('id').limit(1);
    if (!admins || admins.length === 0) {
      await supabase.from('admin_accounts').insert([
        { id: 'master', username: 'master', password_hash: masterHash, role: 'superadmin' }
      ]);
      console.log('Admin: master account created');
    }

    const { data: products } = await supabase.from('products').select('id').limit(1);
    if (!products || products.length === 0) {
      await supabase.from('products').insert([
        { id: 'jungle-green', name: 'Jungle Green', price: 2500, tag: 'Ready-Made', stock: 10 },
        { id: 'blue-dream', name: 'Blue Dream', price: 2500, tag: 'Made to Order', stock: 5 },
        { id: 'cream-la', name: 'Cream LA', price: 2500, tag: 'Made to Order', stock: 5 },
        { id: 'pink-haze', name: 'Pink Haze', price: 2500, tag: 'Made to Order', stock: 5 },
        { id: 'bronx', name: 'Bronx', price: 2500, tag: 'Ready-Made', stock: 8 },
        { id: 'blood-blue', name: 'Blood & Blue', price: 4500, tag: 'Bundle', stock: 3 },
      ]);
      console.log('Admin: default products seeded');
    }

    dbReady = true;
    console.log('Admin: Supabase ready');
  } catch (err) {
    console.warn('Admin: Supabase unavailable, using in-memory fallback:', err.message);
    dbReady = false;
  }
}

const masterHash = process.env.ADMIN_PASSWORD_HASH || hashPassword('rarehooks2024');
const fallbackAdmins = [{ id: 'master', username: 'master', password_hash: masterHash, role: 'superadmin', created_at: new Date().toISOString() }];
const baseImg = 'https://aabyxfcrrqivjupawxdu.supabase.co/storage/v1/object/public/store-images/4aa43748-90b3-4c4b-b74f-d337ea5b63e1/a1b59555-a5c2-4397-b7de-7ff0cc0e8670/products';
const fallbackProducts = [
  { id: 'jungle-green', name: 'Jungle Green', price: 2500, currency: 'KES', tag: 'Ready-Made', stock: 10, image: baseImg + '/1780164202396.jpeg', description: 'Deep green precision cap with custom charm detail. Adjustable fit. NY edition.', created_at: new Date().toISOString() },
  { id: 'blue-dream', name: 'Blue Dream', price: 2500, currency: 'KES', tag: 'Made to Order', stock: 5, image: baseImg + '/1780164297370.png', description: 'Clean blue build with signature charm. Adjustable. That West Coast energy.', created_at: new Date().toISOString() },
  { id: 'cream-la', name: 'Cream LA', price: 2500, currency: 'KES', tag: 'Made to Order', stock: 5, image: baseImg + '/1780164466247.png', description: 'Neutral tone. Clean finish. Adjustable with charm detail. LA classic.', created_at: new Date().toISOString() },
  { id: 'pink-haze', name: 'Pink Haze', price: 2500, currency: 'KES', tag: 'Made to Order', stock: 5, image: baseImg + '/1780250877970.jpeg', description: 'Bold pink statement cap with charm detail. Adjustable fit. NY edition.', created_at: new Date().toISOString() },
  { id: 'bronx', name: 'Bronx', price: 2500, currency: 'KES', tag: 'Ready-Made', stock: 8, image: baseImg + '/1780930702522.png', description: 'Beige and navy. Clean build. Minimal. Straight out the borough.', created_at: new Date().toISOString() },
  { id: 'blood-blue', name: 'Blood & Blue', price: 4500, currency: 'KES', tag: 'Bundle', stock: 3, image: baseImg + '/1780250840434.jpeg', description: 'Two-cap set. Red and blue builds with charm details. Double the drip.', created_at: new Date().toISOString() },
];
const fallbackOrders = [];

async function getAdmins() {
  if (dbReady) {
    const { data } = await supabase.from('admin_accounts').select('*');
    return data || [];
  }
  return fallbackAdmins;
}

async function getProducts() {
  if (dbReady) {
    const { data } = await supabase.from('products').select('*').order('created_at');
    return data || [];
  }
  return fallbackProducts;
}

async function getOrders() {
  if (dbReady) {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    return data || [];
  }
  return [...fallbackOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

initDB();

/* ───── Auth middleware ───── */

function requireAuth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.admin = sessions.get(token);
  next();
}

/* ───── Login ───── */

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password required' });

    const admins = await getAdmins();
    let user;

    if (username) {
      user = admins.find(a => a.username === username);
    } else {
      user = admins.find(a => a.password_hash === hashPassword(password))
          || { id: 'master', username: 'master', password_hash: masterHash, role: 'superadmin' };
    }

    if (!user || user.password_hash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken();
    sessions.set(token, { id: user.id, username: user.username, role: user.role });
    res.json({ status: true, token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', requireAuth, (req, res) => {
  const token = req.headers['x-admin-token'] || req.query.token;
  sessions.delete(token);
  res.json({ status: true });
});

/* ───── Forgot / Reset Password ───── */

const RESET_CODE_TTL = 15 * 60 * 1000; // 15 minutes

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const code = generateCode();
    resetCodes.set(email, { code, expiresAt: Date.now() + RESET_CODE_TTL });

    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0A0A0A;color:#F7F7F7;border-radius:12px;border:1px solid rgba(255,215,0,0.15);">
        <h1 style="color:#FFD700;font-size:1.5rem;margin:0 0 8px;">RAREHOOKS</h1>
        <p style="color:#888;margin:0 0 24px;">Password Reset Code</p>
        <div style="background:#1A1A1A;border-radius:8px;padding:24px;text-align:center;">
          <p style="color:#888;margin:0 0 8px;">Your verification code</p>
          <div style="font-size:2.5rem;font-weight:700;letter-spacing:0.2em;color:#FFD700;font-family:monospace;">${code}</div>
          <p style="color:#555;font-size:0.8rem;margin:16px 0 0;">Expires in 15 minutes</p>
        </div>
        <p style="color:#555;font-size:0.75rem;margin-top:24px;">If you didn't request this, ignore this email.</p>
      </div>`;

    const sent = await sendEmail(email, 'RAREHOOKS — Password Reset Code', html);

    res.json({
      status: true,
      message: sent ? 'Code sent to email' : 'Email not configured — code shown below',
      ...(sent ? {} : { devCode: code }),
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to send code' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) return res.status(400).json({ error: 'Email, code, and new password required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const stored = resetCodes.get(email);
    if (!stored) return res.status(400).json({ error: 'No code requested for this email' });
    if (Date.now() > stored.expiresAt) {
      resetCodes.delete(email);
      return res.status(400).json({ error: 'Code expired — request a new one' });
    }
    if (stored.code !== code) return res.status(400).json({ error: 'Invalid code' });

    resetCodes.delete(email);

    const hashed = hashPassword(newPassword);
    let updated = false;

    if (dbReady) {
      const { error } = await supabase.from('admin_accounts').update({ password_hash: hashed }).eq('username', 'master');
      if (!error) updated = true;
    }

    if (!updated) {
      const idx = fallbackAdmins.findIndex(a => a.id === 'master');
      if (idx !== -1) {
        fallbackAdmins[idx].password_hash = hashed;
        updated = true;
      }
    }

    if (!updated) return res.status(500).json({ error: 'Failed to update password' });

    const confirmHtml = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0A0A0A;color:#F7F7F7;border-radius:12px;border:1px solid rgba(0,200,83,0.15);">
        <h1 style="color:#FFD700;font-size:1.5rem;margin:0 0 8px;">RAREHOOKS</h1>
        <p style="color:#00c853;margin:0 0 24px;">Password Reset Successful</p>
        <div style="background:#1A1A1A;border-radius:8px;padding:24px;">
          <p style="color:#ccc;margin:0;">Your admin password has been changed. If you did not make this change, please contact support immediately.</p>
        </div>
      </div>`;

    sendEmail(email, 'RAREHOOKS — Password Changed', confirmHtml);
    res.json({ status: true, message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

/* ───── Accounts ───── */

router.get('/accounts', requireAuth, async (req, res) => {
  const admins = await getAdmins();
  const safe = admins.map(a => ({ id: a.id, username: a.username, role: a.role, created_at: a.created_at }));
  res.json({ status: true, accounts: safe });
});

router.post('/accounts', requireAuth, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const admins = await getAdmins();
  if (admins.find(a => a.username === username)) return res.status(400).json({ error: 'Username already exists' });

  const newAdmin = { id: generateId(), username, password_hash: hashPassword(password), role: 'admin', created_at: new Date().toISOString() };

  if (dbReady) {
    const { data, error } = await supabase.from('admin_accounts').insert([newAdmin]).select('id, username, role, created_at').single();
    if (error) return res.status(500).json({ error: error.message || 'Failed to create account' });
    return res.json({ status: true, account: data });
  }

  fallbackAdmins.push(newAdmin);
  res.json({ status: true, account: { id: newAdmin.id, username: newAdmin.username, role: newAdmin.role, created_at: newAdmin.created_at } });
});

router.patch('/accounts/:id/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const admins = await getAdmins();
  const admin = admins.find(a => a.id === req.admin.id);
  if (!admin) return res.status(404).json({ error: 'Account not found' });
  if (admin.password_hash !== hashPassword(currentPassword)) return res.status(401).json({ error: 'Current password is incorrect' });

  if (dbReady) {
    const { error } = await supabase.from('admin_accounts').update({ password_hash: hashPassword(newPassword) }).eq('id', req.admin.id);
    if (error) return res.status(500).json({ error: error.message });
  } else {
    const idx = fallbackAdmins.findIndex(a => a.id === req.admin.id);
    if (idx !== -1) fallbackAdmins[idx].password_hash = hashPassword(newPassword);
  }

  res.json({ status: true, message: 'Password updated' });
});

router.post('/accounts/:id/reset-password', requireAuth, async (req, res) => {
  if (req.admin.role !== 'superadmin') return res.status(403).json({ error: 'Only master admin can reset passwords' });
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  if (dbReady) {
    const { error } = await supabase.from('admin_accounts').update({ password_hash: hashPassword(newPassword) }).eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
  } else {
    const idx = fallbackAdmins.findIndex(a => a.id === req.params.id);
    if (idx !== -1) fallbackAdmins[idx].password_hash = hashPassword(newPassword);
  }

  res.json({ status: true, message: 'Password reset successful' });
});

router.delete('/accounts/:id', requireAuth, async (req, res) => {
  if (req.admin.role !== 'superadmin') return res.status(403).json({ error: 'Only master admin can delete accounts' });
  if (req.params.id === 'master') return res.status(400).json({ error: 'Cannot delete master account' });

  if (dbReady) {
    const { error } = await supabase.from('admin_accounts').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
  } else {
    const idx = fallbackAdmins.findIndex(a => a.id === req.params.id);
    if (idx !== -1) fallbackAdmins.splice(idx, 1);
  }

  res.json({ status: true });
});

/* ───── Products ───── */

router.get('/products', requireAuth, async (req, res) => {
  const products = await getProducts();
  res.json({ status: true, products });
});

router.post('/products', requireAuth, async (req, res) => {
  const { id, name, price, currency, tag, stock, image, description } = req.body;
  if (!id || !name || !price) return res.status(400).json({ error: 'id, name, price are required' });

  const product = { id, name, price: Number(price), currency: currency || 'KES', tag: tag || 'New', stock: Number(stock) || 0, image: image || '', description: description || '' };

  if (dbReady) {
    const { data, error } = await supabase.from('products').insert([product]).select('*').single();
    if (error && error.code === '23505') return res.status(400).json({ error: 'Product ID already exists' });
    if (error) return res.status(500).json({ error: error.message || 'Failed to create product' });
    return res.json({ status: true, product: data });
  }

  if (fallbackProducts.find(p => p.id === id)) return res.status(400).json({ error: 'Product ID already exists' });
  fallbackProducts.push(product);
  res.json({ status: true, product });
});

router.patch('/products/:id', requireAuth, async (req, res) => {
  const updates = {};
  for (const key of ['name', 'price', 'currency', 'tag', 'stock', 'image', 'description']) {
    if (req.body[key] !== undefined) updates[key] = (key === 'price' || key === 'stock') ? Number(req.body[key]) : req.body[key];
  }

  if (dbReady) {
    const { data, error } = await supabase.from('products').update(updates).eq('id', req.params.id).select('*').single();
    if (error) return res.status(404).json({ error: 'Product not found' });
    return res.json({ status: true, product: data });
  }

  const idx = fallbackProducts.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  Object.assign(fallbackProducts[idx], updates);
  res.json({ status: true, product: fallbackProducts[idx] });
});

router.delete('/products/:id', requireAuth, async (req, res) => {
  if (dbReady) {
    const { error } = await supabase.from('products').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
  } else {
    const idx = fallbackProducts.findIndex(p => p.id === req.params.id);
    if (idx !== -1) fallbackProducts.splice(idx, 1);
  }

  res.json({ status: true });
});

/* ───── Orders ───── */

router.get('/orders', requireAuth, async (req, res) => {
  const orders = await getOrders();
  res.json({ status: true, orders });
});

router.patch('/orders/:id', requireAuth, async (req, res) => {
  const updates = {};
  if (req.body.status) updates.status = req.body.status;
  if (req.body.notes) updates.admin_notes = req.body.notes;
  updates.updated_at = new Date().toISOString();

  if (dbReady) {
    const { data, error } = await supabase.from('orders').update(updates).eq('id', req.params.id).select('*').single();
    if (error) return res.status(404).json({ error: 'Order not found' });
    return res.json({ status: true, order: data });
  }

  const idx = fallbackOrders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Order not found' });
  Object.assign(fallbackOrders[idx], updates);
  res.json({ status: true, order: fallbackOrders[idx] });
});

/* ───── Contact Messages ───── */

router.get('/messages', requireAuth, async (req, res) => {
  if (dbReady) {
    const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ status: true, messages: data });
  }
  res.json({ status: true, messages: [] });
});

router.patch('/messages/:id/read', requireAuth, async (req, res) => {
  if (dbReady) {
    const { error } = await supabase.from('contact_messages').update({ read: true }).eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
  }
  res.json({ status: true });
});

function registerOrder(order) {
  if (dbReady) {
    supabase.from('orders').insert([order]).catch(() => {});
  }
  fallbackOrders.push(order);
}

export { registerOrder, getProducts, getAdmins };
export default router;