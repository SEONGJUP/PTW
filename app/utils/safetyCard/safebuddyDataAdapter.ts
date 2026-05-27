import type { SafetyCardDocument, RiskAssessment, SafetyInspectionItem, SafetyTraining } from "@/types/safetyCardTypes";
import { legalWorkPlanTypes, riskWorkAttributes, equipmentTypeConfigs } from "@/config/safetyCard";
import { mergeRiskAssessments, mergeInspectionItems, mergeTrainings } from "./safetyCardMergeUtils";

// Mock SafeBuddy adapter — generates rule-based data based on selected work types.
// In production this would call the SafeBuddy API.

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 7)}`;
}

export function fetchRecommendedRiskAssessments(doc: SafetyCardDocument): RiskAssessment[] {
  const all: RiskAssessment[] = [];

  doc.selectedLegalWorkPlanTypes.forEach((typeId) => {
    const config = legalWorkPlanTypes.find((t) => t.id === typeId);
    if (!config) return;
    config.defaultHazards.forEach((hazard, i) => {
      all.push({
        id: makeId("ra"),
        process: config.label,
        unitTask: `${config.label} 단위작업 ${i + 1}`,
        hazard,
        accidentType: "위험",
        currentControl: config.defaultControls[i] ?? "관리기준 준수",
        improvement: "",
        riskLevel: "medium",
        focusManagement: false,
        source: `법정작업(${config.label})`,
        editable: true,
        sources: [`법정작업(${config.label})`],
        note: "",
      });
    });
  });

  doc.selectedRiskAttributes.forEach((attrId) => {
    const config = riskWorkAttributes.find((a) => a.id === attrId);
    if (!config) return;
    config.defaultHazards.forEach((hazard, i) => {
      all.push({
        id: makeId("ra"),
        process: `${config.label} 작업`,
        unitTask: `${config.label} 작업`,
        hazard,
        accidentType: "위험",
        currentControl: config.defaultControls[i] ?? "안전수칙 준수",
        improvement: "",
        riskLevel: "high",
        focusManagement: true,
        source: `위험속성(${config.label})`,
        editable: true,
        sources: [`위험속성(${config.label})`],
        note: "",
      });
    });
  });

  return mergeRiskAssessments(all);
}

export function fetchRecommendedInspectionItems(doc: SafetyCardDocument): SafetyInspectionItem[] {
  const all: SafetyInspectionItem[] = [];
  const today = new Date().toISOString().split("T")[0];

  doc.selectedLegalWorkPlanTypes.forEach((typeId) => {
    const config = legalWorkPlanTypes.find((t) => t.id === typeId);
    if (!config) return;
    config.recommendedInspections.forEach((item) => {
      all.push({
        id: makeId("si"),
        item,
        result: "pending",
        action: "",
        responsiblePerson: doc.common.writer ?? "",
        checkedAt: today,
        source: `법정작업(${config.label})`,
        editable: true,
        sources: [`법정작업(${config.label})`],
        relatedWorkTypes: [typeId],
        relatedRiskAttributes: [],
        relatedEquipments: [],
        note: "",
      });
    });
  });

  doc.selectedRiskAttributes.forEach((attrId) => {
    const config = riskWorkAttributes.find((a) => a.id === attrId);
    if (!config) return;
    config.recommendedInspections.forEach((item) => {
      all.push({
        id: makeId("si"),
        item,
        result: "pending",
        action: "",
        responsiblePerson: doc.common.writer ?? "",
        checkedAt: today,
        source: `위험속성(${config.label})`,
        editable: true,
        sources: [`위험속성(${config.label})`],
        relatedWorkTypes: [],
        relatedRiskAttributes: [attrId],
        relatedEquipments: [],
        note: "",
      });
    });
  });

  doc.selectedEquipmentTypes.forEach((eqId) => {
    const config = equipmentTypeConfigs.find((e) => e.id === eqId);
    if (!config) return;
    config.inspectionItems.forEach((item) => {
      all.push({
        id: makeId("si"),
        item,
        result: "pending",
        action: "",
        responsiblePerson: doc.common.writer ?? "",
        checkedAt: today,
        source: `장비(${config.label})`,
        editable: true,
        sources: [`장비(${config.label})`],
        relatedWorkTypes: [],
        relatedRiskAttributes: [],
        relatedEquipments: [eqId],
        note: "",
      });
    });
  });

  return mergeInspectionItems(all);
}

export function fetchRecommendedTrainings(doc: SafetyCardDocument): SafetyTraining[] {
  const all: SafetyTraining[] = [];

  doc.selectedLegalWorkPlanTypes.forEach((typeId) => {
    const config = legalWorkPlanTypes.find((t) => t.id === typeId);
    if (!config) return;
    config.recommendedTrainings.forEach((training) => {
      all.push({
        id: makeId("st"),
        trainingType: training,
        trainingSubType: config.label,
        trainingDate: "",
        trainingHours: 0.5,
        instructor: "",
        targetWorkers: "",
        completedCount: 0,
        incompleteCount: 0,
        content: training,
        relatedLegalWorkPlanTypes: [config.id],
        relatedRiskAttributes: [],
        relatedEquipments: [],
        source: `법정작업(${config.label})`,
        editable: true,
        sources: [`법정작업(${config.label})`],
        note: "",
      });
    });
  });

  doc.selectedRiskAttributes.forEach((attrId) => {
    const config = riskWorkAttributes.find((a) => a.id === attrId);
    if (!config) return;
    config.recommendedTrainings.forEach((training) => {
      all.push({
        id: makeId("st"),
        trainingType: training,
        trainingSubType: config.label,
        trainingDate: "",
        trainingHours: 0.5,
        instructor: "",
        targetWorkers: "",
        completedCount: 0,
        incompleteCount: 0,
        content: training,
        relatedLegalWorkPlanTypes: [],
        relatedRiskAttributes: [attrId],
        relatedEquipments: [],
        source: `위험속성(${config.label})`,
        editable: true,
        sources: [`위험속성(${config.label})`],
        note: "",
      });
    });
  });

  doc.selectedEquipmentTypes.forEach((eqId) => {
    const config = equipmentTypeConfigs.find((e) => e.id === eqId);
    if (!config) return;
    config.trainingRecommendations.forEach((training) => {
      all.push({
        id: makeId("st"),
        trainingType: training,
        trainingSubType: config.label,
        trainingDate: "",
        trainingHours: 0.5,
        instructor: "",
        targetWorkers: "",
        completedCount: 0,
        incompleteCount: 0,
        content: training,
        relatedLegalWorkPlanTypes: [],
        relatedRiskAttributes: [],
        relatedEquipments: [eqId],
        source: `장비(${config.label})`,
        editable: true,
        sources: [`장비(${config.label})`],
        note: "",
      });
    });
  });

  return mergeTrainings(all);
}
