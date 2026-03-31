"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  useWorkPermitStore,
  WorkPermit,
  WorkPermitType,
  WorkPermitStatus,
  WORK_PERMIT_TYPE_LABELS,
  WORK_PERMIT_TYPE_ICONS,
  WORK_PERMIT_STATUS_LABELS,
  PERMIT_SAFETY_CHECKLIST,
  COMMON_SAFETY_MEASURES,
  PERMIT_SIGNATURE_STAGES,
  PermitSignature,
  LEGALLY_REQUIRED_PERMIT_TYPES,
  PermitApprovalDecision,
  PERMIT_SPECIFICS_FIELDS,
  CustomPermitType,
} from "@/store/workPermitStore";
import { useWorkPlanStore, CONSTRUCTION_EQUIPMENT_TYPES } from "@/store/workPlanStore";
import { buildMergedChecklist, GAS_STANDARDS } from "@/store/workPermitStore";

const PRIMARY = "#00B7AF";
const PRIMARY_LIGHT = "#E6FAF9";

const STATUS_STYLE: Record<WorkPermitStatus, { bg: string; text: string; border: string }> = {
  draft:                  { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" },
  pending:                { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  approved:               { bg: "#d1fae5", text: "#065f46", border: "#34d399" },
  conditionally_approved: { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
  rejected:               { bg: "#fee2e2", text: "#991b1b", border: "#f87171" },
  completed:              { bg: "#f0fdf4", text: "#166534", border: "#86efac" },
  expired:                { bg: "#f1f5f9", text: "#94a3b8", border: "#cbd5e1" },
};

// ── PermitCard (목록 카드) ─────────────────────────────────────
function PermitCard({ permit, onOpen, onDelete }: { permit: WorkPermit; onOpen: () => void; onDelete: () => void }) {
  const s = STATUS_STYLE[permit.status];
  const isLegal = LEGALLY_REQUIRED_PERMIT_TYPES.includes(permit.type);
  const currentStage = permit.signatures.filter((sig) => sig.status === "signed").length;
  return (
    <div className="rounded-2xl border p-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderColor: s.border, background: s.bg }} onClick={onOpen}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl">{WORK_PERMIT_TYPE_ICONS[permit.type]}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-slate-800 truncate">{permit.title || "(제목 없음)"}</p>
              {isLegal && <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">⚖️법정</span>}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{WORK_PERMIT_TYPE_LABELS[permit.type]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: s.border + "44", color: s.text }}>
            {WORK_PERMIT_STATUS_LABELS[permit.status]}
          </span>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-slate-300 hover:text-red-400 text-sm">✕</button>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {permit.siteName && <span>📍 {permit.siteName}</span>}
          {permit.startDate && <span>📅 {permit.startDate}</span>}
          {permit.workPlanTitle && <span className="text-teal-500">📋 계획서 연동</span>}
        </div>
        {/* 서명 진행 표시 */}
        <div className="flex items-center gap-0.5">
          {PERMIT_SIGNATURE_STAGES.map((s) => {
            const sig = permit.signatures.find((sg) => sg.stage === s.stage);
            const done = sig?.status === "signed";
            return (
              <div key={s.stage} className="w-2 h-2 rounded-full" style={{ background: done ? "#10b981" : "#e2e8f0" }} title={s.role} />
            );
          })}
          <span className="text-xs text-slate-400 ml-1">{currentStage}/5</span>
        </div>
      </div>
    </div>
  );
}

// ── 3-state 체크리스트 테이블 ──────────────────────────────────
const CHECK_STATES = [
  { val: "양호",   bg: "#f0fdf4", activeBg: "#10b981", activeText: "white", borderColor: "#10b981", label: "양호" },
  { val: "불량",   bg: "#fff1f2", activeBg: "#ef4444", activeText: "white", borderColor: "#ef4444", label: "불량" },
  { val: "해당없음", bg: "#f8fafc", activeBg: "#94a3b8", activeText: "white", borderColor: "#94a3b8", label: "해당없음" },
] as const;

function ChecklistTable({
  items, checklist, onSet,
}: {
  items: string[];
  checklist: Record<string, string>;
  onSet: (item: string, val: "양호" | "불량" | "해당없음" | "") => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
      {items.map((item) => {
        const cur = checklist[item] ?? "";
        const stateInfo = CHECK_STATES.find((s) => s.val === cur);
        return (
          <div
            key={item}
            className="flex items-center gap-3 px-4 py-2"
            style={{ background: stateInfo?.bg ?? "white" }}
          >
            <span className="flex-1 text-sm" style={{ color: cur ? "#334155" : "#94a3b8" }}>{item}</span>
            <div className="flex gap-1 flex-shrink-0">
              {CHECK_STATES.map(({ val, activeBg, activeText, borderColor, label }) => {
                const active = cur === val;
                return (
                  <button
                    key={val}
                    onClick={() => onSet(item, active ? "" : val)}
                    className="px-2 py-0.5 rounded-full text-xs font-semibold border transition-all"
                    style={{
                      background: active ? activeBg : "white",
                      color: active ? activeText : "#94a3b8",
                      borderColor: active ? borderColor : "#e2e8f0",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 기타 직접입력 체크항목 ──────────────────────────────────────
function CustomChecklistSection({
  items, checklist, onSetValue, onAdd, onRemove, checkedCount,
}: {
  items: string[];
  checklist: Record<string, string>;
  onSetValue: (item: string, val: "양호" | "불량" | "해당없음" | "") => void;
  onAdd: (label: string) => void;
  onRemove: (item: string) => void;
  checkedCount: number;
}) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    if (!input.trim()) return;
    onAdd(input);
    setInput("");
  };

  return (
    <div className="mb-6">
      <p className="text-xs font-bold text-slate-600 mb-2">
        ➕ 기타 직접입력 항목
        {items.length > 0 && (
          <span className="text-slate-400 font-normal ml-1">({checkedCount}/{items.length})</span>
        )}
      </p>

      {/* 기존 커스텀 항목들 */}
      {items.length > 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 overflow-hidden divide-y divide-slate-100 mb-2">
          {items.map((item) => {
            const cur = checklist[item] ?? "";
            const stateInfo = CHECK_STATES.find((s) => s.val === cur);
            return (
              <div key={item} className="flex items-center gap-3 px-4 py-2 transition-colors"
                style={{ background: stateInfo?.bg ?? "white" }}>
                <span className="flex-1 text-sm" style={{ color: cur ? "#334155" : "#94a3b8" }}>{item}</span>
                <div className="flex gap-1 flex-shrink-0">
                  {CHECK_STATES.map(({ val, activeBg, activeText, borderColor, label }) => {
                    const active = cur === val;
                    return (
                      <button key={val} onClick={() => onSetValue(item, active ? "" : val)}
                        className="px-2 py-0.5 rounded-full text-xs font-semibold border transition-all"
                        style={{ background: active ? activeBg : "white", color: active ? activeText : "#94a3b8", borderColor: active ? borderColor : "#e2e8f0" }}
                      >{label}</button>
                    );
                  })}
                </div>
                <button onClick={() => onRemove(item)} className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0 text-xs" title="항목 삭제">✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* 새 항목 추가 입력 */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
          placeholder="체크 항목 직접 입력 후 Enter 또는 추가 클릭"
          className="flex-1 px-3 py-2 border border-dashed border-slate-300 rounded-xl text-sm outline-none focus:border-teal-400 bg-slate-50"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all flex-shrink-0"
          style={{ background: input.trim() ? PRIMARY : "#cbd5e1", cursor: input.trim() ? "pointer" : "not-allowed" }}
        >
          추가
        </button>
      </div>
    </div>
  );
}

// ── 허가서 유형 그리드 선택기 ────────────────────────────────────
const ALL_PERMIT_TYPES = Object.keys(WORK_PERMIT_TYPE_LABELS) as WorkPermitType[];

function PermitTypeGrid({
  permit,
  upd,
  updatePermit,
  addExtraType,
  customTypes,
  selectedCustomIds,
  onToggleCustom,
}: {
  permit: WorkPermit;
  upd: (key: keyof WorkPermit, val: unknown) => void;
  updatePermit: (id: string, data: Partial<WorkPermit>) => void;
  addExtraType: (t: WorkPermitType) => void;
  customTypes: CustomPermitType[];
  selectedCustomIds: string[];
  onToggleCustom: (id: string) => void;
}) {
  const customNames = permit.customTypeName
    ? permit.customTypeName.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const hasCustomNames = customNames.length > 0;
  const [showCustomInput, setShowCustomInput] = useState(hasCustomNames);
  const [customTypeInput, setCustomTypeInput] = useState("");
  const allTypes = [permit.type, ...(permit.extraTypes ?? [])];

  const toggle = (t: WorkPermitType) => {
    if (allTypes.includes(t)) {
      if (allTypes.length === 1) return;
      if (t === permit.type) {
        const extras = permit.extraTypes ?? [];
        updatePermit(permit.id, { type: extras[0], extraTypes: extras.slice(1) });
      } else {
        updatePermit(permit.id, { extraTypes: (permit.extraTypes ?? []).filter((x) => x !== t) });
      }
    } else {
      addExtraType(t);
    }
  };

  const clearAll = () => updatePermit(permit.id, { type: "general", extraTypes: [], customTypeName: "", customTypeIds: [] });

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500">
          허가서 유형 선택 (복수 선택 가능)
          <span className="ml-1 text-slate-400">· 첫 번째가 주 유형</span>
        </p>
        {(allTypes.length > 1 || permit.customTypeName) && (
          <button onClick={clearAll} className="text-xs text-slate-400 hover:text-red-400 transition-colors">
            전체 해제
          </button>
        )}
      </div>

      {/* 유형 그리드 */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {ALL_PERMIT_TYPES.map((t, idx) => {
          const sel = allTypes.includes(t);
          const selOrder = allTypes.indexOf(t) + 1;
          return (
            <button
              key={t}
              onClick={() => toggle(t)}
              className="relative flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border-2 text-center transition-all hover:shadow-sm"
              style={{
                borderColor: sel ? PRIMARY : "#e2e8f0",
                background: sel ? PRIMARY_LIGHT : "white",
                color: sel ? PRIMARY : "#475569",
              }}
            >
              {sel && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                  style={{ background: PRIMARY, fontSize: "0.6rem" }}
                >
                  {selOrder}
                </span>
              )}
              <span className="text-xl leading-none">{WORK_PERMIT_TYPE_ICONS[t]}</span>
              <span className="text-xs font-bold leading-none" style={{ color: sel ? PRIMARY : "#94a3b8" }}>
                {idx + 1}.
              </span>
              <span
                className="leading-tight font-medium text-center"
                style={{ fontSize: "0.65rem", lineHeight: 1.2, color: sel ? PRIMARY : "#64748b", wordBreak: "keep-all", maxWidth: 64 }}
              >
                {WORK_PERMIT_TYPE_LABELS[t].replace(" 허가서", "").replace("야간·조출·단시간 작업", "야간·조출\n단시간")}
                {LEGALLY_REQUIRED_PERMIT_TYPES.includes(t) && <span style={{ fontSize: 9 }}> ⚖️</span>}
              </span>
            </button>
          );
        })}

        {/* 사용자 정의 유형 타일들 */}
        {customTypes.map((ct) => {
          const sel = selectedCustomIds.includes(ct.id);
          return (
            <button
              key={ct.id}
              onClick={() => onToggleCustom(ct.id)}
              className="relative flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border-2 text-center transition-all hover:shadow-sm"
              style={{
                borderColor: sel ? PRIMARY : "#e2e8f0",
                background: sel ? PRIMARY_LIGHT : "white",
                color: sel ? PRIMARY : "#475569",
              }}
            >
              {sel && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                  style={{ background: PRIMARY, fontSize: "0.6rem" }}
                >✓</span>
              )}
              <span className="text-xl leading-none">{ct.icon}</span>
              <span
                className="leading-tight font-medium text-center"
                style={{ fontSize: "0.65rem", lineHeight: 1.2, color: sel ? PRIMARY : "#64748b", wordBreak: "keep-all", maxWidth: 64 }}
              >{ct.label}</span>
              <span className="text-xs px-1 rounded" style={{ fontSize: 8, background: sel ? `${PRIMARY}20` : "#e0f2fe", color: sel ? PRIMARY : "#0369a1" }}>커스텀</span>
            </button>
          );
        })}

        {/* 기타 직접입력 타일 */}
        <button
          onClick={() => setShowCustomInput((v) => !v)}
          className="relative flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border-2 text-center transition-all hover:shadow-sm"
          style={{
            borderColor: (showCustomInput || hasCustomNames) ? PRIMARY : "#e2e8f0",
            background: (showCustomInput || hasCustomNames) ? PRIMARY_LIGHT : "white",
            color: (showCustomInput || hasCustomNames) ? PRIMARY : "#475569",
          }}
        >
          {hasCustomNames && (
            <span
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
              style={{ background: PRIMARY, fontSize: "0.6rem" }}
            >{customNames.length}</span>
          )}
          <span className="text-xl leading-none">🔧</span>
          <span className="text-xs font-bold leading-none" style={{ color: (showCustomInput || hasCustomNames) ? PRIMARY : "#94a3b8" }}>
            {ALL_PERMIT_TYPES.length + 1}.
          </span>
          <span
            className="leading-tight font-medium"
            style={{ fontSize: "0.65rem", lineHeight: 1.2, color: (showCustomInput || hasCustomNames) ? PRIMARY : "#64748b" }}
          >기타</span>
        </button>
      </div>

      {/* 기타 직접입력 영역 */}
      {showCustomInput && (
        <div className="mt-2 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 space-y-2" style={{ background: "#fafafa" }}>
          {customNames.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {customNames.map((name) => (
                <span key={name} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: "white", color: PRIMARY, border: `1px solid ${PRIMARY}55` }}>
                  🔧 {name}
                  <button
                    onClick={() => {
                      const next = customNames.filter((n) => n !== name);
                      upd("customTypeName", next.join(", "));
                    }}
                    className="ml-0.5 hover:text-red-400 transition-colors leading-none"
                  >×</button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={customTypeInput}
              onChange={(e) => setCustomTypeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const trimmed = customTypeInput.trim();
                  if (!trimmed || customNames.includes(trimmed)) return;
                  upd("customTypeName", [...customNames, trimmed].join(", "));
                  setCustomTypeInput("");
                }
              }}
              placeholder="작업유형 입력 후 Enter 또는 추가 (예: 도장작업, 비계설치, 해체작업)"
              className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 bg-white"
            />
            <button
              onClick={() => {
                const trimmed = customTypeInput.trim();
                if (!trimmed || customNames.includes(trimmed)) return;
                upd("customTypeName", [...customNames, trimmed].join(", "));
                setCustomTypeInput("");
              }}
              disabled={!customTypeInput.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex-shrink-0"
              style={{ background: customTypeInput.trim() ? PRIMARY : "#cbd5e1" }}
            >추가</button>
          </div>
        </div>
      )}

    </div>
  );
}

// ── 투입 장비 선택 ─────────────────────────────────────────────
const EQ_ENTRIES = Object.entries(CONSTRUCTION_EQUIPMENT_TYPES) as [string, { label: string; num: number; icon: string }][];

function EquipmentPicker({
  selected, customList, onToggle, onCustomAdd, onCustomRemove,
}: {
  selected: string[];
  customList: string[];
  onToggle: (key: string) => void;
  onCustomAdd: (v: string) => void;
  onCustomRemove: (v: string) => void;
}) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const handleAdd = () => {
    const trimmed = customInput.trim();
    if (!trimmed || customList.includes(trimmed)) return;
    onCustomAdd(trimmed);
    setCustomInput("");
  };

  const hasCustom = customList.length > 0;

  return (
    <div>
      {/* 9종 + 기타 그리드 */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {EQ_ENTRIES.map(([key, info]) => {
          const sel = selected.includes(key);
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className="relative flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border-2 text-center transition-all hover:shadow-sm"
              style={{ borderColor: sel ? PRIMARY : "#e2e8f0", background: sel ? PRIMARY_LIGHT : "white" }}
            >
              {sel && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                  style={{ background: PRIMARY, fontSize: "0.6rem" }}>
                  {selected.indexOf(key) + 1}
                </span>
              )}
              <span className="text-xl leading-none">{info.icon}</span>
              <span className="text-xs font-bold leading-none" style={{ color: sel ? PRIMARY : "#94a3b8" }}>{info.num}.</span>
              <span className="leading-tight font-medium text-center"
                style={{ fontSize: "0.65rem", lineHeight: 1.2, color: sel ? PRIMARY : "#64748b", wordBreak: "keep-all", maxWidth: 64 }}>
                {info.label.replace(" (이동식 포함)", "").replace(" (덤프트럭 등)", "")}
              </span>
            </button>
          );
        })}
        {/* 기타 타일 */}
        <button
          onClick={() => setShowCustomInput((v) => !v)}
          className="relative flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border-2 text-center transition-all hover:shadow-sm"
          style={{ borderColor: (showCustomInput || hasCustom) ? PRIMARY : "#e2e8f0", background: (showCustomInput || hasCustom) ? PRIMARY_LIGHT : "white" }}
        >
          {hasCustom && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
              style={{ background: PRIMARY, fontSize: "0.6rem" }}>
              {customList.length}
            </span>
          )}
          <span className="text-xl leading-none">🔧</span>
          <span className="text-xs font-bold leading-none" style={{ color: (showCustomInput || hasCustom) ? PRIMARY : "#94a3b8" }}>{EQ_ENTRIES.length + 1}.</span>
          <span className="leading-tight font-medium" style={{ fontSize: "0.65rem", lineHeight: 1.2, color: (showCustomInput || hasCustom) ? PRIMARY : "#64748b" }}>기타</span>
        </button>
      </div>

      {/* 기타 직접입력 영역 */}
      {showCustomInput && (
        <div className="mt-2 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 space-y-2" style={{ background: "#fafafa" }}>
          {/* 추가된 기타 항목 */}
          {customList.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {customList.map((item) => (
                <span key={item} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: "white", color: PRIMARY, border: `1px solid ${PRIMARY}55` }}>
                  🔧 {item}
                  <button onClick={() => onCustomRemove(item)} className="ml-0.5 hover:text-red-400 transition-colors leading-none">×</button>
                </span>
              ))}
            </div>
          )}
          {/* 입력 */}
          <div className="flex gap-2">
            <input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
              placeholder="장비명 입력 후 Enter 또는 추가 (예: 고소작업차, 지게차)"
              className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 bg-white"
            />
            <button
              onClick={handleAdd}
              disabled={!customInput.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex-shrink-0"
              style={{ background: customInput.trim() ? PRIMARY : "#cbd5e1" }}
            >추가</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 섹션 헤더 ─────────────────────────────────────────────────
function SectionHeader({ icon, title, badge }: { icon: string; title: string; badge?: string }) {
  return (
    <div className="ptw-section-card-header">
      <span className="text-base">{icon}</span>
      <span>{title}</span>
      {badge && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium ml-1">{badge}</span>}
    </div>
  );
}

// ── 엑셀 내보내기 ─────────────────────────────────────────────
async function exportPermitExcel(permit: WorkPermit) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  // ── 시트 1: 기본정보 ─────────────────────────────────────────
  const allTypesForExport = [permit.type, ...(permit.extraTypes ?? [])];
  const basicRows = [
    { 항목: "허가서 유형",    값: allTypesForExport.map((t) => WORK_PERMIT_TYPE_LABELS[t]).join(" + ") },
    { 항목: "기타 작업명",    값: permit.customTypeName },
    { 항목: "상태",           값: WORK_PERMIT_STATUS_LABELS[permit.status] },
    { 항목: "작업명",         값: permit.title },
    { 항목: "사업장명",       값: permit.siteName },
    { 항목: "작업 장소",      값: permit.location },
    { 항목: "협력사",         값: permit.contractor },
    { 항목: "투입 인원",      값: permit.personnelCount },
    { 항목: "작업 시작일시",  값: [permit.startDate, permit.startTime].filter(Boolean).join(" ") },
    { 항목: "작업 종료일시",  값: [permit.endDate,   permit.endTime  ].filter(Boolean).join(" ") },
    { 항목: "작업 개요",      값: permit.description },
    { 항목: "투입 장비",      값: [...(permit.equipmentTypes ?? []).map((k) => CONSTRUCTION_EQUIPMENT_TYPES[k as keyof typeof CONSTRUCTION_EQUIPMENT_TYPES]?.label ?? k), ...(permit.equipmentCustomList ?? [])].join(", ") },
    { 항목: "신청인 성명",    값: permit.requestedBy },
    { 항목: "신청인 부서",    값: permit.requestedByDept },
    { 항목: "신청인 직책",    값: permit.requestedByPosition },
    { 항목: "연동 작업계획서", 값: permit.workPlanTitle || permit.workPlanId || "" },
    { 항목: "추가 안전조치",  값: permit.additionalMeasures },
  ];
  // 병합 유형별 특화 확인사항
  const seenSpecKeys = new Set<string>();
  for (const t of allTypesForExport) {
    for (const f of PERMIT_SPECIFICS_FIELDS[t] ?? []) {
      if (!seenSpecKeys.has(f.key)) {
        seenSpecKeys.add(f.key);
        basicRows.push({ 항목: `[${WORK_PERMIT_TYPE_LABELS[t]}] ${f.label}`, 값: permit.specifics[f.key] ?? "" });
      }
    }
  }
  const ws1 = XLSX.utils.json_to_sheet(basicRows);
  ws1["!cols"] = [{ wch: 22 }, { wch: 52 }];
  XLSX.utils.book_append_sheet(wb, ws1, "기본정보");

  // ── 시트 2: 안전체크 ─────────────────────────────────────────
  type CheckRow = { 구분: string; 항목: string; 확인: string };
  const checkRows: CheckRow[] = [];
  for (const item of COMMON_SAFETY_MEASURES) {
    checkRows.push({ 구분: "공통 안전조치", 항목: item, 확인: permit.safetyMeasures?.[item] ? "Y" : "" });
  }
  for (const t of allTypesForExport) {
    for (const item of (PERMIT_SAFETY_CHECKLIST[t] ?? [])) {
      checkRows.push({ 구분: `${WORK_PERMIT_TYPE_LABELS[t]} 체크리스트`, 항목: item, 확인: permit.safetyChecklist?.[item] || "" });
    }
  }
  for (const item of (permit.customChecklistItems ?? [])) {
    checkRows.push({ 구분: "기타(직접입력)", 항목: item, 확인: permit.safetyChecklist?.[item] || "" });
  }
  const ws2 = XLSX.utils.json_to_sheet(checkRows);
  ws2["!cols"] = [{ wch: 28 }, { wch: 50 }, { wch: 6 }];
  XLSX.utils.book_append_sheet(wb, ws2, "안전체크");

  // ── 시트 3: 가스농도측정 (밀폐공간·화기 전용) ───────────────
  if (allTypesForExport.some((t) => t === "confined_space" || t === "hot_work")) {
    const gasRows = permit.gasMeasurements.map((gm) => ({
      가스종류: gm.gasType,
      측정값:   gm.value,
      단위:     gm.unit,
      판정기준: gm.standard,
      합부:     gm.pass ? "적합" : "미확인",
      측정자:   gm.measuredBy,
      확인자:   gm.confirmedBy,
    }));
    const ws3 = XLSX.utils.json_to_sheet(gasRows.length ? gasRows : [{ 가스종류: "", 측정값: "", 단위: "", 판정기준: "", 합부: "", 측정자: "", 확인자: "" }]);
    ws3["!cols"] = [{ wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 22 }, { wch: 8 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws3, "가스농도측정");
  }

  // ── 시트 4: 서명결재 ─────────────────────────────────────────
  const sigRows = PERMIT_SIGNATURE_STAGES.map((stage) => {
    const sig = permit.signatures.find((s) => s.stage === stage.stage);
    const statusLabel = sig?.status === "signed" ? "서명완료" : sig?.status === "pending" ? "서명대기" : "미진행";
    return {
      단계:     stage.stage,
      역할:     stage.role,
      단계명:   stage.label,
      성명:     sig?.name       ?? "",
      부서:     sig?.department ?? "",
      직책:     sig?.position   ?? "",
      상태:     statusLabel,
      서명일시: sig?.signedAt ? new Date(sig.signedAt).toLocaleString("ko-KR") : "",
      검토의견: sig?.comment    ?? "",
    };
  });
  const ws4 = XLSX.utils.json_to_sheet(sigRows);
  ws4["!cols"] = [{ wch: 5 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 10 }, { wch: 22 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws4, "서명결재");

  const typeLabel = WORK_PERMIT_TYPE_LABELS[permit.type];
  const docTitle  = permit.title || permit.id;
  XLSX.writeFile(wb, `작업허가서_${typeLabel}_${docTitle}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ── PermitDetail ──────────────────────────────────────────────
function PermitDetail({ permit, onClose, mode = "modal" }: { permit: WorkPermit; onClose: () => void; mode?: "modal" | "page" }) {
  const { updatePermit, updateSignature, updateGasMeasurement, customPermitTypes, specificsOverrides } = useWorkPermitStore();

  const upd = (key: keyof WorkPermit, val: unknown) => updatePermit(permit.id, { [key]: val });

  type CheckState = "양호" | "불량" | "해당없음" | "";
  const setChecklistValue = (item: string, val: CheckState) => {
    upd("safetyChecklist", { ...permit.safetyChecklist, [item]: val });
  };
  const toggleMeasure = (item: string) => {
    upd("safetyMeasures", { ...permit.safetyMeasures, [item]: !permit.safetyMeasures[item] });
  };
  const addCustomItem = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed || (permit.customChecklistItems ?? []).includes(trimmed)) return;
    upd("customChecklistItems", [...(permit.customChecklistItems ?? []), trimmed]);
    upd("safetyChecklist", { ...permit.safetyChecklist, [trimmed]: "" });
  };
  const removeCustomItem = (item: string) => {
    upd("customChecklistItems", (permit.customChecklistItems ?? []).filter((i) => i !== item));
    const next = { ...permit.safetyChecklist };
    delete next[item];
    upd("safetyChecklist", next);
  };

  // ── 복수 유형 관리 ───────────────────────────────────────────
  const allTypes = [permit.type, ...(permit.extraTypes ?? [])];
  const selectedCustomTypes = customPermitTypes.filter(ct => (permit.customTypeIds ?? []).includes(ct.id));
  const addExtraType = (t: WorkPermitType) => {
    const newChecklist = { ...permit.safetyChecklist };
    for (const item of PERMIT_SAFETY_CHECKLIST[t] ?? []) {
      if (!(item in newChecklist)) newChecklist[item] = "";
    }
    const updates: Partial<WorkPermit> = {
      extraTypes: [...(permit.extraTypes ?? []), t],
      safetyChecklist: newChecklist,
    };
    const needsGasNow = [...allTypes, t].some((x) => x === "confined_space" || x === "hot_work");
    if (needsGasNow && permit.gasMeasurements.length === 0) {
      updates.gasMeasurements = GAS_STANDARDS.map((g) => ({
        gasType: g.type, value: "", unit: g.unit, standard: g.standard,
        measuredAt: "", measuredBy: "", confirmedBy: "", pass: false,
      }));
    }
    updatePermit(permit.id, updates);
  };

  // 병합된 유형별 특화 확인사항 (키 중복 제거) — 엑셀 export 용 flat 목록
  const mergedSpecificsFields = (() => {
    const seen = new Set<string>();
    const result: { key: string; label: string; fromType: WorkPermitType; fromCustomId?: string }[] = [];
    // Built-in types
    for (const t of allTypes) {
      const fields = specificsOverrides[t] ?? PERMIT_SPECIFICS_FIELDS[t] ?? [];
      for (const f of fields) {
        if (!seen.has(f.key)) {
          seen.add(f.key);
          result.push({ ...f, fromType: t });
        }
      }
    }
    // Custom types
    for (const ct of selectedCustomTypes) {
      const fields = ct.specificFields ?? [];
      for (const f of fields) {
        if (!seen.has(`${ct.id}_${f.key}`)) {
          seen.add(`${ct.id}_${f.key}`);
          result.push({ key: `${ct.id}_${f.key}`, label: f.label, fromType: "general" as WorkPermitType });
        }
      }
    }
    return result;
  })();

  // 유형별 그룹 (렌더링용 — 키 중복은 먼저 등장한 유형에 귀속)
  const specificsGroups = (() => {
    const seen = new Set<string>();
    const groups: { typeId: string; label: string; icon: string; fields: { key: string; label: string }[]; isCustom?: boolean }[] = [];
    for (const t of allTypes) {
      const fields = (specificsOverrides[t] ?? PERMIT_SPECIFICS_FIELDS[t] ?? []).filter((f) => {
        if (seen.has(f.key)) return false;
        seen.add(f.key);
        return true;
      });
      if (fields.length > 0) groups.push({ typeId: t, label: WORK_PERMIT_TYPE_LABELS[t].replace(" 허가서",""), icon: WORK_PERMIT_TYPE_ICONS[t], fields });
    }
    for (const ct of selectedCustomTypes) {
      const fields = ct.specificFields.filter((f) => {
        const k = `${ct.id}_${f.key}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      }).map(f => ({ key: `${ct.id}_${f.key}`, label: f.label }));
      if (fields.length > 0) groups.push({ typeId: ct.id, label: ct.label, icon: ct.icon, fields, isCustom: true });
    }
    return groups;
  })();

  const [openSpecifics, setOpenSpecifics] = useState<Set<string>>(
    () => new Set(allTypes),
  );
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set());
  const toggleNote = (t: string) =>
    setOpenNotes((prev) => { const next = new Set(prev); next.has(t) ? next.delete(t) : next.add(t); return next; });
  const toggleSpecificsGroup = (t: string) =>
    setOpenSpecifics((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });

  // ── 작업계획서 불러오기 ────────────────────────────────────────
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [syncedId, setSyncedId] = useState<string | null>(null);

  const handleSyncFromCard = (
    cardId: string,
    cardTitle: string,
    formData: Record<string, unknown>,
  ) => {
    const ov = (formData["overview"] as Record<string, string>) ?? {};
    const personnel = (formData["work_personnel"] as { rows?: { id: string; name: string; position: string; role: string; contact: string }[] }) ?? {};
    const firstRow = personnel.rows?.[0];
    updatePermit(permit.id, {
      workPlanId:            cardId,
      workPlanTitle:         ov.title || cardTitle,
      title:                 ov.title                          || permit.title,
      siteName:              ov.siteName                       || permit.siteName,
      location:              ov.location                       || permit.location,
      contractor:            ov.contractor                     || permit.contractor,
      startDate:             ov.workStartDate || ov.startDate  || permit.startDate,
      endDate:               ov.workEndDate   || ov.endDate    || permit.endDate,
      description:           ov.description                    || permit.description,
      requestedBy:           ov.author        || firstRow?.name     || permit.requestedBy,
      requestedByDept:       ov.team          || firstRow?.position || permit.requestedByDept,
      requestedByPosition:   firstRow?.role                    || permit.requestedByPosition,
      personnelCount:        ov.headCount                      || permit.personnelCount,
    });
    setSyncedId(cardId);
    setShowPlanPicker(false);
    setTimeout(() => setSyncedId(null), 2500);
  };

  const customItems = permit.customChecklistItems ?? [];
  const customCheckedCount = customItems.filter((i) => !!permit.safetyChecklist?.[i]).length;
  const checkedCount = Object.entries(permit.safetyChecklist ?? {}).filter(([k, v]) => !!v && !customItems.includes(k)).length;
  const badCount = Object.entries(permit.safetyChecklist ?? {}).filter(([, v]) => v === "불량").length;
  const allChecklistItems = [...new Set(allTypes.flatMap((t) => PERMIT_SAFETY_CHECKLIST[t] ?? []))];
  const totalCount = allChecklistItems.length;
  const measuresCheckedCount = Object.values(permit.safetyMeasures ?? {}).filter(Boolean).length;
  const isLegal = allTypes.some((t) => LEGALLY_REQUIRED_PERMIT_TYPES.includes(t));
  const needsGas = allTypes.some((t) => t === "confined_space" || t === "hot_work");

  const activeStage = permit.signatures.find((s) => s.status === "pending")?.stage ?? 6;

  const handleSignStage = (stage: number) => {
    const sig = permit.signatures.find((s) => s.stage === stage);
    if (!sig || sig.status === "signed") return;
    updateSignature(permit.id, stage, { status: "signed", signedAt: new Date().toISOString() });
    if (stage === 4) {
      const d = permit.approvalDecision;
      if (d === "approved") updatePermit(permit.id, { status: "approved" });
      else if (d === "conditionally_approved") updatePermit(permit.id, { status: "conditionally_approved" });
      else if (d === "rejected") updatePermit(permit.id, { status: "rejected" });
    } else if (stage === 5) {
      updatePermit(permit.id, { status: "completed" });
    } else if (stage === 1) {
      updatePermit(permit.id, { status: "pending" });
    }
  };

  const inp = "ptw-input w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white";

  return (
    <div className={mode === "page" ? "h-full flex flex-col" : "fixed inset-0 z-50 flex items-center justify-center"} style={mode === "modal" ? { background: "rgba(0,0,0,0.6)" } : {}}>
      <div className={mode === "page" ? "flex flex-col h-full w-full bg-white overflow-hidden" : "bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-3xl mx-4"} style={mode === "modal" ? { maxHeight: "92vh" } : {}}>

        {/* ── 헤더 ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{WORK_PERMIT_TYPE_ICONS[permit.type]}</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-800 text-sm">{WORK_PERMIT_TYPE_LABELS[permit.type]}</h3>
                {permit.customTypeName && permit.customTypeName.split(",").map((n) => n.trim()).filter(Boolean).map((name) => (
                  <span key={name} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #86efac" }}>
                    🖊️ {name}
                  </span>
                ))}
                {isLegal && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">⚖️ 법정의무</span>}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: STATUS_STYLE[permit.status].border + "44", color: STATUS_STYLE[permit.status].text }}>
                  {WORK_PERMIT_STATUS_LABELS[permit.status]}
                </span>
                {/* 서명 진행 */}
                <div className="flex items-center gap-0.5">
                  {PERMIT_SIGNATURE_STAGES.map((s) => {
                    const done = permit.signatures.find((sg) => sg.stage === s.stage)?.status === "signed";
                    return <div key={s.stage} className="w-2 h-2 rounded-full" style={{ background: done ? "#10b981" : "#e2e8f0" }} title={s.role} />;
                  })}
                  <span className="text-xs text-slate-400 ml-1">{permit.signatures.filter((s) => s.status === "signed").length}/5</span>
                </div>
                {permit.workPlanTitle && (
                  <Link href="/work-plan/create" className="text-xs text-teal-600 hover:text-teal-700 hover:underline" title="연동된 작업계획서 보기">
                    📋 {permit.workPlanTitle}
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => exportPermitExcel(permit)}
              className="text-xs px-3 py-1.5 rounded-xl border font-medium transition-all hover:opacity-80"
              style={{ borderColor: "#e2e8f0", color: "#475569" }}
              title="허가서 데이터를 엑셀로 내보내기"
            >
              📊 엑셀
            </button>
            {mode === "page" ? (
              <button onClick={onClose} className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">← 목록으로</button>
            ) : (
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl w-8 h-8 flex items-center justify-center">✕</button>
            )}
          </div>
        </div>

        {/* ── 본문 (단일 스크롤) ── */}
        <div className="flex-1 overflow-y-auto" style={{ background: "#f4f6f8" }}>
          <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">

            {/* ══ 섹션 1: 기본 정보 ══ */}
            <div className="ptw-section-card">
              <SectionHeader icon="📋" title="기본 정보" />
              <div className="ptw-section-card-body space-y-3">

              {/* 허가서 유형 선택 그리드 */}
              <PermitTypeGrid
                permit={permit}
                upd={upd}
                updatePermit={updatePermit}
                addExtraType={addExtraType}
                customTypes={customPermitTypes}
                selectedCustomIds={permit.customTypeIds ?? []}
                onToggleCustom={(id) => {
                  const cur = permit.customTypeIds ?? [];
                  upd("customTypeIds", cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
                }}
              />

              {/* 작업계획서 불러오기 */}
              {(() => {
                const { formData: curFD, savedCards } = useWorkPlanStore.getState();
                const curOv = (curFD["overview"] as Record<string, string>) ?? {};
                const hasCurrent = !!(curOv.title || curOv.siteName);
                const allCards = [
                  ...(hasCurrent ? [{ id: "current", title: curOv.title || "(현재 작업계획서)", formData: curFD as Record<string, unknown>, savedAt: new Date().toISOString() }] : []),
                  ...[...savedCards].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()),
                ];
                const linkedCard = allCards.find((c) => c.id === permit.workPlanId);
                return (
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: PRIMARY + "33" }}>
                    {/* 헤더 행 */}
                    <div className="flex items-center justify-between px-4 py-2.5" style={{ background: PRIMARY_LIGHT }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm">📋</span>
                        <span className="text-xs font-semibold" style={{ color: PRIMARY }}>작업계획서 연동</span>
                        {linkedCard && (
                          <span className="text-xs text-slate-500 truncate max-w-[200px]">— {linkedCard.title || linkedCard.id}</span>
                        )}
                        {syncedId && (
                          <span className="text-xs font-semibold text-emerald-600 flex-shrink-0">✓ 불러옴</span>
                        )}
                      </div>
                      <button
                        onClick={() => setShowPlanPicker((v) => !v)}
                        className="flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                        style={{
                          background: showPlanPicker ? PRIMARY : "white",
                          color: showPlanPicker ? "white" : PRIMARY,
                          border: `1px solid ${PRIMARY}66`,
                        }}
                      >
                        {showPlanPicker ? "▲ 닫기" : "⬇ 불러오기"}
                      </button>
                    </div>

                    {/* 피커 드롭다운 */}
                    {showPlanPicker && (
                      <div className="divide-y divide-slate-100" style={{ background: "white" }}>
                        {allCards.length === 0 ? (
                          <p className="px-4 py-3 text-xs text-slate-400 text-center">저장된 작업계획서가 없습니다</p>
                        ) : (
                          allCards.map((card) => {
                            const ov2 = (card.formData["overview"] as Record<string, string>) ?? {};
                            const dateStr = card.id === "current"
                              ? "편집 중"
                              : new Date(card.savedAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
                            const isLinked = permit.workPlanId === card.id;
                            return (
                              <button
                                key={card.id}
                                onClick={() => handleSyncFromCard(card.id, card.title, card.formData)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                                style={{ background: isLinked ? PRIMARY_LIGHT : "white" }}
                              >
                                <span className="text-sm flex-shrink-0">{card.id === "current" ? "✏️" : "📄"}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold truncate" style={{ color: isLinked ? PRIMARY : "#334155" }}>
                                    {ov2.title || card.title || "(제목 없음)"}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    {ov2.siteName && <span className="text-xs text-slate-400">📍 {ov2.siteName}</span>}
                                    {(ov2.workStartDate || ov2.startDate) && (
                                      <span className="text-xs text-slate-400">📅 {ov2.workStartDate || ov2.startDate}</span>
                                    )}
                                    {ov2.contractor && <span className="text-xs text-slate-400">🏢 {ov2.contractor}</span>}
                                    <span className="text-xs text-slate-300">{dateStr}</span>
                                  </div>
                                </div>
                                {isLinked
                                  ? <span className="text-xs font-semibold flex-shrink-0" style={{ color: PRIMARY }}>연동됨</span>
                                  : <span className="text-xs text-slate-400 flex-shrink-0">불러오기 →</span>
                                }
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="ptw-label">작업명 (문서 제목)</label>
                  <input className={inp} value={permit.title} onChange={(e) => upd("title", e.target.value)} placeholder="예: 2026년 03월 23일 작업허가서" />
                </div>
                <div>
                  <label className="ptw-label">사업장명</label>
                  <input className={inp} value={permit.siteName} onChange={(e) => upd("siteName", e.target.value)} placeholder="현장명" />
                </div>
                <div>
                  <label className="ptw-label">작업 장소</label>
                  <input className={inp} value={permit.location} onChange={(e) => upd("location", e.target.value)} placeholder="상세 위치" />
                </div>
                <div>
                  <label className="ptw-label">협력사</label>
                  <input className={inp} value={permit.contractor} onChange={(e) => upd("contractor", e.target.value)} placeholder="시공사/협력업체" />
                </div>
                <div>
                  <label className="ptw-label">투입 인원</label>
                  <input className={inp} value={permit.personnelCount} onChange={(e) => upd("personnelCount", e.target.value)} placeholder="명" />
                </div>
                <div>
                  <label className="ptw-label">작업 시작일시</label>
                  <div className="flex gap-2">
                    <input type="date" className={inp} value={permit.startDate} onChange={(e) => upd("startDate", e.target.value)} />
                    <input type="time" className="ptw-input w-28 flex-shrink-0 px-2 py-2 border border-slate-200 rounded-lg text-sm bg-white" value={permit.startTime} onChange={(e) => upd("startTime", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="ptw-label">작업 종료일시</label>
                  <div className="flex gap-2">
                    <input type="date" className={inp} value={permit.endDate} onChange={(e) => upd("endDate", e.target.value)} />
                    <input type="time" className="ptw-input w-28 flex-shrink-0 px-2 py-2 border border-slate-200 rounded-lg text-sm bg-white" value={permit.endTime} onChange={(e) => upd("endTime", e.target.value)} />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="ptw-label">작업 개요</label>
                  <textarea className="w-full px-3 py-2 ptw-input border border-slate-200 rounded-lg text-sm bg-white resize-none" rows={3} value={permit.description} onChange={(e) => upd("description", e.target.value)} placeholder="작업 내용, 계획 및 순서 등" />
                </div>
                <div className="col-span-2">
                  <label className="ptw-label">투입 장비</label>
                  <EquipmentPicker
                    selected={permit.equipmentTypes ?? []}
                    customList={permit.equipmentCustomList ?? []}
                    onToggle={(key) => {
                      const cur = permit.equipmentTypes ?? [];
                      upd("equipmentTypes", cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]);
                    }}
                    onCustomAdd={(v) => upd("equipmentCustomList", [...(permit.equipmentCustomList ?? []), v])}
                    onCustomRemove={(v) => upd("equipmentCustomList", (permit.equipmentCustomList ?? []).filter((i) => i !== v))}
                  />
                </div>
              </div>

              </div>
            </div>

            {/* ══ 섹션 2: 안전 체크 ══ */}
            <div className="ptw-section-card">
              <SectionHeader icon="✅" title="안전 체크" badge={`${checkedCount + customCheckedCount + measuresCheckedCount}/${totalCount + customItems.length + COMMON_SAFETY_MEASURES.length}${badCount > 0 ? ` · 불량 ${badCount}건` : ""}`} />
              <div className="ptw-section-card-body space-y-4">

              {/* 안전조치 요구사항 */}
              <div className="mb-2">
                <p className="text-xs font-bold text-slate-600 mb-2">안전조치 요구사항 <span className="text-slate-400 font-normal">({measuresCheckedCount}/{COMMON_SAFETY_MEASURES.length})</span></p>
                <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                  {COMMON_SAFETY_MEASURES.map((item) => {
                    const checked = !!permit.safetyMeasures?.[item];
                    return (
                      <button key={item} onClick={() => toggleMeasure(item)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                        style={{ background: checked ? `${PRIMARY}06` : "white" }}>
                        <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                          style={{ background: checked ? PRIMARY : "white", borderColor: checked ? PRIMARY : "#cbd5e1" }}>
                          {checked && <span className="text-white" style={{ fontSize: 9 }}>✓</span>}
                        </div>
                        <span className="text-sm" style={{ color: checked ? "#334155" : "#94a3b8" }}>{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 기타 직접입력 체크항목 — 안전조치 바로 아래 */}
              <CustomChecklistSection
                items={customItems}
                checklist={permit.safetyChecklist ?? {}}
                onSetValue={setChecklistValue}
                onAdd={addCustomItem}
                onRemove={removeCustomItem}
                checkedCount={customCheckedCount}
              />

              {/* 추가 안전조치 */}
              <div>
                <label className="ptw-label">추가 안전조치 사항</label>
                <textarea className="ptw-input w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white resize-none" rows={3}
                  value={permit.additionalMeasures} onChange={(e) => upd("additionalMeasures", e.target.value)} placeholder="위 체크리스트 외 추가로 필요한 안전조치를 기입하세요" />
              </div>

              {/* 가스 측정 (밀폐공간/화기) */}
              {needsGas && (
                <div>
                  <p className="text-xs font-bold text-slate-600 mb-2">🧪 가스 농도 측정 <span className="text-red-500 font-normal text-xs ml-1">법적 의무</span></p>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="grid bg-slate-50 border-b border-slate-200" style={{ gridTemplateColumns: "80px 80px 1fr 80px 100px 100px" }}>
                      {["가스종류", "측정값", "판정기준", "합부", "측정자", "확인자"].map((h) => (
                        <div key={h} className="px-2 py-2 text-xs font-semibold text-slate-500 border-r border-slate-200 last:border-r-0">{h}</div>
                      ))}
                    </div>
                    {permit.gasMeasurements.map((gm, i) => (
                      <div key={i} className="grid border-b border-slate-100 last:border-b-0" style={{ gridTemplateColumns: "80px 80px 1fr 80px 100px 100px" }}>
                        <div className="px-2 py-2 text-xs font-semibold text-slate-700 border-r border-slate-100 flex items-center">{gm.gasType}</div>
                        <div className="px-1 py-1 border-r border-slate-100">
                          <input className="w-full px-1.5 py-1 border border-slate-200 rounded text-xs outline-none focus:border-teal-400"
                            value={gm.value} onChange={(e) => updateGasMeasurement(permit.id, i, { value: e.target.value })} placeholder={gm.unit} />
                        </div>
                        <div className="px-2 py-2 text-xs text-slate-500 border-r border-slate-100 flex items-center">{gm.standard}</div>
                        <div className="px-1 py-1 border-r border-slate-100 flex items-center justify-center">
                          <button onClick={() => updateGasMeasurement(permit.id, i, { pass: !gm.pass })}
                            className="text-xs px-2 py-1 rounded-full font-semibold"
                            style={{ background: gm.pass ? "#d1fae5" : "#fee2e2", color: gm.pass ? "#065f46" : "#991b1b" }}>
                            {gm.pass ? "적합" : "미확인"}
                          </button>
                        </div>
                        <div className="px-1 py-1 border-r border-slate-100">
                          <input className="w-full px-1.5 py-1 border border-slate-200 rounded text-xs outline-none focus:border-teal-400"
                            value={gm.measuredBy} onChange={(e) => updateGasMeasurement(permit.id, i, { measuredBy: e.target.value })} placeholder="측정자" />
                        </div>
                        <div className="px-1 py-1">
                          <input className="w-full px-1.5 py-1 border border-slate-200 rounded text-xs outline-none focus:border-teal-400"
                            value={gm.confirmedBy} onChange={(e) => updateGasMeasurement(permit.id, i, { confirmedBy: e.target.value })} placeholder="확인자" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* ══ 섹션 3: 유형별 확인사항 ══ */}
            {specificsGroups.length > 0 && (
            <div className="ptw-section-card">
              <SectionHeader icon="📝" title="유형별 확인사항" />
              <div className="ptw-section-card-body space-y-2">
                {specificsGroups.map(({ typeId, label, icon, fields, isCustom }) => {
                  const isOpen = openSpecifics.has(typeId);
                  const filledCount = fields.filter((f) => !!(permit.specifics[f.key] ?? "")).length;
                  const checkItems = !isCustom
                    ? (PERMIT_SAFETY_CHECKLIST[typeId as WorkPermitType] ?? [])
                    : (selectedCustomTypes.find(ct => ct.id === typeId)?.checklistItems ?? []);
                  const typeChecked = checkItems.filter((i) => !!permit.safetyChecklist?.[i]).length;
                  const typeBad = checkItems.filter((i) => permit.safetyChecklist?.[i] === "불량").length;
                  const isLegalType = !isCustom && LEGALLY_REQUIRED_PERMIT_TYPES.includes(typeId as WorkPermitType);
                  const totalFilled = filledCount + typeChecked;
                  const totalItems = fields.length + checkItems.length;
                  return (
                    <div key={typeId} className="rounded-xl border border-slate-200 overflow-hidden">
                      {/* 그룹 헤더 */}
                      <button
                        onClick={() => toggleSpecificsGroup(typeId)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                        style={{ background: isOpen ? PRIMARY_LIGHT : "white" }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{icon}</span>
                          <span className="text-xs font-semibold" style={{ color: isOpen ? PRIMARY : "#334155" }}>
                            {label}
                          </span>
                          {isLegalType && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">⚖️ 법정</span>
                          )}
                          {isCustom && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">커스텀</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: totalItems > 0 && totalFilled === totalItems ? "#10b981" : "#94a3b8" }}>
                            {totalFilled}/{totalItems}
                            {typeBad > 0 && <span className="text-red-500 ml-1">· 불량 {typeBad}건</span>}
                          </span>
                          <span className="text-xs text-slate-400">{isOpen ? "▲" : "▼"}</span>
                        </div>
                      </button>
                      {/* 펼쳐진 내용 */}
                      {isOpen && (
                        <div className="border-t border-slate-100" style={{ background: "white" }}>
                          {/* 확인사항 필드 */}
                          {fields.length > 0 && (
                            <div className="px-4 py-3 grid grid-cols-2 gap-3">
                              {fields.map((f) => (
                                <div key={f.key}>
                                  <label className="ptw-label">{f.label}</label>
                                  <input
                                    className={inp}
                                    value={permit.specifics[f.key] ?? ""}
                                    onChange={(e) => upd("specifics", { ...permit.specifics, [f.key]: e.target.value })}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          {/* 체크리스트 */}
                          {checkItems.length > 0 && (
                            <div className="px-4 pb-3">
                              <p className="text-xs font-bold text-slate-500 mb-2">
                                체크리스트
                                <span className="text-slate-400 font-normal ml-1">({typeChecked}/{checkItems.length})</span>
                                {typeBad > 0 && <span className="text-red-500 font-normal ml-1">· 불량 {typeBad}건</span>}
                              </p>
                              <ChecklistTable
                                items={checkItems}
                                checklist={permit.safetyChecklist ?? {}}
                                onSet={setChecklistValue}
                              />
                            </div>
                          )}
                          {/* 기타 특이사항 */}
                          <div className="border-t border-slate-50">
                            <button
                              type="button"
                              onClick={() => toggleNote(typeId)}
                              className="w-full flex items-center gap-1.5 px-4 py-2 text-left hover:bg-slate-50 transition-colors"
                            >
                              <span className="text-xs text-slate-400">{openNotes.has(typeId) ? "▲" : "▼"}</span>
                              <span className="text-xs font-medium text-slate-500">기타 특이사항</span>
                              {permit.specifics[`_note_${typeId}`] && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>입력됨</span>
                              )}
                            </button>
                            {openNotes.has(typeId) && (
                              <div className="px-4 pb-3">
                                <textarea
                                  rows={3}
                                  className={`${inp} resize-none`}
                                  placeholder="해당 유형에 대한 기타 특이사항, 추가 조치사항 등을 자유롭게 입력하세요"
                                  value={permit.specifics[`_note_${typeId}`] ?? ""}
                                  onChange={(e) => upd("specifics", { ...permit.specifics, [`_note_${typeId}`]: e.target.value })}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            )}

            {/* ══ 섹션 4: 서명 · 결재 ══ */}
            <div className="ptw-section-card">
              <SectionHeader icon="✍️" title="서명 · 결재" />
              <div className="ptw-section-card-body space-y-4">

              {/* 진행 표시 바 */}
              <div className="flex items-center gap-1 mb-6 px-2">
                {PERMIT_SIGNATURE_STAGES.map((stage, i) => {
                  const sig = permit.signatures.find((s) => s.stage === stage.stage);
                  const done = sig?.status === "signed";
                  const active = stage.stage === activeStage;
                  return (
                    <React.Fragment key={stage.stage}>
                      <div className="flex flex-col items-center" style={{ minWidth: 56 }}>
                        <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm"
                          style={{ background: done ? "#10b981" : active ? PRIMARY : "#f8fafc", borderColor: done ? "#10b981" : active ? PRIMARY : "#e2e8f0", color: done || active ? "white" : "#94a3b8" }}>
                          {done ? "✓" : stage.icon}
                        </div>
                        <span className="text-xs mt-1 text-center leading-tight" style={{ color: done ? "#10b981" : active ? PRIMARY : "#94a3b8", fontWeight: active || done ? 600 : 400 }}>
                          {stage.role}
                        </span>
                      </div>
                      {i < PERMIT_SIGNATURE_STAGES.length - 1 && (
                        <div className="flex-1 h-0.5 mb-4" style={{ background: done ? "#10b981" : "#e2e8f0" }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* 결재 결과 표시 (승인 완료 후) */}
              {permit.approvalDecision && permit.signatures.find((s) => s.stage === 4)?.status === "signed" && (
                <div className="rounded-xl border p-4 mb-4" style={{
                  background: permit.approvalDecision === "approved" ? "#f0fdf4" : permit.approvalDecision === "conditionally_approved" ? "#fffbeb" : "#fff1f2",
                  borderColor: permit.approvalDecision === "approved" ? "#86efac" : permit.approvalDecision === "conditionally_approved" ? "#fcd34d" : "#fca5a5",
                }}>
                  <p className="text-sm font-bold" style={{ color: permit.approvalDecision === "approved" ? "#166534" : permit.approvalDecision === "conditionally_approved" ? "#92400e" : "#991b1b" }}>
                    {permit.approvalDecision === "approved" ? "✅ 승인됨" : permit.approvalDecision === "conditionally_approved" ? "⚠️ 조건부 승인됨" : "❌ 반려됨"}
                  </p>
                  {permit.approvalConditions && <p className="text-xs text-slate-600 mt-1">조건: {permit.approvalConditions}</p>}
                </div>
              )}

              {/* 단계별 서명 블록 */}
              <div className="space-y-3">
                {PERMIT_SIGNATURE_STAGES.map((stage) => {
                  const sig = permit.signatures.find((s) => s.stage === stage.stage) as PermitSignature;
                  if (!sig) return null;
                  const done = sig.status === "signed";
                  const isActive = stage.stage === activeStage;
                  const isApprovalStage = stage.stage === 4;

                  return (
                    <div key={stage.stage} className="rounded-xl border overflow-hidden"
                      style={{ borderColor: done ? "#34d399" : isActive ? PRIMARY : "#e2e8f0", opacity: stage.stage > activeStage && !done ? 0.5 : 1 }}>
                      {/* 단계 헤더 */}
                      <div className="px-4 py-3 flex items-center justify-between"
                        style={{ background: done ? "#f0fdf4" : isActive ? PRIMARY_LIGHT : "#f8fafc" }}>
                        <div className="flex items-center gap-2">
                          <span className="text-base">{stage.icon}</span>
                          <div>
                            <p className="text-sm font-bold" style={{ color: done ? "#065f46" : isActive ? PRIMARY : "#334155" }}>
                              단계 {stage.stage}: {stage.label}
                            </p>
                            <p className="text-xs text-slate-500">{stage.desc}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {done && <span className="text-xs text-emerald-600 font-semibold">✓ 서명완료 {sig.signedAt ? new Date(sig.signedAt).toLocaleDateString("ko-KR") : ""}</span>}
                          {!done && isActive && (
                            <button onClick={() => handleSignStage(stage.stage)}
                              disabled={isApprovalStage && !permit.approvalDecision}
                              className="text-xs px-3 py-1.5 rounded-xl font-semibold text-white transition-colors"
                              style={{ background: (isApprovalStage && !permit.approvalDecision) ? "#cbd5e1" : PRIMARY, cursor: (isApprovalStage && !permit.approvalDecision) ? "not-allowed" : "pointer" }}>
                              서명 확인
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 서명자 정보 */}
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="ptw-label">성명</label>
                            <input className="ptw-input w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
                              value={sig.name} onChange={(e) => updateSignature(permit.id, stage.stage, { name: e.target.value })}
                              placeholder={stage.role} readOnly={done} style={{ background: done ? "#f8fafc" : "white" }} />
                          </div>
                          <div>
                            <label className="ptw-label">부서</label>
                            <input className="ptw-input w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
                              value={sig.department} onChange={(e) => updateSignature(permit.id, stage.stage, { department: e.target.value })}
                              placeholder="부서명" readOnly={done} style={{ background: done ? "#f8fafc" : "white" }} />
                          </div>
                          <div>
                            <label className="ptw-label">직책</label>
                            <input className="ptw-input w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
                              value={sig.position} onChange={(e) => updateSignature(permit.id, stage.stage, { position: e.target.value })}
                              placeholder="직책" readOnly={done} style={{ background: done ? "#f8fafc" : "white" }} />
                          </div>
                        </div>

                        {/* 결재 결과 선택 */}
                        {isApprovalStage && !done && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                            <p className="text-xs font-bold text-amber-800 mb-2">결재 결과 *</p>
                            <div className="flex gap-2 mb-2">
                              {(["approved", "conditionally_approved", "rejected"] as PermitApprovalDecision[]).map((d) => {
                                const labels: Record<PermitApprovalDecision, string> = { approved: "✅ 승인", conditionally_approved: "⚠️ 조건부승인", rejected: "❌ 반려" };
                                const colors: Record<PermitApprovalDecision, string> = { approved: "#10b981", conditionally_approved: "#f59e0b", rejected: "#ef4444" };
                                const sel = permit.approvalDecision === d;
                                return (
                                  <button key={d} onClick={() => upd("approvalDecision", d)}
                                    className="flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-all"
                                    style={{ borderColor: sel ? colors[d] : "#e2e8f0", background: sel ? colors[d] + "18" : "white", color: sel ? colors[d] : "#64748b" }}>
                                    {labels[d]}
                                  </button>
                                );
                              })}
                            </div>
                            {permit.approvalDecision === "conditionally_approved" && (
                              <textarea className="w-full px-3 py-2 border border-amber-200 rounded-lg text-xs outline-none focus:border-amber-400 resize-none bg-white" rows={2}
                                value={permit.approvalConditions} onChange={(e) => upd("approvalConditions", e.target.value)}
                                placeholder="조건부 승인 조건을 구체적으로 기입하세요" />
                            )}
                          </div>
                        )}

                        {/* 완료 단계 - 무사종료 확인 */}
                        {stage.stage === 5 && !done && (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                            <p className="text-xs font-bold text-emerald-800 mb-2">작업완료 확인 (무사종료)</p>
                            <textarea className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-xs outline-none focus:border-emerald-400 resize-none bg-white" rows={2}
                              value={permit.completionNote} onChange={(e) => upd("completionNote", e.target.value)}
                              placeholder="작업 완료 상태, 현장 복구 확인사항 등을 기입하세요" />
                          </div>
                        )}

                        {/* 검토 의견 */}
                        <div>
                          <label className="ptw-label">
                            {isApprovalStage ? "결재 코멘트" : stage.stage === 5 ? "완료 확인 의견" : "검토 의견"}
                          </label>
                          <textarea className="ptw-input w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm bg-white resize-none"
                            style={{ background: done ? "#f8fafc" : "white" }}
                            rows={2} value={sig.comment}
                            onChange={(e) => updateSignature(permit.id, stage.stage, { comment: e.target.value })}
                            placeholder={done ? "(코멘트 없음)" : "검토 의견을 입력하세요"}
                            readOnly={done} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ── PermitDetailPage (named export for full-page use) ─────────
export function PermitDetailPage({ permit, onClose }: { permit: WorkPermit; onClose: () => void }) {
  return <PermitDetail permit={permit} onClose={onClose} mode="page" />;
}

// ── WorkPermitEditor (default export) ─────────────────────────
export default function WorkPermitEditor() {
  const { permits, deletePermit } = useWorkPermitStore();
  const [openId, setOpenId] = useState<string | null>(null);

  const openPermit = permits.find((p) => p.id === openId) ?? null;

  if (permits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
        <p style={{ fontSize: 36 }}>📋</p>
        <p className="text-sm text-center text-slate-500">작업허가서가 없습니다.<br />작업계획서에서 허가서를 생성하세요.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {permits.map((p) => (
        <PermitCard
          key={p.id}
          permit={p}
          onOpen={() => setOpenId(p.id)}
          onDelete={() => deletePermit(p.id)}
        />
      ))}
      {openPermit && (
        <PermitDetail permit={openPermit} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}
