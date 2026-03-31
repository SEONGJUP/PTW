"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  useWorkPermitStore,
  WorkPermitType,
  WORK_PERMIT_TYPE_LABELS,
  WORK_PERMIT_TYPE_ICONS,
  PERMIT_SAFETY_CHECKLIST,
  LEGALLY_REQUIRED_PERMIT_TYPES,
  PERMIT_SPECIFICS_FIELDS,
  CustomPermitType,
} from "@/store/workPermitStore";

const PRIMARY = "#00B7AF";
const PRIMARY_LIGHT = "#E6FAF9";

const BUILT_IN_META: { type: WorkPermitType; desc: string; color: string }[] = [
  { type: "general",           desc: "일반 작업 허가",           color: "#64748b" },
  { type: "hot_work",          desc: "용접·절단 등 화기 작업",   color: "#ef4444" },
  { type: "electrical",        desc: "전기 차단·활선 작업",       color: "#f59e0b" },
  { type: "working_at_height", desc: "2m 이상 고소 작업",         color: "#8b5cf6" },
  { type: "excavation",        desc: "굴착·터파기 작업",          color: "#92400e" },
  { type: "confined_space",    desc: "맨홀·탱크·밀폐공간 진입",  color: "#1d4ed8" },
  { type: "heavy_load",        desc: "중량물 양중·운반",          color: "#0f766e" },
  { type: "night_overtime",    desc: "야간·조출·휴일 작업",       color: "#475569" },
  { type: "short_time",        desc: "단시간 작업",               color: "#0369a1" },
];

const ICON_OPTIONS = ["📋","🔥","⚡","🏗️","⛏️","🚪","🏋️","🌙","⏱️","🔧","🛠️","🎯","⚠️","🔒","🌿","💡","🔬","🏭"];

type SelectedItem =
  | { kind: "builtin"; typeId: WorkPermitType }
  | { kind: "custom";  typeId: string };

export default function PermitSettingsPage() {
  const {
    checklistOverrides, setChecklistOverride, resetChecklistOverride,
    specificsOverrides, setSpecificsOverride, resetSpecificsOverride,
    customPermitTypes, addCustomPermitType, updateCustomPermitType, deleteCustomPermitType,
  } = useWorkPermitStore();

  const [selected, setSelected] = useState<SelectedItem | null>(null);

  // 새 유형 추가 모드
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState("📋");
  const [newDesc, setNewDesc] = useState("");

  // 체크리스트 편집
  const [clInput, setClInput] = useState("");

  // 확인사항 편집
  const [sfKey, setSfKey] = useState("");
  const [sfLabel, setSfLabel] = useState("");

  // 현재 선택 정보
  const isBuiltin = selected?.kind === "builtin";
  const isCustom = selected?.kind === "custom";
  const builtinType = isBuiltin ? (selected as { kind: "builtin"; typeId: WorkPermitType }).typeId : null;
  const customType = isCustom ? customPermitTypes.find(ct => ct.id === (selected as { kind: "custom"; typeId: string }).typeId) ?? null : null;

  const selectedLabel = builtinType
    ? WORK_PERMIT_TYPE_LABELS[builtinType]
    : customType?.label ?? "";
  const selectedIcon = builtinType
    ? WORK_PERMIT_TYPE_ICONS[builtinType]
    : customType?.icon ?? "";
  const isLegal = builtinType ? LEGALLY_REQUIRED_PERMIT_TYPES.includes(builtinType) : false;

  // 현재 유효한 체크리스트
  const typeId = builtinType ?? customType?.id ?? "";
  const defaultChecklist: string[] = builtinType
    ? PERMIT_SAFETY_CHECKLIST[builtinType] ?? []
    : customType?.checklistItems ?? [];
  const effectiveChecklist: string[] = checklistOverrides[typeId] ?? defaultChecklist;
  const isClOverridden = !!checklistOverrides[typeId];

  // 현재 유효한 확인사항 필드
  const defaultSpecifics: { key: string; label: string }[] = builtinType
    ? PERMIT_SPECIFICS_FIELDS[builtinType] ?? []
    : customType?.specificFields ?? [];
  const effectiveSpecifics: { key: string; label: string }[] = specificsOverrides[typeId] ?? defaultSpecifics;
  const isSfOverridden = !!specificsOverrides[typeId];

  const toggleClItem = (item: string) => {
    if (!typeId) return;
    const current = checklistOverrides[typeId] ?? [...defaultChecklist];
    const next = current.includes(item) ? current.filter((i) => i !== item) : [...current, item];
    setChecklistOverride(typeId, next);
  };

  const addClItem = () => {
    if (!typeId || !clInput.trim()) return;
    const current = checklistOverrides[typeId] ?? [...defaultChecklist];
    if (current.includes(clInput.trim())) return;
    setChecklistOverride(typeId, [...current, clInput.trim()]);
    setClInput("");
  };

  const addSfField = () => {
    const key = sfKey.trim() || `field_${Date.now()}`;
    const label = sfLabel.trim();
    if (!typeId || !label) return;
    const current = effectiveSpecifics;
    if (current.find(f => f.key === key)) return;
    setSpecificsOverride(typeId, [...current, { key, label }]);
    setSfKey("");
    setSfLabel("");
  };

  const removeSfField = (key: string) => {
    setSpecificsOverride(typeId, effectiveSpecifics.filter(f => f.key !== key));
  };

  const handleAddCustomType = () => {
    if (!newLabel.trim()) return;
    addCustomPermitType({
      label: newLabel.trim(),
      icon: newIcon,
      desc: newDesc.trim() || newLabel.trim(),
      checklistItems: [],
      specificFields: [],
    });
    setNewLabel("");
    setNewIcon("📋");
    setNewDesc("");
    setShowAddForm(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "#f8fafc" }}>
      {/* 헤더 */}
      <div className="px-5 py-3 border-b bg-white border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/work-plan/permits" className="text-slate-400 hover:text-teal-500 text-sm">← 작업허가서</Link>
          <span className="text-slate-300">/</span>
          <h1 className="text-sm font-bold text-slate-800">🔑 작업허가서 상세설정</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">허가서 유형별 안전 체크리스트 및 확인사항 필드를 관리합니다</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 좌: 유형 목록 */}
        <div className="flex-shrink-0 bg-white border-r border-slate-200 overflow-y-auto flex flex-col" style={{ width: 240 }}>
          <div className="px-3 py-2 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            기본 제공 유형
          </div>
          <div className="p-2 space-y-1">
            {BUILT_IN_META.map(({ type, desc }) => {
              const active = selected?.kind === "builtin" && selected.typeId === type;
              const clMod = !!checklistOverrides[type];
              const sfMod = !!specificsOverrides[type];
              return (
                <button
                  key={type}
                  onClick={() => { setSelected({ kind: "builtin", typeId: type }); setClInput(""); setSfKey(""); setSfLabel(""); }}
                  className="w-full text-left rounded-xl px-3 py-2.5 transition-all border"
                  style={{
                    background: active ? PRIMARY : (clMod || sfMod) ? `${PRIMARY}08` : "#f8fafc",
                    borderColor: active ? PRIMARY : (clMod || sfMod) ? `${PRIMARY}40` : "#e2e8f0",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 16 }}>{WORK_PERMIT_TYPE_ICONS[type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: active ? "white" : "#1e293b" }}>
                        {WORK_PERMIT_TYPE_LABELS[type].replace(" 허가서", "")}
                        {LEGALLY_REQUIRED_PERMIT_TYPES.includes(type) && (
                          <span className="ml-1 text-xs" style={{ color: active ? "rgba(255,255,255,0.75)" : "#d97706" }}>⚖️</span>
                        )}
                      </p>
                      <p className="text-xs truncate mt-0.5" style={{ color: active ? "rgba(255,255,255,0.75)" : "#64748b" }}>{desc}</p>
                    </div>
                    {(clMod || sfMod) && !active && (
                      <span className="text-xs px-1 rounded flex-shrink-0" style={{ background: `${PRIMARY}20`, color: PRIMARY, fontSize: 9 }}>수정</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 사용자 정의 유형 */}
          <div className="px-3 py-2 border-t border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2">
            사용자 정의 유형
          </div>
          <div className="p-2 space-y-1 flex-1">
            {customPermitTypes.length === 0 && !showAddForm && (
              <p className="text-xs text-slate-400 text-center py-3">추가된 유형 없음</p>
            )}
            {customPermitTypes.map((ct) => {
              const active = selected?.kind === "custom" && selected.typeId === ct.id;
              return (
                <button
                  key={ct.id}
                  onClick={() => { setSelected({ kind: "custom", typeId: ct.id }); setClInput(""); setSfKey(""); setSfLabel(""); }}
                  className="w-full text-left rounded-xl px-3 py-2.5 transition-all border"
                  style={{
                    background: active ? PRIMARY : "#f8fafc",
                    borderColor: active ? PRIMARY : "#e2e8f0",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 16 }}>{ct.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: active ? "white" : "#1e293b" }}>{ct.label}</p>
                      <p className="text-xs truncate mt-0.5" style={{ color: active ? "rgba(255,255,255,0.75)" : "#64748b" }}>{ct.desc}</p>
                    </div>
                    <span className="text-xs px-1 rounded flex-shrink-0" style={{ background: active ? "rgba(255,255,255,0.2)" : "#e0f2fe", color: active ? "white" : "#0369a1", fontSize: 9 }}>커스텀</span>
                  </div>
                </button>
              );
            })}

            {/* 추가 폼 */}
            {showAddForm ? (
              <div className="rounded-xl border border-dashed p-3 space-y-2" style={{ borderColor: `${PRIMARY}66`, background: PRIMARY_LIGHT }}>
                <p className="text-xs font-semibold" style={{ color: PRIMARY }}>새 작업 유형</p>
                <div className="flex gap-1.5 flex-wrap">
                  {ICON_OPTIONS.map((ico) => (
                    <button key={ico} onClick={() => setNewIcon(ico)}
                      className="w-7 h-7 rounded-lg border flex items-center justify-center text-sm transition-all"
                      style={{ borderColor: newIcon === ico ? PRIMARY : "#e2e8f0", background: newIcon === ico ? PRIMARY_LIGHT : "white" }}>
                      {ico}
                    </button>
                  ))}
                </div>
                <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="유형명 (예: 도장작업)"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
                <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="설명 (선택)"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
                <div className="flex gap-1.5">
                  <button onClick={handleAddCustomType} disabled={!newLabel.trim()}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ background: newLabel.trim() ? PRIMARY : "#cbd5e1" }}>생성</button>
                  <button onClick={() => setShowAddForm(false)}
                    className="flex-1 py-1.5 rounded-lg text-xs text-slate-500 bg-slate-100">취소</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddForm(true)}
                className="w-full rounded-xl border-2 border-dashed px-3 py-2.5 text-xs font-semibold transition-all hover:shadow-sm flex items-center justify-center gap-2"
                style={{ borderColor: `${PRIMARY}66`, color: PRIMARY, background: "white" }}>
                + 작업유형 추가
              </button>
            )}
          </div>
        </div>

        {/* 중앙: 편집 패널 */}
        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              <span style={{ fontSize: 36 }}>👈</span>
              <p style={{ fontSize: 14, textAlign: "center", lineHeight: 1.7 }}>허가서 유형을 선택하면<br />체크리스트와 확인사항을 편집할 수 있습니다</p>
            </div>
          ) : (
            <div>
              {/* 패널 헤더 */}
              <div className="sticky top-0 bg-white z-10 px-5 py-3 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 18 }}>{selectedIcon}</span>
                    <span className="text-sm font-bold text-slate-800">{selectedLabel}</span>
                    {isLegal && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">⚖️ 법정의무</span>}
                    {isCustom && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">사용자 정의</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {(isClOverridden || isSfOverridden) && (
                      <button
                        onClick={() => { resetChecklistOverride(typeId); resetSpecificsOverride(typeId); }}
                        className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500"
                      >기본값으로 초기화</button>
                    )}
                    {isCustom && customType && (
                      <button
                        onClick={() => { if (confirm(`"${customType.label}" 유형을 삭제하시겠습니까?`)) { deleteCustomPermitType(customType.id); setSelected(null); } }}
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                      >유형 삭제</button>
                    )}
                  </div>
                </div>

                </div>

              <div className="p-5 space-y-6">

                {/* ── 체크리스트 ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-slate-700">✅ 안전 체크리스트</span>
                    <span className="text-xs text-slate-400">{effectiveChecklist.length}개 항목</span>
                    {isClOverridden && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#fef9c3", color: "#a16207" }}>커스텀 적용중</span>}
                  </div>
                  <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-50">
                    {defaultChecklist.map((item) => {
                      const enabled = effectiveChecklist.includes(item);
                      return (
                        <button key={item} onClick={() => toggleClItem(item)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                          style={{ background: enabled ? `${PRIMARY}06` : "white" }}>
                          <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                            style={{ background: enabled ? PRIMARY : "white", borderColor: enabled ? PRIMARY : "#cbd5e1" }}>
                            {enabled && <span className="text-white" style={{ fontSize: 9 }}>✓</span>}
                          </div>
                          <span className="text-sm flex-1" style={{ color: enabled ? "#334155" : "#94a3b8" }}>{item}</span>
                          {!enabled && <span className="text-xs text-slate-300">비활성</span>}
                        </button>
                      );
                    })}
                    {(checklistOverrides[typeId] ?? []).filter((item) => !defaultChecklist.includes(item)).map((item) => (
                      <div key={item} className="flex items-center gap-3 px-4 py-2.5" style={{ background: `${PRIMARY}04` }}>
                        <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                          style={{ background: PRIMARY, borderColor: PRIMARY }}>
                          <span className="text-white" style={{ fontSize: 9 }}>✓</span>
                        </div>
                        <span className="text-sm flex-1 text-slate-700">{item}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${PRIMARY}15`, color: PRIMARY }}>추가됨</span>
                        <button onClick={() => setChecklistOverride(typeId, effectiveChecklist.filter((i) => i !== item))}
                          className="text-slate-300 hover:text-red-400 text-sm">✕</button>
                      </div>
                    ))}
                    {effectiveChecklist.length === 0 && (
                      <div className="px-4 py-4 text-center text-xs text-slate-400">체크리스트 항목이 없습니다</div>
                    )}
                  </div>
                  <div className="mt-3 rounded-xl border border-dashed border-slate-200 p-3" style={{ background: "#f8fafc" }}>
                    <p className="text-xs font-semibold text-slate-500 mb-2">➕ 항목 직접 추가</p>
                    <div className="flex gap-2">
                      <input value={clInput} onChange={(e) => setClInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addClItem(); } }}
                        placeholder="확인 항목 입력 후 Enter"
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-400" />
                      <button onClick={addClItem} disabled={!clInput.trim()}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
                        style={{ background: clInput.trim() ? PRIMARY : "#cbd5e1" }}>추가</button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
