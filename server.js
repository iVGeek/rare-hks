import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getProducts, addMessage, addOrder, getOrders, updateOrder, waitForStore } from './db/store.js';
import paymentRoutes from './routes/payments.js';
import ordersRoutes from './routes/orders.js';
import adminRoutes, { sendOrderConfirmation } from './routes/admin.js';
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
    const { shipping, items, productId, productName, amount, currency, paymentReference } = req.body;

    if (!shipping || !shipping.name || !shipping.email || !shipping.phone || !shipping.address) {
      return res.status(400).json({ error: 'Shipping details incomplete' });
    }

    const orderId = 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const order = {
      id: orderId,
      product_id: productId || 'cart',
      product_name: productName || 'Multi-item order',
      items: items || [],
      amount,
      currency: currency || 'KES',
      payment_reference: paymentReference || '',
      shipping,
      status: 'pending',
      shipping_status: 'Pending',
      admin_notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await addOrder(order);
    console.log('Order created:', orderId, '(pending payment)');
    res.json({ status: true, orderId, order });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/* ───── Confirm payment after Paystack redirect ───── */

app.post('/api/confirm-payment', async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ error: 'Payment reference required' });

    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return res.json({ status: false, error: 'Payment not confirmed', paystack: paystackData });
    }

    /* Find order by payment_reference */
    const allOrders = await getOrders();
    const order = allOrders.find(o => o.payment_reference === reference);
    if (!order) {
      return res.json({ status: false, error: 'Order not found' });
    }

    /* Update order to paid */
    await updateOrder(order.id, { status: 'paid', updated_at: new Date().toISOString() });
    order.status = 'paid';

    /* Send confirmation email (non-blocking) */
    sendOrderConfirmation(order).then(sent => {
      console.log(`Payment confirmed for ${order.id}: email ${sent ? 'sent' : 'not sent (Gmail not configured)'}`);
    }).catch(err => {
      console.error(`Order ${order.id}: email error:`, err.message);
    });

    res.json({ status: true, orderId: order.id, order });
  } catch (err) {
    console.error('Confirm payment error:', err);
    res.status(500).json({ error: 'Payment confirmation failed' });
  }
});

await waitForStore();
app.listen(PORT, () => {
  console.log(`RAREHOOKS running on http://localhost:${PORT}`);
});