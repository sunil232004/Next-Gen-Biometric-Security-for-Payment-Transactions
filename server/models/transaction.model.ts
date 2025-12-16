import { ObjectId } from 'mongodb';
import { getDb } from '../mongodb.js';

export interface ITransaction {
  _id?: ObjectId;
  userId: ObjectId;
  type: 'payment' | 'transfer' | 'recharge' | 'bill_payment' | 'refund' | 'cashback' | 'add_money';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  description: string;
  recipientId?: string;
  recipientName?: string;
  paymentMethod?: 'upi' | 'card' | 'biometric' | 'wallet' | 'bank_transfer';
  biometricType?: 'fingerprint' | 'face' | 'voice';
  stripePaymentId?: string;
  category?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransactionPublic {
  _id: string;
  userId: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  recipientId?: string;
  recipientName?: string;
  paymentMethod?: string;
  biometricType?: string;
  category?: string;
  createdAt: Date;
}

export const TRANSACTIONS_COLLECTION = 'transactions';

export class TransactionModel {
  private static get collection() {
    return getDb().collection<ITransaction>(TRANSACTIONS_COLLECTION);
  }

  // Create transaction
  static async create(data: Omit<ITransaction, '_id' | 'createdAt' | 'updatedAt'>): Promise<ITransaction> {
    const transaction: ITransaction = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection.insertOne(transaction);
    transaction._id = result.insertedId;
    return transaction;
  }

  // Find by ID
  static async findById(id: string | ObjectId): Promise<ITransaction | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return this.collection.findOne({ _id: objectId });
  }

  // Find by user ID with pagination
  static async findByUserId(
    userId: string | ObjectId, 
    options: { page?: number; limit?: number; type?: string } = {}
  ): Promise<{ transactions: ITransaction[]; total: number }> {
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const query: any = { userId: objectId };
    if (options.type) {
      query.type = options.type;
    }

    const [transactions, total] = await Promise.all([
      this.collection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      this.collection.countDocuments(query)
    ]);

    return { transactions, total };
  }

  // Find by user ID with filters
  static async findByUserIdWithFilters(
    userId: string | ObjectId,
    filters: {
      type?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit = 50
  ): Promise<ITransaction[]> {
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    const query: any = { userId: objectId };
    
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    return this.collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  // Update status
  static async updateStatus(id: string | ObjectId, status: ITransaction['status']): Promise<boolean> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await this.collection.updateOne(
      { _id: objectId },
      { 
        $set: { 
          status,
          updatedAt: new Date()
        }
      }
    );
    return result.modifiedCount > 0;
  }

  // Convert to public
  static toPublic(transaction: ITransaction): ITransactionPublic {
    return {
      _id: transaction._id!.toString(),
      userId: transaction.userId.toString(),
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      description: transaction.description,
      recipientId: transaction.recipientId,
      recipientName: transaction.recipientName,
      paymentMethod: transaction.paymentMethod,
      biometricType: transaction.biometricType,
      category: transaction.category,
      createdAt: transaction.createdAt,
    };
  }

  // Delete all by user
  static async deleteByUserId(userId: string | ObjectId): Promise<void> {
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    await this.collection.deleteMany({ userId: objectId });
  }

  // Delete all transactions (for cleanup)
  static async deleteAll(): Promise<void> {
    await this.collection.deleteMany({});
  }
}
