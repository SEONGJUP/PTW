import type { SafetyCardDocument } from "@/types/safetyCardTypes";

const now = new Date().toISOString();
const today = new Date().toISOString().split("T")[0];

const base = (overrides: Partial<SafetyCardDocument>): SafetyCardDocument => ({
  id: `sample-${Math.random().toString(36).slice(2, 8)}`,
  title: "",
  status: "draft",
  mode: "formal",
  common: {
    title: "",
    documentDate: today,
    partnerCompany: "주식회사 안전시공",
    location: "서울특별시 강남구 현장",
    startDate: today,
    endDate: today,
    includeTime: false,
    siteName: "강남 신축 공사 현장",
    writer: "홍길동",
  },
  selectedLegalWorkPlanTypes: [],
  selectedRiskAttributes: [],
  selectedEquipmentTypes: [],
  recommendedLegalWorkPlanTypes: [],
  recommendedRiskAttributes: [],
  enabledSections: ["overview", "detailedTasks", "workers", "environment", "riskAssessment", "safetyInspection", "safetyTraining", "emergencyContact", "preventionMeasures", "approvals"],
  detailedTasks: [],
  workers: [],
  environment: { weather: "맑음", temperature: "20", ventilation: "양호", brightness: "밝음", noiseLevel: "보통", safetyStatus: "양호", accessRoad: "양호", details: "" },
  heavyLoad: { loadName: "", loadWeight: "", handlingMethod: "", equipment: "", hazards: "", controls: "" },
  equipments: [],
  riskAssessments: [],
  safetyInspections: [],
  safetyTrainings: [],
  emergencyContacts: [
    { id: "ec1", role: "현장 소장", name: "김현장", phone: "010-1234-5678", organization: "주식회사 안전시공", note: "" },
    { id: "ec2", role: "안전 관리자", name: "이안전", phone: "010-2345-6789", organization: "주식회사 안전시공", note: "" },
    { id: "ec3", role: "119", name: "소방서", phone: "119", organization: "소방서", note: "" },
  ],
  preventionMeasures: { fall: "", overturn: "", fallingObject: "", entanglement: "", collapse: "", electrocution: "", fireExplosion: "", suffocation: "", accessControl: "", other: "" },
  attachmentUrls: [],
  drawings: [],
  approvals: [
    { id: "ap1", step: 1, role: "작성자", approverName: "홍길동", department: "시공팀", status: "pending", requestedAt: now },
    { id: "ap2", step: 2, role: "검토자", approverName: "김검토", department: "안전팀", status: "pending" },
    { id: "ap3", step: 3, role: "승인자", approverName: "박승인", department: "현장소장", status: "pending" },
  ],
  reviewResults: [],
  calculationResults: [],
  legalSectionData: {},
  riskAttributeSectionData: {},
  equipmentSectionData: {},
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

export const sampleSafetyCards: SafetyCardDocument[] = [
  base({
    id: "sample-hotwork",
    title: "용접·용단 화기작업 안전카드",
    common: { title: "용접·용단 화기작업 안전카드", documentDate: today, partnerCompany: "주식회사 안전시공", location: "B동 3층 기계실", startDate: today, endDate: today, includeTime: true, startTime: "09:00", endTime: "17:00", siteName: "강남 신축 공사 현장", writer: "홍길동" },
    selectedRiskAttributes: ["hotWork"],
    selectedEquipmentTypes: ["weldingMachine", "cutter"],
    detailedTasks: [
      { id: "t1", taskType: "용접", content: "H형강 접합부 아크용접", location: "B동 3층", manager: "홍길동", sequence: 1, relatedLegalWorkPlanTypes: [], relatedRiskAttributes: ["hotWork"], relatedEquipments: ["weldingMachine"], hazards: ["화재", "화상", "유해가스"], controls: ["소화기 배치", "화재감시자 지정", "방진마스크 착용"], relatedRiskAssessmentIds: [], relatedInspectionIds: [], relatedTrainingIds: [] },
    ],
    riskAssessments: [
      { id: "ra1", process: "용접작업", unitTask: "아크 용접", hazard: "스패터 비산으로 인한 화재", accidentType: "화재", currentControl: "소화기 비치", improvement: "불티 비산방지포 추가 설치", riskLevel: "high", focusManagement: true, source: "작업유형별 추천", editable: true, sources: ["화기작업 추천"], note: "" },
    ],
    safetyInspections: [
      { id: "si1", item: "소화기 충전 상태 확인", result: "good", action: "", responsiblePerson: "홍길동", checkedAt: today, source: "작업유형별 추천", editable: true, sources: ["화기작업 추천"], relatedWorkTypes: [], relatedRiskAttributes: ["hotWork"], relatedEquipments: ["weldingMachine"], note: "" },
      { id: "si2", item: "인화성 물질 격리 확인", result: "good", action: "", responsiblePerson: "홍길동", checkedAt: today, source: "작업유형별 추천", editable: true, sources: [], relatedWorkTypes: [], relatedRiskAttributes: ["hotWork"], relatedEquipments: [], note: "" },
    ],
  }),

  base({
    id: "sample-crane",
    title: "크레인 양중작업 안전카드",
    common: { title: "크레인 양중작업 안전카드", documentDate: today, partnerCompany: "주식회사 안전시공", location: "지하 1층 장비 반입구", startDate: today, endDate: today, includeTime: false, siteName: "강남 신축 공사 현장", writer: "홍길동" },
    selectedLegalWorkPlanTypes: ["heavyLoad"],
    selectedEquipmentTypes: ["mobileCrane"],
    detailedTasks: [
      { id: "t1", taskType: "중량물 인양", content: "H형강 8ton 인양 및 설치", location: "지하 1층", manager: "홍길동", sequence: 1, relatedLegalWorkPlanTypes: ["heavyLoad"], relatedRiskAttributes: [], relatedEquipments: ["mobileCrane"], hazards: ["중량물 낙하", "협착", "줄걸이 파단"], controls: ["정격하중 검토", "신호수 배치", "줄걸이 점검"], relatedRiskAssessmentIds: [], relatedInspectionIds: [], relatedTrainingIds: [] },
    ],
    heavyLoad: { loadName: "H형강", loadWeight: "8", handlingMethod: "크레인 인양", equipment: "이동식 크레인 25ton", hazards: "낙하, 협착", controls: "신호수 배치, 작업반경 통제" },
    calculationResults: [
      { type: "craneLoad", label: "크레인 정격하중 검토", value: 75.2, unit: "%", status: "safe", details: { 양중물중량: 8, 정격총하중: 12, 훅블록중량: 0.3, 달기기구중량: 0.2, 총인양하중: 9.02, 사용률: 75.2 }, calculatedAt: now },
    ],
  }),

  base({
    id: "sample-excavation",
    title: "굴착기 굴착작업 안전카드",
    common: { title: "굴착기 굴착작업 안전카드", documentDate: today, partnerCompany: "주식회사 안전시공", location: "A구역 지하 굴착부", startDate: today, endDate: today, includeTime: false, siteName: "강남 신축 공사 현장", writer: "홍길동" },
    selectedLegalWorkPlanTypes: ["constructionMachine", "excavation"],
    selectedEquipmentTypes: ["excavator"],
    detailedTasks: [
      { id: "t1", taskType: "굴착", content: "지하 2층 터파기 굴착 (깊이 2.5m)", location: "A구역", manager: "홍길동", sequence: 1, relatedLegalWorkPlanTypes: ["excavation", "constructionMachine"], relatedRiskAttributes: [], relatedEquipments: ["excavator"], hazards: ["토사 붕괴", "매설물 파손", "굴착기 전도"], controls: ["흙막이 설치", "매설물 사전 확인", "신호수 배치"], relatedRiskAssessmentIds: [], relatedInspectionIds: [], relatedTrainingIds: [] },
    ],
  }),

  base({
    id: "sample-confined-hot",
    title: "밀폐공간 화기작업 안전카드",
    common: { title: "밀폐공간 화기작업 안전카드", documentDate: today, partnerCompany: "주식회사 안전시공", location: "지하 저수조 내부", startDate: today, endDate: today, includeTime: true, startTime: "08:00", endTime: "12:00", siteName: "강남 신축 공사 현장", writer: "홍길동" },
    selectedRiskAttributes: ["confinedSpace", "hotWork"],
    selectedEquipmentTypes: ["gasDetector", "ventilationFan", "weldingMachine"],
    detailedTasks: [
      { id: "t1", taskType: "용접 보수", content: "저수조 내부 배관 용접 보수", location: "지하 저수조", manager: "홍길동", sequence: 1, relatedLegalWorkPlanTypes: [], relatedRiskAttributes: ["confinedSpace", "hotWork"], relatedEquipments: ["weldingMachine", "gasDetector"], hazards: ["산소결핍", "유해가스 중독", "화재"], controls: ["가스 측정 후 입장", "환기 실시", "소화기 배치", "감시인 배치"], relatedRiskAssessmentIds: [], relatedInspectionIds: [], relatedTrainingIds: [] },
    ],
  }),

  base({
    id: "sample-aerial",
    title: "고소작업대 작업 안전카드",
    common: { title: "고소작업대 작업 안전카드", documentDate: today, partnerCompany: "주식회사 안전시공", location: "외벽 마감 구간 8m", startDate: today, endDate: today, includeTime: false, siteName: "강남 신축 공사 현장", writer: "홍길동" },
    selectedLegalWorkPlanTypes: ["vehicleHandling"],
    selectedRiskAttributes: ["heightWork"],
    selectedEquipmentTypes: ["aerialLift"],
    detailedTasks: [
      { id: "t1", taskType: "외벽 마감", content: "고소작업대 이용 외벽 마감재 시공 (8m)", location: "외벽 B구간", manager: "홍길동", sequence: 1, relatedLegalWorkPlanTypes: ["vehicleHandling"], relatedRiskAttributes: ["heightWork"], relatedEquipments: ["aerialLift"], hazards: ["추락", "고소작업대 전도"], controls: ["안전대 착용 및 체결", "작업발판 고정", "하부 출입통제"], relatedRiskAssessmentIds: [], relatedInspectionIds: [], relatedTrainingIds: [] },
    ],
  }),
];
