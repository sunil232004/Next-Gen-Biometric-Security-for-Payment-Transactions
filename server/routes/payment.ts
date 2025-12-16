import { Router } from 'express';
import { createStripeInstance, simulateSuccessfulPayment, getPaymentStatus, MockStripe } from '../services/stripe.js';
import { PaymentService } from '../services/payment.service.js';
import { getDb } from '../mongodb.js';

const router = Router();

// Initialize "Stripe" (mock) only if key is available
// Uses STRIPE_SECRET_KEY environment variable for authenticity
let stripe: MockStripe | null = null;
let paymentService: PaymentService | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = createStripeInstance(process.env.STRIPE_SECRET_KEY);
  paymentService = new PaymentService(getDb());
  console.log('[Payment] Stripe payment gateway initialized');
}

router.post('/create-payment-intent', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment service unavailable - STRIPE_SECRET_KEY not configured' });
  }
  try {
    const { amount, userId, purpose } = req.body;

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to paise (cents equivalent)
      currency: 'inr',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: userId?.toString() || '1',
        purpose: purpose || 'payment'
      }
    });

    // Store payment details in MongoDB
    if (paymentService) {
      await paymentService.createPayment({
        userId: userId || 1,
        amount,
        purpose: purpose || 'payment',
        paymentIntentId: paymentIntent.id,
        metadata: {
          stripePaymentIntent: paymentIntent.id
        }
      });
    }

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
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

  const sig = req.headers['stripe-signature'] as string;

  let event;

  try {
    // Uses STRIPE_WEBHOOK_SECRET environment variable for authenticity
    event = stripe.webhooks.constructEvent(
      req.body,
      sig || '',
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock_secret'
    );
  } catch (err: any) {
    console.error('[Webhook] Error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await paymentService.updatePaymentStatus(
        paymentIntent.id,
        'succeeded',
        paymentIntent.payment_method as string
      );
      console.log('[Webhook] Payment succeeded:', paymentIntent.id);
      break;
    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object;
      await paymentService.updatePaymentStatus(
        failedPaymentIntent.id,
        'failed'
      );
      console.log('[Webhook] Payment failed:', failedPaymentIntent.id);
      break;
  }

  res.json({ received: true });
});

// Endpoint to verify and complete payment (for UPI/mock flows)
router.post('/verify-payment', async (req, res) => {
  if (!stripe || !paymentService) {
    return res.status(503).json({ error: 'Payment service unavailable' });
  }

  try {
    const { paymentIntentId, userId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    // Simulate successful payment completion
    const paymentIntent = await simulateSuccessfulPayment(paymentIntentId);

    // Update status in database
    await paymentService.updatePaymentStatus(
      paymentIntentId,
      'succeeded',
      paymentIntent.payment_method
    );

    console.log('[Payment] Verified and completed payment:', paymentIntentId);

    res.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      }
    });
  } catch (error: any) {
    console.error('[Payment] Verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint to get payment status
router.get('/payment-status/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const status = getPaymentStatus(paymentIntentId);

    if (!status) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({
      id: status.id,
      status: status.status,
      amount: status.amount,
      currency: status.currency,
      created: status.created
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
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