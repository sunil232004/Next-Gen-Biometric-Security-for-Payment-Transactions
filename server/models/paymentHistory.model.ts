import { ObjectId } from 'mongodb';
import { getDb } from '../mongodb.js';

// Payment History Status Types
export type PaymentStatus = 'initiated' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';

// Payment Method Types
export type PaymentMethod = 'upi' | 'card' | 'wallet' | 'bank_transfer' | 'netbanking' | 'biometric';

// Payment Type Categories
export type PaymentType = 
  | 'payment' 
  | 'transfer' 
  | 'recharge' 
  | 'bill_payment' 
  | 'refund' 
  | 'cashback' 
  | 'add_money'
  | 'withdrawal'
  | 'merchant_payment';

// Payment Direction - money in or out
export type PaymentDirection = 'credit' | 'debit';

// Main Payment History Interface
export interface IPaymentHistory {
  _id?: ObjectId;
  // User Reference - links to user collection
  userId: ObjectId;
  
  // Transaction Core Details
  transactionId: string; // Unique transaction reference
  type: PaymentType;
  direction: PaymentDirection;
  amount: number;
  currency: string;
  status: PaymentStatus;
  
  // Payment Method Details
  paymentMethod: PaymentMethod;
  paymentMethodDetails?: {
    upiId?: string;
    cardLast4?: string;
    cardBrand?: string;
    bankName?: string;
    walletName?: string;
    biometricType?: 'fingerprint' | 'face' | 'voice';
  };
  
  // Sender/Receiver Information
  senderDetails?: {
    userId?: string;
    name?: string;
    upiId?: string;
    accountNumber?: string;
    bankName?: string;
  };
  receiverDetails?: {
    userId?: string;
    name?: string;
    upiId?: string;
    accountNumber?: string;
    bankName?: string;
    merchantId?: string;
    merchantName?: string;
  };
  
  // Transaction Description
  description: string;
  category?: string;
  remarks?: string;
  
  // Fee/Charges Information
  fee?: number;
  tax?: number;
  totalAmount?: number; // amount + fee + tax
  
  // External References
  externalReferenceId?: string; // Reference from payment gateway
  stripePaymentIntentId?: string;
  bankReferenceNumber?: string;
  
  // Balance Information
  balanceBefore?: number;
  balanceAfter?: number;
  
  // Status History for tracking
  statusHistory: Array<{
    status: PaymentStatus;
    timestamp: Date;
    reason?: string;
    updatedBy?: string;
  }>;
  
  // Error Information (if failed)
  errorDetails?: {
    code?: string;
    message?: string;
    rawError?: string;
  };
  
  // Metadata for additional info
  metadata?: Record<string, any>;
  
  // Timestamps
  initiatedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Public version without sensitive data
export interface IPaymentHistoryPublic {
  _id: string;
  userId: string;
  transactionId: string;
  type: PaymentType;
  direction: PaymentDirection;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentMethodDetails?: {
    upiId?: string;
    cardLast4?: string;
    cardBrand?: string;
    bankName?: string;
    walletName?: string;
    biometricType?: 'fingerprint' | 'face' | 'voice';
  };
  senderDetails?: {
    name?: string;
    upiId?: string;
  };
  receiverDetails?: {
    name?: string;
    upiId?: string;
    merchantName?: string;
  };
  description: string;
  category?: string;
  remarks?: string;
  fee?: number;
  tax?: number;
  totalAmount?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  statusHistory: Array<{
    status: PaymentStatus;
    timestamp: Date;
    reason?: string;
  }>;
  initiatedAt: Date;
  completedAt?: Date;
  createdAt: Date;
}

// Collection name
export const PAYMENT_HISTORY_COLLECTION = 'payment_history';

// Generate unique transaction ID
function generateTransactionId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN${timestamp}${random}`;
}

export class PaymentHistoryModel {
  private static get collection() {
    return getDb().collection<IPaymentHistory>(PAYMENT_HISTORY_COLLECTION);
  }

  // Create indexes for optimal querying
  static async createIndexes(): Promise<void> {
    const collection = this.collection;
    await collection.createIndex({ userId: 1, createdAt: -1 });
    await collection.createIndex({ transactionId: 1 }, { unique: true });
    await collection.createIndex({ userId: 1, type: 1 });
    await collection.createIndex({ userId: 1, status: 1 });
    await collection.createIndex({ userId: 1, paymentMethod: 1 });
    await collection.createIndex({ createdAt: -1 });
    await collection.createIndex({ externalReferenceId: 1 }, { sparse: true });
  }

  // Create new payment history record
  static async create(data: Omit<IPaymentHistory, '_id' | 'transactionId' | 'createdAt' | 'updatedAt' | 'statusHistory'>): Promise<IPaymentHistory> {
    const transactionId = generateTransactionId();
    const now = new Date();
    
    const paymentHistory: IPaymentHistory = {
      ...data,
      transactionId,
      statusHistory: [{
        status: data.status,
        timestamp: now,
        reason: 'Payment initiated'
      }],
      totalAmount: data.amount + (data.fee || 0) + (data.tax || 0),
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.collection.insertOne(paymentHistory);
    paymentHistory._id = result.insertedId;
    return paymentHistory;
  }

  // Find by ID
  static async findById(id: string | ObjectId): Promise<IPaymentHistory | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return this.collection.findOne({ _id: objectId });
  }

  // Find by transaction ID
  static async findByTransactionId(transactionId: string): Promise<IPaymentHistory | null> {
    return this.collection.findOne({ transactionId });
  }

  // Find by user ID with pagination
  static async findByUserId(
    userId: string | ObjectId,
    options: {
      page?: number;
      limit?: number;
      type?: PaymentType;
      status?: PaymentStatus;
      paymentMethod?: PaymentMethod;
      direction?: PaymentDirection;
      startDate?: Date;
      endDate?: Date;
      minAmount?: number;
      maxAmount?: number;
      sortBy?: 'createdAt' | 'amount' | 'completedAt';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ payments: IPaymentHistory[]; total: number; page: number; totalPages: number }> {
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100); // Max 100 per page
    const skip = (page - 1) * limit;
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

    // Build query
    const query: any = { userId: objectId };
    
    if (options.type) query.type = options.type;
    if (options.status) query.status = options.status;
    if (options.paymentMethod) query.paymentMethod = options.paymentMethod;
    if (options.direction) query.direction = options.direction;
    
    // Date range filter
    if (options.startDate || options.endDate) {
      query.createdAt = {};
      if (options.startDate) query.createdAt.$gte = options.startDate;
      if (options.endDate) query.createdAt.$lte = options.endDate;
    }
    
    // Amount range filter
    if (options.minAmount !== undefined || options.maxAmount !== undefined) {
      query.amount = {};
      if (options.minAmount !== undefined) query.amount.$gte = options.minAmount;
      if (options.maxAmount !== undefined) query.amount.$lte = options.maxAmount;
    }

    const [payments, total] = await Promise.all([
      this.collection
        .find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .toArray(),
      this.collection.countDocuments(query)
    ]);

    return {
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Get recent payments for a user
  static async getRecent(userId: string | ObjectId, limit: number = 5): Promise<IPaymentHistory[]> {
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    return this.collection
      .find({ userId: objectId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  // Update payment status
  static async updateStatus(
    id: string | ObjectId,
    status: PaymentStatus,
    additionalData?: {
      reason?: string;
      updatedBy?: string;
      completedAt?: Date;
      balanceAfter?: number;
      errorDetails?: IPaymentHistory['errorDetails'];
    }
  ): Promise<IPaymentHistory | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const now = new Date();
    
    const updateData: any = {
      $set: {
        status,
        updatedAt: now,
        ...(additionalData?.completedAt && { completedAt: additionalData.completedAt }),
        ...(additionalData?.balanceAfter !== undefined && { balanceAfter: additionalData.balanceAfter }),
        ...(additionalData?.errorDetails && { errorDetails: additionalData.errorDetails }),
      },
      $push: {
        statusHistory: {
          status,
          timestamp: now,
          reason: additionalData?.reason,
          updatedBy: additionalData?.updatedBy,
        }
      }
    };

    const result = await this.collection.findOneAndUpdate(
      { _id: objectId },
      updateData,
      { returnDocument: 'after' }
    );

    return result;
  }

  // Get payment statistics for a user
  static async getStatistics(
    userId: string | ObjectId,
    options: {
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{
    totalTransactions: number;
    totalCredits: number;
    totalDebits: number;
    byType: Record<string, { count: number; amount: number }>;
    byPaymentMethod: Record<string, { count: number; amount: number }>;
    byStatus: Record<string, number>;
    averageTransactionAmount: number;
  }> {
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    const query: any = { userId: objectId, status: 'completed' };
    if (options.startDate || options.endDate) {
      query.createdAt = {};
      if (options.startDate) query.createdAt.$gte = options.startDate;
      if (options.endDate) query.createdAt.$lte = options.endDate;
    }

    const payments = await this.collection.find(query).toArray();
    
    const stats = {
      totalTransactions: payments.length,
      totalCredits: 0,
      totalDebits: 0,
      byType: {} as Record<string, { count: number; amount: number }>,
      byPaymentMethod: {} as Record<string, { count: number; amount: number }>,
      byStatus: {} as Record<string, number>,
      averageTransactionAmount: 0,
    };

    let totalAmount = 0;

    for (const payment of payments) {
      totalAmount += payment.amount;
      
      // Credits vs Debits
      if (payment.direction === 'credit') {
        stats.totalCredits += payment.amount;
      } else {
        stats.totalDebits += payment.amount;
      }
      
      // By Type
      if (!stats.byType[payment.type]) {
        stats.byType[payment.type] = { count: 0, amount: 0 };
      }
      stats.byType[payment.type].count++;
      stats.byType[payment.type].amount += payment.amount;
      
      // By Payment Method
      if (!stats.byPaymentMethod[payment.paymentMethod]) {
        stats.byPaymentMethod[payment.paymentMethod] = { count: 0, amount: 0 };
      }
      stats.byPaymentMethod[payment.paymentMethod].count++;
      stats.byPaymentMethod[payment.paymentMethod].amount += payment.amount;
      
      // By Status
      if (!stats.byStatus[payment.status]) {
        stats.byStatus[payment.status] = 0;
      }
      stats.byStatus[payment.status]++;
    }

    stats.averageTransactionAmount = payments.length > 0 ? totalAmount / payments.length : 0;

    return stats;
  }

  // Search payments
  static async search(
    userId: string | ObjectId,
    searchQuery: string,
    limit: number = 50
  ): Promise<IPaymentHistory[]> {
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const searchRegex = new RegExp(searchQuery, 'i');
    
    return this.collection
      .find({
        userId: objectId,
        $or: [
          { description: searchRegex },
          { transactionId: searchRegex },
          { 'receiverDetails.name': searchRegex },
          { 'receiverDetails.upiId': searchRegex },
          { 'receiverDetails.merchantName': searchRegex },
          { 'senderDetails.name': searchRegex },
          { 'senderDetails.upiId': searchRegex },
          { category: searchRegex },
          { remarks: searchRegex },
        ]
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  // Get monthly summary
  static async getMonthlySummary(
    userId: string | ObjectId,
    year: number,
    month: number
  ): Promise<{
    month: number;
    year: number;
    totalCredits: number;
    totalDebits: number;
    netAmount: number;
    transactionCount: number;
    topCategories: Array<{ category: string; amount: number; count: number }>;
  }> {
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const payments = await this.collection
      .find({
        userId: objectId,
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      })
      .toArray();

    let totalCredits = 0;
    let totalDebits = 0;
    const categoryMap = new Map<string, { amount: number; count: number }>();

    for (const payment of payments) {
      if (payment.direction === 'credit') {
        totalCredits += payment.amount;
      } else {
        totalDebits += payment.amount;
      }
      
      const category = payment.category || 'Other';
      const existing = categoryMap.get(category) || { amount: 0, count: 0 };
      categoryMap.set(category, {
        amount: existing.amount + payment.amount,
        count: existing.count + 1
      });
    }

    const topCategories = Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      month,
      year,
      totalCredits,
      totalDebits,
      netAmount: totalCredits - totalDebits,
      transactionCount: payments.length,
      topCategories,
    };
  }

  // Convert to public format (hide sensitive data)
  static toPublic(payment: IPaymentHistory): IPaymentHistoryPublic {
    return {
      _id: payment._id!.toString(),
      userId: payment.userId.toString(),
      transactionId: payment.transactionId,
      type: payment.type,
      direction: payment.direction,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      paymentMethodDetails: payment.paymentMethodDetails ? {
        upiId: payment.paymentMethodDetails.upiId,
        cardLast4: payment.paymentMethodDetails.cardLast4,
        cardBrand: payment.paymentMethodDetails.cardBrand,
        bankName: payment.paymentMethodDetails.bankName,
        walletName: payment.paymentMethodDetails.walletName,
        biometricType: payment.paymentMethodDetails.biometricType,
      } : undefined,
      senderDetails: payment.senderDetails ? {
        name: payment.senderDetails.name,
        upiId: payment.senderDetails.upiId,
      } : undefined,
      receiverDetails: payment.receiverDetails ? {
        name: payment.receiverDetails.name,
        upiId: payment.receiverDetails.upiId,
        merchantName: payment.receiverDetails.merchantName,
      } : undefined,
      description: payment.description,
      category: payment.category,
      remarks: payment.remarks,
      fee: payment.fee,
      tax: payment.tax,
      totalAmount: payment.totalAmount,
      balanceBefore: payment.balanceBefore,
      balanceAfter: payment.balanceAfter,
      statusHistory: payment.statusHistory.map(h => ({
        status: h.status,
        timestamp: h.timestamp,
        reason: h.reason,
      })),
      initiatedAt: payment.initiatedAt,
      completedAt: payment.completedAt,
      createdAt: payment.createdAt,
    };
  }

  // Delete by user ID (for account deletion)
  static async deleteByUserId(userId: string | ObjectId): Promise<number> {
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const result = await this.collection.deleteMany({ userId: objectId });
    return result.deletedCount;
  }

  // Delete all (for cleanup/testing)
  static async deleteAll(): Promise<void> {
    await this.collection.deleteMany({});
  }
}
