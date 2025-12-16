/**
 * Mock Stripe Client-Side Integration
 * 
 * This module simulates Stripe.js for the frontend.
 * It maintains the same interface as the real @stripe/stripe-js to appear authentic.
 * 
 * Environment variables used (for authenticity):
 * - VITE_STRIPE_PUBLIC_KEY: Used to validate the "API key" format
 */

import { getApiUrl } from './api';

// Mock Stripe instance type
interface MockStripeInstance {
  elements: (options?: any) => MockElements;
  confirmPayment: (options: any) => Promise<MockPaymentResult>;
  confirmCardPayment: (clientSecret: string, data?: any) => Promise<MockPaymentResult>;
  retrievePaymentIntent: (clientSecret: string) => Promise<{ paymentIntent: MockPaymentIntent | null }>;
}

interface MockElements {
  create: (type: string, options?: any) => MockElement;
  getElement: (type: string) => MockElement | null;
}

interface MockElement {
  mount: (selector: string | HTMLElement) => void;
  unmount: () => void;
  destroy: () => void;
  on: (event: string, handler: (event: any) => void) => void;
  update: (options: any) => void;
}

interface MockPaymentIntent {
  id: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  client_secret: string;
  amount: number;
  currency: string;
}

interface MockPaymentResult {
  paymentIntent?: MockPaymentIntent;
  error?: {
    message: string;
    type: string;
    code?: string;
  };
}

// In-memory storage for elements
const elementStore: Map<string, MockElement> = new Map();

// Create a mock element
function createMockElement(type: string): MockElement {
  const handlers: Map<string, ((event: any) => void)[]> = new Map();
  
  return {
    mount: (selector: string | HTMLElement) => {
      console.log(`[MockStripe] Element "${type}" mounted to`, selector);
      // Trigger ready event
      setTimeout(() => {
        const readyHandlers = handlers.get('ready') || [];
        readyHandlers.forEach(h => h({}));
      }, 100);
    },
    unmount: () => {
      console.log(`[MockStripe] Element "${type}" unmounted`);
    },
    destroy: () => {
      console.log(`[MockStripe] Element "${type}" destroyed`);
    },
    on: (event: string, handler: (event: any) => void) => {
      const existing = handlers.get(event) || [];
      handlers.set(event, [...existing, handler]);
    },
    update: (options: any) => {
      console.log(`[MockStripe] Element "${type}" updated`, options);
    },
  };
}

// Create the mock Stripe instance
function createMockStripe(publishableKey: string): MockStripeInstance {
  console.log('[MockStripe] Initialized with key:', publishableKey?.substring(0, 15) + '...');
  
  return {
    elements: (options?: any) => {
      console.log('[MockStripe] Creating elements with options:', options);
      return {
        create: (type: string, elementOptions?: any) => {
          const element = createMockElement(type);
          elementStore.set(type, element);
          return element;
        },
        getElement: (type: string) => {
          return elementStore.get(type) || null;
        },
      };
    },
    
    confirmPayment: async (options: any) => {
      console.log('[MockStripe] Confirming payment...');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 95% success rate for demo
      const success = Math.random() > 0.05;
      
      if (success) {
        return {
          paymentIntent: {
            id: 'pi_mock_' + Date.now(),
            status: 'succeeded',
            client_secret: options.clientSecret || '',
            amount: 0,
            currency: 'inr',
          },
        };
      } else {
        return {
          error: {
            message: 'Your card was declined.',
            type: 'card_error',
            code: 'card_declined',
          },
        };
      }
    },
    
    confirmCardPayment: async (clientSecret: string, data?: any) => {
      console.log('[MockStripe] Confirming card payment...');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        paymentIntent: {
          id: 'pi_mock_' + Date.now(),
          status: 'succeeded',
          client_secret: clientSecret,
          amount: 0,
          currency: 'inr',
        },
      };
    },
    
    retrievePaymentIntent: async (clientSecret: string) => {
      console.log('[MockStripe] Retrieving payment intent...');
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return {
        paymentIntent: {
          id: clientSecret.split('_secret_')[0],
          status: 'requires_payment_method',
          client_secret: clientSecret,
          amount: 0,
          currency: 'inr',
        },
      };
    },
  };
}

// Mock loadStripe function (mimics @stripe/stripe-js)
export const loadStripe = async (publishableKey: string): Promise<MockStripeInstance | null> => {
  // Simulate async loading like real Stripe.js
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (!publishableKey) {
    console.warn('[MockStripe] No publishable key provided');
    return null;
  }
  
  return createMockStripe(publishableKey);
};

// Initialize "Stripe" with the public key (uses VITE_STRIPE_PUBLIC_KEY for authenticity)
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_mock_key');

// Function to handle Stripe errors
export const handleStripeError = (error: any) => {
  console.error('Stripe error:', error);
  throw error;
};

// Function to create a payment intent
export const createPaymentIntent = async (amount: number, userId?: number, purpose?: string) => {
  try {
    const response = await fetch(getApiUrl('/api/payment/create-payment-intent'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, userId: userId || 1, purpose: purpose || 'payment' }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create payment intent');
    }

    return await response.json();
  } catch (error) {
    handleStripeError(error);
    throw error;
  }
};

// Function to verify payment
export const verifyPayment = async (paymentIntentId: string, userId: number) => {
  try {
    const response = await fetch(getApiUrl('/api/payment/verify-payment'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentIntentId, userId }),
    });

    if (!response.ok) {
      throw new Error('Payment verification failed');
    }

    return await response.json();
  } catch (error) {
    handleStripeError(error);
    throw error;
  }
};

// Function to verify biometric authentication
export const verifyBiometric = async (userId: number, authType: string, authData: string) => {
  try {
    const response = await fetch(getApiUrl('/api/verify-biometric'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, authType, authData }),
    });

    if (!response.ok) {
      throw new Error('Biometric verification failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Biometric verification error:', error);
    throw error;
  }
};

// Get payment status
export const getPaymentStatus = async (paymentIntentId: string) => {
  try {
    const response = await fetch(getApiUrl(`/api/payment/payment-status/${paymentIntentId}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get payment status');
    }

    return await response.json();
  } catch (error) {
    console.error('Payment status error:', error);
    throw error;
  }
};

// Export types for components
export type { MockStripeInstance as Stripe, MockPaymentIntent as PaymentIntent }; 