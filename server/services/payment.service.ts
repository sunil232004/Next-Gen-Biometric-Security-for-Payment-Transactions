import { Collection, Db } from 'mongodb';
import { Payment, PAYMENTS_COLLECTION, createPaymentDocument } from '../models/payment.js';

export class PaymentService {
  private collection: Collection<Payment>;

  constructor(db: Db) {
    this.collection = db.collection(PAYMENTS_COLLECTION);
  }

  async createPayment(data: {
    userId: number;
    amount: number;
    purpose: string;
    paymentIntentId: string;
    paymentMethodId?: string;
    metadata?: Record<string, any>;
  }): Promise<Payment> {
    const payment = createPaymentDocument(data);
    await this.collection.insertOne(payment);
    return payment;
  }

  async updatePaymentStatus(
    paymentIntentId: string,
    status: Payment['status'],
    paymentMethodId?: string
  ): Promise<void> {
    await this.collection.updateOne(
      { paymentIntentId },
      {
        $set: {
          status,
          ...(paymentMethodId && { paymentMethodId }),
          updatedAt: new Date()
        }
      }
    );
  }

  async getPaymentByIntentId(paymentIntentId: string): Promise<Payment | null> {
    return this.collection.findOne({ paymentIntentId });
  }

  async getPaymentsByUserId(userId: number): Promise<Payment[]> {
    return this.collection.find({ userId }).sort({ createdAt: -1 }).toArray();
  }
} 