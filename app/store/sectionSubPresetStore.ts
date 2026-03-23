import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── 섹션 목록 (SECTION_DISPLAY와 동일 순서) ─────────────────────
export const ALL_SECTION_IDS = [
  "overview", "work_description", "work_environment", "heavy_goods",
  "equipment_info", "work_personnel", "operators", "risk",
  "safety_checklist", "emergency_contact", "training",
  "disaster_prevention", "drawing", "other_files",
  "pre_survey", "electrical_safety", "heavy_load_plan",
  "tunnel_plan", "chemical_ops", "demolition_plan", "signature",
] as const;

export type SectionId = typeof ALL_SECTION_IDS[number];
export type SubProfile = "full" | "lite";

// ─── 법정 섹션 트리거 ──────────────────────────────────────────────
// categoryId 또는 subId가 배열에 포함될 때 해당 법정 섹션 활성화
const LEGAL_TRIGGERS: Record<string, Array<string>> = {
  pre_survey:       ["cat_3", "cat_8", "sub_3_6", "sub_3_7", "sub_8_1", "sub_8_2", "sub_8_3", "sub_8_4", "sub_10_6", "sub_10_7", "sub_10_9", "sub_10_10"],
  electrical_safety:["cat_9", "sub_9_1", "sub_9_2", "sub_10_5"],
  heavy_load_plan:  ["cat_2", "sub_1_3", "sub_9_7", "sub_10_1", "sub_10_11"],
  tunnel_plan:      ["sub_3_6", "sub_10_7"],
  chemical_ops:     ["sub_9_6", "sub_10_4"],
  demolition_plan:  ["cat_8", "sub_10_10"],
};

function legalSections(catId: string, subId: string): SectionId[] {
  const result: SectionId[] = [];
  for (const [section, triggers] of Object.entries(LEGAL_TRIGGERS)) {
    if (triggers.includes(catId) || triggers.includes(subId)) {
      result.push(section as SectionId);
    }
  }
  return result;
}

// ─── 중량물 취급 섹션 트리거 (heavy_goods) ───────────────────────
// heavy_load_plan(법정)과 별개로, 중량물을 다루는 모든 작업에 중량물 취급 섹션 포함
const HEAVY_GOODS_CAT_TRIGGERS = new Set(["cat_1", "cat_2"]);
const HEAVY_GOODS_SUB_TRIGGERS = new Set([
  "sub_5_1", // 콘크리트 펌프카 (ra_중량물)
  "sub_7_2", // 가설구조물 (ra_중량물)
]);

// ─── 장비 섹션 트리거 (equipment_info + operators) ───────────────
// 건설장비가 실질적으로 투입되는 카테고리
const EQUIPMENT_CATS = new Set([
  "cat_1", // 운반·하역 (지게차, 덤프 등)
  "cat_2", // 인양·양중 (크레인 등)
  "cat_3", // 굴착·토공 (굴착기, 불도저 등)
  "cat_5", // 콘크리트·타설 (펌프카 등)
  "cat_6", // 기초·항타·천공 (항타기 등)
  "cat_7", // 가설·구조보조 (고소작업차 포함 가능)
  "cat_8", // 해체·철거 (굴착기, 압쇄기 등)
]);

// ─── 프로필별 기본 섹션 계산 ─────────────────────────────────────
export function getDefaultSections(
  subId: string,
  catId: string,
  profile: SubProfile
): string[] {
  const legal = legalSections(catId, subId);
  const hasEquipment = EQUIPMENT_CATS.has(catId);
  const hasHeavyGoods =
    HEAVY_GOODS_CAT_TRIGGERS.has(catId) ||
    HEAVY_GOODS_SUB_TRIGGERS.has(subId) ||
    legal.includes("heavy_load_plan");

  if (profile === "full") {
    const base: SectionId[] = [
      "overview", "work_description", "work_environment",
      ...(hasHeavyGoods ? ["heavy_goods" as SectionId] : []),
      ...(hasEquipment ? ["equipment_info" as SectionId] : []),
      "work_personnel",
      ...(hasEquipment ? ["operators" as SectionId] : []),
      "risk", "safety_checklist", "emergency_contact",
      "training", "disaster_prevention",
      ...legal,
      "signature",
    ];
    // 중복 제거하고 ALL_SECTION_IDS 순서 유지
    const set = new Set(base);
    return ALL_SECTION_IDS.filter((id) => set.has(id));
  } else {
    // 약식: 핵심 + 법정 섹션 + 안전교육
    const base: SectionId[] = [
      "overview", "work_description",
      ...(hasHeavyGoods ? ["heavy_goods" as SectionId] : []),
      "work_personnel",
      "risk", "safety_checklist", "emergency_contact",
      "training",
      ...legal,
      "signature",
    ];
    const set = new Set(base);
    return ALL_SECTION_IDS.filter((id) => set.has(id));
  }
}

// ─── Zustand store ────────────────────────────────────────────────
interface SectionSubPresetState {
  presets: Record<string, string[]>; // key: `${subId}_${profile}`
  setPreset: (subId: string, profile: SubProfile, ids: string[]) => void;
  resetPreset: (subId: string, profile: SubProfile) => void;
}

export const useSectionSubPresetStore = create<SectionSubPresetState>()(
  persist(
    (set) => ({
      presets: {},
      setPreset: (subId, profile, ids) =>
        set((s) => ({ presets: { ...s.presets, [`${subId}_${profile}`]: ids } })),
      resetPreset: (subId, profile) =>
        set((s) => {
          const next = { ...s.presets };
          delete next[`${subId}_${profile}`];
          return { presets: next };
        }),
    }),
    { name: "ptw-section-sub-presets" }
  )
);

export function getEffectiveSections(
  subId: string,
  catId: string,
  profile: SubProfile,
  presets: Record<string, string[]>
): string[] {
  return presets[`${subId}_${profile}`] ?? getDefaultSections(subId, catId, profile);
}
