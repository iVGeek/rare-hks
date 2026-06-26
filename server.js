import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getProducts, addMessage, addOrder, waitForStore } from './db/store.js';
import paymentRoutes from './routes/payments.js';
import ordersRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());
app.set('trust proxy', true);

app.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.use(express.static(path.join(__dirname)));

app.use('/admin', express.static(path.join(__dirname), { index: 'admin.html' }));
app.use('/api', paymentRoutes);
app.use('/api', ordersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', uploadRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  await addMessage({ name, email, message, read: false, created_at: new Date().toISOString() });

  console.log('Contact inquiry:', { name, email, message });
  res.json({ status: true, message: 'Inquiry received' });
});

app.get('/api/products', async (_req, res) => {
  const products = await getProducts();
  res.json(products);
});

/* ───── Also store orders created via payment flow ───── */

app.post('/api/create-order', async (req, res) => {
  try {
    const { shipping, productId, productName, amount, currency, paymentReference } = req.body;

    if (!shipping || !shipping.name || !shipping.email || !shipping.phone || !shipping.address) {
      return res.status(400).json({ error: 'Shipping details incomplete' });
    }

    const orderId = 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const order = {
      id: orderId,
      product_id: productId,
      product_name: productName,
      amount,
      currency: currency || 'KES',
      payment_reference: paymentReference || '',
      shipping,
      status: paymentReference ? 'paid' : 'pending',
      admin_notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await addOrder(order);
    console.log('Order created:', orderId);
    res.json({ status: true, orderId, order });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

await waitForStore();
app.listen(PORT, () => {
  console.log(`RAREHOOKS running on http://localhost:${PORT}`);
});