import { create } from "zustand";
import { persist } from "zustand/middleware";

// 상세분류별 추천값 오버라이드 구조
export interface SubOverride {
  recommendedWorkAttrIds: string[];
  recommendedRiskAttrIds: string[];
  recommendedEquipmentIds: string[];
  customEquipmentLabels?: string[]; // 기타 직접입력 장비명
}

interface TaxonomyOverrideState {
  overrides: Record<string, SubOverride>; // key: subcategory id
  setOverride: (subId: string, override: SubOverride) => void;
  resetOverride: (subId: string) => void;
  resetAll: () => void;
}

export const useTaxonomyOverrideStore = create<TaxonomyOverrideState>()(
  persist(
    (set) => ({
      overrides: {},
      setOverride: (subId, override) =>
        set((s) => ({ overrides: { ...s.overrides, [subId]: override } })),
      resetOverride: (subId) =>
        set((s) => {
          const next = { ...s.overrides };
          delete next[subId];
          return { overrides: next };
        }),
      resetAll: () => set({ overrides: {} }),
    }),
    { name: "ptw-taxonomy-overrides" }
  )
);

/** 상세분류의 추천값을 오버라이드 우선으로 반환 */
export function getEffectiveRecommended(
  sub: {
    recommendedWorkAttrIds: string[];
    recommendedRiskAttrIds: string[];
    recommendedEquipmentIds: string[];
  },
  overrides: Record<string, SubOverride>,
  subId: string
): SubOverride {
  const ov = overrides[subId];
  if (ov) return ov;
  return {
    recommendedWorkAttrIds: sub.recommendedWorkAttrIds,
    recommendedRiskAttrIds: sub.recommendedRiskAttrIds,
    recommendedEquipmentIds: sub.recommendedEquipmentIds,
  };
}
