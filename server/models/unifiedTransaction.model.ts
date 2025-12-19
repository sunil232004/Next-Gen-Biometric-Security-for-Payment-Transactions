import { ObjectId, Collection } from 'mongodb';
import { getDb } from '../mongodb.js';

// ==================== ENUMS & TYPES ====================

export const TransactionType = {
  PAYMENT: 'payment',
  TRANSFER: 'transfer',
  ADD_MONEY: 'add_money',
  WITHDRAWAL: 'withdrawal',
  RECHARGE: 'recharge',
  BILL_PAYMENT: 'bill_payment',
  REFUND: 'refund',
  CASHBACK: 'cashback',
  LOAN_DISBURSEMENT: 'loan_disbursement',
  LOAN_REPAYMENT: 'loan_repayment',
} as const;
export type TransactionType = typeof TransactionType[keyof typeof TransactionType];

export const TransactionStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  ON_HOLD: 'on_hold',
} as const;
export type TransactionStatus = typeof TransactionStatus[keyof typeof TransactionStatus];

export const PaymentMethod = {
  UPI: 'upi',
  CARD: 'card',
  NET_BANKING: 'net_banking',
  WALLET: 'wallet',
  BIOMETRIC: 'biometric',
  BANK_TRANSFER: 'bank_transfer',
  CASH: 'cash',
} as const;
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const TransactionDirection = {
  DEBIT: 'debit',
  CREDIT: 'credit',
} as const;
export type TransactionDirection = typeof TransactionDirection[keyof typeof TransactionDirection];

// ==================== INTERFACES ====================

export interface IPaymentMethodDetails {
  cardLast4?: string;
  cardBrand?: string;
  cardExpiry?: string;
  upiId?: string;
  upiApp?: string;
  bankName?: string;
  bankAccountLast4?: string;
  walletName?: string;
  biometricType?: 'fingerprint' | 'face' | 'voice' | 'pattern';
}

export interface IPartyDetails {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  upiId?: string;
  accountNumber?: string;
  ifscCode?: string;
}

export interface IStatusHistoryEntry {
  status: TransactionStatus;
  timestamp: Date;
  reason?: string;
  updatedBy?: string;
}

export interface IUnifiedTransaction {
  _id?: ObjectId;
  
  // Core identification
  userId: ObjectId;
  accountId?: string; // User's unique account ID for display
  transactionId: string; // Unique reference ID (e.g., TXN123456789)
  
  // Transaction details
  type: TransactionType;
  direction: TransactionDirection;
  amount: number;
  currency: string;
  fee?: number;
  tax?: number;
  totalAmount: number; // amount + fee + tax
  
  // Status tracking
  status: TransactionStatus;
  statusHistory: IStatusHistoryEntry[];
  
  // Description
  description?: string;
  remarks?: string;
  category?: string;
  
  // Sender/Receiver info (consolidated from recipientId/recipientName)
  senderDetails?: IPartyDetails;
  receiverDetails?: IPartyDetails;
  
  // Legacy fields for backward compatibility
  recipientId?: string;
  recipientName?: string;
  
  // Payment method details
  paymentMethod?: PaymentMethod;
  paymentMethodDetails?: IPaymentMethodDetails;
  biometricType?: 'fingerprint' | 'face' | 'voice' | 'pattern';
  
  // External references
  stripePaymentId?: string;
  externalReferenceId?: string;
  
  // Balance tracking
  balanceBefore?: number;
  balanceAfter?: number;
  
  // Error handling
  errorDetails?: {
    code?: string;
    message?: string;
    retryable?: boolean;
  };
  
  // Metadata
  metadata?: Record<string, any>;
  
  // Timestamps
  initiatedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Filter options for queries
export interface ITransactionFilterOptions {
  page?: number;
  limit?: number;
  type?: TransactionType | TransactionType[];
  status?: TransactionStatus | TransactionStatus[];
  direction?: TransactionDirection;
  paymentMethod?: PaymentMethod | PaymentMethod[];
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  category?: string;
  sortBy?: 'createdAt' | 'amount' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// Statistics result
export interface ITransactionStatistics {
  totalTransactions: number;
  totalAmount: number;
  totalFees: number;
  totalDebits: number;
  totalCredits: number;
  byType: Record<string, { count: number; amount: number }>;
  byStatus: Record<string, { count: number; amount: number }>;
  byPaymentMethod: Record<string, { count: number; amount: number }>;
  averageAmount: number;
}

// Monthly summary
export interface IMonthlySummary {
  year: number;
  month: number;
  totalTransactions: number;
  totalDebits: number;
  totalCredits: number;
  netFlow: number;
  byType: Record<string, { count: number; amount: number }>;
  dailyBreakdown: Array<{
    date: string;
    debits: number;
    credits: number;
    count: number;
  }>;
}

// ==================== MODEL CLASS ====================

export class UnifiedTransactionModel {
  private static collectionName = 'transactions'; // Use existing collection

  private static getCollection(): Collection<IUnifiedTransaction> {
    return getDb().collection<IUnifiedTransaction>(this.collectionName);
  }

  // Generate unique transaction ID
  private static generateTransactionId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN${timestamp}${random}`;
  }

  // ==================== CRUD OPERATIONS ====================

  static async create(data: Partial<IUnifiedTransaction> & { userId: string | ObjectId }): Promise<IUnifiedTransaction> {
    const collection = this.getCollection();
    const now = new Date();

    // Ensure userId is an ObjectId
    const userObjId = typeof data.userId === 'string' ? new ObjectId(data.userId) : data.userId;

    // Determine direction if not provided
    let direction = data.direction;
    if (!direction) {
      const creditTypes: TransactionType[] = ['add_money', 'refund', 'cashback', 'loan_disbursement'];
      direction = creditTypes.includes(data.type as TransactionType) ? 'credit' : 'debit';
    }

    // Calculate total amount
    const amount = data.amount || 0;
    const fee = data.fee || 0;
    const tax = data.tax || 0;
    const totalAmount = direction === 'debit' ? amount + fee + tax : amount;

    const transaction: IUnifiedTransaction = {
      userId: userObjId,
      accountId: data.accountId,
      transactionId: data.transactionId || this.generateTransactionId(),
      type: data.type!,
      direction,
      amount,
      currency: data.currency || 'INR',
      fee,
      tax,
      totalAmount,
      status: data.status || 'pending',
      statusHistory: [{
        status: data.status || 'pending',
        timestamp: now,
        reason: 'Transaction initiated',
      }],
      description: data.description,
      remarks: data.remarks,
      category: data.category,
      senderDetails: data.senderDetails,
      receiverDetails: data.receiverDetails,
      recipientId: data.recipientId,
      recipientName: data.recipientName,
      paymentMethod: data.paymentMethod,
      paymentMethodDetails: data.paymentMethodDetails,
      biometricType: data.biometricType,
      stripePaymentId: data.stripePaymentId,
      externalReferenceId: data.externalReferenceId,
      balanceBefore: data.balanceBefore,
      balanceAfter: data.balanceAfter,
      errorDetails: data.errorDetails,
      metadata: data.metadata || {},
      initiatedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(transaction);
    return { ...transaction, _id: result.insertedId };
  }

  static async findById(id: string): Promise<IUnifiedTransaction | null> {
    const collection = this.getCollection();
    return collection.findOne({ _id: new ObjectId(id) });
  }

  static async findByTransactionId(transactionId: string): Promise<IUnifiedTransaction | null> {
    const collection = this.getCollection();
    return collection.findOne({ transactionId });
  }

  static async findByUserId(
    userId: string | ObjectId | number,
    options: ITransactionFilterOptions = {}
  ): Promise<{ transactions: IUnifiedTransaction[]; total: number }> {
    const collection = this.getCollection();
    const {
      page = 1,
      limit = 20,
      type,
      status,
      direction,
      paymentMethod,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    // Handle both ObjectId, string, and legacy numeric userId
    let query: any;
    if (typeof userId === 'number') {
      // Legacy numeric userId
      query = { userId: userId };
    } else if (typeof userId === 'string' && ObjectId.isValid(userId)) {
      // ObjectId as string - query for both formats for compatibility
      const userObjId = new ObjectId(userId);
      query = { $or: [{ userId: userObjId }, { userId: userId }] };
    } else if (userId instanceof ObjectId) {
      // ObjectId instance - query for both formats
      query = { $or: [{ userId: userId }, { userId: userId.toString() }] };
    } else {
      // Fallback - try as string
      query = { userId: userId };
    }

    // Apply filters
    if (type) {
      query.type = Array.isArray(type) ? { $in: type } : type;
    }
    if (status) {
      query.status = Array.isArray(status) ? { $in: status } : status;
    }
    if (direction) {
      query.direction = direction;
    }
    if (paymentMethod) {
      query.paymentMethod = Array.isArray(paymentMethod) ? { $in: paymentMethod } : paymentMethod;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }
    if (minAmount !== undefined || maxAmount !== undefined) {
      query.amount = {};
      if (minAmount !== undefined) query.amount.$gte = minAmount;
      if (maxAmount !== undefined) query.amount.$lte = maxAmount;
    }
    if (category) {
      query.category = category;
    }

    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      collection.find(query).sort(sortOptions).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query),
    ]);

    return { transactions, total };
  }

  static async getRecent(userId: string | ObjectId, limit: number = 10): Promise<IUnifiedTransaction[]> {
    const collection = this.getCollection();
    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    return collection
      .find({ userId: userObjId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  static async updateStatus(
    id: string,
    status: TransactionStatus,
    options: {
      reason?: string;
      updatedBy?: string;
      errorDetails?: IUnifiedTransaction['errorDetails'];
      balanceAfter?: number;
    } = {}
  ): Promise<IUnifiedTransaction | null> {
    const collection = this.getCollection();
    const now = new Date();

    const updateData: any = {
      $set: {
        status,
        updatedAt: now,
      },
      $push: {
        statusHistory: {
          status,
          timestamp: now,
          reason: options.reason,
          updatedBy: options.updatedBy,
        },
      },
    };

    if (status === 'completed') {
      updateData.$set.completedAt = now;
    }

    if (options.errorDetails) {
      updateData.$set.errorDetails = options.errorDetails;
    }

    if (options.balanceAfter !== undefined) {
      updateData.$set.balanceAfter = options.balanceAfter;
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateData,
      { returnDocument: 'after' }
    );

    return result;
  }

  // ==================== STATISTICS & ANALYTICS ====================

  static async getStatistics(
    userId: string | ObjectId,
    options: { startDate?: Date; endDate?: Date } = {}
  ): Promise<ITransactionStatistics> {
    const collection = this.getCollection();
    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const matchStage: any = { userId: userObjId, status: 'completed' };
    if (options.startDate || options.endDate) {
      matchStage.createdAt = {};
      if (options.startDate) matchStage.createdAt.$gte = options.startDate;
      if (options.endDate) matchStage.createdAt.$lte = options.endDate;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalFees: { $sum: { $ifNull: ['$fee', 0] } },
          totalDebits: {
            $sum: { $cond: [{ $eq: ['$direction', 'debit'] }, '$amount', 0] },
          },
          totalCredits: {
            $sum: { $cond: [{ $eq: ['$direction', 'credit'] }, '$amount', 0] },
          },
        },
      },
    ];

    const [mainStats] = await collection.aggregate(pipeline).toArray();

    // Get breakdown by type
    const typeBreakdown = await collection
      .aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
          },
        },
      ])
      .toArray();

    // Get breakdown by status
    const statusBreakdown = await collection
      .aggregate([
        { $match: { userId: userObjId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
          },
        },
      ])
      .toArray();

    // Get breakdown by payment method
    const methodBreakdown = await collection
      .aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
          },
        },
      ])
      .toArray();

    const formatBreakdown = (data: any[]) => {
      return data.reduce((acc, item) => {
        if (item._id) {
          acc[item._id] = { count: item.count, amount: item.amount };
        }
        return acc;
      }, {} as Record<string, { count: number; amount: number }>);
    };

    return {
      totalTransactions: mainStats?.totalTransactions || 0,
      totalAmount: mainStats?.totalAmount || 0,
      totalFees: mainStats?.totalFees || 0,
      totalDebits: mainStats?.totalDebits || 0,
      totalCredits: mainStats?.totalCredits || 0,
      byType: formatBreakdown(typeBreakdown),
      byStatus: formatBreakdown(statusBreakdown),
      byPaymentMethod: formatBreakdown(methodBreakdown),
      averageAmount: mainStats?.totalTransactions
        ? mainStats.totalAmount / mainStats.totalTransactions
        : 0,
    };
  }

  static async getMonthlySummary(
    userId: string | ObjectId,
    year: number,
    month: number
  ): Promise<IMonthlySummary> {
    const collection = this.getCollection();
    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const matchStage = {
      userId: userObjId,
      status: 'completed',
      createdAt: { $gte: startDate, $lte: endDate },
    };

    // Get overall summary
    const [overallStats] = await collection
      .aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalDebits: {
              $sum: { $cond: [{ $eq: ['$direction', 'debit'] }, '$amount', 0] },
            },
            totalCredits: {
              $sum: { $cond: [{ $eq: ['$direction', 'credit'] }, '$amount', 0] },
            },
          },
        },
      ])
      .toArray();

    // Get by type
    const typeBreakdown = await collection
      .aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
          },
        },
      ])
      .toArray();

    // Get daily breakdown
    const dailyBreakdown = await collection
      .aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            debits: {
              $sum: { $cond: [{ $eq: ['$direction', 'debit'] }, '$amount', 0] },
            },
            credits: {
              $sum: { $cond: [{ $eq: ['$direction', 'credit'] }, '$amount', 0] },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const byType = typeBreakdown.reduce((acc, item) => {
      if (item._id) {
        acc[item._id] = { count: item.count, amount: item.amount };
      }
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    return {
      year,
      month,
      totalTransactions: overallStats?.totalTransactions || 0,
      totalDebits: overallStats?.totalDebits || 0,
      totalCredits: overallStats?.totalCredits || 0,
      netFlow: (overallStats?.totalCredits || 0) - (overallStats?.totalDebits || 0),
      byType,
      dailyBreakdown: dailyBreakdown.map((d) => ({
        date: d._id,
        debits: d.debits,
        credits: d.credits,
        count: d.count,
      })),
    };
  }

  // ==================== SEARCH ====================

  static async search(
    userId: string | ObjectId,
    query: string,
    limit: number = 20
  ): Promise<IUnifiedTransaction[]> {
    const collection = this.getCollection();
    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const searchRegex = new RegExp(query, 'i');

    return collection
      .find({
        userId: userObjId,
        $or: [
          { description: searchRegex },
          { remarks: searchRegex },
          { transactionId: searchRegex },
          { 'senderDetails.name': searchRegex },
          { 'receiverDetails.name': searchRegex },
          { recipientName: searchRegex },
          { recipientId: searchRegex },
          { category: searchRegex },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  // ==================== UTILITY METHODS ====================

  // Normalize legacy transactions to unified format
  private static normalizeTransaction(transaction: any): IUnifiedTransaction {
    // Determine direction for legacy transactions without it
    let direction = transaction.direction;
    if (!direction) {
      const creditTypes = ['add_money', 'refund', 'cashback', 'loan_disbursement'];
      direction = creditTypes.includes(transaction.type) ? 'credit' : 'debit';
    }

    // Generate transactionId for legacy transactions
    const transactionId = transaction.transactionId || 
      `TXN${transaction._id?.toString().slice(-12).toUpperCase() || Date.now().toString(36).toUpperCase()}`;

    return {
      ...transaction,
      transactionId,
      direction,
      totalAmount: transaction.totalAmount || transaction.amount || 0,
      statusHistory: transaction.statusHistory || [{
        status: transaction.status,
        timestamp: transaction.updatedAt || transaction.createdAt,
        reason: 'Migrated from legacy'
      }],
      fee: transaction.fee || 0,
      tax: transaction.tax || 0,
    };
  }

  static toPublic(transaction: IUnifiedTransaction | any): Partial<IUnifiedTransaction> {
    // Normalize legacy transactions first
    const normalized = this.normalizeTransaction(transaction);
    
    return {
      _id: normalized._id,
      transactionId: normalized.transactionId,
      userId: normalized.userId,
      accountId: normalized.accountId,
      type: normalized.type,
      direction: normalized.direction,
      amount: normalized.amount,
      currency: normalized.currency || 'INR',
      fee: normalized.fee,
      tax: normalized.tax,
      totalAmount: normalized.totalAmount,
      status: normalized.status,
      statusHistory: normalized.statusHistory,
      description: normalized.description,
      remarks: normalized.remarks,
      category: normalized.category,
      senderDetails: normalized.senderDetails,
      receiverDetails: normalized.receiverDetails,
      recipientId: normalized.recipientId,
      recipientName: normalized.recipientName,
      paymentMethod: normalized.paymentMethod,
      paymentMethodDetails: normalized.paymentMethodDetails
        ? {
            ...normalized.paymentMethodDetails,
            cardLast4: normalized.paymentMethodDetails.cardLast4,
          }
        : undefined,
      biometricType: normalized.biometricType,
      balanceBefore: normalized.balanceBefore,
      balanceAfter: normalized.balanceAfter,
      initiatedAt: normalized.initiatedAt || normalized.createdAt,
      completedAt: normalized.completedAt,
      createdAt: normalized.createdAt,
      updatedAt: normalized.updatedAt,
    };
  }

  // ==================== DELETE OPERATIONS ====================

  static async deleteByUserId(userId: string | ObjectId): Promise<number> {
    const collection = this.getCollection();
    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const result = await collection.deleteMany({ userId: userObjId });
    return result.deletedCount;
  }

  static async deleteById(id: string): Promise<boolean> {
    const collection = this.getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  static async deleteAll(): Promise<number> {
    const collection = this.getCollection();
    const result = await collection.deleteMany({});
    return result.deletedCount;
  }

  // ==================== INDEXES ====================

  static async createIndexes(): Promise<void> {
    const collection = this.getCollection();
    await Promise.all([
      collection.createIndex({ userId: 1, createdAt: -1 }),
      collection.createIndex({ userId: 1, type: 1 }),
      collection.createIndex({ userId: 1, status: 1 }),
      collection.createIndex({ userId: 1, direction: 1 }),
      collection.createIndex({ transactionId: 1 }, { unique: true }),
      collection.createIndex({ stripePaymentId: 1 }, { sparse: true }),
      collection.createIndex({ createdAt: -1 }),
      collection.createIndex(
        { description: 'text', remarks: 'text', 'senderDetails.name': 'text', 'receiverDetails.name': 'text' },
        { name: 'transaction_text_search' }
      ),
    ]);
  }
}

// ==================== BACKWARD COMPATIBILITY EXPORTS ====================

// Legacy type aliases for TransactionModel compatibility
export type ITransaction = IUnifiedTransaction;
export const TransactionModel = UnifiedTransactionModel;

// Legacy type aliases for PaymentHistoryModel compatibility
export type IPaymentHistory = IUnifiedTransaction;
export const PaymentHistoryModel = UnifiedTransactionModel;

// Re-export enums with legacy names
export { 
  TransactionType as PaymentType,
  TransactionStatus as PaymentStatus,
  TransactionDirection as PaymentDirection,
};
