"use client";
import React from "react";
import {
  CONSTRUCTION_EQUIPMENT_TYPES,
  EquipmentType,
  useWorkPlanStore,
  getEquipmentSubtitle,
} from "@/store/workPlanStore";

const PRIMARY = "#00B7AF";
const PRIMARY_DARK = "#00A099";
const PRIMARY_LIGHT = "#E6FAF9";

export default function EquipmentSelector() {
  const { selectedEquipments, toggleEquipment, clearEquipments } = useWorkPlanStore();

  const entries = Object.entries(CONSTRUCTION_EQUIPMENT_TYPES) as [
    EquipmentType,
    (typeof CONSTRUCTION_EQUIPMENT_TYPES)[EquipmentType]
  ][];

  const subtitle = getEquipmentSubtitle(selectedEquipments);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500">
          건설기계 종류 선택 (산업안전보건법 기준)
          <span className="ml-1 text-slate-400">· 복수 선택 가능</span>
        </p>
        {selectedEquipments.length > 0 && (
          <button
            onClick={clearEquipments}
            className="text-xs text-slate-400 hover:text-red-400 transition-colors"
          >
            전체 해제
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {entries.map(([key, info]) => {
          const selected = selectedEquipments.includes(key);
          return (
            <button
              key={key}
              onClick={() => toggleEquipment(key)}
              className="relative flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border-2 text-center transition-all hover:shadow-sm"
              style={{
                borderColor: selected ? PRIMARY : "#e2e8f0",
                background: selected ? PRIMARY_LIGHT : "white",
                color: selected ? PRIMARY_DARK : "#475569",
              }}
              title={info.label}
            >
              {/* 선택 순서 뱃지 */}
              {selected && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                  style={{ background: PRIMARY, fontSize: "0.6rem" }}
                >
                  {selectedEquipments.indexOf(key) + 1}
                </span>
              )}
              <span className="text-xl leading-none">{info.icon}</span>
              <span
                className="text-xs font-bold leading-none"
                style={{ color: selected ? PRIMARY : "#94a3b8" }}
              >
                {info.num}
              </span>
              <span
                className="text-xs leading-tight font-medium"
                style={{
                  fontSize: "0.65rem",
                  lineHeight: "1.2",
                  color: selected ? PRIMARY_DARK : "#64748b",
                  maxWidth: 64,
                  wordBreak: "keep-all",
                }}
              >
                {info.label.replace(" (이동식 포함)", "").replace(" (덤프트럭 등)", "")}
              </span>
            </button>
          );
        })}
      </div>

      {/* 선택된 장비 요약 */}
      {selectedEquipments.length > 0 && (
        <div
          className="mt-2 rounded-xl border px-3 py-2"
          style={{ borderColor: `${PRIMARY}44`, background: PRIMARY_LIGHT }}
        >
          <div className="flex items-start gap-2">
            <span style={{ color: PRIMARY }} className="mt-0.5 flex-shrink-0">✓</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: PRIMARY_DARK }}>
                투입 건설기계 {selectedEquipments.length}종 선택됨
              </p>
              <p className="text-xs mt-0.5 text-slate-500 leading-relaxed">
                {subtitle}
              </p>
              {selectedEquipments.length >= 2 && (
                <p className="text-xs mt-1 text-slate-400">
                  문서 제목: <span className="font-medium text-slate-600">차량계 건설기계 작업계획서</span>
                  <span className="mx-1 text-slate-300">·</span>
                  서브타이틀: <span className="font-medium text-slate-600">{subtitle}</span>
                </p>
              )}
            </div>
            <button
              onClick={clearEquipments}
              className="flex-shrink-0 text-slate-400 hover:text-red-400 transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          {/* 장비 칩 목록 */}
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedEquipments.map((eq, idx) => (
              <span
                key={eq}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: "white", color: PRIMARY_DARK, border: `1px solid ${PRIMARY}55` }}
              >
                <span className="font-bold" style={{ color: PRIMARY }}>
                  {idx + 1}.
                </span>
                {CONSTRUCTION_EQUIPMENT_TYPES[eq].icon}{" "}
                {CONSTRUCTION_EQUIPMENT_TYPES[eq].label
                  .replace(" (이동식 포함)", "")
                  .replace(" (덤프트럭 등)", "")}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleEquipment(eq); }}
                  className="ml-0.5 hover:text-red-400 transition-colors leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
