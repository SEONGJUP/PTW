"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { EquipmentType, CONSTRUCTION_EQUIPMENT_TYPES } from "./workPlanStore";

export type EquipmentStatus = "active" | "maintenance" | "inactive";

export interface InspectionRecord {
  id: string;
  date: string;
  type: string;       // 정기검사 / 자체점검 / 이상점검
  result: "합격" | "불합격" | "조건부합격";
  inspector: string;
  notes: string;
}

export interface EquipmentRecord {
  id: string;

  // 기본 정보
  name: string;                     // 장비명 (자유 입력)
  equipmentType: EquipmentType | string; // 건설기계 종류
  model: string;                    // 모델명
  manufacturer: string;             // 제조사
  year: string;                     // 제조연도
  serialNumber: string;             // 기계번호/차대번호
  registrationNumber: string;       // 건설기계등록번호 (차량계)

  // 제원
  capacity: string;                 // 정격하중 / 정격출력 / 버킷용량 등
  weight: string;                   // 자중 (ton)
  dimensions: string;               // 제원 (길이×폭×높이)
  enginePower: string;              // 엔진 출력

  // 관리 정보
  status: EquipmentStatus;
  operatorName: string;             // 담당 운전원
  operatorLicense: string;          // 면허 번호
  purchaseDate: string;
  lastInspectionDate: string;
  nextInspectionDate: string;
  inspectionCycle: string;          // 점검 주기 (예: 6개월)
  insuranceExpiry: string;          // 보험 만료일

  // 점검 이력
  inspectionHistory: InspectionRecord[];

  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentRegistryStore {
  records: EquipmentRecord[];

  addRecord: (data: Omit<EquipmentRecord, "id" | "createdAt" | "updatedAt" | "inspectionHistory">) => string;
  updateRecord: (id: string, data: Partial<EquipmentRecord>) => void;
  deleteRecord: (id: string) => void;
  addInspection: (equipmentId: string, inspection: Omit<InspectionRecord, "id">) => void;
  getByType: (type: EquipmentType | string) => EquipmentRecord[];
  getActive: () => EquipmentRecord[];
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
        const record: EquipmentRecord = {
          ...data,
          id,
          inspectionHistory: [],
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ records: [...s.records, record] }));
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

      addInspection: (equipmentId, inspection) => {
        const record: InspectionRecord = {
          ...inspection,
          id: `ins_${Date.now()}`,
        };
        set((s) => ({
          records: s.records.map((r) =>
            r.id === equipmentId
              ? {
                  ...r,
                  inspectionHistory: [record, ...r.inspectionHistory],
                  lastInspectionDate: inspection.date,
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
        }));
      },

      getByType: (type) => {
        return get().records.filter((r) => r.equipmentType === type);
      },

      getActive: () => {
        return get().records.filter((r) => r.status === "active");
      },
    }),
    {
      name: "ptw-equipment-registry",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as Storage)
      ),
    }
  )
);
