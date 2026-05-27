"use client";

import { create } from "zustand";
import type { SafetyCardDocument, ValidationResult } from "@/types/safetyCardTypes";
import { sampleSafetyCards } from "@/config/safetyCard";
import { buildEnabledSections, getRecommendedLegalTypes, getRecommendedRiskAttributes } from "@/utils/safetyCard/safetyCardMergeUtils";
import { validateSafetyCard, canTransitionTo } from "@/utils/safetyCard/safetyCardRuleEngine";
import { listDocuments, upsertDocument, deleteDocument, getActiveId, setActiveId, clearActiveId } from "@/utils/safetyCard/safetyCardStorage";
import { fetchRecommendedRiskAssessments, fetchRecommendedInspectionItems, fetchRecommendedTrainings } from "@/utils/safetyCard/safebuddyDataAdapter";

function newDocument(): SafetyCardDocument {
  const now = new Date().toISOString();
  const today = now.split("T")[0];
  return {
    id: `doc-${Date.now()}`,
    title: "",
    status: "draft",
    mode: "formal",
    common: {
      title: "",
      documentDate: today,
      partnerCompany: "",
      location: "",
      startDate: today,
      endDate: today,
      includeTime: false,
      siteName: "",
      writer: "",
    },
    selectedLegalWorkPlanTypes: [],
    selectedRiskAttributes: [],
    selectedEquipmentTypes: [],
    recommendedLegalWorkPlanTypes: [],
    recommendedRiskAttributes: [],
    enabledSections: ["overview", "detailedTasks", "workers", "environment", "riskAssessment", "safetyInspection", "safetyTraining", "emergencyContact", "preventionMeasures", "approvals"],
    detailedTasks: [],
    workers: [],
    environment: { weather: "", temperature: "", ventilation: "", brightness: "", noiseLevel: "", safetyStatus: "", accessRoad: "", details: "" },
    heavyLoad: { loadName: "", loadWeight: "", handlingMethod: "", equipment: "", hazards: "", controls: "" },
    equipments: [],
    riskAssessments: [],
    safetyInspections: [],
    safetyTrainings: [],
    emergencyContacts: [],
    preventionMeasures: { fall: "", overturn: "", fallingObject: "", entanglement: "", collapse: "", electrocution: "", fireExplosion: "", suffocation: "", accessControl: "", other: "" },
    attachmentUrls: [],
    drawings: [],
    approvals: [],
    reviewResults: [],
    calculationResults: [],
    legalSectionData: {},
    riskAttributeSectionData: {},
    equipmentSectionData: {},
    createdAt: now,
    updatedAt: now,
  };
}

interface SafetyCardState {
  documents: SafetyCardDocument[];
  activeDoc: SafetyCardDocument | null;
  activeSection: string;
  validation: ValidationResult | null;
  isDirty: boolean;

  // Lifecycle
  loadFromStorage: () => void;
  newDoc: () => void;
  loadDoc: (id: string) => void;
  loadSample: (sampleId: string) => void;
  saveDoc: () => void;
  deleteDoc: (id: string) => void;

  // Mutations
  updateCommon: (partial: Partial<SafetyCardDocument["common"]>) => void;
  toggleLegalType: (typeId: string) => void;
  toggleRiskAttribute: (attrId: string) => void;
  toggleEquipmentType: (eqId: string) => void;
  applyRecommendedLegalType: (typeId: string) => void;
  applyRecommendedRiskAttribute: (attrId: string) => void;
  setActiveSection: (sectionId: string) => void;
  updateField: <K extends keyof SafetyCardDocument>(key: K, value: SafetyCardDocument[K]) => void;

  // Auto-fill
  applyRecommendedData: () => void;

  // Status transitions
  transitionStatus: (target: SafetyCardDocument["status"]) => { success: boolean; reason?: string };

  // Validate
  validate: () => ValidationResult;
}

export const useSafetyCardStore = create<SafetyCardState>((set, get) => ({
  documents: [],
  activeDoc: null,
  activeSection: "overview",
  validation: null,
  isDirty: false,

  loadFromStorage: () => {
    const docs = listDocuments();
    const activeId = getActiveId();
    const activeDoc = activeId ? (docs.find((d) => d.id === activeId) ?? null) : null;
    set({ documents: docs, activeDoc });
  },

  newDoc: () => {
    const doc = newDocument();
    set({ activeDoc: doc, activeSection: "overview", validation: null, isDirty: true });
  },

  loadDoc: (id) => {
    const docs = listDocuments();
    const doc = docs.find((d) => d.id === id) ?? null;
    if (doc) {
      setActiveId(id);
      set({ activeDoc: doc, activeSection: "overview", validation: null, isDirty: false });
    }
  },

  loadSample: (sampleId) => {
    const sample = sampleSafetyCards.find((s) => s.id === sampleId);
    if (!sample) return;
    const doc: SafetyCardDocument = {
      ...sample,
      id: `doc-${Date.now()}`,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enabledSections: buildEnabledSections(sample),
      recommendedLegalWorkPlanTypes: getRecommendedLegalTypes(sample),
      recommendedRiskAttributes: getRecommendedRiskAttributes(sample),
    };
    set({ activeDoc: doc, activeSection: "overview", validation: null, isDirty: true });
  },

  saveDoc: () => {
    const { activeDoc, documents } = get();
    if (!activeDoc) return;
    const updated = { ...activeDoc, updatedAt: new Date().toISOString() };
    upsertDocument(updated);
    setActiveId(updated.id);
    const docs = listDocuments();
    set({ documents: docs, activeDoc: updated, isDirty: false });
  },

  deleteDoc: (id) => {
    deleteDocument(id);
    const docs = listDocuments();
    const { activeDoc } = get();
    if (activeDoc?.id === id) {
      clearActiveId();
      set({ documents: docs, activeDoc: null, isDirty: false });
    } else {
      set({ documents: docs });
    }
  },

  updateCommon: (partial) => {
    set((s) => {
      if (!s.activeDoc) return s;
      return { activeDoc: { ...s.activeDoc, common: { ...s.activeDoc.common, ...partial } }, isDirty: true };
    });
  },

  toggleLegalType: (typeId) => {
    set((s) => {
      if (!s.activeDoc) return s;
      const current = s.activeDoc.selectedLegalWorkPlanTypes;
      const next = current.includes(typeId) ? current.filter((t) => t !== typeId) : [...current, typeId];
      const updated = { ...s.activeDoc, selectedLegalWorkPlanTypes: next };
      return {
        activeDoc: {
          ...updated,
          enabledSections: buildEnabledSections(updated),
          recommendedLegalWorkPlanTypes: getRecommendedLegalTypes(updated),
        },
        isDirty: true,
      };
    });
  },

  toggleRiskAttribute: (attrId) => {
    set((s) => {
      if (!s.activeDoc) return s;
      const current = s.activeDoc.selectedRiskAttributes;
      const next = current.includes(attrId) ? current.filter((a) => a !== attrId) : [...current, attrId];
      const updated = { ...s.activeDoc, selectedRiskAttributes: next };
      return {
        activeDoc: {
          ...updated,
          enabledSections: buildEnabledSections(updated),
          recommendedRiskAttributes: getRecommendedRiskAttributes(updated),
        },
        isDirty: true,
      };
    });
  },

  toggleEquipmentType: (eqId) => {
    set((s) => {
      if (!s.activeDoc) return s;
      const current = s.activeDoc.selectedEquipmentTypes;
      const next = current.includes(eqId) ? current.filter((e) => e !== eqId) : [...current, eqId];
      const updated = { ...s.activeDoc, selectedEquipmentTypes: next };
      return {
        activeDoc: {
          ...updated,
          enabledSections: buildEnabledSections(updated),
          recommendedLegalWorkPlanTypes: getRecommendedLegalTypes(updated),
          recommendedRiskAttributes: getRecommendedRiskAttributes(updated),
        },
        isDirty: true,
      };
    });
  },

  applyRecommendedLegalType: (typeId) => {
    get().toggleLegalType(typeId);
    set((s) => {
      if (!s.activeDoc) return s;
      return {
        activeDoc: {
          ...s.activeDoc,
          recommendedLegalWorkPlanTypes: s.activeDoc.recommendedLegalWorkPlanTypes.filter((t) => t !== typeId),
        },
      };
    });
  },

  applyRecommendedRiskAttribute: (attrId) => {
    get().toggleRiskAttribute(attrId);
    set((s) => {
      if (!s.activeDoc) return s;
      return {
        activeDoc: {
          ...s.activeDoc,
          recommendedRiskAttributes: s.activeDoc.recommendedRiskAttributes.filter((a) => a !== attrId),
        },
      };
    });
  },

  setActiveSection: (sectionId) => set({ activeSection: sectionId }),

  updateField: (key, value) => {
    set((s) => {
      if (!s.activeDoc) return s;
      return { activeDoc: { ...s.activeDoc, [key]: value }, isDirty: true };
    });
  },

  applyRecommendedData: () => {
    set((s) => {
      if (!s.activeDoc) return s;
      const doc = s.activeDoc;
      const newRiskAssessments = fetchRecommendedRiskAssessments(doc);
      const newInspections = fetchRecommendedInspectionItems(doc);
      const newTrainings = fetchRecommendedTrainings(doc);

      const existingRaIds = new Set(doc.riskAssessments.map((r) => `${r.process}|${r.unitTask}|${r.hazard}`));
      const existingSiIds = new Set(doc.safetyInspections.map((s) => s.item));
      const existingStIds = new Set(doc.safetyTrainings.map((t) => `${t.trainingType}|${t.trainingSubType}`));

      const mergedRa = [...doc.riskAssessments, ...newRiskAssessments.filter((r) => !existingRaIds.has(`${r.process}|${r.unitTask}|${r.hazard}`))];
      const mergedSi = [...doc.safetyInspections, ...newInspections.filter((i) => !existingSiIds.has(i.item))];
      const mergedSt = [...doc.safetyTrainings, ...newTrainings.filter((t) => !existingStIds.has(`${t.trainingType}|${t.trainingSubType}`))];

      return {
        activeDoc: { ...doc, riskAssessments: mergedRa, safetyInspections: mergedSi, safetyTrainings: mergedSt },
        isDirty: true,
      };
    });
  },

  transitionStatus: (target) => {
    const { activeDoc } = get();
    if (!activeDoc) return { success: false, reason: "문서가 없습니다." };
    const check = canTransitionTo(activeDoc, target);
    if (!check.allowed) return { success: false, reason: check.reason };
    set((s) => ({ activeDoc: s.activeDoc ? { ...s.activeDoc, status: target, updatedAt: new Date().toISOString() } : null, isDirty: true }));
    return { success: true };
  },

  validate: () => {
    const { activeDoc } = get();
    if (!activeDoc) return { isValid: false, issues: [], errorCount: 0, warningCount: 0 };
    const result = validateSafetyCard(activeDoc);
    set({ validation: result });
    return result;
  },
}));
