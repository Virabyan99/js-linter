import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LinterSettings {
  rules: {
    missingSemicolon: boolean;
    undeclaredVariables: boolean;
    unusedVariables: boolean;
  };
  toggleRule: (rule: keyof LinterSettings["rules"]) => void;
}

export const useLinterSettings = create<LinterSettings>()(
  persist(
    (set) => ({
      rules: {
        missingSemicolon: true,
        undeclaredVariables: true,
        unusedVariables: true,
      },
      toggleRule: (rule) =>
        set((state) => ({
          rules: { ...state.rules, [rule]: !state.rules[rule] },
        })),
    }),
    { name: "linter-settings" }
  )
);