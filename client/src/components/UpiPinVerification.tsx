import React, { useState } from 'react';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { getApiUrl } from '@/lib/api';

interface UPIPinVerificationProps {
  userId: number;
  amount: number;
  purpose?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UPIPinVerification({ userId, amount, purpose = 'payment', onSuccess, onCancel }: UPIPinVerificationProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const pinString = pin.join('');
    if (pinString.length !== 4) {
      toast({
        title: 'Invalid PIN',
        description: 'UPI PIN must be 4 digits',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // First verify the UPI PIN
      const verifyResponse = await fetch(getApiUrl('/api/verify-upi-pin'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId, 
          upiPin: pinString
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Failed to verify UPI PIN');
      }

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        toast({
          title: 'Invalid PIN',
          description: 'Please enter the correct UPI PIN',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Create the transaction
      const transactionResponse = await fetch(getApiUrl('/api/transaction'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          type: purpose || 'payment',
          amount,
          status: 'success',
          description: `${purpose || 'Payment'} of ₹${amount}`,
          timestamp: new Date().toISOString(),
          metadata: JSON.stringify({
            paymentMethod: 'upi_pin',
            purpose: purpose
          })
        })
      });

      if (!transactionResponse.ok) {
        throw new Error('Failed to create transaction');
      }

      const transactionData = await transactionResponse.json();

      if (transactionData.success) {
        toast({
          title: 'Success',
          description: 'Payment processed successfully',
        });
        onSuccess();
      } else {
        throw new Error(transactionData.message || 'Transaction failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process payment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Complete Payment</h2>
        <p className="text-sm text-gray-600">Enter your 4-digit UPI PIN</p>
        <div className="flex justify-between gap-4 mt-4">
          {pin.map((digit, index) => (
            <Input
              key={index}
              id={`pin-${index}`}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handlePinChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-2xl rounded-md border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              autoComplete="off"
            />
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="flex-1 bg-[#00239C] hover:bg-[#001D7E] text-white py-3 rounded-md"
        >
          {isLoading ? 'Processing...' : `Pay ₹${amount}`}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
} 