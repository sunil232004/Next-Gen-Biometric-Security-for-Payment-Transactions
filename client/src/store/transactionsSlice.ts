import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PaymentHistory } from '@/types/paymentHistory';
import { authApiRequest } from '@/contexts/AuthContext';

interface TransactionsState {
  items: PaymentHistory[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  selectedTransaction: PaymentHistory | null;
}

const initialState: TransactionsState = {
  items: [],
  status: 'idle',
  error: null,
  selectedTransaction: null
};

interface FetchTransactionsArgs {
  limit?: number;
}

export const fetchTransactionsByUser = createAsyncThunk<
  PaymentHistory[],
  FetchTransactionsArgs | undefined,
  { rejectValue: string }
>('transactions/fetchByUser', async (args, { rejectWithValue }) => {
  try {
    const limit = args?.limit ?? 100;
    const response = await authApiRequest(`/api/v2/payment-history?limit=${limit}`);

    if (!response || response.success === false) {
      return rejectWithValue(response?.message || 'Failed to fetch transactions');
    }

    if (!Array.isArray(response.data)) {
      return rejectWithValue('Invalid transaction payload');
    }

    return response.data as PaymentHistory[];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch transactions';
    return rejectWithValue(message);
  }
});

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setTransactions(state, action: PayloadAction<PaymentHistory[]>) {
      state.items = action.payload;
      state.status = 'succeeded';
      state.error = null;
    },
    addOrUpdateTransaction(state, action: PayloadAction<PaymentHistory>) {
      const incoming = action.payload;
      const index = state.items.findIndex((t) => t._id === incoming._id || t.transactionId === incoming.transactionId);
      if (index >= 0) {
        state.items[index] = incoming;
      } else {
        state.items.unshift(incoming);
      }
    },
    setSelectedTransaction(state, action: PayloadAction<PaymentHistory | null>) {
      state.selectedTransaction = action.payload;
    }
  },
  extraReducers(builder) {
    builder
      .addCase(fetchTransactionsByUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTransactionsByUser.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(fetchTransactionsByUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to fetch transactions';
      });
  }
});

export const { setTransactions, addOrUpdateTransaction, setSelectedTransaction } = transactionsSlice.actions;
export default transactionsSlice.reducer;
