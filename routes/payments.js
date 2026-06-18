import { Router } from 'express';
import axios from 'axios';

const router = Router();
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const BASE = 'https://api.paystack.co';

router.post('/initialize-payment', async (req, res) => {
  try {
    const { email, amount, productId, productName, metadata } = req.body;
    if (!email || !amount) {
      return res.status(400).json({ error: 'Email and amount are required' });
    }

    const response = await axios.post(
      `${BASE}/transaction/initialize`,
      {
        email,
        amount: Math.round(amount * 100),
        currency: 'KES',
        metadata: { productId, productName, ...metadata },
        callback_url: `${req.protocol}://${req.get('host')}/payment-success.html`,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error('Paystack init error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

router.get('/verify-payment/:reference', async (req, res) => {
  try {
    const response = await axios.get(
      `${BASE}/transaction/verify/${req.params.reference}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error('Paystack verify error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

export default router;
