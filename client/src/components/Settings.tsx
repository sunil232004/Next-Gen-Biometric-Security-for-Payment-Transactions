import React, { useState } from 'react';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { getApiUrl } from '@/lib/api';

interface SettingsProps {
  userId: number;
}

export function Settings({ userId }: SettingsProps) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSetUPIPin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPin.length !== 4) {
      toast({
        title: 'Invalid PIN',
        description: 'UPI PIN must be 4 digits',
        variant: 'destructive',
      });
      return;
    }

    if (newPin !== confirmPin) {
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
        body: JSON.stringify({ userId, upiPin: newPin }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'UPI PIN set successfully',
        });
        setNewPin('');
        setConfirmPin('');
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>UPI PIN Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetUPIPin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="newPin" className="text-sm font-medium">
                Set New UPI PIN (4 digits)
              </label>
              <Input
                id="newPin"
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter new PIN"
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
        </CardContent>
      </Card>
    </div>
  );
} 