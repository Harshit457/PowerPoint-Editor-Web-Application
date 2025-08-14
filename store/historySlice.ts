// store/historySlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface HistoryState {
  past: any[];
  present: any | null;
  future: any[];
}

const initialState: HistoryState = {
  past: [],
  present: null,
  future: []
};

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    addState: (state, action: PayloadAction<any>) => {
      // Don't add duplicate states
      if (state.present && JSON.stringify(state.present) === JSON.stringify(action.payload)) {
        return;
      }
      
      if (state.present !== null) {
        state.past.push(state.present);
        // Limit history size to prevent memory issues (keep last 50 states)
        if (state.past.length > 50) {
          state.past.shift();
        }
      }
      state.present = action.payload;
      state.future = []; // clear redo stack when new state is added
    },
    undo: (state) => {
      if (state.past.length > 0) {
        const previous = state.past.pop()!;
        if (state.present) {
          state.future.unshift(state.present);
          // Limit future size as well
          if (state.future.length > 50) {
            state.future.pop();
          }
        }
        state.present = previous;
      }
    },
    redo: (state) => {
      if (state.future.length > 0) {
        const next = state.future.shift()!;
        if (state.present) {
          state.past.push(state.present);
        }
        state.present = next;
      }
    },
    // Add action to clear history when needed
    clearHistory: (state) => {
      state.past = [];
      state.future = [];
      state.present = null;
    },
    // Add action to initialize with current state
    initializeHistory: (state, action: PayloadAction<any>) => {
      state.present = action.payload;
      state.past = [];
      state.future = [];
    }
  }
});

// Selectors
export const selectCanUndo = (state: { history: HistoryState }) => state.history.past.length > 0;
export const selectCanRedo = (state: { history: HistoryState }) => state.history.future.length > 0;
export const selectHistoryState = (state: { history: HistoryState }) => state.history.present;
export const selectHistoryStats = (state: { history: HistoryState }) => ({
  pastStates: state.history.past.length,
  futureStates: state.history.future.length,
  canUndo: state.history.past.length > 0,
  canRedo: state.history.future.length > 0
});

export const { addState, undo, redo, clearHistory, initializeHistory } = historySlice.actions;
export default historySlice.reducer;