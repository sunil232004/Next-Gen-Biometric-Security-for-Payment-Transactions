import React, { useState } from 'react';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { getApiUrl } from '@/lib/api';

interface UPIPinSetupProps {
  userId: number;
  onSuccess: () => void;
}

export function UPIPinSetup({ userId, onSuccess }: UPIPinSetupProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length !== 4) {
      toast({
        title: 'Invalid PIN',
        description: 'UPI PIN must be 4 digits',
        variant: 'destructive',
      });
      return;
    }

    if (pin !== confirmPin) {
      toast({
        title: 'PINs do not match',
        description: 'Please make sure both PINs match',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/set-upi-pin'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, upiPin: pin }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'UPI PIN set successfully',
        });
        onSuccess();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to set UPI PIN',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to set UPI PIN',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="pin" className="text-sm font-medium">
          Enter 4-digit UPI PIN
        </label>
        <Input
          id="pin"
          type="password"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder="Enter PIN"
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="confirmPin" className="text-sm font-medium">
          Confirm UPI PIN
        </label>
        <Input
          id="confirmPin"
          type="password"
          maxLength={4}
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
          placeholder="Confirm PIN"
          className="w-full"
        />
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Setting PIN...' : 'Set UPI PIN'}
      </Button>
    </form>
  );
} 