import { create } from "zustand";

interface LinterState {
  errors: string[];
  setErrors: (errors: string[]) => void;
}

export const useLinterStore = create<LinterState>((set) => ({
  errors: [],
  setErrors: (errors) => set({ errors }),
}));
