import { configureStore } from '@reduxjs/toolkit';
import presentationSlice from './presentationSlice';
import historySlice from './historySlice'; // ✅ new import

export const store = configureStore({
  reducer: {
    presentation: presentationSlice,
    history: historySlice, // ✅ add history slice to the store
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;