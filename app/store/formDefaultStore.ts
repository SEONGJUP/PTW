"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// sectionId → fieldLabel → value
export type SectionDefaults = Record<string, string>;
// key: `${subcategoryId}_${profile}` → sectionId → SectionDefaults
export type PlanDefaults = Record<string, SectionDefaults>;

interface FormDefaultState {
  defaults: Record<string, PlanDefaults>;
  setDefault: (key: string, data: PlanDefaults) => void;
  getDefault: (key: string) => PlanDefaults;
  clearDefault: (key: string) => void;
}

export function makeDefaultKey(subId: string, profile: string) {
  return `${subId}_${profile}`;
}

export const useFormDefaultStore = create<FormDefaultState>()(
  persist(
    (set, get) => ({
      defaults: {},
      setDefault: (key, data) =>
        set((s) => ({ defaults: { ...s.defaults, [key]: data } })),
      getDefault: (key) => get().defaults[key] ?? {},
      clearDefault: (key) =>
        set((s) => {
          const next = { ...s.defaults };
          delete next[key];
          return { defaults: next };
        }),
    }),
    {
      name: "ptw-form-defaults",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as Storage)
      ),
    }
  )
);
