import { Router } from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { getAdmins, getProducts, getOrders, getMessages, addProduct, updateProduct, deleteProduct, updateOrder, addAdmin, updateAdmin, deleteAdmin, markMessageRead } from '../db/store.js';

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
  if (!user || !pass) return null;
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

const sessions = new Map();
const resetCodes = new Map();
const RESET_CODE_TTL = 15 * 60 * 1000;

/* ───── Auth middleware ───── */

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
  try {
    const { username, password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password required' });

    const admins = await getAdmins();
    let user;

    if (username) {
      user = admins.find(a => a.username === username);
    } else {
      user = admins.find(a => a.password_hash === hashPassword(password));
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

    const admins = await getAdmins();
    const master = admins.find(a => a.id === 'master');
    if (!master) return res.status(500).json({ error: 'Master admin not found' });

    await updateAdmin('master', { password_hash: hashPassword(newPassword) });

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

/* ───── Account Management ───── */

router.get('/accounts', requireAuth, async (req, res) => {
  const admins = await getAdmins();
  const safe = admins.map(a => ({ id: a.id, username: a.username, role: a.role, created_at: a.created_at || a.createdAt }));
  res.json({ status: true, accounts: safe });
});

router.post('/accounts', requireAuth, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const admins = await getAdmins();
  if (admins.find(a => a.username === username)) return res.status(400).json({ error: 'Username already exists' });

  const newAdmin = { id: generateId(), username, password_hash: hashPassword(password), role: 'admin', created_at: new Date().toISOString() };
  await addAdmin(newAdmin);

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

  await updateAdmin(req.admin.id, { password_hash: hashPassword(newPassword) });
  res.json({ status: true, message: 'Password updated' });
});

router.post('/accounts/:id/reset-password', requireAuth, async (req, res) => {
  if (req.admin.role !== 'superadmin') return res.status(403).json({ error: 'Only master admin can reset passwords' });
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  await updateAdmin(req.params.id, { password_hash: hashPassword(newPassword) });
  res.json({ status: true, message: 'Password reset successful' });
});

router.delete('/accounts/:id', requireAuth, async (req, res) => {
  if (req.admin.role !== 'superadmin') return res.status(403).json({ error: 'Only master admin can delete accounts' });
  if (req.params.id === 'master') return res.status(400).json({ error: 'Cannot delete master account' });

  await deleteAdmin(req.params.id);
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

  const existing = await getProducts();
  if (existing.find(p => p.id === id)) return res.status(400).json({ error: 'Product ID already exists' });

  const product = { id, name, price: Number(price), currency: currency || 'KES', tag: tag || 'New', stock: Number(stock) || 0, image: image || '', description: description || '', created_at: new Date().toISOString() };
  await addProduct(product);

  res.json({ status: true, product });
});

router.patch('/products/:id', requireAuth, async (req, res) => {
  const updates = {};
  for (const key of ['name', 'price', 'currency', 'tag', 'stock', 'image', 'description']) {
    if (req.body[key] !== undefined) updates[key] = (key === 'price' || key === 'stock') ? Number(req.body[key]) : req.body[key];
  }

  const result = await updateProduct(req.params.id, updates);
  if (!result) return res.status(404).json({ error: 'Product not found' });

  res.json({ status: true, product: result });
});

router.delete('/products/:id', requireAuth, async (req, res) => {
  await deleteProduct(req.params.id);
  res.json({ status: true });
});

/* ───── Orders ───── */

router.get('/orders', requireAuth, async (req, res) => {
  const orders = await getOrders();
  orders.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
  res.json({ status: true, orders });
});

router.patch('/orders/:id', requireAuth, async (req, res) => {
  const updates = { updated_at: new Date().toISOString() };
  if (req.body.status) updates.status = req.body.status;
  if (req.body.shipping_status) updates.shipping_status = req.body.shipping_status;
  if (req.body.notes) updates.admin_notes = req.body.notes;

  const result = await updateOrder(req.params.id, updates);
  if (!result) return res.status(404).json({ error: 'Order not found' });

  res.json({ status: true, order: result });
});

/* ───── Messages ───── */

router.get('/messages', requireAuth, async (req, res) => {
  const messages = await getMessages();
  res.json({ status: true, messages });
});

router.patch('/messages/:id/read', requireAuth, async (req, res) => {
  await markMessageRead(req.params.id);
  res.json({ status: true });
});

export { sendEmail };

export async function sendOrderConfirmation(order) {
  const items = order.items || [{ productName: order.product_name || 'Cap', price: order.amount, quantity: 1 }];
  const itemsHtml = items.map(i =>
    `<tr><td style="padding:6px 8px;border-bottom:1px solid #333;color:#ccc;">${i.productName || i.product_name}</td><td style="padding:6px 8px;border-bottom:1px solid #333;color:#888;text-align:center;">x${i.quantity || 1}</td><td style="padding:6px 8px;border-bottom:1px solid #333;color:#FFD700;text-align:right;">KES ${((i.price || 0) * (i.quantity || 1)).toLocaleString()}</td></tr>`
  ).join('');

  const shipping = order.shipping || {};
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#0A0A0A;color:#F7F7F7;border-radius:12px;border:1px solid rgba(255,215,0,0.12);">
      <h1 style="color:#FFD700;font-size:1.8rem;margin:0 0 4px;font-weight:900;letter-spacing:0.02em;">RAREHOOKS</h1>
      <p style="color:#888;margin:0 0 24px;">Order Confirmation</p>

      <div style="background:#1A1A1A;border-radius:8px;padding:20px;margin-bottom:20px;">
        <p style="color:#FFD700;font-size:1rem;margin:0 0 4px;">Order #${order.id}</p>
        <p style="color:#555;font-size:0.8rem;margin:0;">Payment: <span style="color:${order.status === 'paid' ? '#00c853' : '#888'}">${(order.status || 'pending').toUpperCase()}</span></p>
        <p style="color:#555;font-size:0.8rem;margin:4px 0 0;">Reference: ${order.payment_reference || '—'}</p>
      </div>

      <h3 style="color:#F7F7F7;font-size:0.9rem;margin:0 0 12px;">Items</h3>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr><th style="text-align:left;padding:6px 8px;color:#888;font-size:0.75rem;border-bottom:1px solid #444;">Item</th><th style="text-align:center;padding:6px 8px;color:#888;font-size:0.75rem;border-bottom:1px solid #444;">Qty</th><th style="text-align:right;padding:6px 8px;color:#888;font-size:0.75rem;border-bottom:1px solid #444;">Amount</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div style="border-top:1px solid rgba(255,215,0,0.1);margin-top:12px;padding-top:12px;text-align:right;font-size:1.1rem;font-weight:700;color:#FFD700;">Total: KES ${(order.amount || 0).toLocaleString()}</div>

      <div style="background:#1A1A1A;border-radius:8px;padding:20px;margin:20px 0;">
        <h3 style="color:#F7F7F7;font-size:0.9rem;margin:0 0 12px;">Shipping To</h3>
        <p style="color:#ccc;margin:0;font-size:0.85rem;">${shipping.name || '—'}</p>
        <p style="color:#888;margin:2px 0;font-size:0.85rem;">${shipping.address || ''}${shipping.city ? ', ' + shipping.city : ''}</p>
        <p style="color:#888;margin:2px 0;font-size:0.85rem;">${shipping.country || ''}${shipping.postalCode ? ' · ' + shipping.postalCode : ''}</p>
        <p style="color:#888;margin:2px 0;font-size:0.85rem;">${shipping.email || ''} ${shipping.phone ? ' · ' + shipping.phone : ''}</p>
      </div>

      <div style="background:rgba(255,215,0,0.05);border:1px solid rgba(255,215,0,0.1);border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="color:#FFD700;font-size:0.85rem;font-weight:600;margin:0 0 4px;">Shipping Status: <span style="color:#888;">${order.shipping_status || 'Pending'}</span></p>
        <p style="color:#555;font-size:0.8rem;margin:0;">We'll update this as soon as your order ships. You'll receive a notification with tracking details.</p>
      </div>

      <p style="color:#555;font-size:0.75rem;margin:0;text-align:center;">RAREHOOKS — Nairobi to the World · <a href="mailto:rarehooks@gmail.com" style="color:#FFD700;">rarehooks@gmail.com</a></p>
    </div>`;

  return sendEmail(shipping.email, `RAREHOOKS — Order Confirmation #${order.id}`, html);
}

export default router;