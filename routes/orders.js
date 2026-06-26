import { Router } from 'express';
import supabase from '../db/supabase.js';
import { registerOrder } from './admin.js';

const router = Router();

function generateOrderId() {
  return 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

router.post('/create-order', async (req, res) => {
  try {
    const { shipping, productId, productName, amount, currency, paymentReference } = req.body;

    if (!shipping || !shipping.name || !shipping.email || !shipping.phone || !shipping.address) {
      return res.status(400).json({ error: 'Shipping details incomplete' });
    }

    const orderId = generateOrderId();
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

    let data;
    try {
      const result = await supabase.from('orders').insert([order]).select('*').single();
      if (result.error) throw result.error;
      data = result.data;
    } catch (err) {
      console.warn('Order insert failed, using in-memory:', err.message);
      registerOrder(order);
      data = order;
    }

    console.log('Order created:', orderId);
    res.json({ status: true, orderId, order: data });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.patch('/order/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const { status, paymentReference } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (paymentReference) updates.payment_reference = paymentReference;

    const refField = reference.startsWith('ORD-') ? 'id' : 'payment_reference';
    const { data, error } = await supabase.from('orders')
      .update(updates)
      .eq(refField, reference)
      .select('*')
      .single();

    if (error) return res.status(404).json({ error: 'Order not found' });

    res.json({ status: true, order: data });
  } catch (err) {
    console.error('Update order error:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

router.get('/order/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const refField = reference.startsWith('ORD-') ? 'id' : 'payment_reference';

    const { data, error } = await supabase.from('orders')
      .select('*')
      .eq(refField, reference)
      .single();

    if (error) return res.status(404).json({ error: 'Order not found' });
    res.json({ status: true, order: data });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const { data, error } = await supabase.from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Database error' });
    res.json({ status: true, orders: data });
  } catch (err) {
    console.error('List orders error:', err);
    res.json({ status: true, orders: [] });
  }
});

export default router;