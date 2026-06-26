import { Router } from 'express';
import { getOrders, updateOrder } from '../db/store.js';

const router = Router();

router.patch('/order/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const { status, paymentReference } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (paymentReference) updates.payment_reference = paymentReference;

    const result = await updateOrder(reference, updates);
    if (!result) return res.status(404).json({ error: 'Order not found' });

    res.json({ status: true, order: result });
  } catch (err) {
    console.error('Update order error:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

router.get('/order/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const all = await getOrders();
    const order = all.find(o => o.id === reference || o.payment_reference === reference);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({ status: true, order });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const all = await getOrders();
    all.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
    res.json({ status: true, orders: all });
  } catch (err) {
    console.error('List orders error:', err);
    res.json({ status: true, orders: [] });
  }
});

export default router;