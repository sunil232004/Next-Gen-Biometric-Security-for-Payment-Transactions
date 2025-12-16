/**
 * Mock Stripe Payment Gateway
 * 
 * This module simulates Stripe's API for development and demo purposes.
 * It maintains the same interface as the real Stripe SDK to appear authentic.
 * 
 * Environment variables used (for authenticity):
 * - STRIPE_SECRET_KEY: Used to validate the "API key" format
 * - STRIPE_WEBHOOK_SECRET: Used in webhook signature "verification"
 */

// Generate random ID similar to Stripe's format
const generateId = (prefix: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix + '_';
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Store for mock payment intents (in-memory for demo)
const paymentIntents: Map<string, MockPaymentIntent> = new Map();

// Types that match Stripe's interface
export interface MockPaymentIntent {
  id: string;
  object: 'payment_intent';
  amount: number;
  amount_received: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled' | 'requires_capture';
  client_secret: string;
  created: number;
  livemode: boolean;
  metadata: Record<string, string>;
  payment_method?: string;
  automatic_payment_methods?: {
    enabled: boolean;
  };
  description?: string;
  receipt_email?: string;
}

export interface MockPaymentMethod {
  id: string;
  object: 'payment_method';
  type: 'card' | 'upi';
  created: number;
  livemode: boolean;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface MockWebhookEvent {
  id: string;
  object: 'event';
  type: string;
  created: number;
  livemode: boolean;
  data: {
    object: MockPaymentIntent;
  };
}

// Mock Stripe class that mimics the real SDK
export class MockStripe {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    console.log('[MockStripe] Initialized with API key:', apiKey.substring(0, 10) + '...');
  }

  paymentIntents = {
    create: async (params: {
      amount: number;
      currency: string;
      automatic_payment_methods?: { enabled: boolean };
      metadata?: Record<string, string>;
      description?: string;
      receipt_email?: string;
    }): Promise<MockPaymentIntent> => {
      // Simulate network delay for realism
      await new Promise(resolve => setTimeout(resolve, 200));

      const id = generateId('pi');
      const clientSecret = `${id}_secret_${generateId('cs')}`;

      const paymentIntent: MockPaymentIntent = {
        id,
        object: 'payment_intent',
        amount: params.amount,
        amount_received: 0,
        currency: params.currency,
        status: 'requires_payment_method',
        client_secret: clientSecret,
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        metadata: params.metadata || {},
        automatic_payment_methods: params.automatic_payment_methods,
        description: params.description,
        receipt_email: params.receipt_email,
      };

      paymentIntents.set(id, paymentIntent);
      console.log('[MockStripe] Created payment intent:', id);

      return paymentIntent;
    },

    retrieve: async (id: string): Promise<MockPaymentIntent | null> => {
      await new Promise(resolve => setTimeout(resolve, 100));
      const intent = paymentIntents.get(id);
      console.log('[MockStripe] Retrieved payment intent:', id, intent ? 'found' : 'not found');
      return intent || null;
    },

    confirm: async (id: string, params?: {
      payment_method?: string;
      return_url?: string;
    }): Promise<MockPaymentIntent> => {
      await new Promise(resolve => setTimeout(resolve, 300));

      const intent = paymentIntents.get(id);
      if (!intent) {
        throw new Error(`No such payment_intent: '${id}'`);
      }

      // Simulate payment success (90% success rate for demo)
      const success = Math.random() > 0.1;

      intent.status = success ? 'succeeded' : 'requires_payment_method';
      intent.amount_received = success ? intent.amount : 0;
      intent.payment_method = params?.payment_method || generateId('pm');

      paymentIntents.set(id, intent);
      console.log('[MockStripe] Confirmed payment intent:', id, 'status:', intent.status);

      return intent;
    },

    update: async (id: string, params: Partial<MockPaymentIntent>): Promise<MockPaymentIntent> => {
      await new Promise(resolve => setTimeout(resolve, 100));

      const intent = paymentIntents.get(id);
      if (!intent) {
        throw new Error(`No such payment_intent: '${id}'`);
      }

      Object.assign(intent, params);
      paymentIntents.set(id, intent);
      console.log('[MockStripe] Updated payment intent:', id);

      return intent;
    },

    cancel: async (id: string): Promise<MockPaymentIntent> => {
      await new Promise(resolve => setTimeout(resolve, 100));

      const intent = paymentIntents.get(id);
      if (!intent) {
        throw new Error(`No such payment_intent: '${id}'`);
      }

      intent.status = 'canceled';
      paymentIntents.set(id, intent);
      console.log('[MockStripe] Canceled payment intent:', id);

      return intent;
    },
  };

  paymentMethods = {
    create: async (params: {
      type: 'card' | 'upi';
      card?: {
        number: string;
        exp_month: number;
        exp_year: number;
        cvc: string;
      };
    }): Promise<MockPaymentMethod> => {
      await new Promise(resolve => setTimeout(resolve, 150));

      const paymentMethod: MockPaymentMethod = {
        id: generateId('pm'),
        object: 'payment_method',
        type: params.type,
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        ...(params.card && {
          card: {
            brand: detectCardBrand(params.card.number),
            last4: params.card.number.slice(-4),
            exp_month: params.card.exp_month,
            exp_year: params.card.exp_year,
          },
        }),
      };

      console.log('[MockStripe] Created payment method:', paymentMethod.id);
      return paymentMethod;
    },

    retrieve: async (id: string): Promise<MockPaymentMethod> => {
      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        id,
        object: 'payment_method',
        type: 'card',
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
        },
      };
    },
  };

  webhooks = {
    constructEvent: (
      payload: any,
      signature: string,
      secret: string
    ): MockWebhookEvent => {
      // Simulate webhook signature verification
      // In reality, this would verify HMAC signature
      console.log('[MockStripe] Constructing webhook event');

      if (!secret) {
        throw new Error('Webhook secret is required');
      }

      // Parse the payload
      const data = typeof payload === 'string' ? JSON.parse(payload) : payload;

      return {
        id: generateId('evt'),
        object: 'event',
        type: data.type || 'payment_intent.succeeded',
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        data: {
          object: data.data?.object || {},
        },
      };
    },
  };
}

// Helper function to detect card brand from number
function detectCardBrand(number: string): string {
  const cleaned = number.replace(/\s/g, '');
  if (cleaned.startsWith('4')) return 'visa';
  if (cleaned.startsWith('5') || cleaned.startsWith('2')) return 'mastercard';
  if (cleaned.startsWith('3')) return 'amex';
  if (cleaned.startsWith('6')) return 'discover';
  return 'unknown';
}

// Utility function to simulate successful payment (for UPI and other flows)
export async function simulateSuccessfulPayment(paymentIntentId: string): Promise<MockPaymentIntent> {
  const intent = paymentIntents.get(paymentIntentId);
  if (!intent) {
    throw new Error(`No such payment_intent: '${paymentIntentId}'`);
  }

  intent.status = 'succeeded';
  intent.amount_received = intent.amount;
  intent.payment_method = generateId('pm');
  paymentIntents.set(paymentIntentId, intent);

  console.log('[MockStripe] Payment simulated as successful:', paymentIntentId);
  return intent;
}

// Utility function to verify payment status
export function getPaymentStatus(paymentIntentId: string): MockPaymentIntent | null {
  return paymentIntents.get(paymentIntentId) || null;
}

// Create a "Stripe" instance that looks like the real thing
export function createStripeInstance(apiKey: string): MockStripe {
  // Validate API key format (sk_test_... or sk_live_...)
  if (!apiKey || (!apiKey.startsWith('sk_test_') && !apiKey.startsWith('sk_live_') && !apiKey.startsWith('sk_'))) {
    console.warn('[MockStripe] Warning: API key does not follow Stripe format');
  }
  return new MockStripe(apiKey);
}

// Export as default for compatibility
export default MockStripe;
