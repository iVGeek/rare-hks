import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import paymentRoutes from './routes/payments.js';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());
app.set('trust proxy', true);
app.use(express.static(path.join(__dirname)));

app.use('/api', paymentRoutes);

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  console.log('Contact inquiry:', { name, email, message });
  res.json({ status: true, message: 'Inquiry received' });
});

app.get('/api/products', (_req, res) => {
  res.json([
    { id: 'jungle-green', name: 'Jungle Green', price: 2500, currency: 'KES', tag: 'Ready-Made' },
    { id: 'blue-dream', name: 'Blue Dream', price: 2500, currency: 'KES', tag: 'Made to Order' },
    { id: 'cream-la', name: 'Cream LA', price: 2500, currency: 'KES', tag: 'Made to Order' },
    { id: 'pink-haze', name: 'Pink Haze', price: 2500, currency: 'KES', tag: 'Made to Order' },
    { id: 'bronx', name: 'Bronx', price: 2500, currency: 'KES', tag: 'Ready-Made' },
    { id: 'blood-blue', name: 'Blood & Blue', price: 4500, currency: 'KES', tag: 'Bundle' },
  ]);
});

app.listen(PORT, () => {
  console.log(`RAREHOOKS running on http://localhost:${PORT}`);
});
