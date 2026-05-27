import type { SectionConfig } from "@/types/safetyCardTypes";

export const sectionConfigs: SectionConfig[] = [
  // 공통 섹션
  { id: "overview", label: "작업 개요", group: "common", required: true, icon: "📋" },
  { id: "detailedTasks", label: "세부 작업 목록", group: "common", required: true, icon: "📝" },
  { id: "workSteps", label: "작업순서 및 작업방법", group: "common", required: false, icon: "🔢" },
  { id: "workers", label: "작업 인원 배치", group: "common", required: false, icon: "👥" },
  { id: "environment", label: "작업환경", group: "common", required: false, icon: "🌤" },
  { id: "heavyLoad", label: "중량물 취급", group: "common", required: false, icon: "🏋" },
  { id: "equipments", label: "사용 장비 정보", group: "common", required: false, icon: "🚜" },
  { id: "riskAssessment", label: "위험성평가", group: "review", required: false, icon: "⚠" },
  { id: "safetyInspection", label: "안전점검", group: "review", required: false, icon: "✅" },
  { id: "safetyTraining", label: "안전교육", group: "review", required: false, icon: "📚" },
  { id: "emergencyContact", label: "비상연락망", group: "common", required: false, icon: "📞" },
  { id: "preventionMeasures", label: "재해예방 대책", group: "common", required: false, icon: "🛡" },
  { id: "preSurvey", label: "사전조사 기록", group: "common", required: false, icon: "🔍" },
  { id: "drawings", label: "도면", group: "attachment", required: false, icon: "🗺" },
  { id: "attachments", label: "기타 첨부파일", group: "attachment", required: false, icon: "📎" },
  { id: "approvals", label: "서명 및 결재", group: "attachment", required: false, icon: "✍" },

  // 법정 섹션 (타워크레인)
  { id: "towerCranePlan", label: "타워크레인 작업계획", group: "legal", required: false, icon: "🏗" },
  { id: "supportMethod", label: "지지방법", group: "legal", required: false },
  { id: "windCheck", label: "풍속 확인", group: "legal", required: false },

  // 법정 섹션 (굴착)
  { id: "excavationPlan", label: "굴착계획", group: "legal", required: false, icon: "⛏" },
  { id: "retainingWall", label: "흙막이 지보공", group: "legal", required: false },
  { id: "undergroundSurvey", label: "매설물 확인", group: "legal", required: false },

  // 법정 섹션 (해체)
  { id: "demolitionPlan", label: "해체 계획", group: "legal", required: false, icon: "🔨" },
  { id: "demolitionOrder", label: "해체 순서", group: "legal", required: false },

  // 법정 섹션 (전기)
  { id: "lotoProcedure", label: "LOTO 절차", group: "legal", required: false, icon: "🔐" },
  { id: "electricalIsolation", label: "전로차단 작업계획", group: "legal", required: false },

  // 고위험 속성 섹션
  { id: "fallPrevention", label: "추락방지 계획", group: "riskAttribute", required: false, icon: "⬇" },
  { id: "hotWorkPermit", label: "화기작업 허가", group: "riskAttribute", required: false, icon: "🔥" },
  { id: "confinedSpacePlan", label: "밀폐공간 작업계획", group: "riskAttribute", required: false, icon: "🕳" },
  { id: "trafficControlPlan", label: "교통통제 계획", group: "riskAttribute", required: false, icon: "🚦" },

  // 장비별 섹션
  { id: "craneMachineSpec", label: "크레인 기계 제원", group: "equipment", required: false, icon: "🏗" },
  { id: "craneGroundCheck", label: "하부지반 지지력 확인", group: "equipment", required: false },
  { id: "craneLiftCondition", label: "인양 작업 조건", group: "equipment", required: false },
  { id: "craneRigging", label: "달기기구 종류 및 수량", group: "equipment", required: false },
  { id: "craneSwing", label: "선회 반경 내 장애물", group: "equipment", required: false },
  { id: "craneSignal", label: "신호 방법 및 신호수 배치", group: "equipment", required: false },
  { id: "craneLiftCalc", label: "정격하중 자동계산", group: "equipment", required: false },
  { id: "craneChecklist", label: "크레인 사전 점검표", group: "equipment", required: false },
];

export const DEFAULT_ENABLED_SECTIONS = [
  "overview", "detailedTasks", "workers", "environment",
  "riskAssessment", "safetyInspection", "safetyTraining",
  "emergencyContact", "preventionMeasures", "approvals",
];
