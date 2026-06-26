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

  const defaults = [
    { id: 'jungle-green', name: 'Jungle Green', price: 2500, currency: 'KES', tag: 'Ready-Made', image: 'https://aabyxfcrrqivjupawxdu.supabase.co/storage/v1/object/public/store-images/4aa43748-90b3-4c4b-b74f-d337ea5b63e1/a1b59555-a5c2-4397-b7de-7ff0cc0e8670/products/1780164202396.jpeg', description: 'Deep green precision cap with custom charm detail. Adjustable fit. NY edition.' },
    { id: 'blue-dream', name: 'Blue Dream', price: 2500, currency: 'KES', tag: 'Made to Order', image: 'https://aabyxfcrrqivjupawxdu.supabase.co/storage/v1/object/public/store-images/4aa43748-90b3-4c4b-b74f-d337ea5b63e1/a1b59555-a5c2-4397-b7de-7ff0cc0e8670/products/1780164297370.png', description: 'Clean blue build with signature charm. Adjustable. That West Coast energy.' },
    { id: 'cream-la', name: 'Cream LA', price: 2500, currency: 'KES', tag: 'Made to Order', image: 'https://aabyxfcrrqivjupawxdu.supabase.co/storage/v1/object/public/store-images/4aa43748-90b3-4c4b-b74f-d337ea5b63e1/a1b59555-a5c2-4397-b7de-7ff0cc0e8670/products/1780164466247.png', description: 'Neutral tone. Clean finish. Adjustable with charm detail. LA classic.' },
    { id: 'pink-haze', name: 'Pink Haze', price: 2500, currency: 'KES', tag: 'Made to Order', image: 'https://aabyxfcrrqivjupawxdu.supabase.co/storage/v1/object/public/store-images/4aa43748-90b3-4c4b-b74f-d337ea5b63e1/a1b59555-a5c2-4397-b7de-7ff0cc0e8670/products/1780250877970.jpeg', description: 'Bold pink statement cap with charm detail. Adjustable fit. NY edition.' },
    { id: 'bronx', name: 'Bronx', price: 2500, currency: 'KES', tag: 'Ready-Made', image: 'https://aabyxfcrrqivjupawxdu.supabase.co/storage/v1/object/public/store-images/4aa43748-90b3-4c4b-b74f-d337ea5b63e1/a1b59555-a5c2-4397-b7de-7ff0cc0e8670/products/1780930702522.png', description: 'Beige and navy. Clean build. Minimal. Straight out the borough.' },
    { id: 'blood-blue', name: 'Blood & Blue', price: 4500, currency: 'KES', tag: 'Bundle', image: 'https://aabyxfcrrqivjupawxdu.supabase.co/storage/v1/object/public/store-images/4aa43748-90b3-4c4b-b74f-d337ea5b63e1/a1b59555-a5c2-4397-b7de-7ff0cc0e8670/products/1780250840434.jpeg', description: 'Two-cap set. Red and blue builds with charm details. Double the drip.' },
  ];
  res.json(defaults);
});

app.listen(PORT, () => {
  console.log(`RAREHOOKS running on http://localhost:${PORT}`);
});