import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  PaymentHistory,
  PaymentHistoryListResponse,
  PaymentHistoryResponse,
  RecentPaymentsResponse,
  PaymentStatisticsResponse,
  MonthlySummaryResponse,
  PaymentSearchResponse,
  PaymentHistoryFilters,
  CreatePaymentRequest,
  UpdatePaymentStatusRequest,
} from '@/types/paymentHistory';

// Query keys for caching
export const paymentHistoryKeys = {
  all: ['payment-history'] as const,
  lists: () => [...paymentHistoryKeys.all, 'list'] as const,
  list: (filters: PaymentHistoryFilters) => [...paymentHistoryKeys.lists(), filters] as const,
  details: () => [...paymentHistoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentHistoryKeys.details(), id] as const,
  recent: (limit?: number) => [...paymentHistoryKeys.all, 'recent', limit] as const,
  statistics: (period?: string) => [...paymentHistoryKeys.all, 'statistics', period] as const,
  monthly: (year: number, month: number) => [...paymentHistoryKeys.all, 'monthly', year, month] as const,
  search: (query: string) => [...paymentHistoryKeys.all, 'search', query] as const,
};

// Fetch helper with auth
async function fetchWithAuth(url: string, token: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    },
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
}

// Hook to get payment history with filters
export function usePaymentHistory(filters: PaymentHistoryFilters = {}) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: paymentHistoryKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
      
      return fetchWithAuth(
        getApiUrl(`/api/v2/payment-history?${params.toString()}`),
        token!
      ) as Promise<PaymentHistoryListResponse>;
    },
    enabled: !!token,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}

// Hook to get single payment details
export function usePaymentDetails(paymentId: string | null) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: paymentHistoryKeys.detail(paymentId || ''),
    queryFn: async () => {
      return fetchWithAuth(
        getApiUrl(`/api/v2/payment-history/${paymentId}`),
        token!
      ) as Promise<PaymentHistoryResponse>;
    },
    enabled: !!token && !!paymentId,
  });
}

// Hook to get payment by transaction ID
export function usePaymentByTransactionId(transactionId: string | null) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['payment-history', 'transaction', transactionId],
    queryFn: async () => {
      return fetchWithAuth(
        getApiUrl(`/api/v2/payment-history/transaction/${transactionId}`),
        token!
      ) as Promise<PaymentHistoryResponse>;
    },
    enabled: !!token && !!transactionId,
  });
}

// Hook to get recent payments
export function useRecentPayments(limit: number = 5) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: paymentHistoryKeys.recent(limit),
    queryFn: async () => {
      return fetchWithAuth(
        getApiUrl(`/api/v2/payment-history/recent?limit=${limit}`),
        token!
      ) as Promise<RecentPaymentsResponse>;
    },
    enabled: !!token,
    staleTime: 10000, // Recent payments refresh more often
  });
}

// Hook to get payment statistics
export function usePaymentStatistics(period?: 'today' | 'week' | 'month' | 'year') {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: paymentHistoryKeys.statistics(period),
    queryFn: async () => {
      const params = period ? `?period=${period}` : '';
      return fetchWithAuth(
        getApiUrl(`/api/v2/payment-history/statistics${params}`),
        token!
      ) as Promise<PaymentStatisticsResponse>;
    },
    enabled: !!token,
  });
}

// Hook to get monthly summary
export function useMonthlySummary(year: number, month: number) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: paymentHistoryKeys.monthly(year, month),
    queryFn: async () => {
      return fetchWithAuth(
        getApiUrl(`/api/v2/payment-history/monthly-summary?year=${year}&month=${month}`),
        token!
      ) as Promise<MonthlySummaryResponse>;
    },
    enabled: !!token && year > 0 && month > 0 && month <= 12,
  });
}

// Hook to search payments
export function usePaymentSearch(query: string, limit: number = 50) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: paymentHistoryKeys.search(query),
    queryFn: async () => {
      return fetchWithAuth(
        getApiUrl(`/api/v2/payment-history/search?q=${encodeURIComponent(query)}&limit=${limit}`),
        token!
      ) as Promise<PaymentSearchResponse>;
    },
    enabled: !!token && query.length >= 2,
    staleTime: 60000, // Cache search results for 1 minute
  });
}

// Mutation to create a payment record
export function useCreatePayment() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreatePaymentRequest) => {
      return fetchWithAuth(
        getApiUrl('/api/v2/payment-history'),
        token!,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ) as Promise<PaymentHistoryResponse>;
    },
    onSuccess: () => {
      // Invalidate all payment history queries to refetch
      queryClient.invalidateQueries({ queryKey: paymentHistoryKeys.all });
    },
  });
}

// Mutation to update payment status
export function useUpdatePaymentStatus() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePaymentStatusRequest }) => {
      return fetchWithAuth(
        getApiUrl(`/api/v2/payment-history/${id}/status`),
        token!,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        }
      ) as Promise<PaymentHistoryResponse>;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific payment and lists
      queryClient.invalidateQueries({ queryKey: paymentHistoryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: paymentHistoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentHistoryKeys.recent() });
    },
  });
}

// Helper function to record a payment in history (can be used after completing payments)
export async function recordPaymentToHistory(
  token: string,
  paymentData: CreatePaymentRequest
): Promise<PaymentHistory> {
  const response = await fetchWithAuth(
    getApiUrl('/api/v2/payment-history'),
    token,
    {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }
  );
  return response.data;
}
