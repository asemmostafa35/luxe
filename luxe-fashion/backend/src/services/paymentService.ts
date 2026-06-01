import Stripe from 'stripe';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { emailService } from './emailService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

// ─── Stripe ───────────────────────────────────────────────────────────────────

export const createStripePaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.body;
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(Number(order.total) * 100),
      currency: 'usd',
      receipt_email: order.user?.email || order.guestEmail || undefined,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    });

    res.json({ clientSecret: intent.client_secret, intentId: intent.id });
  } catch (err) { next(err); }
};

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Stripe webhook error:', err.message);
    return res.status(400).json({ error: err.message });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata.orderId;
      if (orderId) {
        const order = await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'PAID', paymentId: intent.id, status: 'CONFIRMED',
            statusHistory: { create: { status: 'CONFIRMED', note: 'Payment confirmed via Stripe' } } },
          include: { user: true, items: true },
        });
        const emailTo = order.user?.email || order.guestEmail;
        if (emailTo) emailService.sendOrderStatusUpdate(emailTo, order.user?.firstName || 'Customer', order).catch(console.error);
      }
    }
    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      if (intent.metadata.orderId)
        await prisma.order.update({ where: { id: intent.metadata.orderId }, data: { paymentStatus: 'FAILED' } });
    }
  } catch (err) { console.error('Webhook handler error:', err); }

  res.json({ received: true });
};

// ─── PayPal ───────────────────────────────────────────────────────────────────

async function getPayPalToken(): Promise<string> {
  const base = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
  const r = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const d = await r.json() as any;
  if (!d.access_token) throw new Error('PayPal auth failed');
  return d.access_token;
}

export const createPayPalOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.body;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const base = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
    const token = await getPayPalToken();
    const ppRes = await fetch(`${base}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{ reference_id: order.orderNumber, amount: { currency_code: 'USD', value: Number(order.total).toFixed(2) } }],
        application_context: {
          brand_name: 'Luxe Fashion',
          return_url: `${process.env.FRONTEND_URL}/checkout/success?order=${order.orderNumber}`,
          cancel_url: `${process.env.FRONTEND_URL}/checkout`,
        },
      }),
    });
    const ppOrder = await ppRes.json() as any;
    if (!ppOrder.id) return res.status(500).json({ error: 'PayPal order failed', details: ppOrder });
    res.json({ paypalOrderId: ppOrder.id, approvalUrl: ppOrder.links?.find((l: any) => l.rel === 'approve')?.href });
  } catch (err) { next(err); }
};

export const capturePayPalOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paypalOrderId, orderId } = req.body;
    const base = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
    const token = await getPayPalToken();
    const capRes = await fetch(`${base}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const capture = await capRes.json() as any;
    if (capture.status === 'COMPLETED') {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'PAID', paymentId: paypalOrderId, status: 'CONFIRMED',
          statusHistory: { create: { status: 'CONFIRMED', note: 'Payment confirmed via PayPal' } } },
        include: { user: true, items: true },
      });
      const emailTo = order.user?.email || order.guestEmail;
      if (emailTo) emailService.sendOrderStatusUpdate(emailTo, order.user?.firstName || 'Customer', order).catch(console.error);
    }
    res.json(capture);
  } catch (err) { next(err); }
};
