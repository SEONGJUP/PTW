// SafetyCard Document Types

export type DocumentStatus =
  | "draft"
  | "completed"
  | "approvalRequested"
  | "inReview"
  | "revisionRequested"
  | "approved"
  | "posted"
  | "rejected";

export type DocumentMode = "formal" | "simple" | "custom";

export type ReviewSeverity = "INFO" | "WARNING" | "DANGER";
export type ReviewType =
  | "LEGAL" | "SAFETY" | "LOAD" | "COMPLETION" | "ENVIRONMENT"
  | "EQUIPMENT" | "TRAINING" | "INSPECTION" | "RISK_ASSESSMENT"
  | "DUPLICATE_MERGE" | "APPROVAL";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "revisionRequested";
export type InspectionResult = "good" | "bad" | "notApplicable" | "pending";
export type DataSource = string;

export interface ReviewResult {
  id: string;
  type: ReviewType;
  severity: ReviewSeverity;
  title: string;
  message: string;
  relatedSection?: string;
  relatedFields?: string[];
  requiredAction?: string;
  isBlocking: boolean;
  sources?: string[];
}

export interface ApprovalStep {
  id: string;
  step: number;
  role: "작성자" | "검토자" | "승인자";
  approverName: string;
  department?: string;
  status: ApprovalStatus;
  opinion?: string;
  signedAt?: string;
  requestedAt?: string;
}

export interface DocumentCommon {
  title: string;
  documentDate: string;
  partnerCompany: string;
  location: string;
  startDate: string;
  endDate: string;
  includeTime: boolean;
  startTime?: string;
  endTime?: string;
  siteName: string;
  writer: string;
  writerSignature?: string;
}

export interface DetailedTask {
  id: string;
  taskType: string;
  content: string;
  location: string;
  manager: string;
  sequence: number;
  relatedLegalWorkPlanTypes: string[];
  relatedRiskAttributes: string[];
  relatedEquipments: string[];
  hazards: string[];
  controls: string[];
  relatedRiskAssessmentIds: string[];
  relatedInspectionIds: string[];
  relatedTrainingIds: string[];
}

export interface RiskAssessment {
  id: string;
  process: string;
  unitTask: string;
  hazard: string;
  accidentType: string;
  currentControl: string;
  improvement: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  focusManagement: boolean;
  source: DataSource;
  sourceId?: string;
  editable: boolean;
  sources: string[];
  note: string;
}

export interface SafetyInspectionItem {
  id: string;
  item: string;
  result: InspectionResult;
  action: string;
  responsiblePerson: string;
  checkedAt: string;
  source: DataSource;
  sourceId?: string;
  editable: boolean;
  sources: string[];
  relatedWorkTypes: string[];
  relatedRiskAttributes: string[];
  relatedEquipments: string[];
  note: string;
}

export interface SafetyTraining {
  id: string;
  trainingType: string;
  trainingSubType: string;
  trainingDate: string;
  trainingHours: number;
  instructor: string;
  targetWorkers: string;
  completedCount: number;
  incompleteCount: number;
  content: string;
  relatedLegalWorkPlanTypes: string[];
  relatedRiskAttributes: string[];
  relatedEquipments: string[];
  source: DataSource;
  sourceId?: string;
  editable: boolean;
  sources: string[];
  attachmentUrl?: string;
  note: string;
}

export interface EmergencyContact {
  id: string;
  role: string;
  name: string;
  phone: string;
  organization: string;
  note: string;
}

export interface PreventionMeasure {
  fall: string;
  overturn: string;
  fallingObject: string;
  entanglement: string;
  collapse: string;
  electrocution: string;
  fireExplosion: string;
  suffocation: string;
  accessControl: string;
  other: string;
}

export interface WorkEnvironment {
  weather: string;
  temperature: string;
  ventilation: string;
  brightness: string;
  noiseLevel: string;
  safetyStatus: string;
  accessRoad: string;
  details: string;
}

export interface WorkerInfo {
  id: string;
  name: string;
  contact: string;
  organization: string;
  role: string;
  qualification: string;
  additionalInfo: string;
}

export interface HeavyLoadInfo {
  loadName: string;
  loadWeight: string;
  handlingMethod: string;
  equipment: string;
  hazards: string;
  controls: string;
}

export interface EquipmentInfo {
  id: string;
  equipmentType: string;
  machineName: string;
  maker: string;
  regNo: string;
  capacity: string;
  year: string;
  note: string;
}

export interface CalculationResult {
  type: "craneLoad" | "excavation" | "other";
  label: string;
  value: number;
  unit: string;
  status: "safe" | "caution" | "danger";
  details: Record<string, number | string>;
  calculatedAt: string;
}

export interface SafetyCardDocument {
  id: string;
  title: string;
  status: DocumentStatus;
  mode: DocumentMode;
  common: DocumentCommon;
  selectedLegalWorkPlanTypes: string[];
  selectedRiskAttributes: string[];
  selectedEquipmentTypes: string[];
  recommendedLegalWorkPlanTypes: string[];
  recommendedRiskAttributes: string[];
  enabledSections: string[];
  detailedTasks: DetailedTask[];
  workers: WorkerInfo[];
  environment: WorkEnvironment;
  heavyLoad: HeavyLoadInfo;
  equipments: EquipmentInfo[];
  riskAssessments: RiskAssessment[];
  safetyInspections: SafetyInspectionItem[];
  safetyTrainings: SafetyTraining[];
  emergencyContacts: EmergencyContact[];
  preventionMeasures: PreventionMeasure;
  attachmentUrls: string[];
  drawings: string[];
  approvals: ApprovalStep[];
  reviewResults: ReviewResult[];
  calculationResults: CalculationResult[];
  safetyCardSnapshot?: SafetyCardDocument;
  legalSectionData: Record<string, Record<string, unknown>>;
  riskAttributeSectionData: Record<string, Record<string, unknown>>;
  equipmentSectionData: Record<string, Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
  savedAt?: string;
  completedAt?: string;
  completedBy?: string;
  approvalRequestedAt?: string;
  approvedAt?: string;
  postedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export interface LegalWorkPlanTypeConfig {
  id: string;
  label: string;
  category: string;
  legalBasisText: string;
  description: string;
  activationCondition?: string;
  requiredSections: string[];
  defaultHazards: string[];
  defaultControls: string[];
  requiredRoles: string[];
  recommendedInspections: string[];
  recommendedTrainings: string[];
  icon: string;
}

export interface RiskWorkAttributeConfig {
  id: string;
  label: string;
  description: string;
  sections: string[];
  defaultHazards: string[];
  defaultControls: string[];
  recommendedInspections: string[];
  recommendedTrainings: string[];
  icon: string;
}

export interface EquipmentTypeConfig {
  id: string;
  label: string;
  category: string;
  description: string;
  defaultLegalWorkPlanTypes: string[];
  defaultRiskAttributes: string[];
  requiredFields: string[];
  specificSections: string[];
  inspectionItems: string[];
  trainingRecommendations: string[];
  icon: string;
}

export interface SectionConfig {
  id: string;
  label: string;
  group: "common" | "legal" | "riskAttribute" | "equipment" | "review" | "attachment";
  required: boolean;
  description?: string;
  icon?: string;
}

export interface ImportFilter {
  type?: string;
  keyword?: string;
  site?: string;
  partnerCompany?: string;
  workType?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}

export interface ValidationIssue {
  field: string;
  section: string;
  severity: "error" | "warning";
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
}
