/**
 * @deprecated This file is maintained for backward compatibility.
 * Please use UnifiedTransactionModel from './unifiedTransaction.model.js' for new code.
 * 
 * All exports from this file now re-export from the unified model.
 */

// Re-export runtime values from unified model with legacy names for backward compatibility
export {
  UnifiedTransactionModel as PaymentHistoryModel,
  TransactionType as PaymentType,
  TransactionStatus as PaymentStatus,
  PaymentMethod,
  TransactionDirection as PaymentDirection,
} from './unifiedTransaction.model.js';

// Re-export types only (ensures no runtime import of erased TS types)
export type {
  IUnifiedTransaction as IPaymentHistory,
  IPaymentMethodDetails,
  IPartyDetails,
  IStatusHistoryEntry,
  ITransactionFilterOptions as IPaymentHistoryFilterOptions,
  ITransactionStatistics as IPaymentStatistics,
  IMonthlySummary,
} from './unifiedTransaction.model.js';

// Public version without sensitive data (legacy compatibility)
export interface IPaymentHistoryPublic {
  _id: string;
  userId: string;
  transactionId: string;
  type: string;
  direction: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
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
  description?: string;
  category?: string;
  remarks?: string;
  fee?: number;
  tax?: number;
  totalAmount?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  statusHistory?: Array<{
    status: string;
    timestamp: Date;
    reason?: string;
  }>;
  initiatedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export const PAYMENT_HISTORY_COLLECTION = 'transactions';
