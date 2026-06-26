import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import supabase from './db/supabase.js';
import paymentRoutes from './routes/payments.js';
import ordersRoutes from './routes/orders.js';
import adminRoutes, { getProducts } from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());
app.set('trust proxy', true);
app.use(express.static(path.join(__dirname)));

app.use('/admin', express.static(path.join(__dirname), { index: 'admin.html' }));
app.use('/api', paymentRoutes);
app.use('/api', ordersRoutes);
app.use('/api/admin', adminRoutes);

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const { error } = await supabase.from('contact_messages').insert([
      { name, email, message }
    ]);
    if (error) console.warn('Contact save warning:', error.message);
  } catch (err) {
    console.warn('Contact save failed (non-fatal):', err.message);
  }

  console.log('Contact inquiry:', { name, email, message });
  res.json({ status: true, message: 'Inquiry received' });
});

app.get('/api/products', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, currency, tag, image, description')
      .order('created_at');

    if (!error && data) {
      return res.json(data);
    }
  } catch (err) {
    console.warn('Products fetch failed:', err.message);
  }

  const products = await getProducts();
  res.json(products);
});

app.listen(PORT, () => {
  console.log(`RAREHOOKS running on http://localhost:${PORT}`);
});