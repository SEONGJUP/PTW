"use client";
import React, { useState, useMemo } from "react";
import {
  useEquipmentRegistryStore,
  EquipmentRecord,
  InspectionRecord,
  UsageLog,
  getEquipmentTypeLabel,
} from "@/store/equipmentRegistryStore";
import { CONSTRUCTION_EQUIPMENT_TYPES, EquipmentType, SavedCard } from "@/store/workPlanStore";
import { useWorkPlanStore } from "@/store/workPlanStore";

const PRIMARY = "#00B7AF";
const PRIMARY_DARK = "#00A099";
const PRIMARY_LIGHT = "#E6FAF9";


// ─── 작업계획서 formData에서 장비 정보 추출 헬퍼 ────────────────────────────
interface ExtractedEquip {
  equipmentType: string;   // EquipmentType key
  equipmentLabel: string;
  machineName: string;     // 기계명칭 (machine_spec.machineName)
  regNo: string;           // 등록번호 (machine_spec.regNo)
  maker: string;
  model: string;
  capacity: string;
  dimensions: string;
  year: string;
  inspectionExpiry: string;
  operator: string;        // overview.author 또는 formData.operators
  qty: string;
  ownership: string;
}

function extractEquipments(card: SavedCard): ExtractedEquip[] {
  const formData = card.formData as Record<string, unknown>;
  const overview = (formData["overview"] as Record<string, string>) ?? {};
  const eqInfo = (formData["equipment_info"] as { rows?: { id: string; equipmentType?: string; name: string; spec: string; qty: string; ownership: string }[] }) ?? {};
  const rows = eqInfo.rows ?? [];
  const result: ExtractedEquip[] = [];

  for (const row of rows) {
    const eqType = row.equipmentType;
    let machineName = row.name;
    let regNo = "";
    let maker = "";
    let model = "";
    let capacity = row.spec ?? "";
    let dimensions = "";
    let year = "";
    let inspectionExpiry = "";

    // machine_spec 데이터가 있으면 우선 사용
    if (eqType) {
      const specKey = `${eqType}_machine_spec`;
      const specData = (formData[specKey] as { rows?: Record<string, string>[] }) ?? {};
      const specRows = specData.rows ?? [];
      if (specRows.length > 0) {
        const sr = specRows[0];
        machineName = (sr.machineName as string) || machineName;
        regNo       = (sr.regNo       as string) || "";
        maker       = (sr.maker       as string) || "";
        model       = (sr.model       as string) || "";
        capacity    = (sr.capacity    as string) || capacity;
        dimensions  = (sr.dimensions  as string) || "";
        year        = (sr.year        as string) || "";
        inspectionExpiry = (sr.inspectionExpiry as string) || "";
      }
    }

    result.push({
      equipmentType:  eqType ?? "other",
      equipmentLabel: eqType && eqType in CONSTRUCTION_EQUIPMENT_TYPES
        ? CONSTRUCTION_EQUIPMENT_TYPES[eqType as EquipmentType].label
        : row.name,
      machineName,
      regNo,
      maker,
      model,
      capacity,
      dimensions,
      year,
      inspectionExpiry,
      operator: overview.author ?? "",
      qty:       row.qty ?? "1",
      ownership: row.ownership ?? "자사",
    });
  }
  return result;
}

// ─── "작업계획서에서 불러오기" 모달 ──────────────────────────────────────────
function ImportFromPlanModal({ onClose }: { onClose: () => void }) {
  const { savedCards } = useWorkPlanStore();
  const { records, addRecord, addUsageLog, findByNumber } = useEquipmentRegistryStore();

  const [step, setStep] = useState<"plan" | "equip">("plan");
  const [selectedCard, setSelectedCard] = useState<SavedCard | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  // action[idx] = "register" | "log" | null
  const [actions, setActions] = useState<Record<number, "register" | "log">>({});

  const equips = useMemo(
    () => (selectedCard ? extractEquipments(selectedCard) : []),
    [selectedCard]
  );

  // 각 장비가 이미 등록됐는지 → EquipmentRecord 반환
  const matchMap = useMemo<(EquipmentRecord | undefined)[]>(() => {
    if (!selectedCard) return [];
    return equips.map((e) => {
      if (!e.regNo && !e.machineName) return undefined;
      return findByNumber(e.regNo, "");
    });
  }, [equips, selectedCard, records, findByNumber]);

  const handleSelectCard = (card: SavedCard) => {
    setSelectedCard(card);
    setSelectedIds(new Set());
    setActions({});
    setStep("equip");
  };

  const toggleIdx = (idx: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const setAction = (idx: number, action: "register" | "log") => {
    setActions((prev) => ({ ...prev, [idx]: action }));
    setSelectedIds((prev) => { const n = new Set(prev); n.add(idx); return n; });
  };

  const handleConfirm = () => {
    if (!selectedCard) return;
    const card = selectedCard;
    const formData = card.formData as Record<string, unknown>;
    const overview = (formData["overview"] as Record<string, string>) ?? {};

    for (const idx of selectedIds) {
      const e = equips[idx];
      const action = actions[idx];
      const existing = matchMap[idx];

      const logPayload: Omit<UsageLog, "id" | "createdAt"> = {
        source:        "plan",
        workPlanId:    card.id,
        workPlanTitle: card.title,
        siteName:      overview.siteName ?? "",
        location:      overview.location ?? "",
        startDate:     overview.startDate ?? "",
        endDate:       overview.endDate ?? "",
        operator:      e.operator,
        note:          "",
      };

      if (action === "register" || (!action && !existing)) {
        // 신규 등록
        const newId = addRecord({
          name:               e.machineName || e.equipmentLabel,
          equipmentType:      e.equipmentType,
          model:              e.model,
          manufacturer:       e.maker,
          year:               e.year,
          serialNumber:       "",
          registrationNumber: e.regNo,
          capacity:           e.capacity,
          weight:             "",
          dimensions:         e.dimensions,
          enginePower:        "",
          workRadius:         "",
          operatorName:       e.operator,
          operatorLicense:    "",
          purchaseDate:       "",
          lastInspectionDate: "",
          nextInspectionDate: e.inspectionExpiry,
          inspectionCycle:    "6개월",
          insuranceStart:     "",
          insuranceExpiry:    "",
          workLocation:       "",
          qty:                e.qty ?? "",
          inspectionTarget:   "N",
          inspectionBasis:    "",
          safetyDevice:       "",
          accidentType:       "",
          notes:              `작업계획서 [${card.title}]에서 등록`,
        });
        // 동시에 투입이력 추가
        addUsageLog(newId, logPayload);
      } else if (action === "log" && existing) {
        // 기존 레코드에 투입이력만 추가
        addUsageLog(existing.id, logPayload);
      }
    }
    onClose();
  };

  const overview = selectedCard
    ? ((selectedCard.formData as Record<string, unknown>)["overview"] as Record<string, string> ?? {})
    : {};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col w-full mx-4"
        style={{ maxWidth: 680, maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ background: PRIMARY_LIGHT, borderColor: `${PRIMARY}33` }}>
          <div>
            <p className="text-sm font-bold" style={{ color: PRIMARY }}>
              {step === "plan" ? "📋 작업계획서 선택" : "🚜 장비 선택 및 등록"}
            </p>
            {step === "equip" && selectedCard && (
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedCard.title}
                {overview.siteName && ` · ${overview.siteName}`}
                {overview.startDate && ` · ${overview.startDate}~${overview.endDate ?? ""}`}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/60">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {step === "plan" && (
            <div>
              {savedCards.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-sm">저장된 작업계획서가 없습니다</div>
              ) : (
                savedCards.map((card) => {
                  const ov = ((card.formData as Record<string, unknown>)["overview"] as Record<string, string>) ?? {};
                  const eqList = extractEquipments(card);
                  return (
                    <button
                      key={card.id}
                      onClick={() => handleSelectCard(card)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: PRIMARY_LIGHT }}>
                        <span style={{ color: PRIMARY, fontSize: 18 }}>📄</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{card.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {ov.siteName && `${ov.siteName} · `}
                          {ov.startDate && `${ov.startDate}~${ov.endDate ?? ""} · `}
                          장비 {eqList.length}종
                        </p>
                      </div>
                      <span className="text-xs text-slate-300">선택 →</span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {step === "equip" && selectedCard && (
            <div>
              {equips.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-sm">이 작업계획서에 입력된 장비가 없습니다</div>
              ) : (
                <>
                  {/* 범례 */}
                  <div className="flex items-center gap-4 px-5 py-2.5 text-xs text-slate-500 border-b border-slate-100 bg-slate-50 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#d1fae5" }} />이미 등록됨 → 투입이력 추가
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-3 h-3 rounded-full bg-amber-100" />미등록 → 신규 등록
                    </span>
                  </div>

                  {equips.map((e, idx) => {
                    const existing = matchMap[idx];
                    const isSel = selectedIds.has(idx);
                    const action = actions[idx] ?? (existing ? "log" : "register");
                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-3 px-5 py-4 border-b border-slate-50 transition-colors"
                        style={{ background: isSel ? `${PRIMARY}08` : undefined }}
                      >
                        {/* 체크박스 */}
                        <button
                          onClick={() => toggleIdx(idx)}
                          className="w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center text-white mt-0.5"
                          style={{
                            background: isSel ? PRIMARY : "white",
                            borderColor: isSel ? PRIMARY : "#cbd5e1",
                            fontSize: 10,
                          }}
                        >{isSel && "✓"}</button>

                        {/* 장비 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-semibold text-slate-800">
                              {e.machineName || e.equipmentLabel}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                              {e.equipmentLabel}
                            </span>
                            {existing ? (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: "#d1fae5", color: "#065f46" }}>
                                ✓ 이미 등록됨
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700">
                                미등록
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-400">
                            {e.regNo     && <span>등록번호: {e.regNo}</span>}
                            {e.maker     && <span>제조사: {e.maker}</span>}
                            {e.model     && <span>모델: {e.model}</span>}
                            {e.capacity  && <span>정격: {e.capacity}</span>}
                            {e.operator  && <span>운전원: {e.operator}</span>}
                          </div>
                          {existing && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              → 기존 등록 장비에 이 작업계획서의 투입이력이 추가됩니다
                            </p>
                          )}
                        </div>

                        {/* 액션 선택 */}
                        <div className="flex-shrink-0 flex flex-col gap-1 text-right">
                          {existing ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => setAction(idx, "log")}
                                className="text-xs px-2.5 py-1 rounded-lg font-medium border transition-colors"
                                style={
                                  action === "log"
                                    ? { background: PRIMARY, color: "white", borderColor: PRIMARY }
                                    : { background: "white", color: "#64748b", borderColor: "#e2e8f0" }
                                }
                              >투입이력 추가</button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <button
                                onClick={() => setAction(idx, "register")}
                                className="text-xs px-2.5 py-1 rounded-lg font-medium border transition-colors"
                                style={
                                  action === "register"
                                    ? { background: PRIMARY, color: "white", borderColor: PRIMARY }
                                    : { background: "white", color: "#64748b", borderColor: "#e2e8f0" }
                                }
                              >신규 등록</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-white flex items-center gap-2 flex-shrink-0" style={{ borderColor: "#e2e8f0" }}>
          {step === "equip" && (
            <button
              onClick={() => { setStep("plan"); setSelectedCard(null); }}
              className="text-xs px-3 py-1.5 rounded-lg border text-slate-500 font-medium"
              style={{ borderColor: "#e2e8f0" }}
            >← 뒤로</button>
          )}
          <span className="text-xs text-slate-400 flex-1">
            {step === "equip" && selectedIds.size > 0 ? `${selectedIds.size}대 선택됨` : ""}
          </span>
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-lg text-slate-500 bg-slate-100 font-medium"
          >취소</button>
          {step === "equip" && (
            <button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className="text-xs px-4 py-1.5 rounded-lg font-semibold text-white transition-all"
              style={{ background: selectedIds.size > 0 ? PRIMARY : "#cbd5e1" }}
            >
              등록 / 이력 추가 ({selectedIds.size})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 장비 상세 패널 (기본정보 · 제원 · 투입이력 · 점검이력) ──────────────────
function Field({
  label, value, onChange, type = "text", placeholder, readOnly, required,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; placeholder?: string; readOnly?: boolean; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        readOnly={readOnly}
        className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400"
        style={{ borderColor: "#e2e8f0", background: readOnly ? "#f8fafc" : "white" }}
      />
    </div>
  );
}

// ── 투입이력 행 (읽기모드) ──────────────────────────────────────────────
function UsageLogRow({ log, index, onEdit, onDelete, disabled }: {
  log: UsageLog; index: number;
  onEdit: () => void; onDelete: () => void; disabled: boolean;
}) {
  const days = calcDays(log.startDate, log.endDate);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#e2e8f0" }}>
      {/* 기간 헤더 */}
      <div className="flex items-center justify-between px-4 py-2" style={{ background: PRIMARY_LIGHT }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: PRIMARY }}>
            #{index}
          </span>
          <span className="text-sm font-bold text-slate-800">
            {log.startDate || "??"}  ~  {log.endDate || "??"}
          </span>
          {days && <span className="text-xs text-slate-400">({days})</span>}
        </div>
        <div className="flex items-center gap-1">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={
              log.source === "plan"
                ? { background: "#dbeafe", color: "#1d4ed8" }
                : { background: "#f1f5f9", color: "#64748b" }
            }
          >
            {log.source === "plan" ? "계획서 연동" : "직접 입력"}
          </span>
          {!disabled && (
            <>
              <button onClick={onEdit} className="text-xs px-2 py-1 rounded-lg hover:bg-white/60 text-slate-500 hover:text-teal-600 transition-colors">✎</button>
              <button onClick={onDelete} className="text-xs px-2 py-1 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">✕</button>
            </>
          )}
        </div>
      </div>
      {/* 상세 */}
      <div className="px-4 py-2.5 grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
        {log.workPlanTitle && (
          <span className="col-span-2 font-medium text-slate-700 truncate">📄 {log.workPlanTitle}</span>
        )}
        {log.siteName  && <span className="text-slate-500">🏗 현장: <span className="text-slate-700">{log.siteName}</span></span>}
        {log.location  && <span className="text-slate-500">📍 위치: <span className="text-slate-700">{log.location}</span></span>}
        {log.operator  && <span className="text-slate-500">👤 운전원: <span className="text-slate-700">{log.operator}</span></span>}
        {log.note      && <span className="col-span-2 text-slate-500">💬 변동사항: <span className="text-slate-700">{log.note}</span></span>}
      </div>
    </div>
  );
}

// ── 투입이력 입력 폼 ────────────────────────────────────────────────────
function UsageLogForm({ draft, onChange, onSave, onCancel, isNew }: {
  draft: Omit<UsageLog, "id" | "createdAt">;
  onChange: (v: Omit<UsageLog, "id" | "createdAt">) => void;
  onSave: () => void; onCancel: () => void; isNew?: boolean;
}) {
  const set = (key: keyof typeof draft, val: string) => onChange({ ...draft, [key]: val });
  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ borderColor: `${PRIMARY}44`, background: PRIMARY_LIGHT }}
    >
      <p className="text-xs font-semibold" style={{ color: PRIMARY_DARK }}>
        {isNew ? "새 투입이력 추가" : "투입이력 수정"}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {/* 작업명 */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">작업명 / 작업계획서 제목</label>
          <input
            type="text"
            value={draft.workPlanTitle}
            onChange={(e) => set("workPlanTitle", e.target.value)}
            placeholder="예: 굴착공사 작업계획서"
            className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400"
            style={{ borderColor: "#e2e8f0", background: "white" }}
          />
        </div>
        {/* 위치 */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">위치</label>
          <input type="text" value={draft.location} onChange={(e) => set("location", e.target.value)} placeholder="작업 위치 입력"
            className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0", background: "white" }} />
        </div>
        {/* 투입 시작일 */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">투입 시작일 <span className="text-red-400">*</span></label>
          <input type="date" value={draft.startDate} onChange={(e) => set("startDate", e.target.value)}
            className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0", background: "white" }} />
        </div>
        {/* 투입 종료일 */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">투입 종료일</label>
          <input type="date" value={draft.endDate} onChange={(e) => set("endDate", e.target.value)}
            className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0", background: "white" }} />
        </div>
        {/* 운전원 */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">운전원</label>
          <input type="text" value={draft.operator} onChange={(e) => set("operator", e.target.value)} placeholder="담당 운전원 이름"
            className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0", background: "white" }} />
        </div>
        {/* 변동사항/비고 */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">변동사항 / 비고</label>
          <textarea
            value={draft.note}
            onChange={(e) => set("note", e.target.value)}
            rows={2}
            placeholder="운전원 교체, 기간 연장 등 변동사항을 기록하세요"
            className="w-full px-3 py-2 border rounded-xl text-sm outline-none resize-none focus:border-teal-400"
            style={{ borderColor: "#e2e8f0", background: "white" }}
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-xs px-3 py-1.5 rounded-xl border font-medium text-slate-600" style={{ borderColor: "#e2e8f0" }}>취소</button>
        <button
          onClick={onSave}
          disabled={!draft.startDate}
          className="text-xs px-4 py-1.5 rounded-xl font-medium text-white"
          style={{ background: draft.startDate ? PRIMARY : "#cbd5e1" }}
        >저장</button>
      </div>
    </div>
  );
}

// ── 점검이력 행 (읽기모드) ──────────────────────────────────────────────
function InspectionRow({ ins, onEdit, onDelete, disabled }: {
  ins: InspectionRecord;
  onEdit: () => void; onDelete: () => void; disabled: boolean;
}) {
  const resultStyle = {
    합격:       { bg: "#d1fae5", text: "#065f46" },
    불합격:     { bg: "#fee2e2", text: "#991b1b" },
    조건부합격: { bg: "#fef3c7", text: "#92400e" },
  }[ins.result] ?? { bg: "#f1f5f9", text: "#64748b" };

  return (
    <div className="rounded-xl border p-3" style={{ borderColor: "#e2e8f0" }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-700">{ins.date}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{ins.type}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: resultStyle.bg, color: resultStyle.text }}>
            {ins.result}
          </span>
          {ins.inspector && <span className="text-xs text-slate-400">점검자: {ins.inspector}</span>}
        </div>
        {!disabled && (
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={onEdit} className="text-xs px-2 py-1 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-50 transition-colors">✎</button>
            <button onClick={onDelete} className="text-xs px-2 py-1 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors">✕</button>
          </div>
        )}
      </div>
      {ins.notes && <p className="text-xs text-slate-500 mt-1.5">{ins.notes}</p>}
    </div>
  );
}

// ── 점검이력 입력 폼 ────────────────────────────────────────────────────
function InspectionForm({ draft, onChange, onSave, onCancel, isNew }: {
  draft: Omit<InspectionRecord, "id">;
  onChange: (v: Omit<InspectionRecord, "id">) => void;
  onSave: () => void; onCancel: () => void; isNew?: boolean;
}) {
  const set = (key: keyof typeof draft, val: string) => onChange({ ...draft, [key]: val });
  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: `${PRIMARY}44`, background: PRIMARY_LIGHT }}>
      <p className="text-xs font-semibold" style={{ color: PRIMARY_DARK }}>
        {isNew ? "새 점검이력 추가" : "점검이력 수정"}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">점검일 <span className="text-red-400">*</span></label>
          <input type="date" value={draft.date} onChange={(e) => set("date", e.target.value)}
            className="w-full px-3 py-2 border rounded-xl text-sm outline-none" style={{ borderColor: "#e2e8f0", background: "white" }} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">점검 유형</label>
          <select value={draft.type} onChange={(e) => set("type", e.target.value)}
            className="w-full px-3 py-2 border rounded-xl text-sm outline-none" style={{ borderColor: "#e2e8f0", background: "white" }}>
            {["자체점검", "정기검사", "이상점검", "출고전점검"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">결과</label>
          <select value={draft.result} onChange={(e) => set("result", e.target.value as InspectionRecord["result"])}
            className="w-full px-3 py-2 border rounded-xl text-sm outline-none" style={{ borderColor: "#e2e8f0", background: "white" }}>
            <option value="합격">합격</option>
            <option value="불합격">불합격</option>
            <option value="조건부합격">조건부합격</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">점검자</label>
          <input type="text" value={draft.inspector} onChange={(e) => set("inspector", e.target.value)} placeholder="점검자 이름"
            className="w-full px-3 py-2 border rounded-xl text-sm outline-none" style={{ borderColor: "#e2e8f0", background: "white" }} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">비고</label>
          <textarea value={draft.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="점검 내용, 조치사항 등"
            className="w-full px-3 py-2 border rounded-xl text-sm outline-none resize-none" style={{ borderColor: "#e2e8f0", background: "white" }} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-xs px-3 py-1.5 rounded-xl border font-medium text-slate-600" style={{ borderColor: "#e2e8f0" }}>취소</button>
        <button onClick={onSave} disabled={!draft.date}
          className="text-xs px-4 py-1.5 rounded-xl font-medium text-white"
          style={{ background: draft.date ? PRIMARY : "#cbd5e1" }}>저장</button>
      </div>
    </div>
  );
}

// ── 빈 투입이력 초기값 ──────────────────────────────────────────────────
const EMPTY_USAGE_LOG: Omit<UsageLog, "id" | "createdAt"> = {
  source: "manual",
  workPlanId: "",
  workPlanTitle: "",
  siteName: "",
  location: "",
  startDate: "",
  endDate: "",
  operator: "",
  note: "",
};

const EMPTY_INSPECTION: Omit<InspectionRecord, "id"> = {
  date: "",
  type: "자체점검",
  result: "합격",
  inspector: "",
  notes: "",
};

function calcDays(start: string, end: string): string {
  if (!start || !end) return "";
  const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
  return isNaN(diff) || diff < 0 ? "" : `${diff}일`;
}


function EquipmentDetailModal({ record, onClose }: { record: EquipmentRecord; onClose: () => void }) {
  const { updateRecord, addInspection, updateInspection, deleteInspection, addUsageLog, updateUsageLog, deleteUsageLog } = useEquipmentRegistryStore();
  type Tab = "basic" | "spec" | "usage" | "history";
  const [tab, setTab] = useState<Tab>("basic");

  // 투입이력 편집 상태
  const [usageDraftId, setUsageDraftId] = useState<string | null>(null);
  const [usageDraft, setUsageDraft]     = useState<Omit<UsageLog, "id" | "createdAt">>(EMPTY_USAGE_LOG);

  // 점검이력 편집 상태
  const [inspDraftId, setInspDraftId] = useState<string | null>(null);
  const [inspDraft, setInspDraft]     = useState<Omit<InspectionRecord, "id">>(EMPTY_INSPECTION);

  // 제원 탭 — 해당없음 로컬 상태
  const [inspectionNA, setInspectionNA] = useState(!record.nextInspectionDate);
  const [insuranceNA, setInsuranceNA]   = useState(!record.insuranceExpiry && !record.insuranceStart);

  const today = new Date().toISOString().split("T")[0];
  const update = (key: keyof EquipmentRecord, val: unknown) => updateRecord(record.id, { [key]: val });
  const usageLogs      = record.usageLogs ?? [];
  const inspectionList = record.inspectionHistory ?? [];

  // ── 투입이력 핸들러 ────────────────────────────────────────────────────
  const startNewUsage = () => {
    setUsageDraftId("new");
    setUsageDraft({ ...EMPTY_USAGE_LOG, startDate: today });
  };
  const startEditUsage = (log: UsageLog) => {
    setUsageDraftId(log.id);
    setUsageDraft({ source: log.source, workPlanId: log.workPlanId ?? "", workPlanTitle: log.workPlanTitle, siteName: log.siteName, location: log.location, startDate: log.startDate, endDate: log.endDate, operator: log.operator, note: log.note ?? "" });
  };
  const cancelUsage = () => setUsageDraftId(null);
  const saveUsage = () => {
    if (!usageDraftId) return;
    usageDraftId === "new" ? addUsageLog(record.id, usageDraft) : updateUsageLog(record.id, usageDraftId, usageDraft);
    setUsageDraftId(null);
  };

  // ── 점검이력 핸들러 ────────────────────────────────────────────────────
  const startNewInsp = () => {
    setInspDraftId("new");
    setInspDraft({ ...EMPTY_INSPECTION, date: today });
  };
  const startEditInsp = (ins: InspectionRecord) => {
    setInspDraftId(ins.id);
    setInspDraft({ date: ins.date, type: ins.type, result: ins.result, inspector: ins.inspector, notes: ins.notes });
  };
  const cancelInsp = () => setInspDraftId(null);
  const saveInsp = () => {
    if (!inspDraftId) return;
    inspDraftId === "new" ? addInspection(record.id, inspDraft) : updateInspection(record.id, inspDraftId, inspDraft);
    setInspDraftId(null);
  };

  const capacityLabel = CAPACITY_LABELS[record.equipmentType] ?? "정격용량";
  const eqTypeLabel = record.equipmentType in CONSTRUCTION_EQUIPMENT_TYPES
    ? CONSTRUCTION_EQUIPMENT_TYPES[record.equipmentType as EquipmentType].label
    : "기타";

  const tabs: { id: Tab; label: string }[] = [
    { id: "basic",   label: "기본 정보" },
    { id: "spec",    label: `제원 · ${eqTypeLabel}` },
    { id: "usage",   label: `투입이력 (${usageLogs.length})` },
    { id: "history", label: `점검이력 (${inspectionList.length})` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-2xl mx-4" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#e2e8f0" }}>
          <div>
            <h3 className="font-semibold text-slate-800">{record.name || "장비 정보"}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {eqTypeLabel}
              {record.registrationNumber && ` · ${record.registrationNumber}`}
              {record.model && ` · ${record.model}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-4 overflow-x-auto flex-shrink-0" style={{ borderColor: "#e2e8f0" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="text-xs px-4 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0"
              style={{
                borderColor: tab === t.id ? PRIMARY : "transparent",
                color: tab === t.id ? PRIMARY : "#64748b",
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ── 기본 정보 탭 ── */}
          {tab === "basic" && (
            <>
              {/* 식별 정보 */}
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2.5">식별 정보</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Field label="장비명" value={record.name} onChange={(v) => update("name", v)} required placeholder="예: 굴착기 #1" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      장비 종류<span className="text-red-400 ml-0.5">*</span>
                    </label>
                    <select
                      value={record.equipmentType}
                      onChange={(e) => update("equipmentType", e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400"
                      style={{ borderColor: "#e2e8f0" }}
                    >
                      {Object.entries(CONSTRUCTION_EQUIPMENT_TYPES).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                      <option value="other">기타</option>
                    </select>
                  </div>
                  <Field label="건설기계등록번호 (차량번호)" value={record.registrationNumber} onChange={(v) => update("registrationNumber", v)} placeholder="예: 서울02가1234" />
                  <Field label="제조사" value={record.manufacturer} onChange={(v) => update("manufacturer", v)} placeholder="예: 현대건설기계" />
                  <Field label="모델명" value={record.model} onChange={(v) => update("model", v)} placeholder="예: PC200-10M0" />
                  <Field label="제조연도" value={record.year} onChange={(v) => update("year", v)} placeholder="예: 2021" />
                  <Field label="기계번호/차대번호" value={record.serialNumber} onChange={(v) => update("serialNumber", v)} />
                </div>
              </div>

              {/* 관리 정보 */}
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2.5">관리 정보</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="담당 운전원" value={record.operatorName} onChange={(v) => update("operatorName", v)} placeholder="운전원 이름" />
                  <Field label="운전원 면허번호" value={record.operatorLicense} onChange={(v) => update("operatorLicense", v)} />
                  <Field label="구입일" type="date" value={record.purchaseDate} onChange={(v) => update("purchaseDate", v)} />
                  <Field label="마지막 점검일" type="date" value={record.lastInspectionDate} onChange={(v) => update("lastInspectionDate", v)} />
                  <Field label="작업장소" value={record.workLocation ?? ""} onChange={(v) => update("workLocation", v)} placeholder="예: 3공구 굴착 현장" />
                  <Field label="수량" value={record.qty ?? ""} onChange={(v) => update("qty", v)} placeholder="예: 1" />
                  <div className={(record.inspectionTarget ?? "N") === "Y" ? "col-span-2" : ""}>
                    <label className="block text-xs font-medium text-slate-500 mb-1">검사대상</label>
                    <div className="flex gap-4 px-1 py-2">
                      {(["Y", "N"] as const).map((v) => (
                        <label key={v} className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <input type="radio" name={`inspectionTarget-${record.id}`} value={v}
                            checked={(record.inspectionTarget ?? "N") === v}
                            onChange={() => update("inspectionTarget", v)}
                            className="accent-teal-500" />
                          <span className={(record.inspectionTarget ?? "N") === v ? "font-semibold text-slate-700" : "text-slate-400"}>{v}</span>
                        </label>
                      ))}
                    </div>
                    {(record.inspectionTarget ?? "N") === "Y" && (
                      <input type="text" value={record.inspectionBasis ?? ""} onChange={(e) => update("inspectionBasis", e.target.value)}
                        placeholder="근거규정 입력 (예: 산안법 제93조)"
                        className="w-full mt-1 px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0" }} />
                    )}
                  </div>
                  <Field label="방호장치" value={record.safetyDevice ?? ""} onChange={(v) => update("safetyDevice", v)} placeholder="예: 후방카메라, 경보장치" />
                  <Field label="재해형태" value={record.accidentType ?? ""} onChange={(v) => update("accidentType", v)} placeholder="예: 협착, 전도" />
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">비고 / 특이사항</label>
                    <textarea
                      value={record.notes}
                      onChange={(e) => update("notes", e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400 resize-none"
                      style={{ borderColor: "#e2e8f0" }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── 제원 탭 (장비별) ── */}
          {tab === "spec" && (
            <>
              {/* 기본 제원 */}
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2.5">기본 제원</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{capacityLabel}</label>
                    <input
                      type="text"
                      value={record.capacity}
                      onChange={(e) => update("capacity", e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400"
                      style={{ borderColor: "#e2e8f0" }}
                    />
                  </div>
                  <Field label="자중 (ton)" value={record.weight} onChange={(v) => update("weight", v)} placeholder="예: 20.5" />
                  <div className="col-span-2">
                    <Field label="제원 (길이 × 폭 × 높이)" value={record.dimensions} onChange={(v) => update("dimensions", v)} placeholder="예: 9,455 × 2,800 × 2,970mm" />
                  </div>
                  <Field label="엔진 출력" value={record.enginePower} onChange={(v) => update("enginePower", v)} placeholder="예: 110kW / 150PS" />
                  <Field label="작업반경" value={record.workRadius ?? ""} onChange={(v) => update("workRadius", v)} placeholder="예: 12m" />
                </div>
              </div>

              {/* 점검·검사 */}
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2.5">점검 / 검사</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">점검·검사 유효기간</label>
                    <input
                      type="date"
                      value={record.nextInspectionDate}
                      onChange={(e) => update("nextInspectionDate", e.target.value)}
                      disabled={inspectionNA}
                      className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-300"
                      style={{ borderColor: "#e2e8f0" }}
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inspectionNA}
                        onChange={(e) => {
                          setInspectionNA(e.target.checked);
                          if (e.target.checked) update("nextInspectionDate", "");
                        }}
                        className="rounded"
                      />
                      해당없음
                    </label>
                  </div>
                  <Field label="점검 주기" value={record.inspectionCycle} onChange={(v) => update("inspectionCycle", v)} placeholder="예: 6개월" />
                </div>
              </div>

              {/* 가입보험기간 */}
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2.5">가입보험기간</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">시작일</label>
                    <input
                      type="date"
                      value={record.insuranceStart ?? ""}
                      onChange={(e) => update("insuranceStart", e.target.value)}
                      disabled={insuranceNA}
                      className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-300"
                      style={{ borderColor: "#e2e8f0" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">종료일</label>
                    <input
                      type="date"
                      value={record.insuranceExpiry}
                      onChange={(e) => update("insuranceExpiry", e.target.value)}
                      disabled={insuranceNA}
                      className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-300"
                      style={{ borderColor: "#e2e8f0" }}
                    />
                  </div>
                  <div className="col-span-2 flex items-center">
                    <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={insuranceNA}
                        onChange={(e) => {
                          setInsuranceNA(e.target.checked);
                          if (e.target.checked) { update("insuranceStart", ""); update("insuranceExpiry", ""); }
                        }}
                        className="rounded"
                      />
                      해당없음
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── 투입이력 ── */}
          {tab === "usage" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">
                  총 {usageLogs.length}건 투입 기록
                  <span className="ml-2 font-normal text-slate-400">(행 추가로 변동사항 포함 누적 관리)</span>
                </p>
                {usageDraftId === null && (
                  <button
                    onClick={startNewUsage}
                    className="text-xs px-3 py-1.5 rounded-xl font-medium text-white flex items-center gap-1"
                    style={{ background: PRIMARY }}
                  >+ 행 추가</button>
                )}
              </div>

              {usageDraftId === "new" && (
                <UsageLogForm draft={usageDraft} onChange={setUsageDraft} onSave={saveUsage} onCancel={cancelUsage} isNew />
              )}

              {usageLogs.length === 0 && usageDraftId !== "new" && (
                <div className="text-center py-10 text-slate-400 text-sm rounded-xl border border-dashed border-slate-200">
                  투입 이력이 없습니다<br />
                  <span className="text-xs text-slate-300">직접 행 추가하거나, 목록에서 &ldquo;작업계획서에서 불러오기&rdquo;를 사용하세요</span>
                </div>
              )}

              {usageLogs.map((log, i) => (
                <div key={log.id}>
                  {usageDraftId === log.id ? (
                    <UsageLogForm draft={usageDraft} onChange={setUsageDraft} onSave={saveUsage} onCancel={cancelUsage} />
                  ) : (
                    <UsageLogRow
                      log={log}
                      index={usageLogs.length - i}
                      onEdit={() => startEditUsage(log)}
                      onDelete={() => { if (window.confirm("이 투입이력을 삭제하시겠습니까?")) deleteUsageLog(record.id, log.id); }}
                      disabled={usageDraftId !== null}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── 점검이력 ── */}
          {tab === "history" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">총 {inspectionList.length}건 점검 기록</p>
                {inspDraftId === null && (
                  <button onClick={startNewInsp} className="text-xs px-3 py-1.5 rounded-xl font-medium text-white" style={{ background: PRIMARY }}>
                    + 점검 추가
                  </button>
                )}
              </div>

              {inspDraftId === "new" && (
                <InspectionForm draft={inspDraft} onChange={setInspDraft} onSave={saveInsp} onCancel={cancelInsp} isNew />
              )}

              {inspectionList.length === 0 && inspDraftId !== "new" && (
                <div className="text-center py-8 text-slate-400 text-sm rounded-xl border border-dashed border-slate-200">
                  등록된 점검 이력이 없습니다
                </div>
              )}

              {inspectionList.map((ins) => (
                <div key={ins.id}>
                  {inspDraftId === ins.id ? (
                    <InspectionForm draft={inspDraft} onChange={setInspDraft} onSave={saveInsp} onCancel={cancelInsp} />
                  ) : (
                    <InspectionRow
                      ins={ins}
                      onEdit={() => startEditInsp(ins)}
                      onDelete={() => { if (window.confirm("이 점검이력을 삭제하시겠습니까?")) deleteInspection(record.id, ins.id); }}
                      disabled={inspDraftId !== null}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── 장비 직접 등록 모달 ──────────────────────────────────────────────────────
const CAPACITY_LABELS: Record<string, string> = {
  truck:       "최대 적재용량 (ton)",
  bulldozer:   "정격출력 (kW)",
  grader:      "정격출력 (kW)",
  loader:      "버킷용량 (m³)",
  scraper:     "적재용량 (m³)",
  crane:       "정격하중 (ton)",
  excavator:   "버킷용량 (m³)",
  pile_driver: "최대 관입능력",
  roller:      "다짐중량 (ton)",
};

interface CreateForm {
  equipmentType: string;
  name: string;
  registrationNumber: string;
  manufacturer: string;
  model: string;
  capacity: string;
  dimensions: string;
  year: string;
  weight: string;
  enginePower: string;
  workRadius: string;
  nextInspectionDate: string;
  inspectionNA: boolean;
  insuranceStart: string;
  insuranceExpiry: string;
  insuranceNA: boolean;
  operatorName: string;
  operatorLicense: string;
  purchaseDate: string;
  inspectionCycle: string;
  workLocation: string;
  qty: string;
  inspectionTarget: string;  // "Y" | "N"
  inspectionBasis: string;
  safetyDevice: string;
  accidentType: string;
  notes: string;
}

const EMPTY_CREATE: CreateForm = {
  equipmentType: "excavator", name: "", registrationNumber: "",
  manufacturer: "", model: "", capacity: "", dimensions: "", year: "",
  weight: "", enginePower: "", workRadius: "",
  nextInspectionDate: "", inspectionNA: false,
  insuranceStart: "", insuranceExpiry: "", insuranceNA: false,
  operatorName: "", operatorLicense: "",
  purchaseDate: "", inspectionCycle: "6개월",
  workLocation: "", qty: "", inspectionTarget: "N", inspectionBasis: "", safetyDevice: "", accidentType: "",
  notes: "",
};

function CreateEquipmentModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { addRecord, addUsageLog, addInspection } = useEquipmentRegistryStore();
  const [step, setStep] = useState<"type" | "form">("type");
  const [formTab, setFormTab] = useState<"basic" | "spec" | "usage" | "history">("basic");
  const [form, setForm] = useState<CreateForm>(EMPTY_CREATE);
  const [typeSearch, setTypeSearch] = useState("");

  // 투입이력 버퍼
  const [usageLogs, setUsageLogs] = useState<Omit<UsageLog, "id" | "createdAt">[]>([]);
  const [usageDraft, setUsageDraft] = useState<Omit<UsageLog, "id" | "createdAt"> | null>(null);

  // 점검이력 버퍼
  const [inspections, setInspections] = useState<Omit<InspectionRecord, "id">[]>([]);
  const [inspDraft, setInspDraft] = useState<Omit<InspectionRecord, "id"> | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const setF = (key: keyof CreateForm, val: string | boolean) =>
    setForm((p) => ({ ...p, [key]: val }));

  const handleSelectType = (typeKey: string) => {
    const isPreset = typeKey in CONSTRUCTION_EQUIPMENT_TYPES || typeKey === "other";
    setForm({ ...EMPTY_CREATE, equipmentType: isPreset ? typeKey : "other", name: isPreset ? "" : typeKey });
    setFormTab("basic");
    setStep("form");
  };

  const handleSave = () => {
    if (!form.name) return;
    const id = addRecord({
      name: form.name,
      equipmentType: form.equipmentType,
      model: form.model,
      manufacturer: form.manufacturer,
      year: form.year,
      serialNumber: "",
      registrationNumber: form.registrationNumber,
      capacity: form.capacity,
      weight: form.weight,
      dimensions: form.dimensions,
      enginePower: form.enginePower,
      workRadius: form.workRadius,
      operatorName: form.operatorName,
      operatorLicense: form.operatorLicense,
      purchaseDate: form.purchaseDate,
      lastInspectionDate: "",
      nextInspectionDate: form.inspectionNA ? "" : form.nextInspectionDate,
      inspectionCycle: form.inspectionCycle,
      insuranceStart: form.insuranceNA ? "" : form.insuranceStart,
      insuranceExpiry: form.insuranceNA ? "" : form.insuranceExpiry,
      workLocation: form.workLocation,
      qty: form.qty,
      inspectionTarget: form.inspectionTarget,
      inspectionBasis: form.inspectionTarget === "Y" ? form.inspectionBasis : "",
      safetyDevice: form.safetyDevice,
      accidentType: form.accidentType,
      notes: form.notes,
    });
    usageLogs.forEach((log) => addUsageLog(id, log));
    inspections.forEach((ins) => addInspection(id, ins));
    onCreated(id);
  };

  const typeEntries = Object.entries(CONSTRUCTION_EQUIPMENT_TYPES) as [EquipmentType, { label: string; icon: string }][];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col w-full mx-4"
        style={{ maxWidth: step === "type" ? 560 : 680, maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ background: PRIMARY_LIGHT, borderColor: `${PRIMARY}33` }}
        >
          <div>
            <p className="text-sm font-bold" style={{ color: PRIMARY }}>
              {step === "type" ? "🚜 장비·기계 등록" : "📝 장비·기계 등록"}
            </p>
            {step === "form" && (
              <p className="text-xs text-slate-500 mt-0.5">
                {form.equipmentType in CONSTRUCTION_EQUIPMENT_TYPES
                  ? CONSTRUCTION_EQUIPMENT_TYPES[form.equipmentType as EquipmentType].label
                  : "기타 (직접입력)"}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/60"
          >✕</button>
        </div>

        {/* Tabs (form step only) */}
        {step === "form" && (() => {
          const eqTypeLabel = form.equipmentType in CONSTRUCTION_EQUIPMENT_TYPES
            ? CONSTRUCTION_EQUIPMENT_TYPES[form.equipmentType as EquipmentType].label
            : "기타";
          const createTabs = [
            { id: "basic" as const,   label: "기본 정보" },
            { id: "spec" as const,    label: `제원 · ${eqTypeLabel}` },
            { id: "usage" as const,   label: `투입이력 (${usageLogs.length})` },
            { id: "history" as const, label: `점검이력 (${inspections.length})` },
          ];
          return (
            <div className="flex border-b px-4 overflow-x-auto flex-shrink-0" style={{ borderColor: "#e2e8f0" }}>
              {createTabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFormTab(t.id)}
                  className="text-xs px-4 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0"
                  style={{
                    borderColor: formTab === t.id ? PRIMARY : "transparent",
                    color: formTab === t.id ? PRIMARY : "#64748b",
                  }}
                >{t.label}</button>
              ))}
            </div>
          );
        })()}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Step 1: 장비·기계 종류 검색 / 직접입력 ── */}
          {step === "type" && (() => {
            const q = typeSearch.trim().toLowerCase();
            const allTypes: { key: string; label: string; icon: string }[] = [
              ...typeEntries.map(([key, { label, icon }]) => ({ key, label, icon })),
              { key: "other", label: "기타 (직접입력)", icon: "📦" },
            ];
            const filtered = q
              ? allTypes.filter((t) => t.label.toLowerCase().includes(q))
              : allTypes;
            return (
              <div className="p-5 space-y-3">
                <input
                  autoFocus
                  type="text"
                  value={typeSearch}
                  onChange={(e) => setTypeSearch(e.target.value)}
                  placeholder="장비·기계 종류 검색 또는 직접 입력..."
                  className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none focus:border-teal-400"
                  style={{ borderColor: "#e2e8f0" }}
                />
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {filtered.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => handleSelectType(t.key)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all hover:bg-teal-50"
                      style={{ background: "white" }}
                    >
                      <span className="text-xl w-7 text-center flex-shrink-0">{t.icon}</span>
                      <span className="text-sm font-medium text-slate-700">{t.label}</span>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">일치하는 종류가 없습니다.<br />아래 &quot;등록하기&quot;로 직접 등록하세요.</p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ── Step 2: 장비 정보 폼 (탭) ── */}
          {step === "form" && (
            <div className="p-5 space-y-5">

              {/* ── 기본 정보 탭 ── */}
              {formTab === "basic" && (
                <>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2.5">식별 정보</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          장비명 <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setF("name", e.target.value)}
                          placeholder="예: 굴착기 #1"
                          className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400"
                          style={{ borderColor: "#e2e8f0" }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">건설기계등록번호 (차량번호)</label>
                        <input type="text" value={form.registrationNumber} onChange={(e) => setF("registrationNumber", e.target.value)}
                          placeholder="예: 서울02가1234"
                          className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0" }} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">제조사</label>
                        <input type="text" value={form.manufacturer} onChange={(e) => setF("manufacturer", e.target.value)}
                          placeholder="예: 현대건설기계"
                          className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0" }} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">모델명</label>
                        <input type="text" value={form.model} onChange={(e) => setF("model", e.target.value)}
                          placeholder="예: PC200-10M0"
                          className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0" }} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">제조연도</label>
                        <input type="text" value={form.year} onChange={(e) => setF("year", e.target.value)}
                          placeholder="예: 2021"
                          className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0" }} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2.5">관리 정보</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">담당 운전원</label>
                        <input type="text" value={form.operatorName} onChange={(e) => setF("operatorName", e.target.value)}
                          placeholder="운전원 이름"
                          className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0" }} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">면허번호</label>
                        <input type="text" value={form.operatorLicense} onChange={(e) => setF("operatorLicense", e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0" }} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">구입일</label>
                        <input type="date" value={form.purchaseDate} onChange={(e) => setF("purchaseDate", e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0" }} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">작업장소</label>
                        <input type="text" value={form.workLocation} onChange={(e) => setF("workLocation", e.target.value)}
                          placeholder="예: 3공구 굴착 현장"
                          className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0" }} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">수량</label>
                        <input type="text" value={form.qty} onChange={(e) => setF("qty", e.target.value)}
                          placeholder="예: 1"
                          className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0" }} />
                      </div>
                      <div className={form.inspectionTarget === "Y" ? "col-span-2" : ""}>
                        <label className="block text-xs font-medium text-slate-500 mb-1">검사대상</label>
                        <div className="flex gap-4 px-1 py-2">
                          {(["Y", "N"] as const).map((v) => (
                            <label key={v} className="flex items-center gap-1.5 text-sm cursor-pointer">
                              <input type="radio" name="create-inspectionTarget" value={v}
                                checked={form.inspectionTarget === v}
                                onChange={() => setF("inspectionTarget", v)}
                                className="accent-teal-500" />
                              <span className={form.inspectionTarget === v ? "font-semibold text-slate-700" : "text-slate-400"}>{v}</span>
                            </label>
                          ))}
                        </div>
                        {form.inspectionTarget === "Y" && (
                          <input type="text" value={form.inspectionBasis} onChange={(e) => setF("inspectionBasis", e.target.value)}
                            placeholder="근거규정 입력 (예: 산안법 제93조)"
                            className="w-full mt-1 px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0" }} />
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">방호장치</label>
                        <input type="text" value={form.safetyDevice} onChange={(e) => setF("safetyDevice", e.target.value)}
                          placeholder="예: 후방카메라, 경보장치"
                          className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0" }} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">재해형태</label>
                        <input type="text" value={form.accidentType} onChange={(e) => setF("accidentType", e.target.value)}
                          placeholder="예: 협착, 전도"
                          className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0" }} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-500 mb-1">특이사항</label>
                        <input type="text" value={form.notes} onChange={(e) => setF("notes", e.target.value)}
                          placeholder="특이사항 입력"
                          className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0" }} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── 제원 탭 ── */}
              {formTab === "spec" && (
                <>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2.5">기본 제원</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          {CAPACITY_LABELS[form.equipmentType] ?? "정격용량"}
                        </label>
                        <input type="text" value={form.capacity} onChange={(e) => setF("capacity", e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0" }} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">자중 (ton)</label>
                        <input type="text" value={form.weight} onChange={(e) => setF("weight", e.target.value)}
                          placeholder="예: 20.5"
                          className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0" }} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-500 mb-1">제원 (길이 × 폭 × 높이)</label>
                        <input type="text" value={form.dimensions} onChange={(e) => setF("dimensions", e.target.value)}
                          placeholder="예: 9,455 × 2,800 × 2,970mm"
                          className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0" }} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">엔진출력</label>
                        <input type="text" value={form.enginePower} onChange={(e) => setF("enginePower", e.target.value)}
                          placeholder="예: 110kW / 150PS"
                          className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0" }} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">작업반경</label>
                        <input type="text" value={form.workRadius} onChange={(e) => setF("workRadius", e.target.value)}
                          placeholder="예: 12m"
                          className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0" }} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2.5">점검 / 검사</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">점검·검사 유효기간</label>
                        <input
                          type="date"
                          value={form.nextInspectionDate}
                          onChange={(e) => setF("nextInspectionDate", e.target.value)}
                          disabled={form.inspectionNA}
                          className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-300"
                          style={{ borderColor: "#e2e8f0" }}
                        />
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.inspectionNA}
                            onChange={(e) => setF("inspectionNA", e.target.checked)}
                            className="rounded"
                          />
                          해당없음
                        </label>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">점검 주기</label>
                        <input type="text" value={form.inspectionCycle} onChange={(e) => setF("inspectionCycle", e.target.value)}
                          placeholder="예: 6개월"
                          className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400" style={{ borderColor: "#e2e8f0" }} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2.5">가입보험기간</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">시작일</label>
                        <input
                          type="date"
                          value={form.insuranceStart}
                          onChange={(e) => setF("insuranceStart", e.target.value)}
                          disabled={form.insuranceNA}
                          className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-300"
                          style={{ borderColor: "#e2e8f0" }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">종료일</label>
                        <input
                          type="date"
                          value={form.insuranceExpiry}
                          onChange={(e) => setF("insuranceExpiry", e.target.value)}
                          disabled={form.insuranceNA}
                          className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-300"
                          style={{ borderColor: "#e2e8f0" }}
                        />
                      </div>
                      <div className="col-span-2 flex items-center">
                        <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.insuranceNA}
                            onChange={(e) => setF("insuranceNA", e.target.checked)}
                            className="rounded"
                          />
                          해당없음
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── 투입이력 탭 ── */}
              {formTab === "usage" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500">투입이력 ({usageLogs.length})</p>
                    {!usageDraft && (
                      <button
                        onClick={() => setUsageDraft({ ...EMPTY_USAGE_LOG, startDate: today })}
                        className="text-xs px-3 py-1.5 rounded-xl font-medium text-white"
                        style={{ background: PRIMARY }}
                      >+ 행 추가</button>
                    )}
                  </div>
                  {usageDraft && (
                    <UsageLogForm
                      draft={usageDraft}
                      onChange={setUsageDraft}
                      onSave={() => { setUsageLogs((p) => [usageDraft, ...p]); setUsageDraft(null); }}
                      onCancel={() => setUsageDraft(null)}
                      isNew
                    />
                  )}
                  {usageLogs.length === 0 && !usageDraft && (
                    <p className="text-xs text-slate-300 text-center py-8">추가된 투입이력이 없습니다</p>
                  )}
                  {usageLogs.map((log, i) => (
                    <div key={i} className="rounded-xl border p-3 text-xs text-slate-600 space-y-1" style={{ borderColor: "#e2e8f0" }}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">{log.workPlanTitle || "(작업명 없음)"}</span>
                        <button onClick={() => setUsageLogs((p) => p.filter((_, j) => j !== i))}
                          className="text-slate-300 hover:text-red-400 transition-colors">✕</button>
                      </div>
                      <p className="text-slate-400">{log.startDate || "?"} ~ {log.endDate || "?"}{log.operator && ` · ${log.operator}`}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* ── 점검이력 탭 ── */}
              {formTab === "history" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500">점검이력 ({inspections.length})</p>
                    {!inspDraft && (
                      <button
                        onClick={() => setInspDraft({ ...EMPTY_INSPECTION, date: today })}
                        className="text-xs px-3 py-1.5 rounded-xl font-medium text-white"
                        style={{ background: PRIMARY }}
                      >+ 점검 추가</button>
                    )}
                  </div>
                  {inspDraft && (
                    <InspectionForm
                      draft={inspDraft}
                      onChange={setInspDraft}
                      onSave={() => { setInspections((p) => [inspDraft, ...p]); setInspDraft(null); }}
                      onCancel={() => setInspDraft(null)}
                      isNew
                    />
                  )}
                  {inspections.length === 0 && !inspDraft && (
                    <p className="text-xs text-slate-300 text-center py-8">추가된 점검이력이 없습니다</p>
                  )}
                  {inspections.map((ins, i) => (
                    <InspectionRow
                      key={i}
                      ins={{ ...ins, id: `pre_${i}` }}
                      onEdit={() => {}}
                      onDelete={() => setInspections((p) => p.filter((_, j) => j !== i))}
                      disabled={false}
                    />
                  ))}
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-white flex items-center gap-2 flex-shrink-0" style={{ borderColor: "#e2e8f0" }}>
          {step === "form" && (
            <button
              onClick={() => { setStep("type"); setTypeSearch(""); }}
              className="text-xs px-3 py-1.5 rounded-lg border text-slate-500 font-medium"
              style={{ borderColor: "#e2e8f0" }}
            >← 뒤로</button>
          )}
          <span className="flex-1" />
          <button onClick={onClose} className="text-xs px-3 py-1.5 rounded-xl text-slate-500 bg-slate-100 font-medium">취소</button>
          {step === "type" && (() => {
            const q = typeSearch.trim();
            const allTypes = [
              ...typeEntries.map(([key, { label }]) => label),
              "기타 (직접입력)",
            ];
            const isDirect = q && !allTypes.some((l) => l.toLowerCase() === q.toLowerCase());
            return isDirect ? (
              <button
                onClick={() => handleSelectType(q)}
                className="text-xs px-4 py-1.5 rounded-xl font-semibold text-white transition-all"
                style={{ background: PRIMARY }}
              >
                &quot;{q}&quot; 등록하기
              </button>
            ) : null;
          })()}
          {step === "form" && (
            <button
              onClick={handleSave}
              disabled={!form.name}
              className="text-xs px-4 py-1.5 rounded-xl font-semibold text-white transition-all"
              style={{ background: form.name ? PRIMARY : "#cbd5e1" }}
            >
              등록 완료
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 메인 장비·기계 관리 (테이블 뷰) ───────────────────────────────────────────
export default function EquipmentRegistry() {
  const { records, deleteRecord } = useEquipmentRegistryStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");

  const activeRecord = activeId ? records.find((r) => r.id === activeId) : null;

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    return !q ||
      r.name.toLowerCase().includes(q) ||
      r.model.toLowerCase().includes(q) ||
      r.registrationNumber.toLowerCase().includes(q) ||
      r.serialNumber.toLowerCase().includes(q) ||
      r.operatorName.toLowerCase().includes(q) ||
      getEquipmentTypeLabel(r.equipmentType).toLowerCase().includes(q);
  });

  const dueCount = records.filter(
    (r) => r.nextInspectionDate && new Date(r.nextInspectionDate) <= new Date()
  ).length;

  const handleCreate = () => setShowCreate(true);

  return (
    <div className="flex flex-col h-full" style={{ background: "#f8fafc" }}>
      {/* ── 헤더 ── */}
      <div className="px-5 py-4 border-b flex-shrink-0" style={{ background: "white", borderColor: "#e2e8f0" }}>
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-slate-800">장비·기계 관리</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              총 {records.length}대
              {dueCount > 0 && (
                <span className="ml-2 text-red-500 font-medium">· 점검 기한 초과 {dueCount}대</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="text-xs px-4 py-2 rounded-xl font-medium border transition-colors flex items-center gap-1.5"
              style={{ borderColor: PRIMARY, color: PRIMARY, background: PRIMARY_LIGHT }}
            >
              📋 작업계획서에서 불러오기
            </button>
            <button
              onClick={handleCreate}
              className="text-sm px-4 py-2 rounded-xl font-medium text-white transition-colors"
              style={{ background: PRIMARY }}
            >
              + 장비·기계 등록
            </button>
          </div>
        </div>

        {/* 검색 */}
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="장비명, 등록번호, 모델, 운전원 검색..."
            className="flex-1 min-w-48 px-3 py-1.5 border rounded-xl text-sm outline-none focus:border-teal-400"
            style={{ borderColor: "#e2e8f0" }}
          />
        </div>
      </div>

      {/* ── 테이블 ── */}
      <div className="flex-1 overflow-auto px-5 py-4">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-4xl mb-3">🚜</div>
            <p className="text-sm font-medium mb-1">등록된 장비가 없습니다</p>
            <p className="text-xs text-slate-300 mb-4">작업계획서에서 불러오거나 직접 등록하세요</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setShowImport(true)}
                className="text-xs px-4 py-2 rounded-xl font-medium border"
                style={{ borderColor: PRIMARY, color: PRIMARY, background: PRIMARY_LIGHT }}
              >
                📋 작업계획서에서 불러오기
              </button>
              <button
                onClick={handleCreate}
                className="text-xs px-4 py-2 rounded-xl text-white font-medium"
                style={{ background: PRIMARY }}
              >
                직접 등록
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#e2e8f0" }}>
          <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
                {[
                  "순번", "기계·설비명", "관리번호", "용량", "작업장소",
                  "수량", "검사대상", "방호장치", "담당자명", "투입기간", ""
                ].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-semibold text-slate-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((record, idx) => {
                const dash = <span className="text-slate-300">-</span>;
                return (
                  <tr
                    key={record.id}
                    className="border-b cursor-pointer hover:bg-slate-50 transition-colors"
                    style={{ borderColor: "#f1f5f9" }}
                    onClick={() => setActiveId(record.id)}
                  >
                    <td className="px-4 py-3 text-slate-400 text-center">{filtered.length - idx}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800">{record.name || "(이름 없음)"}</span>
                      {record.model && <span className="text-slate-400 ml-1.5">{record.model}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {record.registrationNumber || dash}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {record.capacity || dash}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {record.workLocation || dash}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {record.qty || dash}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {record.inspectionTarget
                        ? <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "#d1fae5", color: "#065f46" }}>{record.inspectionTarget}</span>
                        : dash}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {record.safetyDevice || dash}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {record.operatorName || dash}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {(() => {
                        const logs = record.usageLogs ?? [];
                        const last = logs[0];
                        if (!last) return dash;
                        const start = last.startDate || "?";
                        const end = last.endDate || "?";
                        return <span>{start} ~ {end}</span>;
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`"${record.name}" 장비를 삭제하시겠습니까?`)) {
                            deleteRecord(record.id);
                            if (activeId === record.id) setActiveId(null);
                          }
                        }}
                        className="text-slate-300 hover:text-red-400 transition-colors px-2"
                      >✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* 모달들 */}
      {showImport && <ImportFromPlanModal onClose={() => setShowImport(false)} />}
      {showCreate && (
        <CreateEquipmentModal
          onClose={() => setShowCreate(false)}
          onCreated={(id) => { setShowCreate(false); setActiveId(id); }}
        />
      )}
      {activeRecord && <EquipmentDetailModal record={activeRecord} onClose={() => setActiveId(null)} />}
    </div>
  );
}
