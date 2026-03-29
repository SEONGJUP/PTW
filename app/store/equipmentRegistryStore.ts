"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { EquipmentType, CONSTRUCTION_EQUIPMENT_TYPES } from "./workPlanStore";


export interface InspectionRecord {
  id: string;
  date: string;
  type: string;       // 정기검사 / 자체점검 / 이상점검
  result: "합격" | "불합격" | "조건부합격";
  inspector: string;
  notes: string;
}

/** 장비 투입 이력 (1회 투입 = 1 UsageLog, 직접입력/계획서 연동 모두 지원) */
export interface UsageLog {
  id: string;
  source: "plan" | "manual";  // 출처: 작업계획서 연동 | 직접 입력
  workPlanId?: string;         // 작업계획서 SavedCard ID (plan 출처일 때)
  workPlanTitle: string;       // 작업명 / 작업계획서 제목
  siteName: string;            // 현장명
  location: string;            // 위치
  startDate: string;           // 투입 시작일
  endDate: string;             // 투입 종료일
  operator: string;            // 운전원
  note: string;                // 변동사항 / 비고
  createdAt: string;
}

export interface EquipmentRecord {
  id: string;

  // 기본 정보
  name: string;
  equipmentType: EquipmentType | string;
  model: string;
  manufacturer: string;
  year: string;
  serialNumber: string;
  registrationNumber: string;

  // 제원
  capacity: string;
  weight: string;
  dimensions: string;
  enginePower: string;
  workRadius: string;

  // 관리 정보
  operatorName: string;
  operatorLicense: string;
  purchaseDate: string;
  lastInspectionDate: string;
  nextInspectionDate: string;
  inspectionCycle: string;
  insuranceStart: string;
  insuranceExpiry: string;

  inspectionHistory: InspectionRecord[];
  usageLogs: UsageLog[];

  // 관리대장 표 필드
  workLocation: string;
  qty: string;
  inspectionTarget: string;  // "Y" | "N"
  inspectionBasis: string;
  safetyDevice: string;
  accidentType: string;

  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentRegistryStore {
  records: EquipmentRecord[];

  addRecord:        (data: Omit<EquipmentRecord, "id" | "createdAt" | "updatedAt" | "inspectionHistory" | "usageLogs">) => string;
  updateRecord:     (id: string, data: Partial<EquipmentRecord>) => void;
  deleteRecord:     (id: string) => void;

  addInspection:    (equipmentId: string, inspection: Omit<InspectionRecord, "id">) => void;
  updateInspection: (equipmentId: string, inspectionId: string, data: Partial<Omit<InspectionRecord, "id">>) => void;
  deleteInspection: (equipmentId: string, inspectionId: string) => void;

  addUsageLog:      (equipmentId: string, log: Omit<UsageLog, "id" | "createdAt">) => void;
  updateUsageLog:   (equipmentId: string, logId: string, data: Partial<Omit<UsageLog, "id" | "createdAt">>) => void;
  deleteUsageLog:   (equipmentId: string, logId: string) => void;

  getByType:   (type: EquipmentType | string) => EquipmentRecord[];
  findByNumber:(regNo: string, serialNo?: string) => EquipmentRecord | undefined;
}

export function getEquipmentTypeLabel(type: EquipmentType | string): string {
  if (type in CONSTRUCTION_EQUIPMENT_TYPES) {
    return CONSTRUCTION_EQUIPMENT_TYPES[type as EquipmentType].label;
  }
  return type;
}

export const useEquipmentRegistryStore = create<EquipmentRegistryStore>()(
  persist(
    (set, get) => ({
      records: [],

      addRecord: (data) => {
        const id = `eq_${Date.now()}`;
        const now = new Date().toISOString();
        set((s) => ({
          records: [...s.records, { ...data, id, inspectionHistory: [], usageLogs: [], createdAt: now, updatedAt: now }],
        }));
        return id;
      },

      updateRecord: (id, data) => {
        set((s) => ({
          records: s.records.map((r) =>
            r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
          ),
        }));
      },

      deleteRecord: (id) => {
        set((s) => ({ records: s.records.filter((r) => r.id !== id) }));
      },

      // ── 점검이력 ──────────────────────────────────────────────────
      addInspection: (equipmentId, inspection) => {
        const now = new Date().toISOString();
        const record: InspectionRecord = { ...inspection, id: `ins_${Date.now()}` };
        set((s) => ({
          records: s.records.map((r) =>
            r.id === equipmentId
              ? { ...r, inspectionHistory: [record, ...r.inspectionHistory], lastInspectionDate: inspection.date, updatedAt: now }
              : r
          ),
        }));
      },

      updateInspection: (equipmentId, inspectionId, data) => {
        set((s) => ({
          records: s.records.map((r) =>
            r.id === equipmentId
              ? {
                  ...r,
                  inspectionHistory: r.inspectionHistory.map((i) =>
                    i.id === inspectionId ? { ...i, ...data } : i
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
        }));
      },

      deleteInspection: (equipmentId, inspectionId) => {
        set((s) => ({
          records: s.records.map((r) =>
            r.id === equipmentId
              ? { ...r, inspectionHistory: r.inspectionHistory.filter((i) => i.id !== inspectionId), updatedAt: new Date().toISOString() }
              : r
          ),
        }));
      },

      // ── 투입이력 ──────────────────────────────────────────────────
      addUsageLog: (equipmentId, log) => {
        const record: UsageLog = { ...log, id: `ul_${Date.now()}`, createdAt: new Date().toISOString() };
        set((s) => ({
          records: s.records.map((r) =>
            r.id === equipmentId
              ? { ...r, usageLogs: [record, ...(r.usageLogs ?? [])], updatedAt: new Date().toISOString() }
              : r
          ),
        }));
      },

      updateUsageLog: (equipmentId, logId, data) => {
        set((s) => ({
          records: s.records.map((r) =>
            r.id === equipmentId
              ? {
                  ...r,
                  usageLogs: (r.usageLogs ?? []).map((l) =>
                    l.id === logId ? { ...l, ...data } : l
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
        }));
      },

      deleteUsageLog: (equipmentId, logId) => {
        set((s) => ({
          records: s.records.map((r) =>
            r.id === equipmentId
              ? { ...r, usageLogs: (r.usageLogs ?? []).filter((l) => l.id !== logId), updatedAt: new Date().toISOString() }
              : r
          ),
        }));
      },

      getByType:    (type)         => get().records.filter((r) => r.equipmentType === type),
      findByNumber: (regNo, serialNo) =>
        get().records.find((r) => {
          if (regNo    && r.registrationNumber && r.registrationNumber === regNo)    return true;
          if (serialNo && r.serialNumber       && r.serialNumber       === serialNo) return true;
          return false;
        }),
    }),
    {
      name: "ptw-equipment-registry",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as Storage)
      ),
    }
  )
);
