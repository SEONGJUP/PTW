"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  toLegacyPlanCategory,
  toLegacyEquipmentTypes,
} from "./workPlanTaxonomy";

// ─── 건설기계 9종 (고용노동부 작업계획서 서식 기준) ───────────────
export const CONSTRUCTION_EQUIPMENT_TYPES = {
  truck:         { label: "트럭",           num: 1, icon: "🚛" },
  excavator:     { label: "굴착기",         num: 2, icon: "⛏️" },
  aerial_lift:   { label: "고소작업대",     num: 3, icon: "🪜" },
  crane:         { label: "크레인",         num: 4, icon: "🏗" },
  concrete_pump: { label: "콘크리트펌프카", num: 5, icon: "🪣" },
  pile_driver:   { label: "항타기",         num: 6, icon: "🔨" },
  forklift:      { label: "지게차",         num: 7, icon: "🔩" },
  loader:        { label: "로더",           num: 8, icon: "🏗️" },
  roller:        { label: "롤러",           num: 9, icon: "🛞" },
} as const;

export type EquipmentType = keyof typeof CONSTRUCTION_EQUIPMENT_TYPES;

// ─── 문서 프로필 (정식=full, 약식=lite, 사용자정의=custom) ─────────
export type DocumentProfile = "full" | "lite" | "custom";
/** @deprecated PlanMode 제거됨. DocumentProfile 을 사용하세요. */
export type PlanMode = DocumentProfile;

// ─── 작업계획서 대분류 ────────────────────────────────────────────
export type PlanCategory =
  | "construction_equipment" // 차량계 건설기계
  | "lifting"               // 양중작업 (크레인)
  | "excavation"            // 굴착작업
  | "confined_space"        // 밀폐공간
  | "hot_work"              // 화기작업
  | "working_at_height"     // 고소작업
  | "general";              // 일반

export const PLAN_CATEGORY_LABELS: Record<PlanCategory, string> = {
  construction_equipment: "차량계 건설기계",
  lifting: "인양·양중 작업",
  excavation: "굴착 작업",
  confined_space: "밀폐공간 작업",
  hot_work: "화기·전기 작업",
  working_at_height: "고소 작업",
  general: "일반 작업",
};

export interface Section {
  id: string;
  label: string;
  required: boolean;
  enabled: boolean;
  order: number;
}

export interface FormRevision {
  revisionNo: number;
  savedAt: string;
  note: string;
  formDataSnapshot: Record<string, unknown>;
}

export interface Signature {
  role: string;
  name: string;
  dataUrl: string;
  signedAt: string;
  status: "pending" | "signing" | "done" | "revision_requested";
  comment: string;           // 검토의견
  revisions: FormRevision[]; // 수정 이력 스냅샷
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
  markup?: string;
}

export interface SavedCard {
  id: string;
  title: string;
  savedAt: string;
  classification: WorkClassification;
  planCategory: PlanCategory;
  selectedEquipments: EquipmentType[];
  documentProfile: DocumentProfile;
  sections: Section[];
  formData: Record<string, unknown>;
}

export interface Template {
  id: string;
  name: string;
  planType: string;
  sections: Section[];
  formData: Record<string, unknown>;
  createdAt: string;
}

export interface SectionFavorite {
  id: string;
  name: string;
  planCategory: PlanCategory;
  selectedEquipments: EquipmentType[];
  sections: Section[];
  classification?: WorkClassification;
  createdAt: string;
}

export interface MilestoneRow {
  task: string;
  start: string;
  end: string;
  responsible: string;
}

export interface PersonnelRow {
  name: string;
  position: string;
  role: string;
  contact: string;
}

export interface BudgetRow {
  item: string;
  unit: string;
  qty: number;
  unitPrice: number;
  amount: number;
  note: string;
}

export interface RiskRow {
  risk: string;
  severity: "상" | "중" | "하";
  mitigation: string;
}

export interface OverviewData {
  title?: string;
  siteName?: string;
  process?: string;
  location?: string;
  background?: string;
  startDate?: string;
  endDate?: string;
  purpose?: string;
  author?: string;
  team?: string;
  headCount?: string;
  contractor?: string;
}

// ─── 새 4축 분류 선택 상태 ────────────────────────────────────────
export interface WorkClassification {
  categoryId: string;       // 대분류 ID
  subcategoryId: string;    // 상세분류 ID
  customSubLabel?: string;  // 기타 작업 직접입력 텍스트 (isCustom subcategory)
  equipmentIds: string[];   // 장비 IDs (새 taxonomy)
  customEquipmentLabels?: string[]; // 기타 직접입력 장비명
  workAttributeIds: string[]; // 작업속성
  riskAttributeIds: string[]; // 위험속성
}

export interface WorkPlanState {
  planType: string;
  planCategory: PlanCategory;
  documentProfile: DocumentProfile;
  selectedEquipments: EquipmentType[]; // 복수 선택 지원
  // ─ 새 분류 체계 ─
  classification: WorkClassification;
  sections: Section[];
  formData: Record<string, unknown>;
  signatures: Signature[];
  attachments: Attachment[];
  templates: Template[];

  savedCards: SavedCard[];
  saveCard: () => void;
  loadCard: (id: string) => void;
  deleteCard: (id: string) => void;
  resetPlan: () => void;

  setPlanType: (type: string) => void;
  setPlanCategory: (category: PlanCategory) => void;
  setDocumentProfile: (profile: DocumentProfile) => void;
  toggleEquipment: (equipment: EquipmentType) => void;
  clearEquipments: () => void;
  toggleSection: (id: string) => void;
  toggleSectionEnabled: (id: string) => void;
  reorderSections: (from: number, to: number) => void;
  addCustomSection: (section: Omit<Section, "order">) => void;
  updateFormData: (sectionId: string, data: unknown) => void;
  addSignature: (role: string, name: string, dataUrl: string) => void;
  resetSignature: (role: string) => void;
  setSignatureComment: (role: string, comment: string) => void;
  requestRevision: (role: string, comment: string) => void;
  addSignatureStep: (role: string) => void;
  removeSignatureStep: (role: string) => void;
  addAttachment: (file: Attachment) => void;
  removeAttachment: (id: string) => void;
  updateAttachmentMarkup: (id: string, markup: string) => void;
  saveTemplate: (name: string) => void;
  loadTemplate: (id: string) => void;
  deleteTemplate: (id: string) => void;
  sectionPresets: Record<string, string[]>;
  setSectionPreset: (profile: DocumentProfile, category: PlanCategory, enabledIds: string[]) => void;
  resetSectionPreset: (profile: DocumentProfile, category: PlanCategory) => void;
  sectionFavorites: SectionFavorite[];
  saveFavorite: (name: string) => void;
  loadFavorite: (id: string) => void;
  deleteFavorite: (id: string) => void;
  renameFavorite: (id: string, name: string) => void;
  overwriteFavorite: (id: string) => void;
  // ─ 새 분류 체계 액션 ─
  setClassification: (c: Partial<WorkClassification>) => void;
}

// ─── 공통 섹션 정의 ───────────────────────────────────────────────
const COMMON_SECTIONS: Omit<Section, "order">[] = [
  { id: "overview",           label: "작업 개요",                    required: true,  enabled: true  },
  { id: "work_description",   label: "작업 설명",                     required: false, enabled: false },
  { id: "work_environment",   label: "작업환경",                     required: false, enabled: false },
  { id: "work_personnel",     label: "작업 인원 배치",                required: false, enabled: true  },
  { id: "heavy_goods",        label: "중량물 취급",                   required: false, enabled: false },
  { id: "equipment_info",     label: "사용 장비 정보",                required: false, enabled: true  },
  { id: "risk",               label: "위험성평가",                   required: false, enabled: true  },
  { id: "safety_checklist",   label: "안전점검",                     required: false, enabled: true  },
  { id: "training",           label: "안전교육",                     required: false, enabled: true  },
  { id: "emergency_contact",  label: "비상연락망",                   required: false, enabled: true  },
  { id: "disaster_prevention",label: "재해예방 대책",                 required: false, enabled: false },
  // ── 법정 의무 섹션 (별표4, 제38조제1항 관련) ─ 기본 비활성 ────
  { id: "pre_survey", label: "사전조사 기록 [법정]", required: false, enabled: false },
  { id: "electrical_safety", label: "전기안전작업계획 [법정]", required: false, enabled: false },
  { id: "heavy_load_plan", label: "중량물 취급 계획 [법정]", required: false, enabled: false },
  { id: "tunnel_plan", label: "터널굴착 계획 [법정]", required: false, enabled: false },
  { id: "chemical_ops", label: "화학설비 운전계획 [법정]", required: false, enabled: false },
  { id: "demolition_plan", label: "해체 계획 [법정]", required: false, enabled: false },
  { id: "drawing",            label: "도면",                         required: false, enabled: true  },
  { id: "other_files",        label: "기타 첨부파일",                 required: false, enabled: true  },
  { id: "signature", label: "서명 및 결재", required: true, enabled: true },
];

// ─── 건설기계별 특화 섹션 (고용노동부 서식 기반) ─────────────────
export const EQUIPMENT_SPECIFIC_SECTIONS: Record<EquipmentType, Omit<Section, "order">[]> = {
  truck: [
    { id: "truck_machine_spec",        label: "기계 제원",           required: false, enabled: true },
    { id: "truck_spec",                label: "트럭 전용 제원",      required: false, enabled: true },
    { id: "truck_route",               label: "운행 경로",           required: false, enabled: true },
    { id: "truck_load",                label: "최대 적재량 및 하중", required: false, enabled: true },
    { id: "truck_road_condition",      label: "도로 상태 및 구배",   required: false, enabled: true },
    { id: "truck_overturn_prevention", label: "전복·낙하 방지 조치", required: false, enabled: true },
    { id: "truck_checklist",           label: "사전 점검표",         required: false, enabled: true },
  ],
  excavator: [
    { id: "excavator_machine_spec", label: "기계 제원",                     required: false, enabled: true },
    { id: "excavator_depth",        label: "굴착 깊이 및 기울기",           required: false, enabled: true },
    { id: "excavator_ground",       label: "지반 상태 (토질조사 결과)",     required: false, enabled: true },
    { id: "excavator_retaining",    label: "흙막이 공법",                   required: false, enabled: true },
    { id: "excavator_utility",      label: "매설물 확인 (가스/전기/통신)", required: false, enabled: true },
    { id: "excavator_checklist",    label: "작동상태 사전 점검표",          required: false, enabled: true },
  ],
  aerial_lift: [
    { id: "aerial_lift_machine_spec", label: "기계 제원",   required: false, enabled: true },
    { id: "aerial_lift_work_plan",    label: "작업 계획",   required: false, enabled: true },
    { id: "aerial_lift_checklist",    label: "사전 점검표", required: false, enabled: true },
  ],
  crane: [
    { id: "crane_machine_spec", label: "기계 제원",                required: false, enabled: true },
    { id: "crane_capacity",     label: "최대 인양하중 및 반경",    required: false, enabled: true },
    { id: "crane_rigging",      label: "달기기구 종류 및 수량",    required: false, enabled: true },
    { id: "crane_swing",        label: "선회 반경 내 장애물",      required: false, enabled: true },
    { id: "crane_signal",       label: "신호 방법 및 신호수 배치", required: false, enabled: true },
    { id: "crane_ground",       label: "하부지반 지지력 확인",     required: false, enabled: true },
    { id: "crane_checklist",    label: "사전 점검표",              required: false, enabled: true },
  ],
  concrete_pump: [
    { id: "concrete_pump_machine_spec", label: "기계 제원",   required: false, enabled: true },
    { id: "concrete_pump_work_plan",    label: "작업 계획",   required: false, enabled: true },
    { id: "concrete_pump_checklist",    label: "사전 점검표", required: false, enabled: true },
  ],
  pile_driver: [
    { id: "pile_driver_machine_spec", label: "기계 제원",       required: false, enabled: true },
    { id: "pile_method",              label: "항타 공법",       required: false, enabled: true },
    { id: "pile_type",                label: "파일 종류",       required: false, enabled: true },
    { id: "pile_noise",               label: "소음·진동 관리", required: false, enabled: true },
    { id: "pile_checklist",           label: "사전 점검표",     required: false, enabled: true },
  ],
  forklift: [
    { id: "forklift_machine_spec", label: "기계 제원",   required: false, enabled: true },
    { id: "forklift_work_plan",    label: "작업 계획",   required: false, enabled: true },
    { id: "forklift_checklist",    label: "사전 점검표", required: false, enabled: true },
  ],
  loader: [
    { id: "loader_machine_spec", label: "기계 제원",   required: false, enabled: true },
    { id: "loader_bucket",       label: "작업계획",    required: false, enabled: true },
    { id: "loader_checklist",    label: "사전 점검표", required: false, enabled: true },
  ],
  roller: [
    { id: "roller_machine_spec", label: "기계 제원",         required: false, enabled: true },
    { id: "roller_section",      label: "다짐 구간 및 면적", required: false, enabled: true },
    { id: "roller_count",        label: "다짐 횟수 및 방법", required: false, enabled: true },
    { id: "roller_compaction",   label: "다짐도 관리",       required: false, enabled: true },
    { id: "roller_checklist",    label: "사전 점검표",       required: false, enabled: true },
  ],
};

// ─── 정식/약식별 카테고리 기본 섹션 preset ─────────────────────────
// key: "${profile}_${category}"  value: enabled section IDs
export const DEFAULT_SECTION_PRESETS: Record<string, string[]> = {
  // ── 정식 (법적 필요 섹션 포함) ────────────────────────────────
  full_construction_equipment: ["overview","work_description","work_environment","equipment_info","work_personnel","risk","safety_checklist","training","emergency_contact","signature"],
  full_lifting:                ["overview","work_description","heavy_goods","equipment_info","work_personnel","risk","safety_checklist","training","emergency_contact","pre_survey","drawing","signature"],
  full_excavation:             ["overview","work_description","work_environment","equipment_info","pre_survey","electrical_safety","work_personnel","risk","safety_checklist","training","emergency_contact","drawing","signature"],
  full_hot_work:               ["overview","work_description","work_environment","work_personnel","risk","safety_checklist","chemical_ops","training","emergency_contact","signature"],
  full_confined_space:         ["overview","work_description","equipment_info","pre_survey","work_personnel","risk","safety_checklist","training","emergency_contact","signature"],
  full_working_at_height:      ["overview","work_description","work_environment","equipment_info","work_personnel","risk","safety_checklist","training","emergency_contact","drawing","signature"],
  full_general:                ["overview","work_description","work_environment","work_personnel","risk","safety_checklist","training","emergency_contact","signature"],
  // ── 약식 (법적 최소) ───────────────────────────────────────────
  lite_construction_equipment: ["overview","equipment_info","risk","safety_checklist","signature"],
  lite_lifting:                ["overview","heavy_goods","equipment_info","risk","safety_checklist","signature"],
  lite_excavation:             ["overview","pre_survey","risk","safety_checklist","signature"],
  lite_hot_work:               ["overview","risk","safety_checklist","signature"],
  lite_confined_space:         ["overview","risk","safety_checklist","signature"],
  lite_working_at_height:      ["overview","risk","safety_checklist","signature"],
  lite_general:                ["overview","risk","safety_checklist","signature"],
};

// ─── 구 planType 호환용 섹션 ──────────────────────────────────────
const LEGACY_SECTIONS: Omit<Section, "order">[] = [
  { id: "overview", label: "프로젝트 개요", required: true, enabled: true },
  { id: "schedule", label: "추진 일정", required: false, enabled: true },
  { id: "scope", label: "업무 범위 및 산출물", required: false, enabled: false },
  { id: "personnel", label: "투입 인력 및 역할", required: false, enabled: true },
  { id: "budget", label: "예산 계획", required: false, enabled: false },
  { id: "risk", label: "위험 요소 및 대응방안", required: false, enabled: false },
  { id: "signature", label: "서명 및 결재", required: true, enabled: true },
];

const LEGACY_PLAN_TYPE_SECTIONS: Record<string, string[]> = {
  일반작업: ["overview", "schedule", "personnel", "signature"],
  화기작업: ["overview", "schedule", "personnel", "risk", "signature"],
  밀폐공간: ["overview", "schedule", "personnel", "risk", "signature"],
  고소작업: ["overview", "schedule", "personnel", "risk", "signature"],
  프로젝트: ["overview", "schedule", "scope", "personnel", "budget", "risk", "signature"],
  유지보수: ["overview", "schedule", "personnel", "signature"],
};

const DEFAULT_SIGNATURES: Signature[] = [
  { role: "작성자", name: "", dataUrl: "", signedAt: "", status: "signing",  comment: "", revisions: [] },
  { role: "검토자", name: "", dataUrl: "", signedAt: "", status: "pending",  comment: "", revisions: [] },
  { role: "승인자", name: "", dataUrl: "", signedAt: "", status: "pending",  comment: "", revisions: [] },
];

function buildLegacySections(planType: string): Section[] {
  const enabledIds = LEGACY_PLAN_TYPE_SECTIONS[planType] ?? LEGACY_PLAN_TYPE_SECTIONS["일반작업"];
  return LEGACY_SECTIONS.map((s, i) => ({
    ...s,
    enabled: s.required || enabledIds.includes(s.id),
    order: i,
  }));
}

function buildSections(
  profile: DocumentProfile,
  category: PlanCategory,
  equipments: EquipmentType[],
  userPresets: Record<string, string[]> = {}
): Section[] {
  const key = `${profile}_${category}`;
  const enabledIds = new Set<string>(
    userPresets[key] ?? DEFAULT_SECTION_PRESETS[key] ?? ["overview", "risk", "safety_checklist", "signature"]
  );
  // Signature is always required/enabled
  enabledIds.add("signature");

  const commonWithoutSig = COMMON_SECTIONS.filter((s) => s.id !== "signature");
  const sigSec = COMMON_SECTIONS.filter((s) => s.id === "signature");

  // 장비 번호 순으로 정렬 (Bug 2-3)
  const sortedEquipments = [...equipments].sort(
    (a, b) => (CONSTRUCTION_EQUIPMENT_TYPES[a]?.num ?? 99) - (CONSTRUCTION_EQUIPMENT_TYPES[b]?.num ?? 99)
  );

  const equipmentSpecific: Omit<Section, "order">[] = [];
  const eqSectionIds = new Set<string>();
  if (sortedEquipments.length > 0) {
    const seenIds = new Set<string>();
    for (const eq of sortedEquipments) {
      for (const sec of EQUIPMENT_SPECIFIC_SECTIONS[eq] ?? []) {
        if (!seenIds.has(sec.id)) {
          seenIds.add(sec.id);
          eqSectionIds.add(sec.id);
          equipmentSpecific.push({ ...sec, enabled: true });
        }
      }
    }
  }

  return [...commonWithoutSig, ...equipmentSpecific, ...sigSec].map((s, i) => ({
    ...s,
    // 장비 전용 섹션은 항상 활성화 유지 (Bug 2-4: preset이 덮어쓰는 문제 수정)
    enabled: eqSectionIds.has(s.id) ? true : (s.required || enabledIds.has(s.id)),
    order: i,
  }));
}

// ─── 섹션 ID → 장비 유형 역방향 맵 ──────────────────────────────
export const SECTION_TO_EQUIPMENT: Record<string, EquipmentType> = (() => {
  const map: Record<string, EquipmentType> = {};
  for (const [eq, sections] of Object.entries(EQUIPMENT_SPECIFIC_SECTIONS)) {
    for (const sec of sections) {
      map[sec.id] = eq as EquipmentType;
    }
  }
  return map;
})();

/** 선택된 장비 목록 → 문서 서브타이틀 문자열 */
export function getEquipmentSubtitle(equipments: EquipmentType[]): string {
  if (equipments.length === 0) return "";
  return equipments
    .map((eq) => CONSTRUCTION_EQUIPMENT_TYPES[eq].label)
    .join(" · ");
}

export const useWorkPlanStore = create<WorkPlanState>()(
  persist(
    (set, get) => ({
  planType: "일반작업",
  planCategory: "general",
  documentProfile: "full",
  selectedEquipments: [],
  sections: buildLegacySections("일반작업"),
  formData: {},
  signatures: DEFAULT_SIGNATURES.map((s) => ({ ...s })),
  attachments: [],
  templates: [],
  sectionPresets: {},
  sectionFavorites: [],
  savedCards: [],
  classification: {
    categoryId: "cat_3",
    subcategoryId: "sub_3_1",
    equipmentIds: [],
    workAttributeIds: [],
    riskAttributeIds: [],
  },

  saveCard: () => {
    const state = get();
    const overview = (state.formData["overview"] as Record<string, string>) ?? {};
    const card: SavedCard = {
      id: `card_${Date.now()}`,
      title: overview.title ?? "(제목 없음)",
      savedAt: new Date().toISOString(),
      classification: state.classification,
      planCategory: state.planCategory,
      selectedEquipments: state.selectedEquipments,
      documentProfile: state.documentProfile,
      sections: state.sections,
      formData: state.formData,
    };
    set((s) => ({ savedCards: [...s.savedCards, card] }));
  },

  loadCard: (id) => {
    const card = get().savedCards.find((c) => c.id === id);
    if (!card) return;
    set({
      classification: card.classification,
      planCategory: card.planCategory,
      selectedEquipments: card.selectedEquipments,
      documentProfile: card.documentProfile,
      sections: card.sections,
      formData: card.formData,
      signatures: DEFAULT_SIGNATURES.map((s) => ({ ...s })),
    });
  },

  deleteCard: (id) => {
    set((state) => ({ savedCards: state.savedCards.filter((c) => c.id !== id) }));
  },

  resetPlan: () => {
    set((state) => ({
      formData: {},
      signatures: DEFAULT_SIGNATURES.map((s) => ({ ...s })),
      sections: buildSections(state.documentProfile, state.planCategory, state.selectedEquipments, state.sectionPresets),
    }));
  },

  setPlanType: (type) => {
    set({ planType: type, sections: buildLegacySections(type) });
  },

  setPlanCategory: (category) => {
    const { selectedEquipments } = get();
    const equipments = category === "construction_equipment" ? selectedEquipments : [];
    set({
      planCategory: category,
      documentProfile: "full",
      selectedEquipments: equipments,
      sections: buildSections("full", category, equipments, get().sectionPresets),
    });
  },

  setDocumentProfile: (profile) => {
    set((state) => ({
      documentProfile: profile,
      sections: buildSections(profile, state.planCategory, state.selectedEquipments, state.sectionPresets),
    }));
  },

  toggleEquipment: (equipment) => {
    const { selectedEquipments, sections } = get();
    const isRemoving = selectedEquipments.includes(equipment);
    const next = isRemoving
      ? selectedEquipments.filter((e) => e !== equipment)
      : [...selectedEquipments, equipment];

    if (isRemoving) {
      // 해당 장비 섹션만 제거 — 나머지 사용자 설정 보존 (Bug 2-1)
      const removeIds = new Set((EQUIPMENT_SPECIFIC_SECTIONS[equipment] ?? []).map((s) => s.id));
      const newSections = sections
        .filter((s) => !removeIds.has(s.id))
        .map((s, i) => ({ ...s, order: i }));
      set({ selectedEquipments: next, sections: newSections });
    } else {
      // 장비 섹션 추가 — 기존 섹션 보존 + 장비 번호 순 정렬 (Bug 2-1, 2-3)
      const existingIds = new Set(sections.map((s) => s.id));
      const newEqSections = (EQUIPMENT_SPECIFIC_SECTIONS[equipment] ?? [])
        .filter((s) => !existingIds.has(s.id))
        .map((s) => ({ ...s, enabled: true, order: 0 }));
      const sigSection = sections.find((s) => s.id === "signature");
      const withoutSig = sections.filter((s) => s.id !== "signature");
      const commonSections = withoutSig.filter((s) => !SECTION_TO_EQUIPMENT[s.id]);
      const existingEqSections = withoutSig.filter((s) => !!SECTION_TO_EQUIPMENT[s.id]);
      const allEqSections = [...existingEqSections, ...newEqSections].sort((a, b) => {
        const numA = CONSTRUCTION_EQUIPMENT_TYPES[SECTION_TO_EQUIPMENT[a.id]]?.num ?? 99;
        const numB = CONSTRUCTION_EQUIPMENT_TYPES[SECTION_TO_EQUIPMENT[b.id]]?.num ?? 99;
        return numA - numB;
      });
      const newSections = [
        ...commonSections,
        ...allEqSections,
        ...(sigSection ? [sigSection] : []),
      ].map((s, i) => ({ ...s, order: i }));
      set({ selectedEquipments: next, sections: newSections });
    }
  },

  clearEquipments: () => {
    const { documentProfile, planCategory, sectionPresets } = get();
    set({
      selectedEquipments: [],
      sections: buildSections(documentProfile, planCategory, [], sectionPresets),
    });
  },

  toggleSection: (id) => {
    set((state) => ({
      documentProfile: "custom",
      sections: state.sections.map((s) =>
        s.id === id && !s.required ? { ...s, enabled: !s.enabled } : s
      ),
    }));
  },

  toggleSectionEnabled: (id) => {
    set((state) => ({
      documentProfile: "custom",
      sections: state.sections.map((s) =>
        s.id === id && !s.required ? { ...s, enabled: !s.enabled } : s
      ),
    }));
  },

  reorderSections: (from, to) => {
    set((state) => {
      const sections = [...state.sections];
      const [moved] = sections.splice(from, 1);
      sections.splice(to, 0, moved);
      return { sections: sections.map((s, i) => ({ ...s, order: i })) };
    });
  },

  addCustomSection: (section) => {
    set((state) => {
      // 서명 및 결재는 항상 최하단 — 그 위에 삽입 (Bug 2-5)
      const withoutSig = state.sections.filter((s) => s.id !== "signature");
      const sigSection = state.sections.find((s) => s.id === "signature");
      const newSec = { ...section, order: withoutSig.length };
      const newSections = [...withoutSig, newSec, ...(sigSection ? [sigSection] : [])];
      return {
        documentProfile: "custom",
        sections: newSections.map((s, i) => ({ ...s, order: i })),
      };
    });
  },

  updateFormData: (sectionId, data) => {
    set((state) => ({
      formData: { ...state.formData, [sectionId]: data },
    }));
  },

  addSignature: (role, name, dataUrl) => {
    set((state) => {
      const sigs = state.signatures.map((s) => {
        if (s.role === role) {
          return { ...s, name, dataUrl, signedAt: new Date().toISOString(), status: "done" as const };
        }
        return s;
      });
      const doneIndex = sigs.findIndex((s) => s.role === role);
      if (doneIndex >= 0 && doneIndex + 1 < sigs.length) {
        sigs[doneIndex + 1] = { ...sigs[doneIndex + 1], status: "signing" as const };
      }
      return { signatures: sigs };
    });
  },

  resetSignature: (role) => {
    set((state) => ({
      signatures: state.signatures.map((s) =>
        s.role === role
          ? { ...s, dataUrl: "", name: "", signedAt: "", status: "pending", comment: "", revisions: [] }
          : s
      ),
    }));
  },

  setSignatureComment: (role, comment) => {
    set((state) => ({
      signatures: state.signatures.map((s) => s.role === role ? { ...s, comment } : s),
    }));
  },

  requestRevision: (role, comment) => {
    set((state) => {
      const reviewer = state.signatures.find((s) => s.role === role);
      if (!reviewer) return state;
      const revNo = reviewer.revisions.length + 1;
      const revision: FormRevision = {
        revisionNo: revNo,
        savedAt: new Date().toISOString(),
        note: comment,
        formDataSnapshot: JSON.parse(JSON.stringify(state.formData)),
      };
      const sigs = state.signatures.map((s) => {
        if (s.role === role) {
          return { ...s, status: "revision_requested" as const, comment, revisions: [...s.revisions, revision] };
        }
        // 첫 번째 서명자(작성자)를 다시 signing 상태로 복원
        if (s.role === state.signatures[0].role) {
          return { ...s, status: "signing" as const };
        }
        return s;
      });
      return { signatures: sigs };
    });
  },

  addSignatureStep: (role) => {
    set((state) => {
      if (state.signatures.length >= 7) return state;
      const newSig: Signature = {
        role,
        name: "", dataUrl: "", signedAt: "",
        status: "pending", comment: "", revisions: [],
      };
      // 마지막(승인자) 앞에 삽입
      const sigs = [...state.signatures];
      sigs.splice(sigs.length - 1, 0, newSig);
      return { signatures: sigs };
    });
  },

  removeSignatureStep: (role) => {
    set((state) => {
      // 작성자(첫번째)와 승인자(마지막)는 삭제 불가
      if (state.signatures.length <= 2) return state;
      if (role === state.signatures[0].role || role === state.signatures[state.signatures.length - 1].role) return state;
      return { signatures: state.signatures.filter((s) => s.role !== role) };
    });
  },

  addAttachment: (file) => {
    set((state) => ({ attachments: [...state.attachments, file] }));
  },

  removeAttachment: (id) => {
    set((state) => ({ attachments: state.attachments.filter((a) => a.id !== id) }));
  },

  updateAttachmentMarkup: (id, markup) => {
    set((state) => ({
      attachments: state.attachments.map((a) =>
        a.id === id ? { ...a, markup } : a
      ),
    }));
  },

  saveTemplate: (name) => {
    const state = get();
    const template: Template = {
      id: `tpl_${Date.now()}`,
      name,
      planType: state.planType,
      sections: state.sections,
      formData: state.formData,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ templates: [...s.templates, template] }));
  },

  loadTemplate: (id) => {
    const state = get();
    const tpl = state.templates.find((t) => t.id === id);
    if (!tpl) return;
    set({
      planType: tpl.planType,
      sections: tpl.sections,
      formData: tpl.formData,
    });
  },

  deleteTemplate: (id) => {
    set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }));
  },

  setSectionPreset: (profile, category, enabledIds) => {
    const key = `${profile}_${category}`;
    set((state) => ({
      sectionPresets: { ...state.sectionPresets, [key]: enabledIds },
    }));
  },

  resetSectionPreset: (profile, category) => {
    const key = `${profile}_${category}`;
    set((state) => {
      const next = { ...state.sectionPresets };
      delete next[key];
      return { sectionPresets: next };
    });
  },

  saveFavorite: (name) => {
    const state = get();
    const fav: SectionFavorite = {
      id: `fav_${Date.now()}`,
      name,
      planCategory: state.planCategory,
      selectedEquipments: state.selectedEquipments,
      sections: state.sections,
      classification: state.classification,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ sectionFavorites: [...s.sectionFavorites, fav] }));
  },

  loadFavorite: (id) => {
    const fav = get().sectionFavorites.find((f) => f.id === id);
    if (!fav) return;
    set({
      planCategory: fav.planCategory,
      selectedEquipments: fav.selectedEquipments,
      sections: fav.sections,
      documentProfile: "custom",
    });
  },

  deleteFavorite: (id) => {
    set((state) => ({ sectionFavorites: state.sectionFavorites.filter((f) => f.id !== id) }));
  },

  renameFavorite: (id, name) => {
    set((state) => ({
      sectionFavorites: state.sectionFavorites.map((f) =>
        f.id === id ? { ...f, name } : f
      ),
    }));
  },

  overwriteFavorite: (id) => {
    const state = get();
    const existing = state.sectionFavorites.find((f) => f.id === id);
    if (!existing) return;
    const updated: SectionFavorite = {
      ...existing,
      planCategory: state.planCategory,
      selectedEquipments: state.selectedEquipments,
      sections: state.sections,
      classification: state.classification,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ sectionFavorites: s.sectionFavorites.map((f) => f.id === id ? updated : f) }));
  },

  setClassification: (partial) => {
    set((state) => {
      const next: WorkClassification = { ...state.classification, ...partial };
      // Derive legacy fields for section building
      const legacyCat = toLegacyPlanCategory(next.subcategoryId) as PlanCategory;
      const legacyEqs = toLegacyEquipmentTypes(next.equipmentIds) as EquipmentType[];
      return {
        classification: next,
        planCategory: legacyCat,
        selectedEquipments: legacyEqs,
        sections: buildSections(state.documentProfile, legacyCat, legacyEqs, state.sectionPresets),
      };
    });
  },
    }),
    {
      name: "ptw-work-plan",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as Storage)
      ),
      // 재수화 후: ① COMMON_SECTIONS에 추가된 신규 섹션 보완 ② 순서 정규화
      onRehydrateStorage: () => (state) => {
        if (!state?.sections) return;
        // ① 저장된 섹션에 없는 COMMON_SECTIONS 항목 추가
        const existingIds = new Set(state.sections.map((s) => s.id));
        const missing = COMMON_SECTIONS.filter((s) => !existingIds.has(s.id));
        if (missing.length > 0) {
          state.sections = [...state.sections, ...missing.map((s) => ({ ...s, order: 0 }))];
        }
        if (!state.sections.length) return;
        // ② 순서 정규화: 공통(비서명) → 장비전용 → 서명
        const sig = state.sections.filter((s) => s.id === "signature");
        const eq  = state.sections.filter((s) => !!SECTION_TO_EQUIPMENT[s.id]);
        const com = state.sections.filter((s) => !SECTION_TO_EQUIPMENT[s.id] && s.id !== "signature");
        state.sections = [...com, ...eq, ...sig].map((s, i) => ({ ...s, order: i }));
      },
      // 서명 dataUrl과 첨부파일은 용량이 크므로 제외
      partialize: (state) => ({
        planType: state.planType,
        planCategory: state.planCategory,
        documentProfile: state.documentProfile,
        selectedEquipments: state.selectedEquipments,
        classification: state.classification,
        sections: state.sections,
        formData: state.formData,
        templates: state.templates,
        sectionFavorites: state.sectionFavorites,
        savedCards: state.savedCards,
        sectionPresets: state.sectionPresets,
      }),
    }
  )
);
