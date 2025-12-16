import { Router } from 'express';
import Stripe from 'stripe';
import { PaymentService } from '../services/payment.service.js';
import { getDb } from '../mongodb.js';

const router = Router();

// Initialize Stripe only if key is available
let stripe: Stripe | null = null;
let paymentService: PaymentService | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  paymentService = new PaymentService(getDb());
}

router.post('/create-payment-intent', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment service unavailable' });
  }
  try {
    const { amount, userId, purpose } = req.body;

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'inr',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: userId.toString(),
        purpose
      }
    });

    // Store payment details in MongoDB
    if (paymentService) {
      await paymentService.createPayment({
        userId,
        amount,
        purpose,
        paymentIntentId: paymentIntent.id,
        metadata: {
          stripePaymentIntent: paymentIntent.id
        }
      });
    }

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

router.post('/webhook', async (req, res) => {
  if (!stripe || !paymentService) {
    return res.status(503).json({ error: 'Payment service unavailable' });
  }

  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig || '',
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await paymentService.updatePaymentStatus(
        paymentIntent.id,
        'succeeded',
        paymentIntent.payment_method as string
      );
      break;
    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
      await paymentService.updatePaymentStatus(
        failedPaymentIntent.id,
        'failed'
      );
      break;
  }

  res.json({ received: true });
});

router.get('/user/:userId', async (req, res) => {
  if (!paymentService) {
    return res.status(503).json({ error: 'Payment service unavailable' });
  }

  try {
    const userId = parseInt(req.params.userId, 10);
    const payments = await paymentService.getPaymentsByUserId(userId);
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({
      error: error.message
    });
  }
});

export default router; 