import { create } from "zustand";
import { saveLintingHistory, loadLintingHistory, deleteLintingHistory } from "@/utils/indexedDB";
import { debounce } from "lodash";

interface HistoryItem {
  id?: number;
  code: string;
  errors: string[];
  timestamp: number;
}

interface HistoryState {
  history: HistoryItem[];
  loadHistory: () => void;
  saveHistory: (code: string, errors: string[]) => void;
  deleteHistory: (id: number) => void;
}

export const useLintingHistoryStore = create<HistoryState>((set, get) => {
  // Track the previous errors to compare with new ones
  let previousErrors: string[] = [];

  // Debounced save function
  const debouncedSave = debounce(async (code: string, errors: string[]) => {
    const currentErrors = JSON.stringify(errors);
    const prevErrors = JSON.stringify(previousErrors);

    // Only save if errors have changed
    if (currentErrors !== prevErrors) {
      await saveLintingHistory(code, errors);
      const records = (await loadLintingHistory()) as HistoryItem[];

      // Limit history to 20 entries
      if (records.length > 20) {
        const oldestId = records[0].id!;
        await deleteLintingHistory(oldestId);
      }

      // Update state and previous errors
      set({ history: records });
      previousErrors = errors;
    }
  }, 2000); // 2-second debounce

  return {
    history: [],

    loadHistory: async () => {
      const records = (await loadLintingHistory()) as HistoryItem[];
      set({ history: records });
      // Initialize previousErrors with the latest entry (if any)
      if (records.length > 0) {
        previousErrors = records[records.length - 1].errors;
      }
    },

    saveHistory: (code: string, errors: string[]) => {
      debouncedSave(code, errors);
    },

    deleteHistory: async (id: number) => {
      await deleteLintingHistory(id);
      const records = (await loadLintingHistory()) as HistoryItem[];
      set({ history: records });
      // Update previousErrors if the last entry was deleted
      if (records.length > 0) {
        previousErrors = records[records.length - 1].errors;
      } else {
        previousErrors = [];
      }
    },
  };
});