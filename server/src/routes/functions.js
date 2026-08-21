import { Router } from 'express';
import { db, uuidv4 } from '../db.js';
import { requireAuth } from '../middleware/authenticate.js';

const router = Router();
const now = () => new Date().toISOString();

function getOrder(id) { return db.prepare('SELECT * FROM orders WHERE id = ?').get(id); }
function updateOrder(id, fields) {
  const sets = Object.keys(fields).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE orders SET ${sets}, updated_date = @updated_date WHERE id = @id`)
    .run({ ...fields, updated_date: now(), id });
  return getOrder(id);
}

// True local-only mode: no Stripe key on this machine at all -> orders are
// marked paid immediately, no network call, nothing leaves localhost.
function stripeConfigured() {
  const key = process.env.STRIPE_SECRET_KEY;
  return !!key && key !== 'mock' && !key.startsWith('sk_test_xxx');
}

// POST /api/functions/createCheckoutSession
router.post('/createCheckoutSession', requireAuth, async (req, res) => {
  try {
    const { order_id, amount, customer_email, customer_name, farmer_name } = req.body;
    if (!order_id || !amount) return res.status(400).json({ error: 'order_id and amount are required' });

    // Payment gate: block checkout for orders whose farmer hasn't cleared any
    // local verification (documents/OCR + ai-image-detector review at upload
    // time -> verification_checks -> admin sets users.verification_level).
    // 'none' means nothing has been reviewed yet - everything past that is
    // an admin judgment call, not something this route re-decides.
    const order = getOrder(order_id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const farmer = db.prepare('SELECT verification_level FROM users WHERE id = ?').get(order.farmer_id);
    if (!farmer || farmer.verification_level === 'none') {
      return res.status(403).json({
        error: 'This farmer has not completed identity verification yet. Payment is blocked until an admin reviews their documents.',
        reason: 'farmer_unverified',
      });
    }

    const clientOrigin = process.env.CLIENT_ORIGIN || req.headers.origin || 'http://localhost:5173';

    if (!stripeConfigured()) {
      // Offline mock: mark the order paid+accepted right away and hand back
      // a fake session id the success page + verifyPayment both understand.
      const mockSessionId = `local_${uuidv4()}`;
      updateOrder(order_id, { stripe_session_id: mockSessionId, payment_status: 'paid', delivery_status: 'accepted' });
      return res.json({ url: `${clientOrigin}/order-success?session_id=${mockSessionId}&mock=1`, session_id: mockSessionId });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('success_url', `${clientOrigin}/order-success?session_id={CHECKOUT_SESSION_ID}`);
    params.append('cancel_url', `${clientOrigin}/cart`);
    if (customer_email) params.append('customer_email', customer_email);
    params.append('client_reference_id', order_id);
    params.append('line_items[0][quantity]', '1');
    params.append('line_items[0][price_data][currency]', 'inr');
    params.append('line_items[0][price_data][product_data][name]', `FarmTrust Order - ${farmer_name || 'Farmer'}`);
    params.append('line_items[0][price_data][unit_amount]', String(Math.round(amount)));
    params.append('metadata[order_id]', order_id);
    params.append('metadata[customer_name]', customer_name || '');
    params.append('metadata[farmer_name]', farmer_name || '');

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Stripe-Version': process.env.STRIPE_VERSION || '2025-10-29.clover',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': uuidv4(),
      },
      body: params,
    });
    const session = await stripeRes.json();
    if (!stripeRes.ok) return res.status(400).json({ error: session.error?.message || 'Stripe error' });

    updateOrder(order_id, { stripe_session_id: session.id, payment_status: 'pending' });
    res.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error('createCheckoutSession error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/functions/verifyPayment
router.post('/verifyPayment', async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });

    if (session_id.startsWith('local_')) {
      // Mock session — createCheckoutSession already marked it paid. Just
      // find it by the id we stamped on the order and return it as-is.
      const order = db.prepare('SELECT * FROM orders WHERE stripe_session_id = ?').get(session_id);
      return res.json(order ? { ...order, items: JSON.parse(order.items || '[]') } : { payment_status: 'paid', session_id });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeConfigured()) return res.status(500).json({ error: 'Stripe is not configured on this server' });

    const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session_id}`, {
      headers: { Authorization: `Bearer ${stripeKey}`, 'Stripe-Version': process.env.STRIPE_VERSION || '2025-10-29.clover' },
    });
    const session = await stripeRes.json();
    if (!stripeRes.ok) return res.status(400).json({ error: session.error?.message || 'Stripe error' });

    const orderId = session.client_reference_id;
    const paymentStatus = session.payment_status === 'paid' ? 'paid' : 'pending';

    let order = null;
    if (orderId) {
      order = getOrder(orderId);
      if (order) {
        order = updateOrder(orderId, {
          payment_status: paymentStatus,
          stripe_payment_intent: session.payment_intent || order.stripe_payment_intent,
          delivery_status: paymentStatus === 'paid' && order.delivery_status === 'placed' ? 'accepted' : order.delivery_status,
        });
      }
    }
    res.json(order ? { ...order, items: JSON.parse(order.items || '[]') } : { payment_status: paymentStatus, session_id });
  } catch (error) {
    console.error('verifyPayment error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/functions/updateOrderStatus
router.post('/updateOrderStatus', requireAuth, (req, res) => {
  try {
    const { order_id, new_status } = req.body;
    if (!order_id) return res.status(400).json({ error: 'order_id is required' });
    const order = getOrder(order_id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.created_by_id !== req.user.id && order.farmer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    updateOrder(order_id, { delivery_status: new_status || order.delivery_status });
    res.json({ success: true, order_id, delivery_status: new_status });
  } catch (error) {
    console.error('updateOrderStatus error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
