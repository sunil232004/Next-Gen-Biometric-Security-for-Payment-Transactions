/**
 * @deprecated This file is maintained for backward compatibility.
 * Please use UnifiedTransactionModel from './unifiedTransaction.model.js' for new code.
 * 
 * All exports from this file now re-export from the unified model.
 */

// Re-export everything from unified model for backward compatibility
export {
  UnifiedTransactionModel as TransactionModel,
  IUnifiedTransaction as ITransaction,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  TransactionDirection,
  type IPaymentMethodDetails,
  type IPartyDetails,
  type IStatusHistoryEntry,
  type ITransactionFilterOptions,
  type ITransactionStatistics,
  type IMonthlySummary,
} from './unifiedTransaction.model.js';

// Legacy interface for public transaction (maintains API compatibility)
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
