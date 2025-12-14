import { ObjectId } from 'mongodb';

export interface Payment {
  _id?: ObjectId;
  userId: number;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  paymentIntentId: string;
  paymentMethodId?: string;
  purpose: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export const PAYMENTS_COLLECTION = 'payments';

export function createPaymentDocument(data: {
  userId: number;
  amount: number;
  purpose: string;
  paymentIntentId: string;
  paymentMethodId?: string;
  metadata?: Record<string, any>;
}): Payment {
  return {
    userId: data.userId,
    amount: data.amount,
    currency: 'inr',
    status: 'pending',
    paymentIntentId: data.paymentIntentId,
    paymentMethodId: data.paymentMethodId,
    purpose: data.purpose,
    metadata: data.metadata,
    createdAt: new Date(),
    updatedAt: new Date()
  };
} 