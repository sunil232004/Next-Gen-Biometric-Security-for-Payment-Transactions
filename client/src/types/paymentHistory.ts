// Payment History Types for Frontend

// Payment Status Types
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

// Payment Method Details
export interface PaymentMethodDetails {
  upiId?: string;
  cardLast4?: string;
  cardBrand?: string;
  bankName?: string;
  walletName?: string;
  biometricType?: 'fingerprint' | 'face' | 'voice';
}

// Sender/Receiver Details
export interface PartyDetails {
  name?: string;
  upiId?: string;
  merchantName?: string;
}

// Status History Entry
export interface StatusHistoryEntry {
  status: PaymentStatus;
  timestamp: string;
  reason?: string;
}

// Main Payment History Interface
export interface PaymentHistory {
  _id: string;
  userId: string;
  transactionId: string;
  type: PaymentType;
  direction: PaymentDirection;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentMethodDetails?: PaymentMethodDetails;
  senderDetails?: PartyDetails;
  receiverDetails?: PartyDetails;
  description: string;
  category?: string;
  remarks?: string;
  fee?: number;
  tax?: number;
  totalAmount?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  statusHistory: StatusHistoryEntry[];
  initiatedAt: string;
  completedAt?: string;
  createdAt: string;
}

// Pagination Info
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API Response for Payment History List
export interface PaymentHistoryListResponse {
  success: boolean;
  data: PaymentHistory[];
  pagination: PaginationInfo;
}

// API Response for Single Payment
export interface PaymentHistoryResponse {
  success: boolean;
  data: PaymentHistory;
}

// API Response for Recent Payments
export interface RecentPaymentsResponse {
  success: boolean;
  data: PaymentHistory[];
}

// Statistics Types
export interface TypeStatistics {
  count: number;
  amount: number;
}

export interface PaymentStatistics {
  totalTransactions: number;
  totalCredits: number;
  totalDebits: number;
  byType: Record<string, TypeStatistics>;
  byPaymentMethod: Record<string, TypeStatistics>;
  byStatus: Record<string, number>;
  averageTransactionAmount: number;
}

export interface PaymentStatisticsResponse {
  success: boolean;
  data: PaymentStatistics;
  period: {
    startDate?: string;
    endDate?: string;
  };
}

// Monthly Summary
export interface CategorySummary {
  category: string;
  amount: number;
  count: number;
}

export interface MonthlySummary {
  month: number;
  year: number;
  totalCredits: number;
  totalDebits: number;
  netAmount: number;
  transactionCount: number;
  topCategories: CategorySummary[];
}

export interface MonthlySummaryResponse {
  success: boolean;
  data: MonthlySummary;
}

// Search Response
export interface PaymentSearchResponse {
  success: boolean;
  data: PaymentHistory[];
  count: number;
}

// Create Payment Request
export interface CreatePaymentRequest {
  type: PaymentType;
  direction: PaymentDirection;
  amount: number;
  currency?: string;
  status?: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentMethodDetails?: PaymentMethodDetails;
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
  description: string;
  category?: string;
  remarks?: string;
  fee?: number;
  tax?: number;
  externalReferenceId?: string;
  balanceBefore?: number;
  metadata?: Record<string, any>;
}

// Update Payment Status Request
export interface UpdatePaymentStatusRequest {
  status: PaymentStatus;
  reason?: string;
  completedAt?: string;
  balanceAfter?: number;
  errorDetails?: {
    code?: string;
    message?: string;
    rawError?: string;
  };
}

// Filter Options for Payment History
export interface PaymentHistoryFilters {
  page?: number;
  limit?: number;
  type?: PaymentType;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  direction?: PaymentDirection;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'createdAt' | 'amount' | 'completedAt';
  sortOrder?: 'asc' | 'desc';
}

// Helper function to get display text for payment type
export function getPaymentTypeLabel(type: PaymentType): string {
  const labels: Record<PaymentType, string> = {
    payment: 'Payment',
    transfer: 'Transfer',
    recharge: 'Recharge',
    bill_payment: 'Bill Payment',
    refund: 'Refund',
    cashback: 'Cashback',
    add_money: 'Add Money',
    withdrawal: 'Withdrawal',
    merchant_payment: 'Merchant Payment',
  };
  return labels[type] || type;
}

// Helper function to get display text for payment status
export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    initiated: 'Initiated',
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  return labels[status] || status;
}

// Helper function to get display text for payment method
export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    upi: 'UPI',
    card: 'Card',
    wallet: 'Wallet',
    bank_transfer: 'Bank Transfer',
    netbanking: 'Net Banking',
    biometric: 'Biometric',
  };
  return labels[method] || method;
}

// Helper function to get status color
export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    initiated: 'text-blue-500',
    pending: 'text-yellow-500',
    processing: 'text-orange-500',
    completed: 'text-green-500',
    failed: 'text-red-500',
    cancelled: 'text-gray-500',
    refunded: 'text-purple-500',
  };
  return colors[status] || 'text-gray-500';
}

// Helper function to get direction color
export function getDirectionColor(direction: PaymentDirection): string {
  return direction === 'credit' ? 'text-green-600' : 'text-red-600';
}

// Helper function to format amount with direction symbol
export function formatAmountWithDirection(amount: number, direction: PaymentDirection, currency: string = 'INR'): string {
  const symbol = currency === 'INR' ? '₹' : '$';
  const prefix = direction === 'credit' ? '+' : '-';
  return `${prefix}${symbol}${amount.toLocaleString('en-IN')}`;
}
