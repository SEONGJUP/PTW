// ─────────────────────────────────────────────────────────────────
// 작업계획서 분류 체계  (IA v1.0)
//
// 구조: 대분류 > 상세분류 (2단)
// 선택 4축:
//   1) categoryId   - 대분류 1개
//   2) subcategoryId - 상세분류 1개
//   3) equipmentIds  - 장비 다중선택 (독립 패널)
//   4) workAttributeIds / riskAttributeIds - 속성 태그
// ─────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════
// 대분류
// ══════════════════════════════════════════════════════════════════
export interface WPCategory {
  id: string;
  num: number;
  icon: string;
  label: string;
}

export const WORK_CATEGORIES: WPCategory[] = [
  { id: "cat_1", num: 1, icon: "🚛", label: "운반·하역 작업" },
  { id: "cat_2", num: 2, icon: "🏗", label: "인양·양중 작업" },
  { id: "cat_3", num: 3, icon: "⛏️", label: "굴착·토공 작업" },
  { id: "cat_4", num: 4, icon: "🪜", label: "고소·접근 작업" },
  { id: "cat_5", num: 5, icon: "🪣", label: "콘크리트·타설 작업" },
  { id: "cat_6", num: 6, icon: "🔩", label: "기초·항타·천공 작업" },
  { id: "cat_7", num: 7, icon: "🧱", label: "가설·구조보조 작업" },
  { id: "cat_8", num: 8, icon: "🏚", label: "해체·철거 작업" },
  { id: "cat_9",  num: 9,  icon: "⚡", label: "전기·특수위험 작업" },
  { id: "cat_10", num: 10, icon: "⚖️", label: "산업안전보건기준 규칙 (제38조)" },
  { id: "cat_11", num: 11, icon: "📝", label: "기타 작업" },
];

// ══════════════════════════════════════════════════════════════════
// 상세분류
// ══════════════════════════════════════════════════════════════════
export interface WPSubcategory {
  id: string;
  num: string;       // "1-1", "2-3" etc.
  categoryId: string;
  label: string;
  articleRef?: string;   // 법령 조문 참조 (예: "제38조 제1항 제1호")
  isCustom?: boolean;    // true → 상세분류 선택 시 직접입력 텍스트 필드 노출
  aliases?: string[];    // 검색용 현장 용어 (예: "스카이", "스카이차")
  recommendedEquipmentIds: string[];
  recommendedWorkAttrIds: string[];
  recommendedRiskAttrIds: string[];
}

export const WORK_SUBCATEGORIES: WPSubcategory[] = [
  // ── 1. 운반·하역 ──────────────────────────────────────────────
  {
    id: "sub_1_1", num: "1-1", categoryId: "cat_1",
    label: "차량계 하역운반",
    recommendedEquipmentIds: ["eq_dump", "eq_cargo"],
    recommendedWorkAttrIds: ["wa_운반", "wa_하역"],
    recommendedRiskAttrIds: ["ra_중량물", "ra_인접작업"],
  },
  {
    id: "sub_1_2", num: "1-2", categoryId: "cat_1",
    label: "지게차 작업",
    recommendedEquipmentIds: ["eq_forklift"],
    recommendedWorkAttrIds: ["wa_운반", "wa_하역"],
    recommendedRiskAttrIds: ["ra_중량물", "ra_협소공간"],
  },
  {
    id: "sub_1_3", num: "1-3", categoryId: "cat_1",
    label: "중량물 운반",
    recommendedEquipmentIds: ["eq_mobile_crane", "eq_forklift"],
    recommendedWorkAttrIds: ["wa_운반", "wa_인양"],
    recommendedRiskAttrIds: ["ra_중량물", "ra_인접작업"],
  },
  // ── 2. 인양·양중 ──────────────────────────────────────────────
  {
    id: "sub_2_1", num: "2-1", categoryId: "cat_2",
    label: "타워크레인 작업",
    recommendedEquipmentIds: ["eq_tower_crane"],
    recommendedWorkAttrIds: ["wa_인양", "wa_양중"],
    recommendedRiskAttrIds: ["ra_중량물", "ra_인접작업"],
  },
  {
    id: "sub_2_2", num: "2-2", categoryId: "cat_2",
    label: "이동식크레인 작업",
    recommendedEquipmentIds: ["eq_mobile_crane"],
    recommendedWorkAttrIds: ["wa_인양", "wa_양중"],
    recommendedRiskAttrIds: ["ra_중량물", "ra_인접작업"],
  },
  {
    id: "sub_2_3", num: "2-3", categoryId: "cat_2",
    label: "카고크레인 작업",
    recommendedEquipmentIds: ["eq_cargo_crane"],
    recommendedWorkAttrIds: ["wa_인양", "wa_양중"],
    recommendedRiskAttrIds: ["ra_중량물"],
  },
  {
    id: "sub_2_4", num: "2-4", categoryId: "cat_2",
    label: "복합 양중 작업",
    recommendedEquipmentIds: ["eq_tower_crane", "eq_mobile_crane"],
    recommendedWorkAttrIds: ["wa_인양", "wa_양중"],
    recommendedRiskAttrIds: ["ra_중량물", "ra_인접작업"],
  },
  // ── 3. 굴착·토공 ──────────────────────────────────────────────
  {
    id: "sub_3_1", num: "3-1", categoryId: "cat_3",
    label: "굴착기 작업",
    recommendedEquipmentIds: ["eq_excavator"],
    recommendedWorkAttrIds: ["wa_굴착", "wa_운반"],
    recommendedRiskAttrIds: ["ra_인접작업", "ra_협소공간"],
  },
  {
    id: "sub_3_2", num: "3-2", categoryId: "cat_3",
    label: "로더 작업",
    recommendedEquipmentIds: ["eq_loader"],
    recommendedWorkAttrIds: ["wa_운반", "wa_하역"],
    recommendedRiskAttrIds: ["ra_인접작업"],
  },
  {
    id: "sub_3_3", num: "3-3", categoryId: "cat_3",
    label: "롤러 작업",
    recommendedEquipmentIds: ["eq_roller"],
    recommendedWorkAttrIds: ["wa_보강"],
    recommendedRiskAttrIds: ["ra_인접작업"],
  },
  {
    id: "sub_3_4", num: "3-4", categoryId: "cat_3",
    label: "굴착 작업",
    recommendedEquipmentIds: ["eq_excavator"],
    recommendedWorkAttrIds: ["wa_굴착"],
    recommendedRiskAttrIds: ["ra_인접작업", "ra_협소공간"],
  },
  {
    id: "sub_3_5", num: "3-5", categoryId: "cat_3",
    label: "발파 작업",
    recommendedEquipmentIds: [],
    recommendedWorkAttrIds: ["wa_발파", "wa_굴착"],
    recommendedRiskAttrIds: ["ra_인접작업"],
  },
  {
    id: "sub_3_6", num: "3-6", categoryId: "cat_3",
    label: "터널 굴착 작업",
    recommendedEquipmentIds: ["eq_excavator"],
    recommendedWorkAttrIds: ["wa_굴착"],
    recommendedRiskAttrIds: ["ra_인접작업", "ra_협소공간"],
  },
  {
    id: "sub_3_7", num: "3-7", categoryId: "cat_3",
    label: "채석 작업",
    recommendedEquipmentIds: ["eq_excavator"],
    recommendedWorkAttrIds: ["wa_굴착", "wa_발파"],
    recommendedRiskAttrIds: ["ra_인접작업"],
  },
  // ── 4. 고소·접근 ──────────────────────────────────────────────
  {
    id: "sub_4_1", num: "4-1", categoryId: "cat_4",
    label: "고소작업대 작업",
    aliases: ["스카이", "스카이차", "고소작업차", "붐리프트", "붐 리프트", "cherry picker"],
    recommendedEquipmentIds: ["eq_scissors_lift", "eq_boom_lift"],
    recommendedWorkAttrIds: ["wa_설치", "wa_해체"],
    recommendedRiskAttrIds: ["ra_고소작업", "ra_개구부"],
  },
  {
    id: "sub_4_2", num: "4-2", categoryId: "cat_4",
    label: "곤돌라 작업",
    recommendedEquipmentIds: ["eq_gondola"],
    recommendedWorkAttrIds: ["wa_설치"],
    recommendedRiskAttrIds: ["ra_고소작업"],
  },
  {
    id: "sub_4_3", num: "4-3", categoryId: "cat_4",
    label: "고소 접근 복합작업",
    recommendedEquipmentIds: ["eq_scissors_lift", "eq_boom_lift"],
    recommendedWorkAttrIds: ["wa_설치", "wa_해체"],
    recommendedRiskAttrIds: ["ra_고소작업", "ra_개구부", "ra_인접작업"],
  },
  {
    id: "sub_4_4", num: "4-4", categoryId: "cat_4",
    label: "차량탑재형 고소작업대(스카이)",
    aliases: ["스카이차", "스카이 차량", "차량형 고소작업대", "sky lift", "skytruck"],
    recommendedEquipmentIds: ["eq_sky_lift"],
    recommendedWorkAttrIds: ["wa_설치", "wa_해체", "wa_운반"],
    recommendedRiskAttrIds: ["ra_고소작업", "ra_개구부", "ra_인접작업", "ra_중량물"],
  },
  // ── 5. 콘크리트·타설 ──────────────────────────────────────────
  {
    id: "sub_5_1", num: "5-1", categoryId: "cat_5",
    label: "콘크리트펌프카 작업",
    recommendedEquipmentIds: ["eq_pump_car", "eq_mixer"],
    recommendedWorkAttrIds: ["wa_타설"],
    recommendedRiskAttrIds: ["ra_중량물", "ra_인접작업"],
  },
  {
    id: "sub_5_2", num: "5-2", categoryId: "cat_5",
    label: "레미콘/믹서트럭 작업",
    recommendedEquipmentIds: ["eq_mixer"],
    recommendedWorkAttrIds: ["wa_운반", "wa_타설"],
    recommendedRiskAttrIds: ["ra_인접작업"],
  },
  {
    id: "sub_5_3", num: "5-3", categoryId: "cat_5",
    label: "콘크리트 타설 작업",
    recommendedEquipmentIds: ["eq_pump_car", "eq_mixer"],
    recommendedWorkAttrIds: ["wa_타설"],
    recommendedRiskAttrIds: ["ra_중량물"],
  },
  // ── 6. 기초·항타·천공 ─────────────────────────────────────────
  {
    id: "sub_6_1", num: "6-1", categoryId: "cat_6",
    label: "항타기/항발기 작업",
    recommendedEquipmentIds: ["eq_pile_driver"],
    recommendedWorkAttrIds: ["wa_항타"],
    recommendedRiskAttrIds: ["ra_인접작업"],
  },
  {
    id: "sub_6_2", num: "6-2", categoryId: "cat_6",
    label: "천공기/오거 작업",
    recommendedEquipmentIds: ["eq_borer"],
    recommendedWorkAttrIds: ["wa_천공"],
    recommendedRiskAttrIds: ["ra_인접작업"],
  },
  {
    id: "sub_6_3", num: "6-3", categoryId: "cat_6",
    label: "기초 복합작업",
    recommendedEquipmentIds: ["eq_pile_driver", "eq_borer"],
    recommendedWorkAttrIds: ["wa_항타", "wa_천공"],
    recommendedRiskAttrIds: ["ra_인접작업"],
  },
  // ── 7. 가설·구조보조 ──────────────────────────────────────────
  {
    id: "sub_7_1", num: "7-1", categoryId: "cat_7",
    label: "가설비계 작업",
    recommendedEquipmentIds: ["eq_scissors_lift", "eq_forklift"],
    recommendedWorkAttrIds: ["wa_설치", "wa_해체"],
    recommendedRiskAttrIds: ["ra_고소작업", "ra_개구부"],
  },
  {
    id: "sub_7_2", num: "7-2", categoryId: "cat_7",
    label: "거푸집 작업",
    recommendedEquipmentIds: ["eq_mobile_crane"],
    recommendedWorkAttrIds: ["wa_설치", "wa_해체", "wa_조립"],
    recommendedRiskAttrIds: ["ra_중량물", "ra_고소작업"],
  },
  {
    id: "sub_7_3", num: "7-3", categoryId: "cat_7",
    label: "동바리 작업",
    recommendedEquipmentIds: [],
    recommendedWorkAttrIds: ["wa_설치", "wa_해체", "wa_보강"],
    recommendedRiskAttrIds: ["ra_고소작업"],
  },
  {
    id: "sub_7_4", num: "7-4", categoryId: "cat_7",
    label: "가설구조물 복합작업",
    recommendedEquipmentIds: ["eq_mobile_crane"],
    recommendedWorkAttrIds: ["wa_설치", "wa_해체", "wa_조립"],
    recommendedRiskAttrIds: ["ra_고소작업", "ra_인접작업"],
  },
  // ── 8. 해체·철거 ──────────────────────────────────────────────
  {
    id: "sub_8_1", num: "8-1", categoryId: "cat_8",
    label: "건물 해체 작업",
    recommendedEquipmentIds: ["eq_excavator"],
    recommendedWorkAttrIds: ["wa_해체"],
    recommendedRiskAttrIds: ["ra_해체작업", "ra_인접작업"],
  },
  {
    id: "sub_8_2", num: "8-2", categoryId: "cat_8",
    label: "교량 작업",
    recommendedEquipmentIds: ["eq_mobile_crane"],
    recommendedWorkAttrIds: ["wa_해체", "wa_보강"],
    recommendedRiskAttrIds: ["ra_해체작업", "ra_고소작업"],
  },
  {
    id: "sub_8_3", num: "8-3", categoryId: "cat_8",
    label: "석면해체 작업",
    recommendedEquipmentIds: [],
    recommendedWorkAttrIds: ["wa_해체"],
    recommendedRiskAttrIds: ["ra_해체작업", "ra_밀폐공간"],
  },
  {
    id: "sub_8_4", num: "8-4", categoryId: "cat_8",
    label: "철거 복합작업",
    recommendedEquipmentIds: ["eq_excavator", "eq_mobile_crane"],
    recommendedWorkAttrIds: ["wa_해체"],
    recommendedRiskAttrIds: ["ra_해체작업", "ra_인접작업"],
  },
  // ── 9. 전기·특수위험 ──────────────────────────────────────────
  {
    id: "sub_9_1", num: "9-1", categoryId: "cat_9",
    label: "정전 작업",
    recommendedEquipmentIds: [],
    recommendedWorkAttrIds: ["wa_설치"],
    recommendedRiskAttrIds: ["ra_정전"],
  },
  {
    id: "sub_9_2", num: "9-2", categoryId: "cat_9",
    label: "활선 작업",
    recommendedEquipmentIds: [],
    recommendedWorkAttrIds: ["wa_보강"],
    recommendedRiskAttrIds: ["ra_활선"],
  },
  {
    id: "sub_9_3", num: "9-3", categoryId: "cat_9",
    label: "밀폐공간 작업",
    recommendedEquipmentIds: [],
    recommendedWorkAttrIds: ["wa_설치"],
    recommendedRiskAttrIds: ["ra_밀폐공간"],
  },
  {
    id: "sub_9_4", num: "9-4", categoryId: "cat_9",
    label: "개구부 인접 작업",
    recommendedEquipmentIds: [],
    recommendedWorkAttrIds: ["wa_보강"],
    recommendedRiskAttrIds: ["ra_개구부", "ra_고소작업"],
  },
  {
    id: "sub_9_5", num: "9-5", categoryId: "cat_9",
    label: "시간특수 작업",
    aliases: ["야간작업", "조출작업", "휴일작업", "야간조출", "특근"],
    recommendedEquipmentIds: [],
    recommendedWorkAttrIds: ["wa_운반", "wa_설치"],
    recommendedRiskAttrIds: ["ra_야간", "ra_휴일", "ra_인접작업"],
  },
  {
    id: "sub_9_6", num: "9-6", categoryId: "cat_9",
    label: "화학설비 작업",
    recommendedEquipmentIds: [],
    recommendedWorkAttrIds: ["wa_설치"],
    recommendedRiskAttrIds: ["ra_밀폐공간"],
  },
  {
    id: "sub_9_7", num: "9-7", categoryId: "cat_9",
    label: "중량물 취급 작업",
    recommendedEquipmentIds: ["eq_mobile_crane", "eq_forklift"],
    recommendedWorkAttrIds: ["wa_인양", "wa_운반"],
    recommendedRiskAttrIds: ["ra_중량물", "ra_인접작업"],
  },
  // ── 10. 산업안전보건기준 규칙 제38조 (작업계획서 의무 작성) ──────
  {
    id: "sub_10_1", num: "10-1", categoryId: "cat_10",
    label: "타워크레인 설치·조립·해체 작업",
    articleRef: "제38조 제1항 제1호",
    recommendedEquipmentIds: ["eq_tower_crane"],
    recommendedWorkAttrIds: ["wa_설치", "wa_해체", "wa_조립"],
    recommendedRiskAttrIds: ["ra_중량물", "ra_인접작업"],
  },
  {
    id: "sub_10_2", num: "10-2", categoryId: "cat_10",
    label: "차량계 하역운반기계 사용 작업",
    articleRef: "제38조 제1항 제2호",
    recommendedEquipmentIds: ["eq_dump", "eq_cargo", "eq_forklift"],
    recommendedWorkAttrIds: ["wa_운반", "wa_하역"],
    recommendedRiskAttrIds: ["ra_중량물", "ra_인접작업"],
  },
  {
    id: "sub_10_3", num: "10-3", categoryId: "cat_10",
    label: "차량계 건설기계 사용 작업",
    articleRef: "제38조 제1항 제3호",
    recommendedEquipmentIds: ["eq_excavator", "eq_loader", "eq_roller"],
    recommendedWorkAttrIds: ["wa_굴착", "wa_운반"],
    recommendedRiskAttrIds: ["ra_인접작업"],
  },
  {
    id: "sub_10_4", num: "10-4", categoryId: "cat_10",
    label: "화학설비·부속설비 사용 작업",
    articleRef: "제38조 제1항 제4호",
    recommendedEquipmentIds: [],
    recommendedWorkAttrIds: ["wa_설치"],
    recommendedRiskAttrIds: ["ra_밀폐공간"],
  },
  {
    id: "sub_10_5", num: "10-5", categoryId: "cat_10",
    label: "전기작업 (50V 초과 또는 250VA 초과)",
    articleRef: "제38조 제1항 제5호",
    recommendedEquipmentIds: [],
    recommendedWorkAttrIds: ["wa_설치"],
    recommendedRiskAttrIds: ["ra_활선", "ra_정전"],
  },
  {
    id: "sub_10_6", num: "10-6", categoryId: "cat_10",
    label: "굴착면 높이 2m 이상 지반 굴착작업",
    articleRef: "제38조 제1항 제6호",
    recommendedEquipmentIds: ["eq_excavator"],
    recommendedWorkAttrIds: ["wa_굴착"],
    recommendedRiskAttrIds: ["ra_협소공간", "ra_인접작업"],
  },
  {
    id: "sub_10_7", num: "10-7", categoryId: "cat_10",
    label: "터널굴착작업",
    articleRef: "제38조 제1항 제7호",
    recommendedEquipmentIds: ["eq_excavator"],
    recommendedWorkAttrIds: ["wa_굴착"],
    recommendedRiskAttrIds: ["ra_협소공간", "ra_밀폐공간"],
  },
  {
    id: "sub_10_8", num: "10-8", categoryId: "cat_10",
    label: "교량 설치·해체·변경 작업 (높이 5m↑ 또는 지간 30m↑)",
    articleRef: "제38조 제1항 제8호",
    recommendedEquipmentIds: ["eq_mobile_crane"],
    recommendedWorkAttrIds: ["wa_설치", "wa_해체"],
    recommendedRiskAttrIds: ["ra_고소작업", "ra_중량물"],
  },
  {
    id: "sub_10_9", num: "10-9", categoryId: "cat_10",
    label: "채석작업",
    articleRef: "제38조 제1항 제9호",
    recommendedEquipmentIds: ["eq_excavator"],
    recommendedWorkAttrIds: ["wa_굴착", "wa_발파"],
    recommendedRiskAttrIds: ["ra_인접작업"],
  },
  {
    id: "sub_10_10", num: "10-10", categoryId: "cat_10",
    label: "구축물·건축물 등 해체작업",
    articleRef: "제38조 제1항 제10호",
    recommendedEquipmentIds: ["eq_excavator"],
    recommendedWorkAttrIds: ["wa_해체"],
    recommendedRiskAttrIds: ["ra_해체작업", "ra_인접작업"],
  },
  {
    id: "sub_10_11", num: "10-11", categoryId: "cat_10",
    label: "중량물 취급작업",
    articleRef: "제38조 제1항 제11호",
    recommendedEquipmentIds: ["eq_mobile_crane", "eq_forklift"],
    recommendedWorkAttrIds: ["wa_인양", "wa_운반"],
    recommendedRiskAttrIds: ["ra_중량물"],
  },
  {
    id: "sub_10_12", num: "10-12", categoryId: "cat_10",
    label: "궤도·관련설비 보수·점검작업",
    articleRef: "제38조 제1항 제12호",
    recommendedEquipmentIds: [],
    recommendedWorkAttrIds: ["wa_보강"],
    recommendedRiskAttrIds: ["ra_인접작업"],
  },
  {
    id: "sub_10_13", num: "10-13", categoryId: "cat_10",
    label: "열차 교환·연결·분리 (입환작업)",
    articleRef: "제38조 제1항 제13호",
    recommendedEquipmentIds: [],
    recommendedWorkAttrIds: [],
    recommendedRiskAttrIds: ["ra_인접작업"],
  },
  // ── 11. 기타 작업 ──────────────────────────────────────────────
  {
    id: "sub_11_1", num: "11-1", categoryId: "cat_11",
    label: "기타 작업 (직접 입력)",
    isCustom: true,
    recommendedEquipmentIds: [],
    recommendedWorkAttrIds: [],
    recommendedRiskAttrIds: [],
  },
];

// ══════════════════════════════════════════════════════════════════
// 장비 트리 (독립 멀티선택)
// ══════════════════════════════════════════════════════════════════
export interface EquipmentItem {
  id: string;
  label: string;
  icon?: string;
  /** legacy EquipmentType 매핑 키 (섹션 생성용) */
  legacyType?: string;
}

export interface EquipmentGroup {
  id: string;
  label: string;
  icon: string;
  items: EquipmentItem[];
}

// 고용노동부 작업계획서 서식 기준 9종
export const EQUIPMENT_GROUPS: EquipmentGroup[] = [
  {
    id: "grp_truck", label: "트럭", icon: "🚛",
    items: [
      { id: "eq_dump",  label: "덤프트럭",        legacyType: "truck" },
      { id: "eq_cargo", label: "카고트럭",        legacyType: "truck" },
      { id: "eq_mixer", label: "레미콘/믹서트럭", legacyType: "truck" },
    ],
  },
  {
    id: "grp_excavator", label: "굴착기", icon: "⛏️",
    items: [
      { id: "eq_excavator", label: "굴착기(백호)", legacyType: "excavator" },
    ],
  },
  {
    id: "grp_aerial_lift", label: "고소작업대", icon: "🪜",
    items: [
      { id: "eq_scissors_lift", label: "시저 리프트",           legacyType: "aerial_lift" },
      { id: "eq_boom_lift",     label: "붐 리프트",             legacyType: "aerial_lift" },
      { id: "eq_gondola",       label: "곤돌라",                 legacyType: "aerial_lift" },
      { id: "eq_sky_lift",      label: "차량탑재형 고소작업대(스카이)", legacyType: "truck" },
    ],
  },
  {
    id: "grp_crane", label: "크레인", icon: "🏗",
    items: [
      { id: "eq_tower_crane",  label: "타워크레인",   legacyType: "crane" },
      { id: "eq_mobile_crane", label: "이동식크레인", legacyType: "crane" },
      { id: "eq_cargo_crane",  label: "카고크레인",   legacyType: "crane" },
    ],
  },
  {
    id: "grp_concrete_pump", label: "콘크리트펌프카", icon: "🪣",
    items: [
      { id: "eq_pump_car", label: "콘크리트펌프카", legacyType: "concrete_pump" },
    ],
  },
  {
    id: "grp_pile_driver", label: "항타기", icon: "🔨",
    items: [
      { id: "eq_pile_driver", label: "항타기/항발기", legacyType: "pile_driver" },
      { id: "eq_borer",       label: "천공기/오거",   legacyType: "pile_driver" },
    ],
  },
  {
    id: "grp_forklift", label: "지게차", icon: "🔩",
    items: [
      { id: "eq_forklift", label: "지게차", legacyType: "forklift" },
    ],
  },
  {
    id: "grp_loader", label: "로더", icon: "🏗️",
    items: [
      { id: "eq_loader", label: "로더", legacyType: "loader" },
    ],
  },
  {
    id: "grp_roller", label: "롤러", icon: "🛞",
    items: [
      { id: "eq_roller", label: "롤러", legacyType: "roller" },
    ],
  },
];

/** 전체 장비 flat map (id → item) */
export const EQUIPMENT_MAP: Record<string, EquipmentItem> = (() => {
  const m: Record<string, EquipmentItem> = {};
  for (const grp of EQUIPMENT_GROUPS) {
    for (const item of grp.items) {
      m[item.id] = item;
    }
  }
  return m;
})();

/** EQUIPMENT_GROUPS_DISPLAY = EQUIPMENT_GROUPS (중복 표시 불필요) */
export const EQUIPMENT_GROUPS_DISPLAY: EquipmentGroup[] = EQUIPMENT_GROUPS;

// ══════════════════════════════════════════════════════════════════
// 작업속성 / 위험속성
// ══════════════════════════════════════════════════════════════════
export interface WorkAttribute { id: string; label: string }
export interface RiskAttribute  { id: string; label: string; color?: string }

export const WORK_ATTRIBUTES: WorkAttribute[] = [
  { id: "wa_설치", label: "설치" },
  { id: "wa_해체", label: "해체" },
  { id: "wa_운반", label: "운반" },
  { id: "wa_하역", label: "하역" },
  { id: "wa_인양", label: "인양" },
  { id: "wa_양중", label: "양중" },
  { id: "wa_굴착", label: "굴착" },
  { id: "wa_발파", label: "발파" },
  { id: "wa_타설", label: "타설" },
  { id: "wa_천공", label: "천공" },
  { id: "wa_항타", label: "항타" },
  { id: "wa_조립", label: "조립" },
  { id: "wa_보강", label: "보강" },
];

export const RISK_ATTRIBUTES: RiskAttribute[] = [
  { id: "ra_야간",    label: "야간",    color: "#6366f1" },
  { id: "ra_휴일",    label: "휴일",    color: "#8b5cf6" },
  { id: "ra_개구부",  label: "개구부",  color: "#f59e0b" },
  { id: "ra_밀폐공간", label: "밀폐공간", color: "#ef4444" },
  { id: "ra_정전",    label: "정전",    color: "#ef4444" },
  { id: "ra_활선",    label: "활선",    color: "#dc2626" },
  { id: "ra_중량물",  label: "중량물",  color: "#f97316" },
  { id: "ra_고소작업", label: "고소작업", color: "#f59e0b" },
  { id: "ra_협소공간", label: "협소공간", color: "#78716c" },
  { id: "ra_인접작업", label: "인접작업", color: "#0ea5e9" },
  { id: "ra_해체작업", label: "해체작업", color: "#dc2626" },
];

// ══════════════════════════════════════════════════════════════════
// 헬퍼 함수
// ══════════════════════════════════════════════════════════════════
export function getCategoryById(id: string): WPCategory | undefined {
  return WORK_CATEGORIES.find((c) => c.id === id);
}

export function getSubcategoryById(id: string): WPSubcategory | undefined {
  return WORK_SUBCATEGORIES.find((s) => s.id === id);
}

export function getSubcategoriesByCategoryId(catId: string): WPSubcategory[] {
  return WORK_SUBCATEGORIES.filter((s) => s.categoryId === catId);
}

/** 새 equipment IDs → 기존 legacyType 목록 (section 생성용) */
export function toLegacyEquipmentTypes(equipmentIds: string[]): string[] {
  const types = new Set<string>();
  for (const id of equipmentIds) {
    const item = EQUIPMENT_MAP[id];
    if (item?.legacyType) types.add(item.legacyType);
  }
  return Array.from(types);
}

/** subcategoryId → 기존 PlanCategory 문자열 */
export function toLegacyPlanCategory(subcategoryId: string): string {
  const mapping: Record<string, string> = {
    sub_1_1: "construction_equipment", sub_1_2: "general",       sub_1_3: "lifting",
    sub_2_1: "lifting",                sub_2_2: "lifting",        sub_2_3: "lifting",       sub_2_4: "lifting",
    sub_3_1: "construction_equipment", sub_3_2: "construction_equipment", sub_3_3: "construction_equipment",
    sub_3_4: "excavation",             sub_3_5: "excavation",
    sub_4_1: "working_at_height",      sub_4_2: "working_at_height", sub_4_3: "working_at_height", sub_4_4: "working_at_height",
    sub_5_1: "construction_equipment", sub_5_2: "construction_equipment", sub_5_3: "construction_equipment",
    sub_6_1: "construction_equipment", sub_6_2: "construction_equipment", sub_6_3: "construction_equipment",
    sub_7_1: "general",                sub_7_2: "general",        sub_7_3: "general",       sub_7_4: "general",
    sub_8_1: "general",                sub_8_2: "general",        sub_8_3: "confined_space", sub_8_4: "general",
    sub_9_1: "hot_work",               sub_9_2: "hot_work",       sub_9_3: "confined_space",
    sub_9_4: "working_at_height",      sub_9_5: "general",
    // 제38조
    sub_10_1: "lifting",               sub_10_2: "construction_equipment", sub_10_3: "construction_equipment",
    sub_10_4: "general",               sub_10_5: "hot_work",      sub_10_6: "excavation",
    sub_10_7: "excavation",            sub_10_8: "general",       sub_10_9: "excavation",
    sub_10_10: "general",              sub_10_11: "lifting",      sub_10_12: "general",
    sub_10_13: "general",
    // 기타
    sub_11_1: "general",
  };
  return mapping[subcategoryId] ?? "general";
}

/** 선택 요약 텍스트 생성 */
export function buildSelectionSummary(
  categoryId: string,
  subcategoryId: string,
  equipmentIds: string[],
  workAttrIds: string[],
  riskAttrIds: string[],
): string {
  const sub = getSubcategoryById(subcategoryId);
  if (!sub) return "분류 미선택";
  const eqLabels = equipmentIds.map((id) => EQUIPMENT_MAP[id]?.label ?? id);
  const parts = [sub.num + " " + sub.label];
  if (eqLabels.length > 0) parts.push(eqLabels.join("·"));
  if (workAttrIds.length > 0) parts.push(workAttrIds.map((id) => WORK_ATTRIBUTES.find((a) => a.id === id)?.label ?? "").join(" "));
  if (riskAttrIds.length > 0) parts.push(riskAttrIds.map((id) => RISK_ATTRIBUTES.find((a) => a.id === id)?.label ?? "").join(" "));
  return parts.join(" | ");
}
