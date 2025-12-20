import React, { useState } from 'react';
import { verifyPayment, verifyBiometric, stripePromise } from '../lib/stripe';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CreditCard, Lock, Calendar, User } from 'lucide-react';

interface PaymentFormProps {
  amount: number;
  userId: number;
  clientSecret: string;
  paymentIntentId?: string;
  onSuccess: () => void;
  onError: (error: Error) => void;
}

export function PaymentForm({ amount, userId, clientSecret, paymentIntentId, onSuccess, onError }: PaymentFormProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Card details state (mock - for display only)
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.substring(0, 16);
    const formatted = limited.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted;
  };

  // Format expiry date
  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.substring(0, 4);
    if (limited.length >= 2) {
      return limited.substring(0, 2) + '/' + limited.substring(2);
    }
    return limited;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Frontend validation for required fields
    if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
      toast({
        title: 'Invalid Card Number',
        description: 'Please enter a valid 16-digit card number.',
        variant: 'destructive',
      });
      return;
    }
    if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
      toast({
        title: 'Invalid Expiry Date',
        description: 'Please enter expiry in MM/YY format.',
        variant: 'destructive',
      });
      return;
    }
    if (!cvc || cvc.length < 3) {
      toast({
        title: 'Invalid CVC',
        description: 'Please enter a valid CVC (3 or 4 digits).',
        variant: 'destructive',
      });
      return;
    }
    if (!name || name.trim().length < 2) {
      toast({
        title: 'Cardholder Name Required',
        description: 'Please enter the cardholder name.',
        variant: 'destructive',
      });
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

      // Get the mock Stripe instance
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Payment system unavailable');
      }

      // Simulate card payment confirmation
      const result = await stripe.confirmPayment({
        clientSecret,
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
        const verificationResult = await verifyPayment(
          paymentIntentId || result.paymentIntent.id, 
          userId
        );
        
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
      {/* Mock Card Input UI - looks like Stripe Elements */}
      <div className="p-4 border rounded-lg bg-white space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cardNumber" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Card Number
          </Label>
          <Input
            id="cardNumber"
            type="text"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            className="font-mono"
            maxLength={19}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiry" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Expiry
            </Label>
            <Input
              id="expiry"
              type="text"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              maxLength={5}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cvc" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              CVC
            </Label>
            <Input
              id="cvc"
              type="text"
              placeholder="123"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').substring(0, 4))}
              maxLength={4}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Cardholder Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>

      {/* Stripe branding for authenticity */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <Lock className="w-3 h-3" />
        <span>Powered by Stripe</span>
      </div>

      <Button
        type="submit"
        disabled={isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processing...' : `Pay ₹${amount}`}
      </Button>
    </form>
  );
} 