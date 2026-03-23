"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type WorkPermitType =
  | "general"           // 일반작업
  | "hot_work"          // 화기작업
  | "electrical"        // 전기작업
  | "working_at_height" // 고소작업
  | "excavation"        // 굴착작업
  | "confined_space"    // 밀폐공간작업
  | "heavy_load"        // 중량물작업
  | "night_overtime"    // 야간·조출·휴일 작업
  | "short_time";       // 단시간 작업

export type WorkPermitStatus = "draft" | "pending" | "approved" | "conditionally_approved" | "rejected" | "completed" | "expired";
export type PermitApprovalDecision = "approved" | "conditionally_approved" | "rejected";
export type PermitSignatureStatus = "pending" | "signed" | "rejected";

export const WORK_PERMIT_TYPE_LABELS: Record<WorkPermitType, string> = {
  general: "일반작업 허가서",
  hot_work: "화기작업 허가서",
  electrical: "전기작업 허가서",
  working_at_height: "고소작업 허가서",
  excavation: "굴착작업 허가서",
  confined_space: "밀폐공간작업 허가서",
  heavy_load: "중량물작업 허가서",
  night_overtime: "야간·조출·휴일 작업허가서",
  short_time: "단시간 작업허가서",
};

export const WORK_PERMIT_TYPE_ICONS: Record<WorkPermitType, string> = {
  general: "📋",
  hot_work: "🔥",
  electrical: "⚡",
  working_at_height: "🏗️",
  excavation: "⛏️",
  confined_space: "🚪",
  heavy_load: "🏋️",
  night_overtime: "🌙",
  short_time: "⏱️",
};

export const WORK_PERMIT_STATUS_LABELS: Record<WorkPermitStatus, string> = {
  draft: "초안",
  pending: "승인 대기",
  approved: "승인됨",
  conditionally_approved: "조건부 승인",
  rejected: "반려됨",
  completed: "작업 완료",
  expired: "만료됨",
};

// 법정 의무 허가 유형 (고용노동부훈령 제488호 제9조5항)
export const LEGALLY_REQUIRED_PERMIT_TYPES: WorkPermitType[] = [
  "electrical", "confined_space", "hot_work", "working_at_height",
];

// 유형별 안전 체크리스트 (참고자료 기반)
export const PERMIT_SAFETY_CHECKLIST: Record<WorkPermitType, string[]> = {
  general: [
    // "작업 구역 구획 및 표지판 설치" → COMMON_SAFETY_MEASURES의 "작업구역 설정 (출입경고 표지)"와 동일, 공통으로 통일
    "개인보호구 지급 및 착용 확인",
    "작업 전 TBM(Tool Box Meeting) 실시",
    "비상연락망 공유 완료",
    "작업허가서 게시 여부",
    "작업장 정리정돈 여부",
  ],
  hot_work: [
    "가연성 가스농도 측정 유무",
    "불꽃 비산 방지조치(방지포) 설치 유무",
    "화기감시자·소화장비 배치 유무",
    "역화·전격방지기 이상 유무",
    "압력조정기 부착 및 이상 유무",
    "주위 가연물 제거 유무",
  ],
  electrical: [
    // "작업안내 표지판 설치 유무" → COMMON의 "작업구역 설정 (출입경고 표지)"로 통일
    "작업자 자격여부 확인",
    "시건(Lockout) 확인",
    "접지 및 방전 유무",
    "정전작업 전로 개폐 시건 유무",
    "주전원 차단 유무 (활선작업)",
  ],
  working_at_height: [
    "2인 1조 작업 유무",
    "추락위험 방호망 설치 상태",
    "이동식 비계 안전인증 유무",
    "안전모·안전대(2m 이상) 착용 상태",
    "안전난간대 설치(90cm 이상)",
    "사다리 아우트리거 설치 유무",
  ],
  excavation: [
    "매설배관 파악 유무(도면 확인)",
    "출입금지 구역 설정 및 바리케이드 설치",  // 기존 "출입금지 표지판 설치 유무" + "작업장 주변 바리케이드 설치" 통일
    "매설전선 전원 차단 여부",
    "제어용 케이블 안전성 유무",
    "연락수단 적정 유무",
  ],
  confined_space: [
    "산소농도 측정 (18%~23.5%)",
    "2인 1조 작업 유무",                   // working_at_height와 동일 → buildMergedChecklist의 Set dedup 처리
    "환기 및 배기장치 가동 유무",
    "출입금지 구역 설정 및 바리케이드 설치", // excavation과 통일
    "호흡용 보호구 착용 유무",
    "작업지휘자 배치 유무",
  ],
  heavy_load: [
    "감독자 지정 및 상주 유무",
    "로프 상태 확인 (파단·소손)",
    "작업 신호수 배치 유무",
    "적재물 이동경로 적정성 확인",
    "출입금지 구역 설정 및 바리케이드 설치", // 기존 "관계자 외 출입통제 조치"를 동일 표현으로 통일
    "적재 중량 초과 유무",
  ],
  night_overtime: [
    "야간·조출·휴일 작업 승인 여부 확인",
    "작업지휘자·관리자 안전기준 숙지",
    "조명 및 시야 확보 상태 확인",
    "건설장비 법적 방호장치 설치",
    "위험요인 개선대책 수립",
    "비상연락체계 가동 여부",
  ],
  short_time: [
    "작업범위 및 시간 명확한 사전 공유",
    "작업지휘자 지정 유무",
    "보호구 착용 상태 확인",
    "위험요인 사전 파악 및 통보",
    "작업 완료 후 현장 복구 확인",
  ],
};

// 공통 안전조치 항목 (모든 유형에 공통)
export const COMMON_SAFETY_MEASURES: string[] = [
  "작업구역 설정 (출입경고 표지)",           // general의 "작업 구역 구획 및 표지판 설치", electrical의 "작업안내 표지판 설치 유무", night_overtime의 "안전표지판 설치" 통일
  "환기장비",
  "조명장비",
  "소화기",
  "안전장구",
  "안전교육 실시",
  "운전요원 입회",
  "MSDS 비치·교육, 비상대응요령 숙지",
];

// 유형별 특화 확인사항 기본 필드 정의
export const PERMIT_SPECIFICS_FIELDS: Record<string, { key: string; label: string }[]> = {
  general: [],
  hot_work: [
    { key: "welding_type",    label: "용접/절단 방식" },
    { key: "gas_type",        label: "사용 가스 종류" },
    { key: "permit_validity", label: "허가 유효기간" },
    { key: "fire_watch_name", label: "화기감시자 성명" },
  ],
  electrical: [
    { key: "circuit_location",  label: "차단 회로 위치 (제어실/현장)" },
    { key: "lockout_confirmed", label: "시건(Lockout) 확인자" },
    { key: "voltage_level",     label: "전압 등급" },
    { key: "restoration_time",  label: "전원복구 예정시간" },
  ],
  working_at_height: [
    { key: "max_height",        label: "최대 작업 높이(m)" },
    { key: "scaffold_type",     label: "발판/비계 종류" },
    { key: "permit_validity",   label: "허가 유효기간" },
    { key: "fall_net_installed",label: "추락방지망 설치 여부" },
  ],
  excavation: [
    { key: "excavation_depth",   label: "굴착 깊이(m)" },
    { key: "soil_type",          label: "토질 종류" },
    { key: "underground_utility",label: "매설물 확인 (가스·전기·통신)" },
    { key: "groundwater_level",  label: "지하수위" },
  ],
  confined_space: [
    { key: "space_name",          label: "밀폐공간 명칭/번호" },
    { key: "permit_validity",     label: "허가 유효기간" },
    { key: "communication_means", label: "통신수단" },
    { key: "rescue_equipment",    label: "구명장구 (줄, 송기마스크)" },
  ],
  heavy_load: [
    { key: "load_weight",      label: "중량물 중량(ton)" },
    { key: "load_dimensions",  label: "중량물 규격" },
    { key: "lifting_equipment",label: "양중 장비 종류" },
    { key: "movement_route",   label: "이동 경로" },
  ],
  night_overtime: [
    { key: "work_type_detail", label: "작업 구분 (야간/조출/휴일)" },
    { key: "supervisor_name",  label: "작업관리자/지휘자 성명" },
    { key: "team_count",       label: "작업팀 인원" },
    { key: "overtime_reason",  label: "야간/조출 사유" },
  ],
  short_time: [
    { key: "short_work_scope",  label: "작업 내용 및 범위" },
    { key: "supervisor_name",   label: "작업관리자 성명" },
    { key: "team_count",        label: "작업팀 인원" },
    { key: "planned_duration",  label: "예정 작업시간" },
    { key: "short_time_reason", label: "단시간 작업 사유" },
  ],
};

// 가스 측정 기준
export const GAS_STANDARDS: { type: string; unit: string; standard: string }[] = [
  { type: "O₂", unit: "%", standard: "18% 이상 23.5% 미만" },
  { type: "CO", unit: "ppm", standard: "30ppm 미만" },
  { type: "CO₂", unit: "%", standard: "1.5% 미만" },
  { type: "H₂S", unit: "ppm", standard: "10ppm 미만" },
  { type: "가연성가스", unit: "%LEL", standard: "하한치 10% 이하" },
];

export interface GasMeasurement {
  gasType: string;
  value: string;
  unit: string;
  standard: string;
  measuredAt: string;
  measuredBy: string;
  confirmedBy: string;
  pass: boolean;
}

// 5단계 서명 워크플로
export const PERMIT_SIGNATURE_STAGES: { stage: number; role: string; label: string; desc: string; icon: string }[] = [
  { stage: 1, role: "신청인", label: "작업 신청", desc: "작업내용 및 안전조치 계획 작성 후 서명", icon: "✍️" },
  { stage: 2, role: "현장확인자", label: "현장 확인", desc: "현장 안전조치 이행 여부 확인 후 서명", icon: "🔍" },
  { stage: 3, role: "발급자", label: "검토 및 발급", desc: "신청내용 검토 후 허가서 발급 서명", icon: "📝" },
  { stage: 4, role: "승인자", label: "최종 승인", desc: "최종 작업 허가 결재 (승인/조건부승인/반려)", icon: "✅" },
  { stage: 5, role: "완료확인자", label: "작업완료 확인", desc: "작업 무사종료 및 현장 복구 확인 서명", icon: "🏁" },
];

export interface PermitSignature {
  stage: number;
  role: string;
  name: string;
  department: string;
  position: string;
  comment: string;
  status: PermitSignatureStatus;
  signedAt: string;
}

export interface WorkPermit {
  id: string;
  type: WorkPermitType;        // 주 허가서 유형
  extraTypes: WorkPermitType[]; // 추가 허가서 유형 (복수선택)
  status: WorkPermitStatus;
  workPlanId?: string;
  workPlanTitle?: string;

  // 기타작업 직접입력 (type이 "general"이거나 별도 명시가 필요할 때)
  customTypeName: string;

  // 기본 정보
  title: string;
  siteName: string;
  location: string;
  contractor: string;
  requestedBy: string;
  requestedByDept: string;
  requestedByPosition: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  description: string;
  personnelCount: string;
  equipmentTypes: string[];      // 건설기계 9종 선택
  equipmentCustomList: string[]; // 기타 장비 직접입력 (복수)

  // 안전조치 요구사항 (공통)
  safetyMeasures: Record<string, boolean>;
  // 유형별 안전 체크리스트
  safetyChecklist: Record<string, string>; // "양호" | "불량" | "해당없음" | ""
  // 사용자 직접입력 체크항목 (기타작업 포함)
  customChecklistItems: string[];
  customTypeIds: string[];   // 사용자 정의 허가서 유형 선택
  ppeRequired: string[];
  additionalMeasures: string;

  // 유형별 특화 확인사항
  specifics: Record<string, string>;

  // 가스 측정 (밀폐공간/화기 시)
  gasMeasurements: GasMeasurement[];

  // 5단계 서명
  signatures: PermitSignature[];

  // 결재 결과
  approvalDecision: PermitApprovalDecision | "";
  approvalConditions: string;

  // 작업 완료
  completionNote: string;

  createdAt: string;
  updatedAt: string;
}

export interface PermitFavorite {
  id: string;
  name: string;
  type: WorkPermitType;
  prefillData: Partial<Pick<WorkPermit, "title" | "siteName" | "location" | "contractor" | "requestedBy" | "requestedByDept" | "requestedByPosition" | "description" | "personnelCount" | "additionalMeasures">>;
  customChecklist: string[];   // 사용자 추가 체크 항목
  createdAt: string;
}

export interface CustomPermitType {
  id: string;
  label: string;
  icon: string;
  desc: string;
  checklistItems: string[];
  specificFields: { key: string; label: string }[];
  createdAt: string;
}

export interface WorkPermitStore {
  permits: WorkPermit[];
  draftPermit: Partial<WorkPermit> | null;

  // 즐겨찾기
  permitFavorites: PermitFavorite[];
  savePermitFavorite: (name: string, type: WorkPermitType, permit?: WorkPermit) => void;
  deletePermitFavorite: (id: string) => void;
  renamePermitFavorite: (id: string, name: string) => void;
  overwritePermitFavorite: (id: string, permit: WorkPermit) => void;

  // 유형별 체크리스트 커스텀
  checklistOverrides: Record<string, string[]>;
  setChecklistOverride: (typeId: string, items: string[]) => void;
  resetChecklistOverride: (typeId: string) => void;

  // 사용자 정의 허가서 유형
  customPermitTypes: CustomPermitType[];
  addCustomPermitType: (data: Omit<CustomPermitType, 'id' | 'createdAt'>) => string;
  updateCustomPermitType: (id: string, data: Partial<CustomPermitType>) => void;
  deleteCustomPermitType: (id: string) => void;

  // 유형별 특화 확인사항 커스텀
  specificsOverrides: Record<string, { key: string; label: string }[]>;
  setSpecificsOverride: (typeId: string, fields: { key: string; label: string }[]) => void;
  resetSpecificsOverride: (typeId: string) => void;

  createPermit: (type: WorkPermitType, workPlanData?: Partial<WorkPermit>) => string;
  updatePermit: (id: string, data: Partial<WorkPermit>) => void;
  deletePermit: (id: string) => void;
  setPermitStatus: (id: string, status: WorkPermitStatus, reason?: string) => void;
  updateSignature: (permitId: string, stage: number, data: Partial<PermitSignature>) => void;
  updateGasMeasurement: (permitId: string, index: number, data: Partial<GasMeasurement>) => void;
  setDraft: (data: Partial<WorkPermit> | null) => void;
  getPermitsByWorkPlan: (workPlanId: string) => WorkPermit[];
}

function buildDefaultChecklist(type: WorkPermitType): Record<string, boolean> {
  return Object.fromEntries(
    PERMIT_SAFETY_CHECKLIST[type].map((item) => [item, false])
  );
}

export function buildMergedChecklist(types: WorkPermitType[]): Record<string, string> {
  const items = new Set<string>();
  for (const t of types) {
    for (const item of PERMIT_SAFETY_CHECKLIST[t]) items.add(item);
  }
  return Object.fromEntries([...items].map((item) => [item, ""]));
}

function buildDefaultSafetyMeasures(): Record<string, boolean> {
  return Object.fromEntries(COMMON_SAFETY_MEASURES.map((item) => [item, false]));
}

function buildDefaultGasMeasurements(): GasMeasurement[] {
  return GAS_STANDARDS.map((g) => ({
    gasType: g.type,
    value: "",
    unit: g.unit,
    standard: g.standard,
    measuredAt: "",
    measuredBy: "",
    confirmedBy: "",
    pass: false,
  }));
}

function buildDefaultSignatures(): PermitSignature[] {
  return PERMIT_SIGNATURE_STAGES.map((s) => ({
    stage: s.stage,
    role: s.role,
    name: "",
    department: "",
    position: "",
    comment: "",
    status: "pending",
    signedAt: "",
  }));
}

export const useWorkPermitStore = create<WorkPermitStore>()(
  persist(
    (set, get) => ({
      permits: [],
      draftPermit: null,
      permitFavorites: [],
      checklistOverrides: {},
      specificsOverrides: {},
      customPermitTypes: [],

      savePermitFavorite: (name, type, permit) => {
        const fav: PermitFavorite = {
          id: `pfav_${Date.now()}`,
          name,
          type,
          prefillData: permit ? {
            title: permit.title,
            siteName: permit.siteName,
            location: permit.location,
            contractor: permit.contractor,
            requestedBy: permit.requestedBy,
            requestedByDept: permit.requestedByDept,
            requestedByPosition: permit.requestedByPosition,
            description: permit.description,
            personnelCount: permit.personnelCount,
            additionalMeasures: permit.additionalMeasures,
          } : {},
          customChecklist: [],
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ permitFavorites: [...s.permitFavorites, fav] }));
      },

      deletePermitFavorite: (id) => {
        set((s) => ({ permitFavorites: s.permitFavorites.filter((f) => f.id !== id) }));
      },

      renamePermitFavorite: (id, name) => {
        set((s) => ({ permitFavorites: s.permitFavorites.map((f) => f.id === id ? { ...f, name } : f) }));
      },

      overwritePermitFavorite: (id, permit) => {
        set((s) => ({
          permitFavorites: s.permitFavorites.map((f) => f.id !== id ? f : {
            ...f,
            type: permit.type,
            prefillData: {
              title: permit.title, siteName: permit.siteName, location: permit.location,
              contractor: permit.contractor, requestedBy: permit.requestedBy,
              requestedByDept: permit.requestedByDept, requestedByPosition: permit.requestedByPosition,
              description: permit.description, personnelCount: permit.personnelCount,
              additionalMeasures: permit.additionalMeasures,
            },
            createdAt: new Date().toISOString(),
          }),
        }));
      },

      setChecklistOverride: (typeId, items) => {
        set((s) => ({ checklistOverrides: { ...s.checklistOverrides, [typeId]: items } }));
      },

      resetChecklistOverride: (typeId) => {
        set((s) => {
          const next = { ...s.checklistOverrides };
          delete next[typeId];
          return { checklistOverrides: next };
        });
      },

      addCustomPermitType: (data) => {
        const id = `cpt_${Date.now()}`;
        const newType: CustomPermitType = { ...data, id, createdAt: new Date().toISOString() };
        set((s) => ({ customPermitTypes: [...s.customPermitTypes, newType] }));
        return id;
      },
      updateCustomPermitType: (id, data) => {
        set((s) => ({ customPermitTypes: s.customPermitTypes.map((t) => t.id === id ? { ...t, ...data } : t) }));
      },
      deleteCustomPermitType: (id) => {
        set((s) => ({ customPermitTypes: s.customPermitTypes.filter((t) => t.id !== id) }));
      },
      setSpecificsOverride: (typeId, fields) => set((s) => ({ specificsOverrides: { ...s.specificsOverrides, [typeId]: fields } })),
      resetSpecificsOverride: (typeId) => set((s) => {
        const next = { ...s.specificsOverrides };
        delete next[typeId];
        return { specificsOverrides: next };
      }),

      createPermit: (type, workPlanData = {}) => {
        const id = `permit_${Date.now()}`;
        const now = new Date().toISOString();
        const _d = new Date();
        const defaultTitle = `${_d.getFullYear()}년 ${String(_d.getMonth()+1).padStart(2,"0")}월 ${String(_d.getDate()).padStart(2,"0")}일 작업허가서`;
        const extraTypes = (workPlanData as Partial<WorkPermit>).extraTypes ?? [];
        const allTypes = [type, ...extraTypes];
        const needsGas = allTypes.some((t) => t === "confined_space" || t === "hot_work");
        const permit: WorkPermit = {
          id,
          type,
          extraTypes,
          status: "draft",
          workPlanId: workPlanData.workPlanId ?? "",
          workPlanTitle: workPlanData.workPlanTitle ?? "",
          customTypeName: workPlanData.customTypeName ?? "",
          title: workPlanData.title ?? defaultTitle,
          siteName: workPlanData.siteName ?? "",
          location: workPlanData.location ?? "",
          contractor: workPlanData.contractor ?? "",
          requestedBy: workPlanData.requestedBy ?? "",
          requestedByDept: "",
          requestedByPosition: "",
          startDate: workPlanData.startDate ?? "",
          endDate: workPlanData.endDate ?? "",
          startTime: "",
          endTime: "",
          description: workPlanData.description ?? "",
          personnelCount: "",
          equipmentTypes: [],
          equipmentCustomList: [],
          safetyMeasures: buildDefaultSafetyMeasures(),
          safetyChecklist: buildMergedChecklist(allTypes),
          customChecklistItems: [],
          customTypeIds: [],
          ppeRequired: [],
          additionalMeasures: "",
          specifics: {},
          gasMeasurements: needsGas ? buildDefaultGasMeasurements() : [],
          signatures: buildDefaultSignatures(),
          approvalDecision: "",
          approvalConditions: "",
          completionNote: "",
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ permits: [...s.permits, permit] }));
        return id;
      },

      updatePermit: (id, data) => {
        set((s) => ({
          permits: s.permits.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deletePermit: (id) => {
        set((s) => ({ permits: s.permits.filter((p) => p.id !== id) }));
      },

      setPermitStatus: (id, status) => {
        set((s) => ({
          permits: s.permits.map((p) =>
            p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      updateSignature: (permitId, stage, data) => {
        set((s) => ({
          permits: s.permits.map((p) => {
            if (p.id !== permitId) return p;
            const sigs = p.signatures.map((sig) =>
              sig.stage === stage ? { ...sig, ...data } : sig
            );
            return { ...p, signatures: sigs, updatedAt: new Date().toISOString() };
          }),
        }));
      },

      updateGasMeasurement: (permitId, index, data) => {
        set((s) => ({
          permits: s.permits.map((p) => {
            if (p.id !== permitId) return p;
            const gm = [...p.gasMeasurements];
            gm[index] = { ...gm[index], ...data };
            return { ...p, gasMeasurements: gm, updatedAt: new Date().toISOString() };
          }),
        }));
      },

      setDraft: (data) => set({ draftPermit: data }),

      getPermitsByWorkPlan: (workPlanId) => {
        return get().permits.filter((p) => p.workPlanId === workPlanId);
      },
    }),
    {
      name: "ptw-work-permits",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as Storage)
      ),
    }
  )
);
