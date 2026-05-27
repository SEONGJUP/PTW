import type { SafetyCardDocument, RiskAssessment, SafetyInspectionItem, SafetyTraining } from "@/types/safetyCardTypes";
import { legalWorkPlanTypes, riskWorkAttributes, equipmentTypeConfigs, DEFAULT_ENABLED_SECTIONS } from "@/config/safetyCard";

export function buildEnabledSections(doc: SafetyCardDocument): string[] {
  const sections = new Set<string>(DEFAULT_ENABLED_SECTIONS);

  doc.selectedLegalWorkPlanTypes.forEach((typeId) => {
    const config = legalWorkPlanTypes.find((t) => t.id === typeId);
    config?.requiredSections.forEach((s) => sections.add(s));
  });

  doc.selectedRiskAttributes.forEach((attrId) => {
    const config = riskWorkAttributes.find((a) => a.id === attrId);
    config?.sections.forEach((s) => sections.add(s));
  });

  doc.selectedEquipmentTypes.forEach((eqId) => {
    const config = equipmentTypeConfigs.find((e) => e.id === eqId);
    config?.specificSections.forEach((s) => sections.add(s));
  });

  if (doc.enabledSections.length > 0) {
    doc.enabledSections.forEach((s) => sections.add(s));
  }

  return Array.from(sections);
}

export function getRecommendedLegalTypes(doc: SafetyCardDocument): string[] {
  const recommended = new Set<string>();

  doc.selectedEquipmentTypes.forEach((eqId) => {
    const config = equipmentTypeConfigs.find((e) => e.id === eqId);
    config?.defaultLegalWorkPlanTypes.forEach((t) => {
      if (!doc.selectedLegalWorkPlanTypes.includes(t)) recommended.add(t);
    });
  });

  return Array.from(recommended);
}

export function getRecommendedRiskAttributes(doc: SafetyCardDocument): string[] {
  const recommended = new Set<string>();

  doc.selectedEquipmentTypes.forEach((eqId) => {
    const config = equipmentTypeConfigs.find((e) => e.id === eqId);
    config?.defaultRiskAttributes.forEach((a) => {
      if (!doc.selectedRiskAttributes.includes(a)) recommended.add(a);
    });
  });

  return Array.from(recommended);
}

export function mergeRiskAssessments(items: RiskAssessment[]): RiskAssessment[] {
  const merged = new Map<string, RiskAssessment>();
  items.forEach((item) => {
    const key = `${item.process}|${item.unitTask}|${item.hazard}`;
    const existing = merged.get(key);
    if (existing) {
      const combinedSources = Array.from(new Set([...existing.sources, ...item.sources]));
      merged.set(key, { ...existing, sources: combinedSources });
    } else {
      merged.set(key, { ...item });
    }
  });
  return Array.from(merged.values());
}

export function mergeInspectionItems(items: SafetyInspectionItem[]): SafetyInspectionItem[] {
  const merged = new Map<string, SafetyInspectionItem>();
  items.forEach((item) => {
    const existing = merged.get(item.item);
    if (existing) {
      const combinedSources = Array.from(new Set([...existing.sources, ...item.sources]));
      const combinedWorkTypes = Array.from(new Set([...existing.relatedWorkTypes, ...item.relatedWorkTypes]));
      const combinedEquipments = Array.from(new Set([...existing.relatedEquipments, ...item.relatedEquipments]));
      merged.set(item.item, { ...existing, sources: combinedSources, relatedWorkTypes: combinedWorkTypes, relatedEquipments: combinedEquipments });
    } else {
      merged.set(item.item, { ...item });
    }
  });
  return Array.from(merged.values());
}

export function mergeTrainings(items: SafetyTraining[]): SafetyTraining[] {
  const merged = new Map<string, SafetyTraining>();
  items.forEach((item) => {
    const key = `${item.trainingType}|${item.trainingSubType}`;
    const existing = merged.get(key);
    if (existing) {
      const combinedSources = Array.from(new Set([...existing.sources, ...item.sources]));
      merged.set(key, { ...existing, sources: combinedSources });
    } else {
      merged.set(key, { ...item });
    }
  });
  return Array.from(merged.values());
}

export function generateDefaultHazards(doc: SafetyCardDocument): string[] {
  const hazards = new Set<string>();

  doc.selectedLegalWorkPlanTypes.forEach((typeId) => {
    const config = legalWorkPlanTypes.find((t) => t.id === typeId);
    config?.defaultHazards.forEach((h) => hazards.add(h));
  });

  doc.selectedRiskAttributes.forEach((attrId) => {
    const config = riskWorkAttributes.find((a) => a.id === attrId);
    config?.defaultHazards.forEach((h) => hazards.add(h));
  });

  return Array.from(hazards);
}

export function generateDefaultControls(doc: SafetyCardDocument): string[] {
  const controls = new Set<string>();

  doc.selectedLegalWorkPlanTypes.forEach((typeId) => {
    const config = legalWorkPlanTypes.find((t) => t.id === typeId);
    config?.defaultControls.forEach((c) => controls.add(c));
  });

  doc.selectedRiskAttributes.forEach((attrId) => {
    const config = riskWorkAttributes.find((a) => a.id === attrId);
    config?.defaultControls.forEach((c) => controls.add(c));
  });

  return Array.from(controls);
}
