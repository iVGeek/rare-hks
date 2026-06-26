import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import supabase from './db/supabase.js';
import paymentRoutes from './routes/payments.js';
import ordersRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());
app.set('trust proxy', true);
app.use(express.static(path.join(__dirname)));

app.use('/api', paymentRoutes);
app.use('/api', ordersRoutes);
app.use('/api/admin', adminRoutes);

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const { error } = await supabase.from('contact_messages').insert([
    { name, email, message }
  ]);

  if (error) {
    console.error('Contact save error:', error);
    return res.status(500).json({ error: 'Failed to save message' });
  }

  console.log('Contact inquiry:', { name, email, message });
  res.json({ status: true, message: 'Inquiry received' });
});

app.get('/api/products', async (_req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, currency, tag')
    .order('created_at');

  if (error) {
    console.error('Products fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }

  res.json(data);
});

app.listen(PORT, () => {
  console.log(`RAREHOOKS running on http://localhost:${PORT}`);
});