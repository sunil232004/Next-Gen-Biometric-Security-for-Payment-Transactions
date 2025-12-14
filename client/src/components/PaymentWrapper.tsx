import React from 'react';
import { UPIPinVerification } from './UpiPinVerification';

interface PaymentWrapperProps {
  amount: number;
  userId: number;
  purpose?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentWrapper({ amount, userId, purpose, onSuccess, onCancel }: PaymentWrapperProps) {
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Complete Payment</h2>
      <p className="text-gray-600 mb-6">Amount to pay: ₹{amount}</p>
      <UPIPinVerification
        userId={userId}
        amount={amount}
        purpose={purpose}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </div>
  );
} 