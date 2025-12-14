import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { verifyPayment, verifyBiometric } from '../lib/stripe';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

interface PaymentFormProps {
  amount: number;
  userId: number;
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: Error) => void;
}

export function PaymentForm({ amount, userId, clientSecret, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // First, verify biometric if available
      try {
        const biometricResult = await verifyBiometric(userId, 'fingerprint', 'biometric_data');
        if (!biometricResult.success) {
          throw new Error('Biometric verification failed');
        }
      } catch (error) {
        console.warn('Biometric verification not available or failed, proceeding with card payment');
      }

      // Confirm the payment
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        throw new Error(result.error.message || 'Payment failed');
      }

      // Verify the payment on our server
      if (result.paymentIntent) {
        const verificationResult = await verifyPayment(result.paymentIntent.id, userId);
        if (verificationResult.success) {
          toast({
            title: 'Payment Successful',
            description: `Payment of ₹${amount} was successful.`,
          });
          onSuccess();
        } else {
          throw new Error('Payment verification failed');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error instanceof Error ? error.message : 'Payment failed',
        variant: 'destructive',
      });
      onError(error instanceof Error ? error : new Error('Payment failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processing...' : `Pay ₹${amount}`}
      </Button>
    </form>
  );
} 