import { configureStore } from '@reduxjs/toolkit';
import transactionsReducer from './transactionsSlice';

export const store = configureStore({
  reducer: {
    transactions: transactionsReducer
  },
  devTools: import.meta.env.DEV
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
