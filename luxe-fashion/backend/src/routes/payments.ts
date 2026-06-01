import { Router } from 'express';
import { createStripePaymentIntent, createPayPalOrder, capturePayPalOrder } from '../services/paymentService';
import { authenticate } from '../middleware/auth';

const router = Router();

// Stripe webhook is registered in server.ts BEFORE json body parser (needs raw body)
// Only non-webhook routes here
router.post('/stripe/create-intent', authenticate, createStripePaymentIntent);
router.post('/paypal/create-order', authenticate, createPayPalOrder);
router.post('/paypal/capture', authenticate, capturePayPalOrder);

export default router;
