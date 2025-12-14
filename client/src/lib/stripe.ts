import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with the public key
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Function to handle Stripe errors
export const handleStripeError = (error: any) => {
  console.error('Stripe error:', error);
  throw error;
};

// Function to create a payment intent
export const createPaymentIntent = async (amount: number) => {
  try {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
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
    const response = await fetch('/api/verify-payment', {
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
    const response = await fetch('/api/verify-biometric', {
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