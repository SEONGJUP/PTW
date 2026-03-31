"use client";
import React from "react";
import {
  useWorkPlanStore, CONSTRUCTION_EQUIPMENT_TYPES, EquipmentType,
  SECTION_TO_EQUIPMENT,
} from "@/store/workPlanStore";
import {
  getCategoryById, getSubcategoryById,
  WORK_ATTRIBUTES, RISK_ATTRIBUTES,
  EQUIPMENT_GROUPS_DISPLAY,
} from "@/store/workPlanTaxonomy";
import { useEquipmentRegistryStore, EquipmentRecord, getEquipmentTypeLabel } from "@/store/equipmentRegistryStore";
import FileUploader from "./FileUploader";

const PRIMARY = "#00B7AF";
const PRIMARY_LIGHT = "#E6FAF9";

// ─── Helper ──────────────────────────────────────────────────────
function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="ptw-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="ptw-input w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="ptw-label">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="ptw-input w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white resize-none"
      />
    </div>
  );
}

function CheckItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer py-1 group">
      <div
        className="w-4 h-4 rounded border-2 flex items-center justify-center text-white text-xs flex-shrink-0 transition-all duration-100"
        style={{
          background: checked ? PRIMARY : "white",
          borderColor: checked ? PRIMARY : "#cbd5e1",
          animation: checked ? "checkPop 120ms ease-out both" : undefined,
        }}
        onClick={() => onChange(!checked)}
      >
        {checked && "✓"}
      </div>
      <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">{label}</span>
    </label>
  );
}

// ─── SafeBuddy 안전카드 불러오기 버튼 (stub) ─────────────────────
function SafeCardButton({ context }: { context: string }) {
  const handleClick = () => {
    alert(`[SafeBuddy 연동 준비 중]\n${context} 관련 안전카드 문서를 SafeBuddy 시스템에서 불러옵니다.\n\n실제 연동 시 SafeBuddy API를 통해 해당 작업 유형의\n안전카드를 검색·선택하여 자동 입력할 수 있습니다.`);
  };
  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all hover:opacity-80 active:scale-95"
      style={{ borderColor: `${PRIMARY}66`, color: PRIMARY, background: PRIMARY_LIGHT }}
    >
      🛡 안전카드 불러오기
    </button>
  );
}

function useSection<T extends Record<string, unknown>>(id: string, defaults: T): [T, (key: keyof T, val: unknown) => void] {
  const { formData, updateFormData } = useWorkPlanStore();
  const data = ((formData[id] as T) ?? defaults) as T;
  const update = (key: keyof T, val: unknown) => {
    updateFormData(id, { ...data, [key]: val });
  };
  return [data, update];
}

// ─── 작업 개요 (공통) ────────────────────────────────────────────
const CONTRACTOR_PRESETS = ["해당없음", "자사", "현대건설", "삼성물산", "GS건설", "대우건설", "포스코건설", "롯데건설"];

function OverviewForm() {
  const { formData, updateFormData, classification } = useWorkPlanStore();
  const data = (formData["overview"] as Record<string, string>) ?? {};
  const update = (key: string, value: string) =>
    updateFormData("overview", { ...data, [key]: value });

  const savedContractor = (data.contractor as string) || "해당없음";
  const isCustomContractor = !!savedContractor && !CONTRACTOR_PRESETS.includes(savedContractor);
  const [showCustomInput, setShowCustomInput] = React.useState(isCustomContractor);

  const workStepsData = (formData["work_steps"] as { steps?: { id: string; task: string; content: string; responsible: string }[] }) ?? {};
  const workSteps = workStepsData.steps ?? [];
  const updateStep = (id: string, key: string, value: string) =>
    updateFormData("work_steps", { steps: workSteps.map((m) => m.id === id ? { ...m, [key]: value } : m) });
  const addStepRow = () =>
    updateFormData("work_steps", { steps: [...workSteps, { id: `ws${Date.now()}`, task: "", content: "", responsible: "" }] });
  const removeStep = (id: string) =>
    updateFormData("work_steps", { steps: workSteps.filter((m) => m.id !== id) });

  const workStartDate = data.workStartDate ?? "";
  const workEndDate = data.workEndDate ?? "";
  const durationDays = React.useMemo(() => {
    if (!workStartDate || !workEndDate) return null;
    const s = new Date(workStartDate);
    const e = new Date(workEndDate);
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff + 1 : null;
  }, [workStartDate, workEndDate]);

  return (
    <div className="space-y-3">
      {/* 사업장명 */}
      <div>
        <label className="ptw-label flex items-center gap-1.5">
          사업장명
          <span className="text-xs px-1.5 py-0.5 rounded font-normal" style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>연동</span>
        </label>
        <input
          type="text"
          value={data.siteName ?? ""}
          readOnly
          placeholder="SafeBuddy 연동"
          className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
          style={{ borderColor: `${PRIMARY}22` }}
        />
      </div>

      {/* Row 1: 작업명 · 문서작성일 · 작성자 */}
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-2">
          <TextField label="작업명(문서제목) *" value={data.title ?? ""} onChange={(v) => update("title", v)} placeholder="예: 3호기 터빈 정기 점검" />
        </div>
        <div>
          <label className="ptw-label">문서작성일</label>
          <input
            type="date"
            value={data.documentDate ?? ""}
            onChange={(e) => update("documentDate", e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-400"
          />
        </div>
        <TextField label="작성자" value={data.author ?? ""} onChange={(v) => update("author", v)} placeholder="홍길동" />
      </div>

      {/* Row 2: 공정 · 작업 장소 · 작업인원 · 협력사 */}
      <div className="grid grid-cols-4 gap-3">
        <TextField label="공정" value={data.process ?? ""} onChange={(v) => update("process", v)} placeholder="예: 토공사" />
        <TextField label="작업 장소" value={data.location ?? ""} onChange={(v) => update("location", v)} placeholder="예: 제1공장 3층" />
        <TextField label="작업인원" value={data.headCount ?? ""} onChange={(v) => update("headCount", v)} placeholder="0명" type="number" />
        <div>
          <label className="ptw-label">협력사</label>
          <select
            value={showCustomInput ? "__custom__" : (savedContractor || "해당없음")}
            onChange={(e) => {
              if (e.target.value === "__custom__") { setShowCustomInput(true); update("contractor", ""); }
              else { setShowCustomInput(false); update("contractor", e.target.value); }
            }}
            className="ptw-input w-full px-2 py-2 border border-slate-200 rounded-lg text-sm bg-white"
          >
            {CONTRACTOR_PRESETS.map((o) => <option key={o} value={o}>{o}</option>)}
            <option value="__custom__">직접 입력...</option>
          </select>
          {showCustomInput && (
            <input type="text" value={data.contractor ?? ""} onChange={(e) => update("contractor", e.target.value)}
              placeholder="협력사명 입력" autoFocus
              className="ptw-input mt-1 w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white anim-fade-in-up" />
          )}
        </div>
      </div>

      {/* 작업기간 */}
      <div className="pt-1">
        <div className="grid grid-cols-4 gap-3 items-end">
          <div>
            <label className="ptw-label">작업 시작일</label>
            <input type="date" value={workStartDate} onChange={(e) => update("workStartDate", e.target.value)} className="ptw-input w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" />
          </div>
          <div>
            <label className="ptw-label">작업 종료일</label>
            <input type="date" value={workEndDate} onChange={(e) => update("workEndDate", e.target.value)} className="ptw-input w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" />
          </div>
          <div className="pb-1">
            {durationDays !== null ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>
                📅 총 작업기간: {durationDays}일
              </div>
            ) : (
              <div className="px-3 py-2 rounded-lg text-xs text-slate-400 bg-slate-50">시작일·종료일 입력 시 총 기간 표시</div>
            )}
          </div>
        </div>
      </div>

      {/* 작업순서 및 작업방법 */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">작업순서 및 작업방법</span>
        </div>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: PRIMARY_LIGHT }}>
                {["작업명", "작업내용", "담당", ""].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium text-slate-600 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workSteps.map((m) => (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="px-2 py-1 w-28"><input type="text" value={m.task} onChange={(e) => updateStep(m.id, "task", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="작업명" /></td>
                  <td className="px-2 py-1"><input type="text" value={m.content} onChange={(e) => updateStep(m.id, "content", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="작업내용" /></td>
                  <td className="px-2 py-1 w-24"><input type="text" value={m.responsible} onChange={(e) => updateStep(m.id, "responsible", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="담당자" /></td>
                  <td className="px-2 py-1"><button onClick={() => removeStep(m.id)} className="text-slate-300 hover:text-red-400 text-sm px-1">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-3 py-2 border-t border-slate-100">
            <button onClick={addStepRow} className="text-xs text-slate-400 hover:text-teal-500">+ 행 추가</button>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── 약식: 작업 개요 ─────────────────────────────────────────────
function SimplifiedOverviewForm() {
  const { formData, updateFormData } = useWorkPlanStore();
  const data = (formData["overview"] as Record<string, string>) ?? {};
  const update = (key: string, value: string) =>
    updateFormData("overview", { ...data, [key]: value });

  return (
    <div className="space-y-4">
      <TextField label="작업명" value={data.title ?? ""} onChange={(v) => update("title", v)} placeholder="작업명을 입력하세요" />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="작업 장소" value={data.location ?? ""} onChange={(v) => update("location", v)} placeholder="작업 위치" />
        <TextField label="작업 일시" value={data.workDate ?? ""} onChange={(v) => update("workDate", v)} type="date" />
      </div>
    </div>
  );
}

// ─── 약식: 주요 위험요인 ─────────────────────────────────────────
interface SimplifiedRiskData { risks: string[] }

function SimplifiedRiskForm() {
  const { formData, updateFormData } = useWorkPlanStore();
  const data = (formData["simplified_risk"] as SimplifiedRiskData) ?? { risks: ["", "", ""] };
  const risks = data.risks.length > 0 ? data.risks : ["", "", ""];

  const update = (i: number, v: string) => {
    const arr = [...risks];
    arr[i] = v;
    updateFormData("simplified_risk", { risks: arr });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400">주요 위험요인을 최대 3개 작성하세요</p>
      {risks.slice(0, 3).map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs font-bold w-5 text-center" style={{ color: i === 0 ? "#ef4444" : i === 1 ? "#f59e0b" : "#22c55e" }}>
            {i + 1}
          </span>
          <input
            type="text"
            value={r}
            onChange={(e) => update(i, e.target.value)}
            placeholder={`위험요인 ${i + 1}`}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-400"
          />
        </div>
      ))}
    </div>
  );
}

// ─── 약식: 안전 조치 사항 ────────────────────────────────────────
const SIMPLIFIED_SAFETY_ITEMS = [
  "작업 전 안전교육 실시",
  "개인보호구(PPE) 착용 확인",
  "작업 구역 출입 통제",
  "위험 표지판 설치",
  "비상구 및 대피로 확인",
  "응급처치 키트 준비",
];

interface SimplifiedSafetyData { checks: Record<string, boolean>; note: string }

function SimplifiedSafetyForm() {
  const { formData, updateFormData } = useWorkPlanStore();
  const data = (formData["simplified_safety"] as SimplifiedSafetyData) ?? { checks: {}, note: "" };

  const setCheck = (item: string, v: boolean) => {
    updateFormData("simplified_safety", { ...data, checks: { ...data.checks, [item]: v } });
  };
  const setNote = (v: string) => {
    updateFormData("simplified_safety", { ...data, note: v });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 px-4 py-3 space-y-1">
        {SIMPLIFIED_SAFETY_ITEMS.map((item) => (
          <CheckItem key={item} label={item} checked={data.checks?.[item] ?? false} onChange={(v) => setCheck(item, v)} />
        ))}
      </div>
      <TextAreaField label="추가 조치 사항" value={data.note ?? ""} onChange={setNote} placeholder="기타 안전 조치 사항을 입력하세요" rows={2} />
    </div>
  );
}

// ─── 중량물 취급 ────────────────────────────────────────────────
interface HeavyGoodsRow {
  id: string;
  itemName: string;
  shape: string;
  weight: string;
  cargoSize: string;
  distance: string;
  method: string;
  note: string;
}
interface HeavyGoodsRigging {
  tools?: string[];
  toolCustom?: string;
  accessories?: string[];
  accessoryCustom?: string;
  diameter?: string;
  swl?: string;
  slingCount?: string;
  loadFactor?: string;
  safetyFactor?: string;
  // 인양 능력 검토
  reviewSlingMaxLoad?: string;
  reviewSlingTotalLoad?: string;
  reviewSlingResult?: "가능" | "불가" | "";
  reviewRatedLoad?: string;
  reviewRatedTotalLoad?: string;
  reviewRatedResult?: "가능" | "불가" | "";
  // 화물 상태
  cargoAllowLoad?: string;
  cargoItemName?: string;
  cargoUnitWeight?: string;
  cargoShapeType?: string;
  cargoDimensions?: string;
  cargoQtyPerTrip?: string;
  cargoWeightPerTrip?: string;
  cargoTotalQty?: string;
  cargoTotalWeight?: string;
  // 적재 상태
  stackHeight?: string;
  routeMinHeight?: string;
  stackWidth?: string;
  routeMinWidth?: string;
  driverVisibility?: string;
  cargoFixStatus?: string;
}
interface HeavyGoodsData { rows?: HeavyGoodsRow[]; rigging?: HeavyGoodsRigging }

const CARGO_SHAPE_OPTIONS = ["사각", "원통", "구형", "기타"];
const SLING_TOOLS = ["와이어로프", "섬유로프", "체인", "기타"] as const;
const SLING_ACCESSORIES = ["클램프", "해커", "체인슬링", "러그", "기타"] as const;

function HeavyGoodsForm() {
  const { formData, updateFormData } = useWorkPlanStore();
  const data = (formData["heavy_goods"] as HeavyGoodsData) ?? {};
  const rows: HeavyGoodsRow[] = data.rows ?? [];
  const rigging: HeavyGoodsRigging = data.rigging ?? {};
  const [riggingOpen, setRiggingOpen] = React.useState(false);
  const [cargoOpen, setCargoOpen] = React.useState(false);

  const updateRow = (id: string, key: keyof HeavyGoodsRow, value: string) =>
    updateFormData("heavy_goods", { ...data, rows: rows.map((r) => r.id === id ? { ...r, [key]: value } : r) });
  const addRow = () =>
    updateFormData("heavy_goods", { ...data, rows: [...rows, { id: `hg${Date.now()}`, itemName: "", shape: "", weight: "", cargoSize: "", distance: "", method: "", note: "" }] });
  const removeRow = (id: string) =>
    updateFormData("heavy_goods", { ...data, rows: rows.filter((r) => r.id !== id) });

  const updateRigging = (patch: Partial<HeavyGoodsRigging>) =>
    updateFormData("heavy_goods", { ...data, rigging: { ...rigging, ...patch } });

  const toggleChip = (field: "tools" | "accessories", item: string) => {
    const cur: string[] = rigging[field] ?? [];
    updateRigging({ [field]: cur.includes(item) ? cur.filter((v) => v !== item) : [...cur, item] });
  };

  // 최대사용하중 자동계산: (안전작업하중 × 줄걸이수) / 하중계수
  const maxLoad = (() => {
    const swl = parseFloat(rigging.swl ?? "");
    const cnt = parseFloat(rigging.slingCount ?? "");
    const lf = parseFloat(rigging.loadFactor ?? "");
    if (!isNaN(swl) && !isNaN(cnt) && !isNaN(lf) && lf !== 0) {
      return ((swl * cnt) / lf).toFixed(3);
    }
    return "";
  })();

  // 인양 능력 검토 자동계산: 기준하중 > 하중 총중량 → 가능
  React.useEffect(() => {
    const patch: Partial<HeavyGoodsRigging> = {};
    const check = (max: string | undefined, total: string | undefined) => {
      const m = parseFloat(max ?? ""), t = parseFloat(total ?? "");
      if (!isNaN(m) && !isNaN(t)) return m >= t ? "가능" : "불가";
      return undefined;
    };
    const sr = check(rigging.reviewSlingMaxLoad, rigging.reviewSlingTotalLoad);
    const rr = check(rigging.reviewRatedLoad, rigging.reviewRatedTotalLoad);
    if (sr !== undefined && sr !== rigging.reviewSlingResult) patch.reviewSlingResult = sr;
    if (rr !== undefined && rr !== rigging.reviewRatedResult) patch.reviewRatedResult = rr;
    if (Object.keys(patch).length) updateRigging(patch);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rigging.reviewSlingMaxLoad, rigging.reviewSlingTotalLoad, rigging.reviewRatedLoad, rigging.reviewRatedTotalLoad]);

  // 화물 운반 능력 검토: 허용하중 - 1회 운반중량
  const cargoReview = (() => {
    const allow = parseFloat(rigging.cargoAllowLoad ?? "");
    const perTrip = parseFloat(rigging.cargoWeightPerTrip ?? "");
    if (!isNaN(allow) && !isNaN(perTrip)) return { diff: (allow - perTrip).toFixed(1), ok: allow >= perTrip };
    return null;
  })();

  // 적재 상태 검토: 적재높이 ≤ 통로최소높이 AND 적재너비 ≤ 통로최소너비
  const stackReview = (() => {
    const sh = parseFloat(rigging.stackHeight ?? "");
    const rh = parseFloat(rigging.routeMinHeight ?? "");
    const sw = parseFloat(rigging.stackWidth ?? "");
    const rw = parseFloat(rigging.routeMinWidth ?? "");
    const hOk = !isNaN(sh) && !isNaN(rh) ? sh <= rh : null;
    const wOk = !isNaN(sw) && !isNaN(rw) ? sw <= rw : null;
    if (hOk === null && wOk === null) return null;
    const ok = (hOk ?? true) && (wOk ?? true);
    return { hOk, wOk, ok };
  })();

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: PRIMARY_LIGHT }}>
              {["품명", "화물형상", "화물중량", "화물크기", "운반거리", "취급방법", "특이사항", ""].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium text-slate-600 text-xs whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-2 py-1.5"><input type="text" value={r.itemName} onChange={(e) => updateRow(r.id, "itemName", e.target.value)} className="w-full min-w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="품명" /></td>
                <td className="px-2 py-1.5">
                  <select value={r.shape} onChange={(e) => updateRow(r.id, "shape", e.target.value)} className="px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400">
                    <option value="">선택</option>
                    {CARGO_SHAPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1.5"><input type="text" value={r.weight} onChange={(e) => updateRow(r.id, "weight", e.target.value)} className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="예: 500kg" /></td>
                <td className="px-2 py-1.5"><input type="text" value={r.cargoSize} onChange={(e) => updateRow(r.id, "cargoSize", e.target.value)} className="w-28 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="예: 2.0×1.5×1.2m" /></td>
                <td className="px-2 py-1.5"><input type="text" value={r.distance} onChange={(e) => updateRow(r.id, "distance", e.target.value)} className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="예: 50m" /></td>
                <td className="px-2 py-1.5"><input type="text" value={r.method} onChange={(e) => updateRow(r.id, "method", e.target.value)} className="w-full min-w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="예: 크레인 인양" /></td>
                <td className="px-2 py-1.5"><input type="text" value={r.note} onChange={(e) => updateRow(r.id, "note", e.target.value)} className="w-full min-w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="특이사항" /></td>
                <td className="px-2 py-1.5"><button onClick={() => removeRow(r.id)} className="text-slate-300 hover:text-red-400 text-sm px-1">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-3 py-2 border-t border-slate-100"><button onClick={addRow} className="text-xs text-slate-400 hover:text-teal-500">+ 행 추가</button></div>
      </div>

      {/* 줄걸이 용구 세부사항 (선택) */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setRiggingOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50"
        >
          <span className="text-sm font-medium text-slate-700">줄걸이 용구 세부사항 <span className="text-xs font-normal text-slate-400">(선택)</span></span>
          <div className="flex items-center gap-2">
            {((rigging.tools?.length ?? 0) > 0 || (rigging.accessories?.length ?? 0) > 0 || rigging.swl) && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>입력됨</span>
            )}
            <span className="text-slate-400 text-xs">{riggingOpen ? "▲" : "▼"}</span>
          </div>
        </button>
        {riggingOpen && (
          <div className="border-t border-slate-100 px-4 py-4 space-y-4">
            {/* 줄걸이 용구 */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">줄걸이 용구</label>
              <div className="flex flex-wrap items-center gap-2">
                {SLING_TOOLS.map((item) => {
                  const sel = rigging.tools?.includes(item) ?? false;
                  return (
                    <button key={item} type="button" onClick={() => toggleChip("tools", item)}
                      className="text-xs px-3 py-1.5 rounded-full border transition-all"
                      style={{ background: sel ? PRIMARY : "white", borderColor: sel ? PRIMARY : "#e2e8f0", color: sel ? "white" : "#64748b" }}>
                      {item}
                    </button>
                  );
                })}
                {rigging.tools?.includes("기타") && (
                  <input type="text" value={rigging.toolCustom ?? ""} onChange={(e) => updateRigging({ toolCustom: e.target.value })}
                    placeholder="용구명 직접 입력" autoFocus
                    className="px-3 py-1.5 border border-slate-200 rounded-full text-xs focus:outline-none focus:border-teal-400 w-36" />
                )}
              </div>
            </div>
            {/* 보조 용구 */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">보조 용구</label>
              <div className="flex flex-wrap items-center gap-2">
                {SLING_ACCESSORIES.map((item) => {
                  const sel = rigging.accessories?.includes(item) ?? false;
                  return (
                    <button key={item} type="button" onClick={() => toggleChip("accessories", item)}
                      className="text-xs px-3 py-1.5 rounded-full border transition-all"
                      style={{ background: sel ? PRIMARY : "white", borderColor: sel ? PRIMARY : "#e2e8f0", color: sel ? "white" : "#64748b" }}>
                      {item}
                    </button>
                  );
                })}
                {rigging.accessories?.includes("기타") && (
                  <input type="text" value={rigging.accessoryCustom ?? ""} onChange={(e) => updateRigging({ accessoryCustom: e.target.value })}
                    placeholder="용구명 직접 입력" autoFocus
                    className="px-3 py-1.5 border border-slate-200 rounded-full text-xs focus:outline-none focus:border-teal-400 w-36" />
                )}
              </div>
            </div>
            {/* 수치 입력 */}
            <div className="grid grid-cols-4 gap-3">
              <TextField label="직경 (mm)" value={rigging.diameter ?? ""} onChange={(v) => updateRigging({ diameter: v })} placeholder="예: 16" type="number" />
              <TextField label="안전작업하중 (ton)" value={rigging.swl ?? ""} onChange={(v) => updateRigging({ swl: v })} placeholder="예: 3.2" type="number" />
              <TextField label="줄걸이수 (줄)" value={rigging.slingCount ?? ""} onChange={(v) => updateRigging({ slingCount: v })} placeholder="예: 2" type="number" />
              <TextField label="하중계수 (장력)" value={rigging.loadFactor ?? ""} onChange={(v) => updateRigging({ loadFactor: v })} placeholder="예: 1.4" type="number" />
            </div>
            <div className="grid grid-cols-4 gap-3 items-end">
              <TextField label="안전계수" value={rigging.safetyFactor ?? ""} onChange={(v) => updateRigging({ safetyFactor: v })} placeholder="예: 6" type="number" />
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">최대사용하중 (ton) <span className="text-slate-400 font-normal">자동계산</span></label>
                <div className="px-3 py-2 rounded-lg text-xs font-semibold border"
                  style={{ background: maxLoad ? PRIMARY_LIGHT : "#f8fafc", borderColor: maxLoad ? "#b2ece9" : "#e2e8f0", color: maxLoad ? PRIMARY : "#94a3b8" }}>
                  {maxLoad ? `${maxLoad} ton` : "(안전작업하중 × 줄수) ÷ 하중계수"}
                </div>
              </div>
            </div>

            {/* 인양 능력 검토 결과 */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-2.5 text-xs font-semibold text-slate-600 border-b border-slate-100" style={{ background: "#f8fafc" }}>
                인양 능력 검토 결과
              </div>
              {/* 헤더 */}
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-0 border-b border-slate-100 bg-slate-50">
                <div className="px-3 py-2 text-xs font-medium text-slate-500">구분</div>
                <div className="px-3 py-2 text-xs font-medium text-slate-500">기준 하중 (ton)</div>
                <div className="px-3 py-2 text-xs font-medium text-slate-500">하중 총중량 (ton)</div>
                <div className="px-3 py-2 text-xs font-medium text-slate-500 w-32">검토 결과</div>
              </div>
              {/* 줄걸이 용구 행 */}
              {([
                { label: "줄걸이 용구", maxField: "reviewSlingMaxLoad" as const, totalField: "reviewSlingTotalLoad" as const, resultField: "reviewSlingResult" as const, placeholder: "최대사용하중" },
                { label: "중량물 제원", maxField: "reviewRatedLoad" as const, totalField: "reviewRatedTotalLoad" as const, resultField: "reviewRatedResult" as const, placeholder: "정격하중" },
              ] as const).map(({ label, maxField, totalField, resultField, placeholder }) => (
                <div key={label} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-0 border-b border-slate-50 last:border-0">
                  <div className="px-3 py-2 text-xs text-slate-600 font-medium flex items-center">{label}</div>
                  <div className="px-2 py-1.5">
                    <input type="number" value={rigging[maxField] ?? ""} onChange={(e) => updateRigging({ [maxField]: e.target.value })}
                      placeholder={placeholder} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
                  </div>
                  <div className="px-2 py-1.5">
                    <input type="number" value={rigging[totalField] ?? ""} onChange={(e) => updateRigging({ [totalField]: e.target.value })}
                      placeholder="총중량" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
                  </div>
                  <div className="px-2 py-1.5 flex gap-1.5 items-center w-32">
                    {(["가능", "불가"] as const).map((opt) => (
                      <button key={opt} type="button"
                        onClick={() => updateRigging({ [resultField]: rigging[resultField] === opt ? "" : opt })}
                        className="flex-1 text-xs py-1.5 rounded-lg border font-medium transition-all"
                        style={{
                          background: rigging[resultField] === opt ? (opt === "가능" ? "#dcfce7" : "#fee2e2") : "white",
                          borderColor: rigging[resultField] === opt ? (opt === "가능" ? "#86efac" : "#fca5a5") : "#e2e8f0",
                          color: rigging[resultField] === opt ? (opt === "가능" ? "#166534" : "#991b1b") : "#94a3b8",
                        }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 화물 및 적재 상태 */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <button type="button" onClick={() => setCargoOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50">
          <span className="text-sm font-medium text-slate-700">화물 및 적재 상태 <span className="text-xs font-normal text-slate-400">(선택)</span></span>
          <div className="flex items-center gap-2">
            {(rigging.cargoAllowLoad || rigging.stackHeight) && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>입력됨</span>
            )}
            <span className="text-slate-400 text-xs">{cargoOpen ? "▲" : "▼"}</span>
          </div>
        </button>
        {cargoOpen && (
          <div className="border-t border-slate-100 px-4 py-4 space-y-5">

            {/* ── 화물 상태 ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-slate-600">화물 상태</span>
                <span className="text-xs text-slate-400">허용하중 ①</span>
                <div className="flex items-center gap-1">
                  <input type="number" value={rigging.cargoAllowLoad ?? ""} onChange={(e) => updateRigging({ cargoAllowLoad: e.target.value })}
                    placeholder="000" className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
                  <span className="text-xs text-slate-400">kg</span>
                  <span className="text-xs text-slate-300 ml-1">(제원별 별도 확인 후 기재)</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="ptw-label">품명</label>
                  <input type="text" value={rigging.cargoItemName ?? ""} onChange={(e) => updateRigging({ cargoItemName: e.target.value })}
                    placeholder="예: 철근(D-22)" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="ptw-label">단위중량 (kg)</label>
                  <input type="number" value={rigging.cargoUnitWeight ?? ""} onChange={(e) => updateRigging({ cargoUnitWeight: e.target.value })}
                    placeholder="000" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="ptw-label">종류 / 형상</label>
                  <input type="text" value={rigging.cargoShapeType ?? ""} onChange={(e) => updateRigging({ cargoShapeType: e.target.value })}
                    placeholder="예: 봉형 / 직선" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="ptw-label">크기 (가로×세로×높이) m</label>
                  <input type="text" value={rigging.cargoDimensions ?? ""} onChange={(e) => updateRigging({ cargoDimensions: e.target.value })}
                    placeholder="예: 1.0×0.5×0.3" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="ptw-label">1회 운반수량 (개)</label>
                  <input type="number" value={rigging.cargoQtyPerTrip ?? ""} onChange={(e) => updateRigging({ cargoQtyPerTrip: e.target.value })}
                    placeholder="0" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="ptw-label">1회 운반중량 ② (kg)</label>
                  <input type="number" value={rigging.cargoWeightPerTrip ?? ""} onChange={(e) => updateRigging({ cargoWeightPerTrip: e.target.value })}
                    placeholder="000" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="ptw-label">총 수량 (개)</label>
                  <input type="number" value={rigging.cargoTotalQty ?? ""} onChange={(e) => updateRigging({ cargoTotalQty: e.target.value })}
                    placeholder="0" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="ptw-label">총 중량 (kg)</label>
                  <input type="number" value={rigging.cargoTotalWeight ?? ""} onChange={(e) => updateRigging({ cargoTotalWeight: e.target.value })}
                    placeholder="000" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
                </div>
              </div>
              {/* 운반 능력 검토 */}
              <div className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl border" style={{ background: cargoReview ? (cargoReview.ok ? "#f0fdf4" : "#fef2f2") : "#f8fafc", borderColor: cargoReview ? (cargoReview.ok ? "#86efac" : "#fca5a5") : "#e2e8f0" }}>
                <span className="text-xs font-medium text-slate-500">운반 능력 검토 ① − ②</span>
                {cargoReview ? (
                  <>
                    <span className="text-xs font-semibold tabular-nums" style={{ color: cargoReview.ok ? "#166534" : "#991b1b" }}>
                      {cargoReview.diff} kg
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: cargoReview.ok ? "#dcfce7" : "#fee2e2", color: cargoReview.ok ? "#166534" : "#991b1b" }}>
                      {cargoReview.ok ? "적정" : "부적정"}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-300">허용하중과 1회 운반중량 입력 시 자동 계산</span>
                )}
              </div>
            </div>

            {/* ── 적재 상태 ── */}
            <div className="border-t border-slate-100 pt-4">
              <span className="text-xs font-semibold text-slate-600 block mb-3">적재 상태</span>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="ptw-label">적재 높이 ① (m)</label>
                  <input type="number" value={rigging.stackHeight ?? ""} onChange={(e) => updateRigging({ stackHeight: e.target.value })}
                    placeholder="0.0" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="ptw-label">작업장·통로 최소 높이 ② (m)</label>
                  <input type="number" value={rigging.routeMinHeight ?? ""} onChange={(e) => updateRigging({ routeMinHeight: e.target.value })}
                    placeholder="0.0" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="ptw-label">적재 너비 ③ (m)</label>
                  <input type="number" value={rigging.stackWidth ?? ""} onChange={(e) => updateRigging({ stackWidth: e.target.value })}
                    placeholder="0.0" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="ptw-label">작업장·통로 최소 너비 ④ (m)</label>
                  <input type="number" value={rigging.routeMinWidth ?? ""} onChange={(e) => updateRigging({ routeMinWidth: e.target.value })}
                    placeholder="0.0" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
                </div>
                <div className="col-span-2">
                  <label className="ptw-label">운전자 시야 확보</label>
                  <input type="text" value={rigging.driverVisibility ?? ""} onChange={(e) => updateRigging({ driverVisibility: e.target.value })}
                    placeholder="예: 적정 (조치내용: 유도원 배치)" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
                </div>
                <div className="col-span-2">
                  <label className="ptw-label">적재물 고정 상태</label>
                  <input type="text" value={rigging.cargoFixStatus ?? ""} onChange={(e) => updateRigging({ cargoFixStatus: e.target.value })}
                    placeholder="예: 적정 (조치내용: 결속 고정)" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
                </div>
              </div>
              {/* 적재 상태 검토 */}
              <div className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl border" style={{ background: stackReview ? (stackReview.ok ? "#f0fdf4" : "#fef2f2") : "#f8fafc", borderColor: stackReview ? (stackReview.ok ? "#86efac" : "#fca5a5") : "#e2e8f0" }}>
                <span className="text-xs font-medium text-slate-500">적재 상태 검토 ①≤② / ③≤④</span>
                {stackReview ? (
                  <>
                    <span className="text-xs text-slate-500">
                      높이 {stackReview.hOk === null ? "—" : stackReview.hOk ? "✓" : "✗"}
                      &nbsp;·&nbsp;
                      너비 {stackReview.wOk === null ? "—" : stackReview.wOk ? "✓" : "✗"}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: stackReview.ok ? "#dcfce7" : "#fee2e2", color: stackReview.ok ? "#166534" : "#991b1b" }}>
                      {stackReview.ok ? "적정" : "부적정"}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-300">치수 입력 시 자동 계산</span>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

// ─── 장비·기계 관리 불러오기 모달 ─────────────────────────────────────
function EquipmentRegistryPickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (recs: EquipmentRecord[]) => void;
  onClose: () => void;
}) {
  const { records } = useEquipmentRegistryStore();
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const filtered = [...records]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((r) =>
      !query ||
      r.name.includes(query) ||
      r.model.includes(query) ||
      r.manufacturer.includes(query)
    );
  const toggleSelect = (id: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const handleConfirm = () => {
    const picked = records.filter((r) => selected.has(r.id));
    if (picked.length > 0) onSelect(picked);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col"
        style={{ maxWidth: 560, maxHeight: "70vh", margin: "0 1rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ background: PRIMARY_LIGHT }}
        >
          <span className="text-sm font-bold" style={{ color: PRIMARY }}>📋 장비·기계 관리에서 불러오기</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
        </div>
        <div className="px-4 py-2 border-b flex-shrink-0">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="장비명·모델·제조사 검색"
            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-400"
            autoFocus
          />
        </div>
        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              {records.length === 0 ? "장비·기계 관리에 등록된 장비가 없습니다" : "검색 결과가 없습니다"}
            </div>
          ) : (
            filtered.map((rec) => {
              const isSel = selected.has(rec.id);
              return (
                <button
                  key={rec.id}
                  onClick={() => toggleSelect(rec.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-50 transition-colors"
                  style={{ background: isSel ? `${PRIMARY}0d` : undefined }}
                >
                  <div
                    className="w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center text-white"
                    style={{ background: isSel ? PRIMARY : "white", borderColor: isSel ? PRIMARY : "#cbd5e1", fontSize: 10 }}
                  >{isSel && "✓"}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{rec.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-500">{getEquipmentTypeLabel(rec.equipmentType)}</span>
                      {rec.registrationNumber && (
                        <><span className="text-slate-300 text-xs">·</span><span className="text-xs text-slate-500">{rec.registrationNumber}</span></>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
        <div className="px-4 py-3 border-t flex-shrink-0 flex items-center gap-2 bg-white">
          <span className="text-xs text-slate-400 flex-1">{selected.size > 0 ? `${selected.size}대 선택됨` : "장비를 선택하세요"}</span>
          <button onClick={onClose} className="text-xs px-3 py-1.5 rounded-lg text-slate-500 bg-slate-100 font-medium">취소</button>
          <button
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className="text-xs px-4 py-1.5 rounded-lg font-semibold text-white transition-all"
            style={{ background: selected.size > 0 ? PRIMARY : "#cbd5e1" }}
          >
            선택 완료 ({selected.size}대)
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 장비별 섹션 ID 맵 ──────────────────────────────────────────
const EQUIPMENT_SECTION_IDS: Record<string, string[]> = {
  truck:         ["truck_machine_spec", "truck_route", "truck_load", "truck_road_condition", "truck_overturn_prevention", "truck_checklist"],
  excavator:     ["excavator_machine_spec", "excavator_depth", "excavator_ground", "excavator_utility", "excavator_retaining", "excavator_checklist"],
  aerial_lift:   ["aerial_lift_machine_spec", "aerial_lift_work_plan", "aerial_lift_checklist"],
  crane:         ["crane_machine_spec", "crane_capacity", "crane_rigging", "crane_swing", "crane_signal", "crane_ground", "crane_checklist"],
  concrete_pump: ["concrete_pump_machine_spec", "concrete_pump_work_plan", "concrete_pump_checklist"],
  pile_driver:   ["pile_driver_machine_spec", "pile_method", "pile_type", "pile_noise", "pile_checklist"],
  forklift:      ["forklift_machine_spec", "forklift_work_plan", "forklift_checklist"],
  loader:        ["loader_machine_spec", "loader_bucket", "loader_radius", "loader_method", "loader_checklist"],
  roller:        ["roller_machine_spec", "roller_section", "roller_count", "roller_compaction", "roller_checklist"],
};

// ─── 사용 장비 정보 ──────────────────────────────────────────────
interface EquipRow {
  id: string;
  equipmentType?: EquipmentType;
  name: string;
  spec: string;
  qty: string;
  ownership: string;
  note?: string;
}
interface EquipmentInfoData { rows: EquipRow[] }

const OWNERSHIP_OPTIONS = ["자사", "임차"];

function EquipmentInfoForm() {
  const { formData, updateFormData, planCategory, selectedEquipments, toggleEquipment, clearEquipments } = useWorkPlanStore();
  const data = (formData["equipment_info"] as EquipmentInfoData) ?? {};
  const rows: EquipRow[] = data.rows ?? [];
  const isConst = true;
  const [expandedEq, setExpandedEq] = React.useState<Record<string, boolean>>({});

  const save = (newRows: EquipRow[]) =>
    updateFormData("equipment_info", { rows: newRows });

  const updateRow = (id: string, key: keyof EquipRow, value: string) =>
    save(rows.map((r) => r.id === id ? { ...r, [key]: value } : r));

  const applyRegistryRecords = (recs: EquipmentRecord[]) => {
    let newRows = [...rows];
    for (const rec of recs) {
      const eqType = rec.equipmentType as EquipmentType;
      const isLegacy = eqType in CONSTRUCTION_EQUIPMENT_TYPES;
      if (isLegacy) {
        if (!selectedEquipments.includes(eqType)) {
          toggleEquipment(eqType);
          newRows = [...newRows, { id: eqType, equipmentType: eqType, name: CONSTRUCTION_EQUIPMENT_TYPES[eqType].label, spec: rec.capacity || rec.dimensions || "", qty: "1", ownership: "자사" }];
        }
        updateFormData(`${eqType}_machine_spec`, {
          rows: [{ ...EMPTY_MACHINE_ROW(), machineName: rec.name, equipmentTypeName: CONSTRUCTION_EQUIPMENT_TYPES[eqType]?.label ?? "", regNo: rec.registrationNumber || "", maker: rec.manufacturer || "", model: rec.model || "", capacity: rec.capacity || "", dimensions: rec.dimensions || "", year: rec.year || "", inspectionExpiry: rec.nextInspectionDate || "" }],
        });
        setExpandedEq((prev) => ({ ...prev, [eqType]: true }));
      } else {
        newRows = [...newRows, { id: `eq${Date.now()}`, name: rec.name, spec: rec.capacity || rec.dimensions || "", qty: "1", ownership: "자사" }];
      }
    }
    save(newRows);
  };

  const removeRow = (id: string) => {
    const row = rows.find((r) => r.id === id);
    if (row?.equipmentType && selectedEquipments.includes(row.equipmentType)) {
      toggleEquipment(row.equipmentType);
      (EQUIPMENT_SECTION_IDS[row.equipmentType] ?? []).forEach((sid) => updateFormData(sid, {}));
    }
    save(rows.filter((r) => r.id !== id));
  };

  const addCustomRow = () =>
    save([...rows, { id: `eq${Date.now()}`, name: "", spec: "", qty: "1", ownership: "자사" }]);

  const handleTypeToggle = (type: EquipmentType) => {
    const isSelected = selectedEquipments.includes(type);
    toggleEquipment(type);
    if (isSelected) {
      // 제거: 장비 행 + 관련 모든 서브섹션 데이터 초기화
      save(rows.filter((r) => r.equipmentType !== type));
      (EQUIPMENT_SECTION_IDS[type] ?? []).forEach((sid) => updateFormData(sid, {}));
    } else {
      // 추가: 장비 행 추가 + machine_spec 자동 초기화 (1행)
      save([...rows, { id: type, equipmentType: type, name: CONSTRUCTION_EQUIPMENT_TYPES[type].label, spec: "", qty: "1", ownership: "자사" }]);
      updateFormData(`${type}_machine_spec`, { rows: [EMPTY_MACHINE_ROW()] });
      setExpandedEq((prev) => ({ ...prev, [type]: true }));
    }
  };

  const toggleExpand = (type: string) =>
    setExpandedEq((prev) => ({ ...prev, [type]: !prev[type] }));

  // 사이드패널 클릭 시 탭 전환 + 카드 펼치기 (Bug 2-2)
  React.useEffect(() => {
    const handler = (e: Event) => {
      const { eqType } = (e as CustomEvent).detail;
      setExpandedEq((prev) => ({ ...prev, [eqType]: true }));
    };
    window.addEventListener("ptw:focusEquipmentSection", handler);
    return () => window.removeEventListener("ptw:focusEquipmentSection", handler);
  }, []);

// ── 차량계 건설기계 전용 UI ───────────────────────────────────
  if (isConst) {
    const customRows = rows.filter((r) => !r.equipmentType);
    return (
      <div className="space-y-4">
        {/* 상단: 투입 건설기계 선택 */}
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          투입 건설기계 선택 (복수 선택 가능)
        </p>



        {/* 9종 선택 토글 */}
        <div className="flex flex-wrap gap-2">
          {(Object.entries(CONSTRUCTION_EQUIPMENT_TYPES) as [EquipmentType, typeof CONSTRUCTION_EQUIPMENT_TYPES[EquipmentType]][]).map(([type, info]) => {
            const isSelected = selectedEquipments.includes(type);
            return (
              <button
                key={type}
                onClick={() => handleTypeToggle(type)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all"
                style={{
                  background: isSelected ? PRIMARY_LIGHT : "white",
                  color: isSelected ? PRIMARY : "#64748b",
                  borderColor: isSelected ? PRIMARY : "#e2e8f0",
                }}
              >
                <span>{info.icon}</span>
                <span className="font-semibold">{info.num}.</span>
                <span>{info.label}</span>
                {isSelected && <span className="font-bold">✓</span>}
              </button>
            );
          })}
          <button
            onClick={addCustomRow}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all"
            style={{
              background: customRows.length > 0 ? PRIMARY_LIGHT : "white",
              color: customRows.length > 0 ? PRIMARY : "#64748b",
              borderColor: customRows.length > 0 ? PRIMARY : "#e2e8f0",
            }}
          >
            <span>🔧</span>
            <span className="font-semibold">10.</span>
            <span>기타</span>
            {customRows.length > 0 && <span className="font-bold">✓</span>}
          </button>
        </div>

        {/* 빈 상태 */}
        {selectedEquipments.length === 0 && customRows.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
            <p className="text-sm text-slate-400">위에서 투입할 건설기계를 선택하세요</p>
          </div>
        )}

        {/* ── 장비별 그룹 카드 (기본 정보 + 상세 입력 통합) ── */}
        {[...selectedEquipments].sort((a, b) => (CONSTRUCTION_EQUIPMENT_TYPES[a]?.num ?? 99) - (CONSTRUCTION_EQUIPMENT_TYPES[b]?.num ?? 99)).map((type) => {
          const info = CONSTRUCTION_EQUIPMENT_TYPES[type];
          const row = rows.find((r) => r.equipmentType === type);
          const sectionIds = EQUIPMENT_SECTION_IDS[type] ?? [];
          const isOpen = expandedEq[type] !== false;
          if (!row) return null;
          return (
            <div key={type} className="rounded-xl border overflow-hidden anim-fade-in-up" style={{ borderColor: `${PRIMARY}30` }}>
              {/* 기본 정보 행 */}
              <div className="flex items-center gap-2 px-3 py-2 flex-wrap" style={{ background: `${PRIMARY}0d` }}>
                <span className="text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0" style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>
                  {info.num}번
                </span>
                <span className="text-sm flex-shrink-0">{info.icon}</span>
                <span className="text-xs font-semibold text-slate-700 flex-shrink-0" style={{ minWidth: "4rem" }}>
                  {info.label.split(" ")[0]}
                </span>
                <input
                  type="text"
                  value={row.spec}
                  onChange={(e) => updateRow(row.id, "spec", e.target.value)}
                  className="flex-1 min-w-[6rem] px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 bg-white"
                  placeholder="규격 (예: 20t)"
                />
                <input
                  type="number"
                  value={row.qty}
                  min="1"
                  onChange={(e) => updateRow(row.id, "qty", e.target.value)}
                  className="w-14 flex-shrink-0 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 bg-white"
                />
                <select
                  value={row.ownership}
                  onChange={(e) => updateRow(row.id, "ownership", e.target.value)}
                  className="flex-shrink-0 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 bg-white"
                >
                  {OWNERSHIP_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
                <button
                  onClick={() => toggleExpand(type)}
                  className="flex-shrink-0 text-xs px-2 py-1 rounded-lg font-medium transition-colors"
                  style={{ background: isOpen ? `${PRIMARY}15` : "#f1f5f9", color: isOpen ? PRIMARY : "#64748b" }}
                >
                  {isOpen ? "▲ 접기" : "▼ 상세"}
                </button>
                <button
                  onClick={() => removeRow(row.id)}
                  className="text-slate-300 hover:text-red-400 text-sm px-1 flex-shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* 상세 입력 — 세로 나열 */}
              {isOpen && (
                <div className="p-3 space-y-5 anim-fade-in-up" style={{ background: "white" }}>
                  {sectionIds.map((sid) => {
                    const entry = SECTION_COMPONENTS[sid];
                    if (!entry) return null;
                    return (
                      <div key={sid} id={sid}>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 pb-1.5 border-b border-slate-100">{entry.title}</p>
                        <entry.Component />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* 9종 외 커스텀 장비 */}
        {customRows.length > 0 && (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-100" style={{ background: "#f8fafc" }}>
              기타 장비
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: PRIMARY_LIGHT }}>
                  {["기종명", "규격", "수량", "임차/자사", "특이사항", ""].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-slate-600 text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customRows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-2 py-1.5"><input type="text" value={r.name} onChange={(e) => updateRow(r.id, "name", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="기종명 입력" /></td>
                    <td className="px-2 py-1.5"><input type="text" value={r.spec} onChange={(e) => updateRow(r.id, "spec", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="규격 (예: 20t)" /></td>
                    <td className="px-2 py-1.5"><input type="number" value={r.qty} min="1" onChange={(e) => updateRow(r.id, "qty", e.target.value)} className="w-14 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" /></td>
                    <td className="px-2 py-1.5">
                      <select value={r.ownership} onChange={(e) => updateRow(r.id, "ownership", e.target.value)} className="px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400">
                        {OWNERSHIP_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5"><input type="text" value={r.note ?? ""} onChange={(e) => updateRow(r.id, "note", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="특이사항 입력" /></td>
                    <td className="px-2 py-1.5"><button onClick={() => removeRow(r.id)} className="text-slate-300 hover:text-red-400 text-sm px-1">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ── 일반 장비 정보 ─────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: PRIMARY_LIGHT }}>
              {["기종명", "규격", "수량", "임차/자사", ""].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium text-slate-600 text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-xs text-slate-400">
                  아래 버튼을 눌러 장비를 추가하세요
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-2 py-1"><input type="text" value={r.name} onChange={(e) => updateRow(r.id, "name", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="기종명" /></td>
                <td className="px-2 py-1"><input type="text" value={r.spec} onChange={(e) => updateRow(r.id, "spec", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="규격" /></td>
                <td className="px-2 py-1"><input type="number" value={r.qty} onChange={(e) => updateRow(r.id, "qty", e.target.value)} className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" /></td>
                <td className="px-2 py-1">
                  <select value={r.ownership} onChange={(e) => updateRow(r.id, "ownership", e.target.value)} className="px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400">
                    {OWNERSHIP_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <button onClick={() => removeRow(r.id)} className="text-slate-300 hover:text-red-400 text-sm px-1">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-3 py-2 border-t border-slate-100">
          <button onClick={addCustomRow} className="text-xs text-slate-400 hover:text-teal-500">+ 행 추가</button>
        </div>
      </div>
    </div>
  );
}

// ─── 작업 인원 배치 ──────────────────────────────────────────────
const PERSONNEL_ROLES = ["작업자", "운전원", "유도자", "작업지휘자", "신호수", "감시자"] as const;
type PersonnelRole = typeof PERSONNEL_ROLES[number];
interface PersonnelDetailRow { id: string; role: PersonnelRole; name: string; contact: string; affiliation: string; license: string; signalMethod: string; position: string; extraNote: string; trained: boolean }
interface WorkPersonnelData { counts: Partial<Record<PersonnelRole, number>>; details?: PersonnelDetailRow[] }

const ROLE_EXTRA: Record<PersonnelRole, { label: string; placeholder: string; field: "license" | "signalMethod" | "position" | "extraNote" }> = {
  운전원:     { label: "면허",     placeholder: "건설기계면허 00-000000",           field: "license" },
  유도자:     { label: "신호방법", placeholder: "수신호 / 무전",                    field: "signalMethod" },
  작업지휘자: { label: "직책",     placeholder: "공사팀장",                         field: "position" },
  작업자:     { label: "교육이수", placeholder: "교육이수 정보: 기초안전보건교육 등", field: "extraNote" },
  신호수:     { label: "교육이수", placeholder: "교육이수 정보: 기초안전보건교육 등", field: "extraNote" },
  감시자:     { label: "교육이수", placeholder: "교육이수 정보: 기초안전보건교육 등", field: "extraNote" },
};

const EMPTY_DETAIL_ROW = (): PersonnelDetailRow => ({
  id: `pd${Date.now()}`, role: "작업자", name: "", contact: "", affiliation: "", license: "", signalMethod: "", position: "", extraNote: "", trained: false,
});

const inputCls = "px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 bg-white w-full";

function WorkPersonnelForm() {
  const { formData, updateFormData } = useWorkPlanStore();
  const data = (formData["work_personnel"] as WorkPersonnelData) ?? {};
  const counts = data.counts ?? {};
  const details: PersonnelDetailRow[] = data.details ?? [];
  const [showDetail, setShowDetail] = React.useState(false);

  const setCount = (role: PersonnelRole, val: string) => {
    const n = parseInt(val, 10);
    updateFormData("work_personnel", { ...data, counts: { ...counts, [role]: isNaN(n) || n < 0 ? 0 : n } });
  };

  const total = PERSONNEL_ROLES.reduce((s, r) => s + (counts[r] ?? 0), 0);

  const updateDetail = (id: string, key: keyof PersonnelDetailRow, value: string | boolean) =>
    updateFormData("work_personnel", { ...data, details: details.map((r) => r.id === id ? { ...r, [key]: value } : r) });
  const addDetail = () =>
    updateFormData("work_personnel", { ...data, details: [...details, EMPTY_DETAIL_ROW()] });
  const removeDetail = (id: string) =>
    updateFormData("work_personnel", { ...data, details: details.filter((r) => r.id !== id) });

  return (
    <div className="space-y-3">
      {/* 역할별 인원 수 — 한 줄 */}
      <div className="flex flex-wrap gap-2 items-center">
        {PERSONNEL_ROLES.map((role) => {
          const val = counts[role] ?? 0;
          const active = val > 0;
          return (
            <div key={role} className="flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 transition-colors"
              style={{ borderColor: active ? `${PRIMARY}50` : "#e2e8f0", background: active ? PRIMARY_LIGHT : "white" }}>
              <span className="text-xs font-semibold whitespace-nowrap" style={{ color: active ? PRIMARY : "#64748b" }}>{role}</span>
              <input
                type="number" min={0} value={val === 0 ? "" : val}
                onChange={(e) => setCount(role, e.target.value)}
                onBlur={(e) => { if (e.target.value === "") setCount(role, "0"); }}
                placeholder="0"
                className="w-14 text-center text-xs font-bold tabular-nums border rounded-lg px-1 py-0.5 outline-none focus:border-teal-400"
                style={{ borderColor: active ? `${PRIMARY}40` : "#e2e8f0", color: active ? PRIMARY : "#94a3b8", background: active ? "white" : "#f8fafc" }}
              />
              <span className="text-xs" style={{ color: active ? PRIMARY : "#94a3b8" }}>명</span>
            </div>
          );
        })}
        <div className="flex items-center gap-1 order-first pr-2 border-r border-slate-200 mr-1">
          <span className="text-xs text-slate-400">총</span>
          <span className="text-sm font-bold tabular-nums" style={{ color: total > 0 ? PRIMARY : "#94a3b8" }}>{total}명</span>
        </div>
      </div>

      {/* 상세 입력 토글 */}
      <div>
        <button
          onClick={() => setShowDetail(!showDetail)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-teal-600 transition-colors"
        >
          <span>{showDetail ? "▲" : "▼"}</span>
          <span>인원 상세 입력 {details.length > 0 ? `(${details.length}명)` : "(선택)"}</span>
        </button>

        {showDetail && (
          <div className="mt-2 rounded-xl border border-slate-200 overflow-hidden anim-fade-in-up">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: PRIMARY_LIGHT }}>
                    <th className="px-3 py-2 text-left font-medium text-slate-500 whitespace-nowrap">역할</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500 whitespace-nowrap">성명</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500 whitespace-nowrap">연락처</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500 whitespace-nowrap">소속</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500 whitespace-nowrap">추가정보</th>
                    <th className="px-3 py-2 text-center font-medium text-slate-500 whitespace-nowrap">교육이수</th>
                    <th className="w-6" />
                  </tr>
                </thead>
                <tbody>
                  {details.map((r) => {
                    const extra = ROLE_EXTRA[r.role];
                    return (
                      <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-2 py-1.5">
                          <select value={r.role} onChange={(e) => updateDetail(r.id, "role", e.target.value)}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg outline-none focus:border-teal-400 bg-white text-xs">
                            {PERSONNEL_ROLES.map((role) => <option key={role}>{role}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1.5"><input type="text" value={r.name} onChange={(e) => updateDetail(r.id, "name", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg outline-none focus:border-teal-400 text-xs" placeholder="홍길동" /></td>
                        <td className="px-2 py-1.5"><input type="tel" value={r.contact} onChange={(e) => updateDetail(r.id, "contact", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg outline-none focus:border-teal-400 text-xs" placeholder="010-0000-0000" /></td>
                        <td className="px-2 py-1.5"><input type="text" value={r.affiliation} onChange={(e) => updateDetail(r.id, "affiliation", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg outline-none focus:border-teal-400 text-xs" placeholder="소속" /></td>
                        <td className="px-2 py-1.5">
                          <input type="text" value={r[extra.field] as string} onChange={(e) => updateDetail(r.id, extra.field, e.target.value)}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg outline-none focus:border-teal-400 text-xs"
                            placeholder={`${extra.label}: ${extra.placeholder}`} />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <div className="w-5 h-5 rounded border-2 flex items-center justify-center text-white text-xs cursor-pointer mx-auto transition-colors"
                            style={{ background: r.trained ? PRIMARY : "white", borderColor: r.trained ? PRIMARY : "#cbd5e1" }}
                            onClick={() => updateDetail(r.id, "trained", !r.trained)}
                          >{r.trained && "✓"}</div>
                        </td>
                        <td className="px-2 py-1.5"><button onClick={() => removeDetail(r.id)} className="text-slate-300 hover:text-red-400 px-1">✕</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-2 border-t border-slate-100">
              <button onClick={addDetail} className="text-xs text-slate-400 hover:text-teal-500 transition-colors">+ 행 추가</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 추진 일정 ───────────────────────────────────────────────────
// 시작일/종료일은 작업 개요에서 관리 — 이 섹션은 마일스톤 전용
interface MilestoneRow { id: string; task: string; start: string; end: string; responsible: string }
interface ScheduleData { milestones?: MilestoneRow[] }

function ScheduleForm() {
  const { formData, updateFormData } = useWorkPlanStore();
  const data = (formData["schedule"] as ScheduleData) ?? {};
  const milestones: MilestoneRow[] = data.milestones ?? [{ id: "ms1", task: "", start: "", end: "", responsible: "" }];

  const updateMilestone = (id: string, key: keyof MilestoneRow, value: string) =>
    updateFormData("schedule", { ...data, milestones: milestones.map((m) => m.id === id ? { ...m, [key]: value } : m) });
  const addRow = () =>
    updateFormData("schedule", { ...data, milestones: [...milestones, { id: `ms${Date.now()}`, task: "", start: "", end: "", responsible: "" }] });
  const removeRow = (id: string) =>
    updateFormData("schedule", { ...data, milestones: milestones.filter((m) => m.id !== id) });

  return (
    <div className="space-y-4">
      {/* 마일스톤 */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">마일스톤</label>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: PRIMARY_LIGHT }}>
                {["작업명", "시작", "종료", "담당", ""].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium text-slate-600 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="px-2 py-1"><input type="text" value={m.task} onChange={(e) => updateMilestone(m.id, "task", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="작업명" /></td>
                  <td className="px-2 py-1"><input type="date" value={m.start} onChange={(e) => updateMilestone(m.id, "start", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" /></td>
                  <td className="px-2 py-1"><input type="date" value={m.end} onChange={(e) => updateMilestone(m.id, "end", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" /></td>
                  <td className="px-2 py-1"><input type="text" value={m.responsible} onChange={(e) => updateMilestone(m.id, "responsible", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="담당자" /></td>
                  <td className="px-2 py-1"><button onClick={() => removeRow(m.id)} className="text-slate-300 hover:text-red-400 text-sm px-1">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-3 py-2 border-t border-slate-100">
            <button onClick={addRow} className="text-xs text-slate-400 hover:text-teal-500">+ 행 추가</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 업무 범위 및 산출물 ─────────────────────────────────────────
interface ScopeData { description?: string; deliverables?: string[] }

function ScopeForm() {
  const { formData, updateFormData } = useWorkPlanStore();
  const data = (formData["scope"] as ScopeData) ?? {};
  const deliverables = data.deliverables ?? [""];
  const updateDesc = (v: string) => updateFormData("scope", { ...data, description: v });
  const updateDeliverable = (i: number, v: string) => { const arr = [...deliverables]; arr[i] = v; updateFormData("scope", { ...data, deliverables: arr }); };
  const addDeliverable = () => updateFormData("scope", { ...data, deliverables: [...deliverables, ""] });
  const removeDeliverable = (i: number) => updateFormData("scope", { ...data, deliverables: deliverables.filter((_, idx) => idx !== i) });
  return (
    <div className="space-y-4">
      <TextAreaField label="작업 범위" value={data.description ?? ""} onChange={updateDesc} placeholder="수행할 작업의 범위와 경계를 명확히 기술하세요" rows={4} />
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">산출물 목록</label>
        <div className="space-y-2">
          {deliverables.map((d, i) => (
            <div key={i} className="flex gap-2">
              <input type="text" value={d} onChange={(e) => updateDeliverable(i, e.target.value)} placeholder={`산출물 ${i + 1}`} className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-400" />
              <button onClick={() => removeDeliverable(i)} className="text-slate-300 hover:text-red-400 px-2">✕</button>
            </div>
          ))}
          <button onClick={addDeliverable} className="text-xs text-slate-400 hover:text-teal-500">+ 산출물 추가</button>
        </div>
      </div>
    </div>
  );
}

// ─── 예산 ────────────────────────────────────────────────────────
interface BudgetRow { id: string; item: string; unit: string; qty: string; unitPrice: string; note: string }
interface BudgetData { rows?: BudgetRow[] }

function BudgetForm() {
  const { formData, updateFormData } = useWorkPlanStore();
  const data = (formData["budget"] as BudgetData) ?? {};
  const rows: BudgetRow[] = data.rows ?? [{ id: "b1", item: "", unit: "", qty: "", unitPrice: "", note: "" }];
  const updateRow = (id: string, key: keyof BudgetRow, value: string) =>
    updateFormData("budget", { rows: rows.map((r) => r.id === id ? { ...r, [key]: value } : r) });
  const addRow = () =>
    updateFormData("budget", { rows: [...rows, { id: `b${Date.now()}`, item: "", unit: "", qty: "", unitPrice: "", note: "" }] });
  const removeRow = (id: string) =>
    updateFormData("budget", { rows: rows.filter((r) => r.id !== id) });
  const total = rows.reduce((sum, r) => sum + (Number(r.qty) * Number(r.unitPrice) || 0), 0);
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead><tr style={{ background: PRIMARY_LIGHT }}>{["항목", "단위", "수량", "단가(원)", "금액(원)", "비고", ""].map((h) => <th key={h} className="px-3 py-2 text-left font-medium text-slate-600 text-xs">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-slate-100">
              <td className="px-2 py-1"><input type="text" value={r.item} onChange={(e) => updateRow(r.id, "item", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="항목명" /></td>
              <td className="px-2 py-1"><input type="text" value={r.unit} onChange={(e) => updateRow(r.id, "unit", e.target.value)} className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="개" /></td>
              <td className="px-2 py-1"><input type="number" value={r.qty} onChange={(e) => updateRow(r.id, "qty", e.target.value)} className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" /></td>
              <td className="px-2 py-1"><input type="number" value={r.unitPrice} onChange={(e) => updateRow(r.id, "unitPrice", e.target.value)} className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" /></td>
              <td className="px-2 py-1 text-xs text-slate-500 font-medium">{(Number(r.qty) * Number(r.unitPrice) || 0).toLocaleString()}</td>
              <td className="px-2 py-1"><input type="text" value={r.note} onChange={(e) => updateRow(r.id, "note", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" /></td>
              <td className="px-2 py-1"><button onClick={() => removeRow(r.id)} className="text-slate-300 hover:text-red-400 text-sm">✕</button></td>
            </tr>
          ))}
        </tbody>
        <tfoot><tr className="border-t-2 border-slate-200" style={{ background: PRIMARY_LIGHT }}><td colSpan={4} className="px-3 py-2 text-xs font-semibold text-slate-600 text-right">합계</td><td className="px-3 py-2 text-xs font-bold" style={{ color: PRIMARY }}>{total.toLocaleString()} 원</td><td colSpan={2} /></tr></tfoot>
      </table>
      <div className="px-3 py-2 border-t border-slate-100"><button onClick={addRow} className="text-xs text-slate-400 hover:text-teal-500">+ 행 추가</button></div>
    </div>
  );
}

// ─── 위험성평가 ───────────────────────────────────────────────────
interface RiskRow { id: string; process: string; unitTask: string; risk: string; mitigation: string; grade: string; keyManagement: boolean }
interface RiskData { rows?: RiskRow[] }

const RISK_GRADE_COLORS: Record<string, string> = { 상: "bg-red-100 text-red-600", 중: "bg-amber-100 text-amber-600", 하: "bg-green-100 text-green-600" };

function RiskForm() {
  const { formData, updateFormData } = useWorkPlanStore();
  const data = (formData["risk"] as RiskData) ?? {};
  const rows: RiskRow[] = data.rows ?? [{ id: "r1", process: "", unitTask: "", risk: "", mitigation: "", grade: "중", keyManagement: false }];
  const updateRow = (id: string, key: keyof RiskRow, value: string | boolean) =>
    updateFormData("risk", { rows: rows.map((r) => r.id === id ? { ...r, [key]: value } : r) });
  const addRow = () =>
    updateFormData("risk", { rows: [...rows, { id: `r${Date.now()}`, process: "", unitTask: "", risk: "", mitigation: "", grade: "중", keyManagement: false }] });
  const removeRow = (id: string) =>
    updateFormData("risk", { rows: rows.filter((r) => r.id !== id) });
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: PRIMARY_LIGHT }}>
              {["작업공정", "단위작업", "위험요인", "저감대책", "위험등급", "중점관리", ""].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium text-slate-600 text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-2 py-1.5"><input type="text" value={r.process} onChange={(e) => updateRow(r.id, "process", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="예: 굴착" /></td>
                <td className="px-2 py-1.5"><input type="text" value={r.unitTask} onChange={(e) => updateRow(r.id, "unitTask", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="예: 터파기" /></td>
                <td className="px-2 py-1.5"><input type="text" value={r.risk} onChange={(e) => updateRow(r.id, "risk", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="위험요인 기술" /></td>
                <td className="px-2 py-1.5"><input type="text" value={r.mitigation} onChange={(e) => updateRow(r.id, "mitigation", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="저감대책 기술" /></td>
                <td className="px-2 py-1.5">
                  <select value={r.grade ?? "중"} onChange={(e) => updateRow(r.id, "grade", e.target.value)} className={`px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 font-semibold ${RISK_GRADE_COLORS[r.grade ?? "중"]}`}>
                    <option value="상">상</option>
                    <option value="중">중</option>
                    <option value="하">하</option>
                  </select>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <div
                    className="w-4 h-4 rounded border-2 flex items-center justify-center text-white text-xs cursor-pointer mx-auto transition-all"
                    style={{ background: r.keyManagement ? PRIMARY : "white", borderColor: r.keyManagement ? PRIMARY : "#cbd5e1" }}
                    onClick={() => updateRow(r.id, "keyManagement", !r.keyManagement)}
                  >{r.keyManagement && "✓"}</div>
                </td>
                <td className="px-2 py-1.5"><button onClick={() => removeRow(r.id)} className="text-slate-300 hover:text-red-400 text-sm px-1">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-3 py-2 border-t border-slate-100"><button onClick={addRow} className="text-xs text-slate-400 hover:text-teal-500">+ 행 추가</button></div>
      </div>
    </div>
  );
}

// ─── 안전 조치 체크리스트 (공통) ─────────────────────────────────
const COMMON_SAFETY_ITEMS = [
  "작업 전 안전교육 실시",
  "개인보호구(PPE) 착용 확인",
  "작업 구역 출입 통제 및 표지판 설치",
  "장비 점검 일지 확인",
  "작업 허가서(PTW) 발급 확인",
  "연락 체계 구축 (무전기 등)",
  "기상 조건 확인 (강풍·우천 시 작업 중지)",
  "비상구 및 대피로 사전 확인",
];

interface SafetyCheckData { checks: Record<string, "양호" | "불량" | "해당없음" | boolean>; note: string }

type SafetyResult = "양호" | "불량" | "해당없음";
const SAFETY_RESULT_OPTIONS: SafetyResult[] = ["양호", "불량", "해당없음"];
const SAFETY_RESULT_COLORS: Record<SafetyResult, string> = { 양호: "#00B7AF", 불량: "#dc2626", 해당없음: "#94a3b8" };

function SafetyChecklistForm() {
  const { formData, updateFormData } = useWorkPlanStore();
  const data = (formData["safety_checklist"] as SafetyCheckData) ?? { checks: {}, note: "" };
  const [showNote, setShowNote] = React.useState(!!(data.note));
  const setResult = (item: string, v: SafetyResult) =>
    updateFormData("safety_checklist", { ...data, checks: { ...data.checks, [item]: v } });
  const setNote = (v: string) =>
    updateFormData("safety_checklist", { ...data, note: v });
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto] text-xs font-medium text-slate-500 px-4 py-2 border-b border-slate-100" style={{ background: PRIMARY_LIGHT }}>
          <span>점검 항목</span>
          <div className="flex gap-4">
            {SAFETY_RESULT_OPTIONS.map((r) => (
              <span key={r} className="w-14 text-center">{r}</span>
            ))}
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {COMMON_SAFETY_ITEMS.map((item) => {
            const current = (data.checks?.[item] as SafetyResult) ?? null;
            return (
              <div key={item} className="flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors">
                <span className="text-sm text-slate-600 flex-1 mr-4">{item}</span>
                <div className="flex gap-4 flex-shrink-0">
                  {SAFETY_RESULT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setResult(item, opt)}
                      className="w-14 flex justify-center"
                    >
                      <div
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all"
                        style={{
                          borderColor: current === opt ? SAFETY_RESULT_COLORS[opt] : "#cbd5e1",
                          background: current === opt ? SAFETY_RESULT_COLORS[opt] : "white",
                        }}
                      >
                        {current === opt && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* 추가 조치 사항 — 접기/펼치기 */}
      {showNote ? (
        <div className="anim-fade-in-up">
          <TextAreaField label="추가 조치 사항" value={data.note ?? ""} onChange={setNote} placeholder="기타 안전 조치 사항을 입력하세요" rows={2} />
          <button onClick={() => { setShowNote(false); setNote(""); }} className="mt-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">− 접기</button>
        </div>
      ) : (
        <button onClick={() => setShowNote(true)} className="text-xs px-3 py-1 rounded-lg border border-dashed transition-all hover:border-teal-300 hover:text-teal-600" style={{ borderColor: "#d1d5db", color: "#94a3b8" }}>
          + 추가 조치 사항
        </button>
      )}
    </div>
  );
}

// ─── 비상연락망 ──────────────────────────────────────────────────
interface EmergencyData { hospital: string; fire: string; police: string; supervisor: string; safetyManager: string; note: string }

function EmergencyContactForm() {
  const { formData, updateFormData } = useWorkPlanStore();
  const data = (formData["emergency_contact"] as EmergencyData) ?? { hospital: "", fire: "", police: "", supervisor: "", safetyManager: "", note: "" };
  const update = (key: keyof EmergencyData, val: string) =>
    updateFormData("emergency_contact", { ...data, [key]: val });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <TextField label="응급의료기관" value={data.hospital ?? ""} onChange={(v) => update("hospital", v)} placeholder="병원명 및 전화번호" />
        <TextField label="소방서 (119)" value={data.fire ?? ""} onChange={(v) => update("fire", v)} placeholder="관할 소방서" />
        <TextField label="경찰서 (112)" value={data.police ?? ""} onChange={(v) => update("police", v)} placeholder="관할 경찰서" />
        <TextField label="관리감독자" value={data.supervisor ?? ""} onChange={(v) => update("supervisor", v)} placeholder="이름 / 연락처" />
        <TextField label="안전관리자" value={data.safetyManager ?? ""} onChange={(v) => update("safetyManager", v)} placeholder="이름 / 연락처" />
        <TextField label="기타 연락처" value={data.note ?? ""} onChange={(v) => update("note", v)} placeholder="기타 비상연락 정보" />
      </div>
    </div>
  );
}

// ─── 건설기계별 특화 섹션 폼 ─────────────────────────────────────

// 트럭
function TruckRouteForm() {
  const [d, u] = useSection<Record<string, string>>("truck_route", {});
  return (
    <div className="grid grid-cols-4 gap-3 items-end">
      <div className="col-span-2">
        <label className="ptw-label">운행 경로 (경유지 포함)</label>
        <input type="text" value={d.route ?? ""} onChange={(e) => u("route", e.target.value)}
          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-400"
          placeholder="출발지 → 경유지 → 목적지" />
      </div>
      <TextField label="운행 거리 (km)" value={d.distance ?? ""} onChange={(v) => u("distance", v)} placeholder="예: 2.5" type="number" />
      <TextField label="예상 소요 시간" value={d.duration ?? ""} onChange={(v) => u("duration", v)} placeholder="예: 30분" />
    </div>
  );
}

function TruckLoadForm() {
  const [d, u] = useSection<Record<string, string>>("truck_load", {});
  return (
    <div className="grid grid-cols-4 gap-3 items-end">
      <TextField label="최대 적재량 (ton)" value={d.maxLoad ?? ""} onChange={(v) => u("maxLoad", v)} placeholder="예: 15" type="number" />
      <TextField label="실제 적재량 (ton)" value={d.actualLoad ?? ""} onChange={(v) => u("actualLoad", v)} placeholder="예: 12" type="number" />
      <TextField label="적재물 종류" value={d.material ?? ""} onChange={(v) => u("material", v)} placeholder="예: 콘크리트 폐기물" />
      <TextField label="낙하 방지 조치" value={d.fallPrevention ?? ""} onChange={(v) => u("fallPrevention", v)} placeholder="덮개 설치, 결속 방법 등" />
    </div>
  );
}

function TruckRoadForm() {
  const [d, u] = useSection<Record<string, string>>("truck_road_condition", {});
  return (
    <div className="grid grid-cols-4 gap-3 items-end">
      <TextField label="도로 폭원 (m)" value={d.width ?? ""} onChange={(v) => u("width", v)} placeholder="예: 6.0" type="number" />
      <TextField label="최대 구배 (%)" value={d.slope ?? ""} onChange={(v) => u("slope", v)} placeholder="예: 8" type="number" />
      <div className="col-span-2">
        <TextField label="도로 상태 특이사항" value={d.note ?? ""} onChange={(v) => u("note", v)} placeholder="노면 상태, 주의 구간 등" />
      </div>
    </div>
  );
}

interface TruckSpecRow { id: string; machineName: string; manufactureDate: string; grossWeight: string; speedLimit: string; climbingAbility: string; maxSpeed: string; loadCapacity: string; dumpAngle: string; liftTime: string; loadDimensions: string }
interface TruckSpecData { rows?: TruckSpecRow[] }
const EMPTY_TRUCK_SPEC_ROW = (): TruckSpecRow => ({ id: `ts${Date.now()}`, machineName: "", manufactureDate: "", grossWeight: "", speedLimit: "", climbingAbility: "", maxSpeed: "", loadCapacity: "", dumpAngle: "", liftTime: "", loadDimensions: "" });

function TruckSpecForm() {
  const { formData, updateFormData } = useWorkPlanStore();
  const data = (formData["truck_spec"] as TruckSpecData) ?? {};
  const rows: TruckSpecRow[] = data.rows ?? [];
  const save = (r: TruckSpecRow[]) => updateFormData("truck_spec", { rows: r });
  const update = (id: string, key: keyof TruckSpecRow, val: string) => save(rows.map((r) => r.id === id ? { ...r, [key]: val } : r));

  const fieldCls = "w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400";

  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={r.id} className="rounded-xl border border-slate-200 p-3 space-y-3" style={{ background: "#fafcff" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">장비 {i + 1}</span>
              <input type="text" value={r.machineName} onChange={(e) => update(r.id, "machineName", e.target.value)}
                className="px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 w-40" placeholder="장비명 (기계 제원과 동일)" />
            </div>
            <button onClick={() => save(rows.filter((x) => x.id !== r.id))} className="text-slate-300 hover:text-red-400 text-sm px-1">✕</button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="ptw-label">제조일</label><input type="text" value={r.manufactureDate} onChange={(e) => update(r.id, "manufactureDate", e.target.value)} className={fieldCls} placeholder="예: 20.03.15" /></div>
            <div><label className="ptw-label">차량총중량 (ton)</label><input type="text" value={r.grossWeight} onChange={(e) => update(r.id, "grossWeight", e.target.value)} className={fieldCls} placeholder="예: 15" /></div>
            <div><label className="ptw-label">제한속도 (km/h)</label><input type="text" value={r.speedLimit} onChange={(e) => update(r.id, "speedLimit", e.target.value)} className={fieldCls} placeholder="예: 30" /></div>
            <div><label className="ptw-label">등판능력 (도, 부하)</label><input type="text" value={r.climbingAbility} onChange={(e) => update(r.id, "climbingAbility", e.target.value)} className={fieldCls} placeholder="예: 30도 (만재)" /></div>
            <div><label className="ptw-label">최고속도 (km/h)</label><input type="text" value={r.maxSpeed} onChange={(e) => update(r.id, "maxSpeed", e.target.value)} className={fieldCls} placeholder="예: 90" /></div>
            <div><label className="ptw-label">적재함 용량 (m³)</label><input type="text" value={r.loadCapacity} onChange={(e) => update(r.id, "loadCapacity", e.target.value)} className={fieldCls} placeholder="예: 8" /></div>
            <div><label className="ptw-label">덤프 최대경사각 (도)</label><input type="text" value={r.dumpAngle} onChange={(e) => update(r.id, "dumpAngle", e.target.value)} className={fieldCls} placeholder="예: 50" /></div>
            <div><label className="ptw-label">상승시간 (sec)</label><input type="text" value={r.liftTime} onChange={(e) => update(r.id, "liftTime", e.target.value)} className={fieldCls} placeholder="예: 15" /></div>
            <div><label className="ptw-label">적재함 크기 (L×W×H mm)</label><input type="text" value={r.loadDimensions} onChange={(e) => update(r.id, "loadDimensions", e.target.value)} className={fieldCls} placeholder="예: 5200×2200×600" /></div>
          </div>
        </div>
      ))}
      <button onClick={() => save([...rows, EMPTY_TRUCK_SPEC_ROW()])}
        className="text-xs px-4 py-1.5 rounded-lg font-medium transition-all"
        style={{ background: PRIMARY_LIGHT, color: PRIMARY, border: `1px solid ${PRIMARY}55` }}>
        + 장비 추가
      </button>
    </div>
  );
}

function TruckOverturnForm() {
  const [d, u] = useSection<Record<string, boolean | string>>("truck_overturn_prevention", {});
  const checks = [
    "전복 방지 장치 설치",
    "후진 경보 장치 작동 확인",
    "경광등 설치 확인",
    "안전 속도 준수 (20km/h 이하)",
    "과적 여부 확인",
    "추가 조치 사항",
  ];
  return (
    <div className="rounded-xl border border-slate-200 px-4 py-3 space-y-1">
      {checks.map((c) => (
        <div key={c} className="flex items-center gap-2">
          <CheckItem label={c} checked={(d[c] as boolean) ?? false} onChange={(v) => u(c, v)} />
          {c === "추가 조치 사항" && (d[c] as boolean) && (
            <input
              type="text"
              value={(d.note as string) ?? ""}
              onChange={(e) => u("note", e.target.value)}
              placeholder="기타 조치 사항 입력"
              autoFocus
              className="flex-1 px-3 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-400"
            />
          )}
        </div>
      ))}
    </div>
  );
}

// 불도저
function BulldozerSlopeForm() {
  const [d, u] = useSection<Record<string, string>>("bulldozer_slope", {});
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <TextField label="최대 경사도 (°)" value={d.maxAngle ?? ""} onChange={(v) => u("maxAngle", v)} placeholder="예: 30" type="number" />
        <TextField label="작업 면적 (m²)" value={d.area ?? ""} onChange={(v) => u("area", v)} placeholder="예: 500" type="number" />
      </div>
      <TextAreaField label="지형 및 지반 특이사항" value={d.note ?? ""} onChange={(v) => u("note", v)} placeholder="연약 지반, 절성토 구간 등" rows={2} />
    </div>
  );
}

function BulldozerBuriedForm() {
  const [d, u] = useSection<Record<string, string | boolean>>("bulldozer_buried", {});
  const checks = ["가스관", "상하수도관", "전력선 (지중)", "통신케이블", "기타 매설물"];
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">매설물 종류 확인 (해당 항목 체크)</p>
      <div className="rounded-xl border border-slate-200 px-4 py-3 space-y-1">
        {checks.map((c) => (
          <CheckItem key={c} label={c} checked={(d[c] as boolean) ?? false} onChange={(v) => u(c, v)} />
        ))}
      </div>
      <TextAreaField label="매설물 현황 메모" value={(d.note as string) ?? ""} onChange={(v) => u("note", v)} placeholder="위치, 깊이, 관리기관 등" rows={2} />
    </div>
  );
}

function BulldozerObstacleForm() {
  const [d, u] = useSection<Record<string, string>>("bulldozer_obstacle", {});
  return <TextAreaField label="암석·지장물 현황" value={d.content ?? ""} onChange={(v) => u("content", v)} placeholder="암석 위치, 크기, 제거 방법 등" rows={4} />;
}

function BulldozerAlarmForm() {
  const [d, u] = useSection<Record<string, boolean | string>>("bulldozer_alarm", {});
  const checks = ["후진 경보 장치 설치", "경광등 설치", "조명등 설치 (야간 작업 시)", "안전 펜스 설치"];
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 px-4 py-3 space-y-1">
        {checks.map((c) => <CheckItem key={c} label={c} checked={(d[c] as boolean) ?? false} onChange={(v) => u(c, v)} />)}
      </div>
      <TextAreaField label="비고" value={(d.note as string) ?? ""} onChange={(v) => u("note", v)} placeholder="추가 사항" rows={2} />
    </div>
  );
}

// 모터그레이더
function GraderSectionForm() {
  const [d, u] = useSection<Record<string, string>>("grader_section", {});
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <TextField label="작업 구간 시점" value={d.start ?? ""} onChange={(v) => u("start", v)} placeholder="예: STA.0+000" />
        <TextField label="작업 구간 종점" value={d.end ?? ""} onChange={(v) => u("end", v)} placeholder="예: STA.1+500" />
      </div>
      <TextField label="작업 연장 (m)" value={d.length ?? ""} onChange={(v) => u("length", v)} placeholder="예: 1500" type="number" />
    </div>
  );
}

function GraderRoadForm() {
  const [d, u] = useSection<Record<string, string>>("grader_road", {});
  return (
    <div className="space-y-3">
      <TextField label="노면 상태" value={d.condition ?? ""} onChange={(v) => u("condition", v)} placeholder="예: 비포장, 자갈 노면" />
      <TextAreaField label="특이사항" value={d.note ?? ""} onChange={(v) => u("note", v)} placeholder="노면 상태 특이사항" rows={2} />
    </div>
  );
}

function GraderSpeedForm() {
  const [d, u] = useSection<Record<string, string>>("grader_speed", {});
  return (
    <div className="grid grid-cols-2 gap-3">
      <TextField label="최고 제한 속도 (km/h)" value={d.maxSpeed ?? ""} onChange={(v) => u("maxSpeed", v)} placeholder="예: 15" type="number" />
      <TextField label="야간 작업 여부" value={d.nightWork ?? ""} onChange={(v) => u("nightWork", v)} placeholder="예: 없음" />
    </div>
  );
}

// 로더
function LoaderBucketForm() {
  const [d, u] = useSection<Record<string, string>>("loader_bucket", {});
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <TextField label="버킷 용량 (m³)" value={d.capacity ?? ""} onChange={(v) => u("capacity", v)} placeholder="예: 1.5" type="number" />
        <TextField label="최대 인양하중 (ton)" value={d.maxLoad ?? ""} onChange={(v) => u("maxLoad", v)} placeholder="예: 3.0" type="number" />
        <TextField label="최대 작업 반경 (m)" value={d.radius ?? ""} onChange={(v) => u("radius", v)} placeholder="예: 5.0" type="number" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-2">
          <TextField label="작업 반경 내 장애물" value={d.obstacles ?? ""} onChange={(v) => u("obstacles", v)} placeholder="장애물 현황 기술" />
        </div>
        <div className="col-span-2">
          <TextField label="적재 방법 및 주의사항" value={d.method ?? ""} onChange={(v) => u("method", v)} placeholder="적재 순서, 균형 유지 방법 등" />
        </div>
      </div>
    </div>
  );
}

// 스크레이퍼
function ScraperSectionForm() {
  const [d, u] = useSection<Record<string, string>>("scraper_section", {});
  return (
    <div className="grid grid-cols-2 gap-3">
      <TextField label="작업 길이 (m)" value={d.length ?? ""} onChange={(v) => u("length", v)} placeholder="예: 200" type="number" />
      <TextField label="작업 폭 (m)" value={d.width ?? ""} onChange={(v) => u("width", v)} placeholder="예: 12" type="number" />
    </div>
  );
}

function ScraperDepthForm() {
  const [d, u] = useSection<Record<string, string>>("scraper_depth", {});
  return (
    <div className="space-y-3">
      <TextField label="절취 깊이 (m)" value={d.depth ?? ""} onChange={(v) => u("depth", v)} placeholder="예: 0.3" type="number" />
      <TextAreaField label="토질 특성" value={d.soil ?? ""} onChange={(v) => u("soil", v)} placeholder="절취 토질 분류 및 특성" rows={2} />
    </div>
  );
}

// 크레인
function CraneCapacityForm() {
  const [d, u] = useSection<Record<string, string>>("crane_capacity", {});
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <TextField label="최대 인양하중 (ton)" value={d.maxLoad ?? ""} onChange={(v) => u("maxLoad", v)} placeholder="예: 25.0" type="number" />
        <TextField label="최대 인양반경 (m)" value={d.maxRadius ?? ""} onChange={(v) => u("maxRadius", v)} placeholder="예: 15.0" type="number" />
        <TextField label="실 인양하중 (ton)" value={d.actualLoad ?? ""} onChange={(v) => u("actualLoad", v)} placeholder="예: 18.0" type="number" />
        <TextField label="실 인양반경 (m)" value={d.actualRadius ?? ""} onChange={(v) => u("actualRadius", v)} placeholder="예: 12.0" type="number" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <TextField label="인양각도 (°)" value={d.angle ?? ""} onChange={(v) => u("angle", v)} placeholder="예: 75" type="number" />
      </div>
    </div>
  );
}

function CraneRiggingForm() {
  const [d, u] = useSection<Record<string, string>>("crane_rigging", {});
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <TextField label="슬링 종류" value={d.slingType ?? ""} onChange={(v) => u("slingType", v)} placeholder="예: 와이어로프 슬링" />
        <TextField label="슬링 수량 (개)" value={d.slingQty ?? ""} onChange={(v) => u("slingQty", v)} placeholder="예: 4" type="number" />
        <TextField label="샤클 규격" value={d.shackleSpec ?? ""} onChange={(v) => u("shackleSpec", v)} placeholder="예: 3T 샤클" />
        <TextField label="샤클 수량 (개)" value={d.shackleQty ?? ""} onChange={(v) => u("shackleQty", v)} placeholder="예: 4" type="number" />
      </div>
      <TextAreaField label="달기기구 점검 상태" value={d.condition ?? ""} onChange={(v) => u("condition", v)} placeholder="점검일, 이상 여부 등" rows={2} />
    </div>
  );
}

function CraneSwingForm() {
  const [d, u] = useSection<Record<string, unknown>>("crane_swing", {});
  const SWING_ITEMS = ["전력선 유무 확인", "구조물 접촉 위험 확인", "출입 인원 통제 확인", "과부하 방지장치 작동 확인", "기타 장애물"];
  type SwingRow = { checked: boolean; note: string };
  const rows = d.rows as Record<string, SwingRow> | undefined ?? {};
  const updateRow = (key: string, field: keyof SwingRow, val: boolean | string) =>
    u("rows", { ...rows, [key]: { checked: rows[key]?.checked ?? false, note: rows[key]?.note ?? "", [field]: val } });
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: PRIMARY_LIGHT }}>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs w-6"></th>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs whitespace-nowrap w-44">확인 항목</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">장애물 위치 및 처리 방법</th>
          </tr>
        </thead>
        <tbody>
          {SWING_ITEMS.map((item) => {
            const row = rows[item] ?? { checked: false, note: "" };
            return (
              <tr key={item} className="border-t border-slate-100">
                <td className="px-3 py-2 text-center">
                  <div className="w-4 h-4 rounded border-2 flex items-center justify-center text-white text-xs cursor-pointer mx-auto"
                    style={{ background: row.checked ? PRIMARY : "white", borderColor: row.checked ? PRIMARY : "#cbd5e1" }}
                    onClick={() => updateRow(item, "checked", !row.checked)}
                  >{row.checked && "✓"}</div>
                </td>
                <td className="px-3 py-2 text-xs font-medium whitespace-nowrap w-44" style={{ color: row.checked ? PRIMARY : "#64748b" }}>{item}</td>
                <td className="px-2 py-1.5">
                  <input type="text" value={row.note} onChange={(e) => updateRow(item, "note", e.target.value)}
                    disabled={!row.checked}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-300"
                    placeholder={row.checked ? "위치 및 처리 방법 기재" : "—"} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CraneSignalForm() {
  const [d, u] = useSection<Record<string, string>>("crane_signal", {});
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <TextField label="신호 방법" value={d.method ?? ""} onChange={(v) => u("method", v)} placeholder="예: 무전기 + 수신호" />
        <TextField label="신호수 이름" value={d.signalPerson ?? ""} onChange={(v) => u("signalPerson", v)} placeholder="홍길동" />
        <TextField label="신호수 배치 위치" value={d.position ?? ""} onChange={(v) => u("position", v)} placeholder="예: 인양물 북측" />
        <TextField label="비상 신호 방법" value={d.emergency ?? ""} onChange={(v) => u("emergency", v)} placeholder="비상 중지 신호 등" />
      </div>
    </div>
  );
}

function CraneGroundForm() {
  const [d, u] = useSection<Record<string, string | boolean>>("crane_ground", {});
  const checks = ["지내력 확인 (지반조사 결과)", "아웃트리거 설치 위치 확인", "아웃트리거 하부 철판 설치", "연약지반 보강 조치"];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3 items-end">
        <TextField label="지내력 (kN/m²)" value={(d.bearing as string) ?? ""} onChange={(v) => u("bearing", v)} placeholder="예: 150" type="number" />
        <div className="col-span-3">
          <TextField label="지반 보강 방법" value={(d.reinforcement as string) ?? ""} onChange={(v) => u("reinforcement", v)} placeholder="지반 보강 조치 내용" />
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 px-4 py-3 space-y-1">
        {checks.map((c) => <CheckItem key={c} label={c} checked={(d[c] as boolean) ?? false} onChange={(v) => u(c, v)} />)}
      </div>
    </div>
  );
}

// 굴착기
function ExcavatorDepthForm() {
  const [d, u] = useSection<Record<string, string>>("excavator_depth", {});
  return (
    <div className="grid grid-cols-4 gap-3">
      <TextField label="최대 굴착 깊이 (m)" value={d.depth ?? ""} onChange={(v) => u("depth", v)} placeholder="예: 3.5" type="number" />
      <TextField label="굴착 기울기 (구배)" value={d.slope ?? ""} onChange={(v) => u("slope", v)} placeholder="예: 1:1" />
      <TextField label="굴착 폭 (m)" value={d.width ?? ""} onChange={(v) => u("width", v)} placeholder="예: 4.0" type="number" />
      <TextField label="굴착 연장 (m)" value={d.length ?? ""} onChange={(v) => u("length", v)} placeholder="예: 50" type="number" />
    </div>
  );
}

function ExcavatorGroundForm() {
  const [d, u] = useSection<Record<string, unknown>>("excavator_ground", {});
  const soilTypes = ["점토", "실트", "사질토", "자갈", "풍화암", "연암", "경암", "기타"];
  const selected: string[] = Array.isArray(d.soilTypes) ? (d.soilTypes as string[]) : [];
  const toggleSoil = (t: string) => {
    const next = selected.includes(t) ? selected.filter((s) => s !== t) : [...selected, t];
    u("soilTypes", next);
  };
  const hasOther = selected.includes("기타");
  return (
    <div className="grid grid-cols-4 gap-3 items-end">
      <div className="col-span-2">
        <label className="block text-sm font-medium text-slate-600 mb-1">토질 분류 (복수 선택 가능)</label>
        <div className="flex flex-wrap gap-2">
          {soilTypes.map((t) => {
            const active = selected.includes(t);
            return (
              <button key={t} onClick={() => toggleSoil(t)} className="text-xs px-3 py-1.5 rounded-full border transition-all"
                style={{ background: active ? PRIMARY : "white", borderColor: active ? PRIMARY : "#e2e8f0", color: active ? "white" : "#64748b" }}>
                {t}
              </button>
            );
          })}
        </div>
        {hasOther && (
          <input type="text" value={(d.soilTypeOther as string) ?? ""} onChange={(e) => u("soilTypeOther", e.target.value)}
            className="mt-2 w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400"
            placeholder="토질 종류 직접 입력" />
        )}
      </div>
      <div className="col-span-2">
        <TextField label="토질조사 결과" value={(d.surveyResult as string) ?? ""} onChange={(v) => u("surveyResult", v)} placeholder="지반조사 결과, 지하수위 등" />
      </div>
    </div>
  );
}

function ExcavatorUtilityForm() {
  const [d, u] = useSection<Record<string, unknown>>("excavator_utility", {});
  const UTILITY_TYPES = ["도시가스관", "상수도관", "하수도관", "전력케이블 (지중)", "통신케이블", "난방배관", "기타 매설물"];
  type UtilityRow = { checked: boolean; note: string };
  const rows = d.rows as Record<string, UtilityRow> | undefined ?? {};
  const updateRow = (key: string, field: keyof UtilityRow, val: boolean | string) =>
    u("rows", { ...rows, [key]: { checked: rows[key]?.checked ?? false, note: rows[key]?.note ?? "", [field]: val } });
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: PRIMARY_LIGHT }}>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs w-6"></th>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs whitespace-nowrap w-32">매설물 종류</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">확인 내용 및 조치</th>
          </tr>
        </thead>
        <tbody>
          {UTILITY_TYPES.map((type) => {
            const row = rows[type] ?? { checked: false, note: "" };
            return (
              <tr key={type} className="border-t border-slate-100">
                <td className="px-3 py-2 text-center">
                  <div className="w-4 h-4 rounded border-2 flex items-center justify-center text-white text-xs cursor-pointer mx-auto"
                    style={{ background: row.checked ? PRIMARY : "white", borderColor: row.checked ? PRIMARY : "#cbd5e1" }}
                    onClick={() => updateRow(type, "checked", !row.checked)}
                  >{row.checked && "✓"}</div>
                </td>
                <td className="px-3 py-2 text-xs font-medium whitespace-nowrap w-32" style={{ color: row.checked ? PRIMARY : "#64748b" }}>{type}</td>
                <td className="px-2 py-1.5">
                  <input type="text" value={row.note} onChange={(e) => updateRow(type, "note", e.target.value)}
                    disabled={!row.checked}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-300"
                    placeholder={row.checked ? "관리기관 연락, 탐지 결과, 방호 방법 등" : "—"} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ExcavatorRetainingForm() {
  const [d, u] = useSection<Record<string, string | string[]>>("excavator_retaining", {});
  const methods = ["엄지말뚝 + 토류판", "시트파일", "CIP (현장타설말뚝)", "SCW", "흙막이 불필요", "기타"];
  const attachments = ["버킷", "브레이커", "크램셸", "인양용 달기구", "기타"];
  const selectedAttach: string[] = Array.isArray(d.attachments) ? (d.attachments as string[]) : [];
  const toggleAttach = (item: string) =>
    u("attachments", selectedAttach.includes(item) ? selectedAttach.filter((v) => v !== item) : [...selectedAttach, item]);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">흙막이 공법</label>
          <div className="flex flex-wrap items-center gap-2">
            {methods.map((m) => (
              <button key={m} onClick={() => u("method", m === d.method ? "" : m)} className="text-xs px-3 py-1.5 rounded-full border transition-all"
                style={{ background: d.method === m ? PRIMARY : "white", borderColor: d.method === m ? PRIMARY : "#e2e8f0", color: d.method === m ? "white" : "#64748b" }}>
                {m}
              </button>
            ))}
            {d.method === "기타" && (
              <input type="text" value={(d.methodCustom as string) ?? ""} onChange={(e) => u("methodCustom", e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-full text-xs outline-none focus:border-teal-400 w-40"
                placeholder="공법명 직접 입력" autoFocus />
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">작업장치 선택</label>
          <div className="flex flex-wrap items-center gap-2">
            {attachments.map((item) => (
              <button key={item} type="button" onClick={() => toggleAttach(item)}
                className="text-xs px-3 py-1.5 rounded-full border transition-all"
                style={{ background: selectedAttach.includes(item) ? PRIMARY : "white", borderColor: selectedAttach.includes(item) ? PRIMARY : "#e2e8f0", color: selectedAttach.includes(item) ? "white" : "#64748b" }}>
                {item}
              </button>
            ))}
            {selectedAttach.includes("기타") && (
              <input type="text" value={(d.attachmentCustom as string) ?? ""} onChange={(e) => u("attachmentCustom", e.target.value)}
                placeholder="장치명 직접 입력" autoFocus
                className="px-3 py-1.5 border border-slate-200 rounded-full text-xs focus:outline-none focus:border-teal-400 w-40" />
            )}
          </div>
        </div>
      </div>
      <TextAreaField label="흙막이 설계 및 시공 특이사항" value={(d.note as string) ?? ""} onChange={(v) => u("note", v)} placeholder="흙막이 공법 상세, 계측 계획 등" rows={3} />
    </div>
  );
}

// 항타·항발기
function PileMethodForm() {
  const [d, u] = useSection<Record<string, string>>("pile_method", {});
  const methods = ["디젤해머", "유압해머", "바이브로해머", "오거 (매입공법)", "SIP 공법", "PRD 공법", "기타"];
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">항타 공법</label>
        <div className="flex flex-wrap items-center gap-2">
          {methods.map((m) => (
            <button
              key={m}
              onClick={() => u("method", m === d.method ? "" : m)}
              className="text-xs px-3 py-1.5 rounded-full border transition-all"
              style={{
                background: d.method === m ? PRIMARY : "white",
                borderColor: d.method === m ? PRIMARY : "#e2e8f0",
                color: d.method === m ? "white" : "#64748b",
              }}
            >
              {m}
            </button>
          ))}
          {d.method === "기타" && (
            <input
              type="text"
              value={d.methodCustom ?? ""}
              onChange={(e) => u("methodCustom", e.target.value)}
              placeholder="공법명 직접 입력"
              autoFocus
              className="px-3 py-1.5 border border-slate-200 rounded-full text-xs focus:outline-none focus:border-teal-400 w-40"
            />
          )}
        </div>
      </div>
      <TextAreaField label="공법 상세" value={d.detail ?? ""} onChange={(v) => u("detail", v)} placeholder="항타 에너지, 타격 회수 등" rows={2} />
    </div>
  );
}

function PileTypeForm() {
  const [d, u] = useSection<Record<string, string>>("pile_type", {});
  const types = ["PHC파일", "강관파일", "H-파일", "RC파일", "목파일", "기타"];
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">파일 종류</label>
        <div className="flex flex-wrap items-center gap-2">
          {types.map((t) => (
            <button key={t} onClick={() => u("type", t === d.type ? "" : t)} className="text-xs px-3 py-1.5 rounded-full border transition-all"
              style={{ background: d.type === t ? PRIMARY : "white", borderColor: d.type === t ? PRIMARY : "#e2e8f0", color: d.type === t ? "white" : "#64748b" }}>
              {t}
            </button>
          ))}
          {d.type === "기타" && (
            <input
              type="text"
              value={d.typeCustom ?? ""}
              onChange={(e) => u("typeCustom", e.target.value)}
              placeholder="파일 종류 직접 입력"
              autoFocus
              className="px-3 py-1.5 border border-slate-200 rounded-full text-xs focus:outline-none focus:border-teal-400 w-40"
            />
          )}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <TextField label="규격 (mm)" value={d.spec ?? ""} onChange={(v) => u("spec", v)} placeholder="예: φ400" />
        <TextField label="길이 (m)" value={d.length ?? ""} onChange={(v) => u("length", v)} placeholder="예: 12" type="number" />
        <TextField label="본수 (본)" value={d.count ?? ""} onChange={(v) => u("count", v)} placeholder="예: 50" type="number" />
      </div>
    </div>
  );
}

function PileNoiseForm() {
  const [d, u] = useSection<Record<string, string | boolean>>("pile_noise", {});
  const checks = ["소음 측정 실시 계획", "방음벽 설치", "진동 모니터링 계획", "인접 구조물 안전 확인", "주민 민원 대응 계획"];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3 items-end">
        <TextField label="소음 기준 (dB)" value={(d.noiseLimit as string) ?? ""} onChange={(v) => u("noiseLimit", v)} placeholder="예: 75" type="number" />
        <TextField label="진동 기준 (cm/s)" value={(d.vibrationLimit as string) ?? ""} onChange={(v) => u("vibrationLimit", v)} placeholder="예: 0.2" type="number" />
        <div className="col-span-2">
          <TextField label="소음·진동 저감 방법" value={(d.note as string) ?? ""} onChange={(v) => u("note", v)} placeholder="저감 대책 및 관리 방법" />
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 px-4 py-3 space-y-1">
        {checks.map((c) => <CheckItem key={c} label={c} checked={(d[c] as boolean) ?? false} onChange={(v) => u(c, v)} />)}
      </div>
    </div>
  );
}

// 롤러
function RollerSectionForm() {
  const [d, u] = useSection<Record<string, string>>("roller_section", {});
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3 items-end">
        <TextField label="다짐 면적 (m²)" value={d.area ?? ""} onChange={(v) => u("area", v)} placeholder="예: 1500" type="number" />
        <TextField label="층별 다짐 두께 (cm)" value={d.thickness ?? ""} onChange={(v) => u("thickness", v)} placeholder="예: 20" type="number" />
        <div className="col-span-2">
          <TextField label="다짐 구간" value={d.section ?? ""} onChange={(v) => u("section", v)} placeholder="다짐 시점 ~ 종점, 구간 설명" />
        </div>
      </div>
    </div>
  );
}

function RollerCountForm() {
  const [d, u] = useSection<Record<string, string | boolean>>("roller_count", {});
  const methods = ["진동 다짐", "정적 다짐", "타이어 다짐", "진동+정적 병행"];
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">다짐 방법</label>
        <div className="flex flex-wrap gap-2">
          {methods.map((m) => (
            <button key={m} onClick={() => u("method", m)} className="text-xs px-3 py-1.5 rounded-full border transition-all"
              style={{ background: d.method === m ? PRIMARY : "white", borderColor: d.method === m ? PRIMARY : "#e2e8f0", color: d.method === m ? "white" : "#64748b" }}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <TextField label="다짐 횟수 (회)" value={(d.count as string) ?? ""} onChange={(v) => u("count", v)} placeholder="예: 6" type="number" />
        <TextField label="다짐 속도 (km/h)" value={(d.speed as string) ?? ""} onChange={(v) => u("speed", v)} placeholder="예: 3" type="number" />
        <TextField label="목표 다짐도 (%)" value={((d.targetDensity as string) ?? "")} onChange={(v) => u("targetDensity", v)} placeholder="예: 95" type="number" />
        <TextField label="시험 빈도" value={((d.testFreq as string) ?? "")} onChange={(v) => u("testFreq", v)} placeholder="예: 500m²당 1회" />
      </div>
    </div>
  );
}

function RollerCompactionForm() {
  const [d, u] = useSection<Record<string, string | boolean>>("roller_compaction", {});
  const checks = ["현장밀도시험 계획 수립", "다짐 관리 기준 확인", "함수비 관리 계획"];
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 px-4 py-3 space-y-1">
        {checks.map((c) => <CheckItem key={c} label={c} checked={(d[c] as boolean) ?? false} onChange={(v) => u(c, v)} />)}
      </div>
      <TextAreaField label="다짐도 관리 방법" value={(d.note as string) ?? ""} onChange={(v) => u("note", v)} placeholder="품질관리 기준 및 방법" rows={2} />
    </div>
  );
}

// ─── 작업 설명 ───────────────────────────────────────────────────
interface WorkDescriptionData extends Record<string, unknown> { purpose?: string; details?: string; scope?: string; method?: string }

function WorkDescriptionForm() {
  const [d, u] = useSection<WorkDescriptionData>("work_description", {});
  return (
    <div className="space-y-4">
      <TextAreaField label="작업 목적" value={d.purpose ?? ""} onChange={(v) => u("purpose", v)} rows={3} placeholder="작업을 수행하는 목적을 기술하세요" />
      <TextAreaField label="작업 세부내용" value={d.details ?? ""} onChange={(v) => u("details", v)} rows={4} placeholder="작업의 세부 내용을 기술하세요" />
      <TextAreaField label="작업 범위" value={d.scope ?? ""} onChange={(v) => u("scope", v)} rows={3} placeholder="작업의 범위와 경계를 기술하세요" />
    </div>
  );
}

// ─── 작업환경 ────────────────────────────────────────────────────
interface WorkEnvironmentData extends Record<string, unknown> {
  weather?: string; temperature?: string; ventilation?: string; lighting?: string;
  noiseLevel?: string; surroundingSafety?: string; accessRoute?: string; specialConditions?: string;
}

function WorkEnvironmentForm() {
  const [d, u] = useSection<WorkEnvironmentData>("work_environment", {});
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <TextField label="날씨" value={d.weather ?? ""} onChange={(v) => u("weather", v)} placeholder="예: 맑음" />
        <TextField label="온도 (°C)" value={d.temperature ?? ""} onChange={(v) => u("temperature", v)} placeholder="예: 25" type="number" />
        <TextField label="환기상태" value={d.ventilation ?? ""} onChange={(v) => u("ventilation", v)} placeholder="예: 양호" />
        <TextField label="조도" value={d.lighting ?? ""} onChange={(v) => u("lighting", v)} placeholder="예: 300lux" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <TextField label="소음도" value={d.noiseLevel ?? ""} onChange={(v) => u("noiseLevel", v)} placeholder="예: 75dB" />
        <TextField label="주변 안전상태" value={d.surroundingSafety ?? ""} onChange={(v) => u("surroundingSafety", v)} placeholder="예: 양호" />
        <div className="col-span-2">
          <TextField label="진입로 상태" value={d.accessRoute ?? ""} onChange={(v) => u("accessRoute", v)} placeholder="예: 포장도로" />
        </div>
      </div>
      <TextAreaField label="상세내용" value={d.specialConditions ?? ""} onChange={(v) => u("specialConditions", v)} rows={4} placeholder="작업 현장의 환경 및 상황을 기술하세요 (예: 지하 2층 밀폐공간, 우천·야간 작업 여부, 인접 구조물 현황, 통행 제한 여부 등)" />
    </div>
  );
}


// ─── 기계 제원 (장비별 전용, 팩토리 패턴) ───────────────────────
interface AdditionalPart { id: string; partName: string; material: string; ratedLoad: string; method: string }
interface MachineRow {
  id: string;
  machineName: string;       // 장비명
  equipmentTypeName: string; // 장비종류 (직접 입력)
  regNo: string; maker: string; model: string;
  capacity: string; dimensions: string; year: string; note: string;
  workRadius: string;
  inspectionExpiry: string; inspectionNA: boolean;
  insuranceNA: boolean;      // 해당없음
  insuranceTypeName: string; // 보험 종류
  insuranceEnd: string;      // 보험 유효기간 (까지)
  additionalParts: AdditionalPart[];
}
interface MachineSpecData { rows?: MachineRow[] }

const EMPTY_MACHINE_ROW = (): MachineRow => ({
  id: `ms${Date.now()}`, machineName: "", equipmentTypeName: "", regNo: "", maker: "",
  model: "", capacity: "", dimensions: "", year: "", note: "",
  workRadius: "", inspectionExpiry: "", inspectionNA: false,
  insuranceNA: false, insuranceTypeName: "", insuranceEnd: "",
  additionalParts: [],
});

function makeMachineSpecForm(sectionId: string) {
  // sectionId 예: "excavator_machine_spec" → eqTypeKey = "excavator"
  const eqTypeKey = sectionId.replace("_machine_spec", "") as EquipmentType;
  const defaultEqTypeName = CONSTRUCTION_EQUIPMENT_TYPES[eqTypeKey]?.label ?? "";

  return function MachineSpecFormInner() {
    const { formData, updateFormData } = useWorkPlanStore();
    const data = (formData[sectionId] as MachineSpecData) ?? {};
    const rows: MachineRow[] = data.rows ?? [];
    const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({});

    const save = (r: MachineRow[]) => updateFormData(sectionId, { rows: r });
    const updateRow = (id: string, key: keyof MachineRow, value: string | boolean) =>
      save(rows.map((r) => r.id === id ? { ...r, [key]: value } : r));
    const addRow = (preset?: Partial<MachineRow>) =>
      save([...rows, { ...EMPTY_MACHINE_ROW(), equipmentTypeName: defaultEqTypeName, ...preset }]);
    const removeRow = (id: string) => save(rows.filter((r) => r.id !== id));
    const toggleExpand = (id: string) =>
      setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

    // Additional parts helpers
    const addPart = (rowId: string) => {
      const row = rows.find((r) => r.id === rowId);
      if (!row) return;
      const parts = [...(row.additionalParts ?? []), { id: `pt${Date.now()}`, partName: "", material: "", ratedLoad: "", method: "" }];
      save(rows.map((r) => r.id === rowId ? { ...r, additionalParts: parts } : r));
    };
    const updatePart = (rowId: string, partId: string, key: keyof AdditionalPart, value: string) => {
      const row = rows.find((r) => r.id === rowId);
      if (!row) return;
      const parts = (row.additionalParts ?? []).map((p) => p.id === partId ? { ...p, [key]: value } : p);
      save(rows.map((r) => r.id === rowId ? { ...r, additionalParts: parts } : r));
    };
    const removePart = (rowId: string, partId: string) => {
      const row = rows.find((r) => r.id === rowId);
      if (!row) return;
      const parts = (row.additionalParts ?? []).filter((p) => p.id !== partId);
      save(rows.map((r) => r.id === rowId ? { ...r, additionalParts: parts } : r));
    };

    return (
      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-6 flex flex-col items-center gap-2">
            <p className="text-xs text-slate-400">기계 제원을 입력하려면 아래 버튼을 누르세요</p>
            <button
              onClick={() => addRow()}
              className="text-xs px-4 py-1.5 rounded-lg font-medium transition-all"
              style={{ background: PRIMARY_LIGHT, color: PRIMARY, border: `1px solid ${PRIMARY}55` }}
            >
              + 기계 추가
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: PRIMARY_LIGHT }}>
                    {["장비명", "장비종류", "등록번호", "제조사", "모델명", "정격하중/용량", "제원(L×W×H)", "연식", "특이사항", ""].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-slate-600 text-xs whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <React.Fragment key={r.id}>
                      <tr className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                        {(["machineName","equipmentTypeName","regNo","maker","model","capacity","dimensions","year","note"] as (keyof MachineRow)[]).map((key) => (
                          <td key={key} className="px-2 py-1">
                            <input
                              type="text"
                              value={r[key] as string}
                              onChange={(e) => updateRow(r.id, key, e.target.value)}
                              className="w-full min-w-14 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400"
                            />
                          </td>
                        ))}
                        <td className="px-2 py-1 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleExpand(r.id)}
                              className="text-xs px-2 py-0.5 rounded-lg font-medium transition-colors"
                              style={{ background: expandedRows[r.id] ? `${PRIMARY}15` : "#f1f5f9", color: expandedRows[r.id] ? PRIMARY : "#64748b" }}
                            >
                              {expandedRows[r.id] ? "▲" : "▼ 추가"}
                            </button>
                            <button onClick={() => removeRow(r.id)} className="text-slate-300 hover:text-red-400 text-sm px-1">✕</button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows[r.id] && (
                        <tr className="border-t border-slate-100">
                          <td colSpan={10} className="p-3" style={{ background: "#fafcff" }}>
                            <div className="space-y-3">
                              {/* 작업반경 + 점검/검사유효기간 + 보험 */}
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="ptw-label">작업반경</label>
                                  <input type="text" value={r.workRadius} onChange={(e) => updateRow(r.id, "workRadius", e.target.value)} placeholder="예: 5m" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="ptw-label mb-0">점검/검사 유효기간</label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                      <div
                                        className="w-3.5 h-3.5 rounded border-2 flex items-center justify-center text-white"
                                        style={{ background: r.inspectionNA ? PRIMARY : "white", borderColor: r.inspectionNA ? PRIMARY : "#cbd5e1", fontSize: "0.55rem" }}
                                        onClick={() => updateRow(r.id, "inspectionNA", !r.inspectionNA)}
                                      >{r.inspectionNA && "✓"}</div>
                                      <span className="text-xs text-slate-400">해당없음</span>
                                    </label>
                                  </div>
                                  <input type="date" value={r.inspectionNA ? "" : r.inspectionExpiry} disabled={r.inspectionNA} onChange={(e) => updateRow(r.id, "inspectionExpiry", e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-300" />
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="ptw-label mb-0">보험 여부 / 유효기간</label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                      <div
                                        className="w-3.5 h-3.5 rounded border-2 flex items-center justify-center text-white"
                                        style={{ background: r.insuranceNA ? PRIMARY : "white", borderColor: r.insuranceNA ? PRIMARY : "#cbd5e1", fontSize: "0.55rem" }}
                                        onClick={() => updateRow(r.id, "insuranceNA", !r.insuranceNA)}
                                      >{r.insuranceNA && "✓"}</div>
                                      <span className="text-xs text-slate-400">해당없음</span>
                                    </label>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <input type="text" value={r.insuranceNA ? "" : r.insuranceTypeName} disabled={r.insuranceNA} onChange={(e) => updateRow(r.id, "insuranceTypeName", e.target.value)}
                                      placeholder="보험 종류" className="flex-1 min-w-0 px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-300" />
                                    <input type="date" value={r.insuranceNA ? "" : r.insuranceEnd} disabled={r.insuranceNA} onChange={(e) => updateRow(r.id, "insuranceEnd", e.target.value)}
                                      className="shrink-0 px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-300" />
                                  </div>
                                </div>
                              </div>
                              {/* 추가 설치부품 */}
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-semibold text-slate-500">상세규격 / 추가 설치부품</span>
                                  <button onClick={() => addPart(r.id)} className="text-xs text-slate-400 hover:text-teal-500">+ 부품 추가</button>
                                </div>
                                {(r.additionalParts ?? []).length > 0 ? (
                                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr style={{ background: PRIMARY_LIGHT }}>
                                          {["설치부품 명칭", "재료/규격", "정격하중", "방법", ""].map((h) => (
                                            <th key={h} className="px-2 py-1.5 text-left font-medium text-slate-600 whitespace-nowrap">{h}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(r.additionalParts ?? []).map((p) => (
                                          <tr key={p.id} className="border-t border-slate-100">
                                            <td className="px-2 py-1"><input type="text" value={p.partName} onChange={(e) => updatePart(r.id, p.id, "partName", e.target.value)} className="w-full min-w-20 px-2 py-1 border border-slate-200 rounded text-xs outline-none focus:border-teal-400" placeholder="예: 오거드릴" /></td>
                                            <td className="px-2 py-1"><input type="text" value={p.material} onChange={(e) => updatePart(r.id, p.id, "material", e.target.value)} className="w-full min-w-20 px-2 py-1 border border-slate-200 rounded text-xs outline-none focus:border-teal-400" placeholder="예: φ600mm" /></td>
                                            <td className="px-2 py-1"><input type="text" value={p.ratedLoad} onChange={(e) => updatePart(r.id, p.id, "ratedLoad", e.target.value)} className="w-24 px-2 py-1 border border-slate-200 rounded text-xs outline-none focus:border-teal-400" placeholder="예: 5t" /></td>
                                            <td className="px-2 py-1"><input type="text" value={p.method} onChange={(e) => updatePart(r.id, p.id, "method", e.target.value)} className="w-full min-w-16 px-2 py-1 border border-slate-200 rounded text-xs outline-none focus:border-teal-400" placeholder="설치 방법" /></td>
                                            <td className="px-2 py-1"><button onClick={() => removePart(r.id, p.id)} className="text-slate-300 hover:text-red-400 px-1">✕</button></td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-300 py-1">+ 부품 추가를 눌러 설치부품을 입력하세요</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-2 border-t border-slate-100">
              <button onClick={() => addRow()} className="text-xs text-slate-400 hover:text-teal-500">+ 행 추가</button>
            </div>
          </div>
        )}
      </div>
    );
  };
}

// ─── 안전교육 ────────────────────────────────────────────────────
interface TrainingRow { id: string; trainingType: string; subType: string; date: string; duration: string; instructor: string; completedCount: string }
interface TrainingData { rows?: TrainingRow[] }

const TRAINING_TYPE_OPTIONS = ["정기교육", "채용 시 교육", "작업내용 변경 시", "특별교육", "관리감독자 교육", "기타"];

function TrainingForm() {
  const { formData, updateFormData } = useWorkPlanStore();
  const data = (formData["training"] as TrainingData) ?? {};
  const rows: TrainingRow[] = data.rows ?? [];
  const updateRow = (id: string, key: keyof TrainingRow, value: string) =>
    updateFormData("training", { ...data, rows: rows.map((r) => r.id === id ? { ...r, [key]: value } : r) });
  const addRow = (trainingType = "") =>
    updateFormData("training", { ...data, rows: [...rows, { id: `tr${Date.now()}`, trainingType, subType: "", date: "", duration: "", instructor: "", completedCount: "" }] });
  const removeRow = (id: string) =>
    updateFormData("training", { ...data, rows: rows.filter((r) => r.id !== id) });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TRAINING_TYPE_OPTIONS.map((t) => (
          <button key={t} onClick={() => addRow(t)} className="text-xs px-3 py-1.5 rounded-full border transition-all" style={{ borderColor: `${PRIMARY}55`, color: PRIMARY, background: PRIMARY_LIGHT }}>+ {t}</button>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: PRIMARY_LIGHT }}>
              {["교육종류", "교육세부종류", "교육날짜", "교육시간", "강사명", "수료자 수", ""].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium text-slate-600 text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-2 py-1">
                  <select value={r.trainingType} onChange={(e) => updateRow(r.id, "trainingType", e.target.value)} className="px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400">
                    <option value="">선택</option>
                    {TRAINING_TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1"><input type="text" value={r.subType} onChange={(e) => updateRow(r.id, "subType", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="세부 내용" /></td>
                <td className="px-2 py-1"><input type="date" value={r.date} onChange={(e) => updateRow(r.id, "date", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" /></td>
                <td className="px-2 py-1"><input type="text" value={r.duration} onChange={(e) => updateRow(r.id, "duration", e.target.value)} className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="1시간" /></td>
                <td className="px-2 py-1"><input type="text" value={r.instructor} onChange={(e) => updateRow(r.id, "instructor", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="홍길동" /></td>
                <td className="px-2 py-1"><input type="number" value={r.completedCount} onChange={(e) => updateRow(r.id, "completedCount", e.target.value)} className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="0" /></td>
                <td className="px-2 py-1"><button onClick={() => removeRow(r.id)} className="text-slate-300 hover:text-red-400 text-sm px-1">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-3 py-2 border-t border-slate-100"><button onClick={() => addRow()} className="text-xs text-slate-400 hover:text-teal-500">+ 행 추가</button></div>
      </div>
    </div>
  );
}

// ─── 재해예방 대책 ────────────────────────────────────────────────
interface DisasterPreventionData extends Record<string, unknown> {
  fallPrevention?: string; overturnPrevention?: string; dropPrevention?: string;
  pinchPrevention?: string; collapsePrevention?: string; accessRestriction?: string; otherMeasures?: string;
}

function DisasterPreventionForm() {
  const [d, u] = useSection<DisasterPreventionData>("disaster_prevention", {});
  return (
    <div className="space-y-4">
      <TextAreaField label="추락 방지 대책" value={d.fallPrevention ?? ""} onChange={(v) => u("fallPrevention", v)} rows={2} placeholder="추락 방지를 위한 구체적인 대책을 기술하세요" />
      <TextAreaField label="전도·전복 방지 대책" value={d.overturnPrevention ?? ""} onChange={(v) => u("overturnPrevention", v)} rows={2} placeholder="전도·전복 방지를 위한 대책을 기술하세요" />
      <TextAreaField label="낙하·비래 방지 대책" value={d.dropPrevention ?? ""} onChange={(v) => u("dropPrevention", v)} rows={2} placeholder="낙하·비래 방지를 위한 대책을 기술하세요" />
      <TextAreaField label="끼임·협착 방지 대책" value={d.pinchPrevention ?? ""} onChange={(v) => u("pinchPrevention", v)} rows={2} placeholder="끼임·협착 방지를 위한 대책을 기술하세요" />
      <TextAreaField label="붕괴·도괴 방지 대책" value={d.collapsePrevention ?? ""} onChange={(v) => u("collapsePrevention", v)} rows={2} placeholder="붕괴·도괴 방지를 위한 대책을 기술하세요" />
      <TextAreaField label="접근 통제 계획" value={d.accessRestriction ?? ""} onChange={(v) => u("accessRestriction", v)} rows={2} placeholder="작업 구역 접근 통제 방법을 기술하세요" />
      <TextAreaField label="기타 재해예방 대책" value={d.otherMeasures ?? ""} onChange={(v) => u("otherMeasures", v)} rows={2} placeholder="기타 재해예방 대책을 기술하세요" />
    </div>
  );
}

// ─── 법정검사 기록 ────────────────────────────────────────────────
interface LegalInspectionRow { id: string; inspectionType: string; inspectionDate: string; expiryDate: string; result: string; agency: string; inspectionNo: string }
interface LegalInspectionData { rows?: LegalInspectionRow[] }

function LegalInspectionForm() {
  const { formData, updateFormData } = useWorkPlanStore();
  const data = (formData["legal_inspection"] as LegalInspectionData) ?? {};
  const rows: LegalInspectionRow[] = data.rows ?? [];
  const updateRow = (id: string, key: keyof LegalInspectionRow, value: string) =>
    updateFormData("legal_inspection", { rows: rows.map((r) => r.id === id ? { ...r, [key]: value } : r) });
  const addRow = () =>
    updateFormData("legal_inspection", { rows: [...rows, { id: `li${Date.now()}`, inspectionType: "", inspectionDate: "", expiryDate: "", result: "적합", agency: "", inspectionNo: "" }] });
  const removeRow = (id: string) =>
    updateFormData("legal_inspection", { rows: rows.filter((r) => r.id !== id) });
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: PRIMARY_LIGHT }}>
            {["검사종류", "검사일자", "유효기간", "결과", "검사기관", "검사번호", ""].map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium text-slate-600 text-xs">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={7} className="px-3 py-4 text-center text-xs text-slate-400">아래 버튼을 눌러 검사 기록을 추가하세요</td></tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-slate-100">
              <td className="px-2 py-1"><input type="text" value={r.inspectionType} onChange={(e) => updateRow(r.id, "inspectionType", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="정기검사" /></td>
              <td className="px-2 py-1"><input type="date" value={r.inspectionDate} onChange={(e) => updateRow(r.id, "inspectionDate", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" /></td>
              <td className="px-2 py-1"><input type="date" value={r.expiryDate} onChange={(e) => updateRow(r.id, "expiryDate", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" /></td>
              <td className="px-2 py-1">
                <select value={r.result} onChange={(e) => updateRow(r.id, "result", e.target.value)} className="px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400">
                  <option>적합</option><option>부적합</option><option>조건부</option>
                </select>
              </td>
              <td className="px-2 py-1"><input type="text" value={r.agency} onChange={(e) => updateRow(r.id, "agency", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="검사기관명" /></td>
              <td className="px-2 py-1"><input type="text" value={r.inspectionNo} onChange={(e) => updateRow(r.id, "inspectionNo", e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" placeholder="검사번호" /></td>
              <td className="px-2 py-1"><button onClick={() => removeRow(r.id)} className="text-slate-300 hover:text-red-400 text-sm px-1">✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 border-t border-slate-100"><button onClick={addRow} className="text-xs text-slate-400 hover:text-teal-500">+ 행 추가</button></div>
    </div>
  );
}

// ─── 서명 (인라인 상태 요약 — 상단 버튼에서 서명 진행) ─────────
function SignatureForm() {
  const { signatures } = useWorkPlanStore();
  const [expandedRevisions, setRevExpanded] = React.useState<Set<string>>(new Set());
  const doneCount = signatures.filter((s) => s.status === "done").length;

  const statusMeta = (status: string) => {
    if (status === "done")               return { bg: PRIMARY_LIGHT, border: PRIMARY,   text: PRIMARY,   label: "서명완료" };
    if (status === "signing")            return { bg: "#fffbeb",     border: "#f59e0b", text: "#b45309", label: "서명중" };
    if (status === "revision_requested") return { bg: "#fff1f2",     border: "#f43f5e", text: "#be123c", label: "수정요청" };
    return                                      { bg: "#f8fafc",     border: "#e2e8f0", text: "#94a3b8", label: "대기중" };
  };

  return (
    <div className="space-y-3">
      {/* Steps */}
      {signatures.map((sig, idx) => {
        const meta = statusMeta(sig.status);
        const isFirst = idx === 0;
        const isLast = idx === signatures.length - 1;
        const revExpanded = expandedRevisions.has(sig.role);
        return (
          <React.Fragment key={sig.role}>
            {idx > 0 && <div className="flex justify-center"><div className="w-px h-3 bg-slate-200" /></div>}
            <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: meta.border, background: meta.bg }}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: meta.border }}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-700">{sig.role}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${meta.border}22`, color: meta.text }}>{meta.label}</span>
                    {isFirst && <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">작성자</span>}
                    {isLast && <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">최종 승인</span>}
                  </div>
                  {sig.name && <p className="text-xs text-slate-500 mt-0.5">{sig.name}{sig.signedAt && ` · ${new Date(sig.signedAt).toLocaleDateString("ko-KR")}`}</p>}
                </div>
                <div className="h-12 w-20 rounded-lg flex items-center justify-center border flex-shrink-0" style={{ borderColor: meta.border, background: "white" }}>
                  {sig.dataUrl
                    ? <img src={sig.dataUrl} alt="서명" className="max-h-full max-w-full object-contain p-1" />
                    : <span className="text-lg opacity-15">✍️</span>}
                </div>
              </div>
              {/* 검토의견 */}
              {!isFirst && sig.comment && (
                <div className="px-4 pb-3 border-t border-slate-100">
                  <p className="ptw-label mt-2 mb-1">검토의견</p>
                  <p className="text-xs px-3 py-2 rounded-lg text-slate-600" style={{ background: `${meta.border}12` }}>{sig.comment}</p>
                </div>
              )}
              {/* 수정이력 */}
              {sig.revisions.length > 0 && (
                <div className="px-4 pb-3 border-t border-slate-100">
                  <button
                    onClick={() => setRevExpanded((prev) => { const n = new Set(prev); n.has(sig.role) ? n.delete(sig.role) : n.add(sig.role); return n; })}
                    className="text-xs font-semibold mt-2 mb-1 flex items-center gap-1"
                    style={{ color: "#f59e0b" }}
                  >
                    🔄 수정 이력 {sig.revisions.length}건 {revExpanded ? "▲" : "▼"}
                  </button>
                  {revExpanded && (
                    <div className="space-y-1.5">
                      {sig.revisions.map((rev) => (
                        <div key={rev.revisionNo} className="rounded-lg px-3 py-2 text-xs" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-amber-700">v{rev.revisionNo}</span>
                            <span className="text-slate-400">{new Date(rev.savedAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          {rev.note && <p className="text-slate-600">{rev.note}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}
      {/* Guide */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs" style={{ background: PRIMARY_LIGHT }}>
        <span style={{ color: PRIMARY }}>✍</span>
        <span className="text-slate-600">
          서명·검토의견·수정 요청은 상단 <strong style={{ color: PRIMARY }}>서명·결재 버튼</strong>에서 진행하세요. ({doneCount}/{signatures.length} 완료)
        </span>
      </div>
    </div>
  );
}

// ─── 도면 ─────────────────────────────────────────────────────────
function DrawingForm() {
  return <FileUploader />;
}

// ─── 기타 첨부파일 ────────────────────────────────────────────────
const EQUIPMENT_DOC_TYPES = [
  "건설기계 등록·검사증",
  "운전원 자격·면허 사본",
  "제조·임대사 사용설명서",
  "기계 대여사항 기록부",
  "건설기계 수리·보수·점검이력",
  "보험등록증",
  "기타 (제원표, 사전검토사항 등)",
] as const;

interface OtherFile { id: string; name: string; type: string }
interface EquipmentFile { id: string; name: string; mimeType: string; docCategory: string }
interface OtherFilesData { files?: OtherFile[]; equipmentFiles?: Record<string, EquipmentFile[]> }

function OtherFilesForm() {
  const { formData, updateFormData, selectedEquipments } = useWorkPlanStore();
  const data = (formData["other_files"] as OtherFilesData) ?? {};
  const files: OtherFile[] = data.files ?? [];
  const equipmentFiles: Record<string, EquipmentFile[]> = data.equipmentFiles ?? {};
  const inputRef = React.useRef<HTMLInputElement>(null);
  const eqInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});
  const [eqAttachEnabled, setEqAttachEnabled] = React.useState(false);
  const [expandedEq, setExpandedEq] = React.useState<Set<string>>(new Set());

  const fileIcon = (type: string) => type.includes("pdf") ? "📄" : type.startsWith("image/") ? "🖼️" : "📎";
  const newId = () => `f_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // 일반 첨부
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles: OtherFile[] = Array.from(e.target.files ?? []).map((f) => ({ id: newId(), name: f.name, type: f.type }));
    updateFormData("other_files", { ...data, files: [...files, ...newFiles] });
    if (inputRef.current) inputRef.current.value = "";
  };
  const removeGeneral = (id: string) =>
    updateFormData("other_files", { ...data, files: files.filter((f) => f.id !== id) });

  // 장비별 첨부
  const handleEqFileChange = (eqType: string, docCategory: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const newEqFiles: EquipmentFile[] = Array.from(e.target.files ?? []).map((f) => ({
      id: newId(), name: f.name, mimeType: f.type, docCategory,
    }));
    const existing = equipmentFiles[eqType] ?? [];
    updateFormData("other_files", { ...data, equipmentFiles: { ...equipmentFiles, [eqType]: [...existing, ...newEqFiles] } });
    const el = eqInputRefs.current[`${eqType}__${docCategory}`];
    if (el) el.value = "";
  };
  const removeEqFile = (eqType: string, fileId: string) => {
    const next = (equipmentFiles[eqType] ?? []).filter((f) => f.id !== fileId);
    updateFormData("other_files", { ...data, equipmentFiles: { ...equipmentFiles, [eqType]: next } });
  };

  const toggleExpand = (eqType: string) =>
    setExpandedEq((prev) => { const s = new Set(prev); s.has(eqType) ? s.delete(eqType) : s.add(eqType); return s; });

  return (
    <div className="space-y-4">
      {/* 장비별 서류 첨부 */}
      {selectedEquipments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">장비별 서류 첨부 <span className="normal-case font-normal text-slate-400">(선택)</span></p>
            <button
              type="button"
              onClick={() => setEqAttachEnabled((v) => !v)}
              className="relative inline-flex items-center w-10 h-5 rounded-full transition-colors flex-shrink-0"
              style={{ background: eqAttachEnabled ? PRIMARY : "#cbd5e1" }}
            >
              <span
                className="inline-block w-4 h-4 bg-white rounded-full shadow transition-transform"
                style={{ transform: eqAttachEnabled ? "translateX(22px)" : "translateX(2px)" }}
              />
            </button>
          </div>
          {eqAttachEnabled && (selectedEquipments as EquipmentType[]).map((eqType) => {
            const eq = CONSTRUCTION_EQUIPMENT_TYPES[eqType];
            const eqFiles = equipmentFiles[eqType] ?? [];
            const isExpanded = expandedEq.has(eqType);
            return (
              <div key={eqType} className="rounded-xl border border-slate-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleExpand(eqType)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="text-sm font-medium text-slate-700">{eq.icon} {eq.label}</span>
                  <div className="flex items-center gap-2">
                    {eqFiles.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>
                        {eqFiles.length}건
                      </span>
                    )}
                    <span className="text-slate-400 text-xs">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-slate-100 divide-y divide-slate-50">
                    {EQUIPMENT_DOC_TYPES.map((docType) => {
                      const docFiles = eqFiles.filter((f) => f.docCategory === docType);
                      const refKey = `${eqType}__${docType}`;
                      return (
                        <div key={docType} className="px-4 py-2.5 flex items-start gap-3">
                          <span className="text-xs text-slate-500 w-44 flex-shrink-0 pt-0.5">{docType}</span>
                          <div className="flex flex-wrap items-center gap-1.5 flex-1">
                            {docFiles.map((f) => (
                              <div key={f.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-slate-200 bg-slate-50">
                                <span>{fileIcon(f.mimeType)}</span>
                                <span className="text-slate-700 max-w-[8rem] truncate">{f.name}</span>
                                <button type="button" onClick={() => removeEqFile(eqType, f.id)} className="text-slate-300 hover:text-red-400 ml-0.5">✕</button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => eqInputRefs.current[refKey]?.click()}
                              className="text-xs px-2.5 py-1 rounded-full border border-dashed transition-colors hover:border-teal-400 hover:text-teal-600 text-slate-400"
                              style={{ borderColor: "#cbd5e1" }}
                            >
                              + 첨부
                            </button>
                            <input
                              ref={(el) => { eqInputRefs.current[refKey] = el; }}
                              type="file" multiple accept="image/*,.pdf" className="hidden"
                              onChange={(e) => handleEqFileChange(eqType, docType, e)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 일반 첨부파일 */}
      <div className="space-y-2">
        {selectedEquipments.length > 0 && (
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">일반 첨부파일 <span className="normal-case font-normal text-slate-400">(선택)</span></p>
        )}
        <div
          className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors hover:border-teal-400"
          style={{ borderColor: "#b2ece9", background: PRIMARY_LIGHT }}
          onClick={() => inputRef.current?.click()}
        >
          <p className="text-sm text-slate-500">클릭하여 파일 업로드</p>
          <p className="text-xs text-slate-400 mt-0.5">이미지, PDF 파일 지원</p>
          <input ref={inputRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
        </div>
        {files.length > 0 && (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-100" style={{ background: "#f8fafc" }}>
              첨부파일 목록 ({files.length}건)
            </div>
            <div className="divide-y divide-slate-50">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="text-base flex-shrink-0">{fileIcon(f.type)}</span>
                  <span className="flex-1 min-w-0 text-xs text-slate-700 truncate">{f.name}</span>
                  <button onClick={() => removeGeneral(f.id)} className="text-slate-300 hover:text-red-400 text-xs px-1 flex-shrink-0">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 법정 의무 섹션 폼 (별표4 / 제38조제1항)
// ══════════════════════════════════════════════════════════════════

// ─── 사전조사 기록 [법정] ─────────────────────────────────────────
interface PreSurveyData extends Record<string, unknown> {
  surveyDate?: string; surveyMethod?: string; surveyor?: string;
  topography?: string; geology?: string;
  crackWater?: string; buriedObjects?: string; groundwaterLevel?: string;
  structureCondition?: string; surroundings?: string; note?: string;
}
function PreSurveyForm() {
  const [d, u] = useSection<PreSurveyData>("pre_survey", {});
  const crackItems = ["균열", "함수(含水)", "용수(湧水)", "동결"];
  return (
    <div className="space-y-4">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
        style={{ background: "#fef9c3", color: "#a16207", border: "1px solid #fde047" }}
      >
        ⚖️ 별표4 — 차량계 건설기계·굴착·터널·채석·해체 작업 시 사전조사 결과를 반드시 기록·보존해야 합니다.
      </div>
      <div className="grid grid-cols-3 gap-3">
        <TextField label="조사일자" value={(d.surveyDate as string) ?? ""} onChange={(v) => u("surveyDate", v)} type="date" />
        <TextField label="조사자" value={(d.surveyor as string) ?? ""} onChange={(v) => u("surveyor", v)} placeholder="홍길동" />
        <TextField label="조사방법" value={(d.surveyMethod as string) ?? ""} onChange={(v) => u("surveyMethod", v)} placeholder="보링, 현장조사 등" />
      </div>
      <TextAreaField label="지형 및 지반 상태" value={(d.topography as string) ?? ""} onChange={(v) => u("topography", v)} rows={2} placeholder="작업장소의 지형·지반·지층 상태를 기술하세요" />
      <TextAreaField label="지질 및 지층 상태" value={(d.geology as string) ?? ""} onChange={(v) => u("geology", v)} rows={2} placeholder="토질조사 결과, 지층 구성 등" />
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">균열·함수·용수·동결 상태</label>
        <div className="grid grid-cols-2 gap-2">
          {crackItems.map((item) => (
            <div key={item} className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-20">{item}</span>
              <input
                type="text"
                value={(d[`crack_${item}`] as string) ?? ""}
                onChange={(e) => u(`crack_${item}`, e.target.value)}
                className="flex-1 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400"
                placeholder="유무 및 상태"
              />
            </div>
          ))}
        </div>
      </div>
      <TextAreaField label="매설물 현황" value={(d.buriedObjects as string) ?? ""} onChange={(v) => u("buriedObjects", v)} rows={2} placeholder="가스관·상하수도·전력선·통신케이블 등 매설물 위치·종류" />
      <TextField label="지반 지하수위 상태" value={(d.groundwaterLevel as string) ?? ""} onChange={(v) => u("groundwaterLevel", v)} placeholder="지하수위 깊이 및 상태" />
      <TextAreaField label="해체 건물 구조 및 주변 상황" value={(d.structureCondition as string) ?? ""} onChange={(v) => u("structureCondition", v)} rows={2} placeholder="해체 대상 건물의 구조, 노후도, 주변 인접 건물·시설 현황 (해체작업 시)" />
      <TextAreaField label="특이사항 및 조사 결론" value={(d.note as string) ?? ""} onChange={(v) => u("note", v)} rows={2} placeholder="조사 결과 종합 및 안전대책 필요 사항" />
    </div>
  );
}

// ─── 전기안전작업계획 [법정] (제318조 준용) ─────────────────────
interface ElecSafetyData extends Record<string, unknown> {
  workPurpose?: string; workerQual?: string; workerCount?: string;
  workScope?: string; supervisor?: string;
  hazards?: string; approachLimit?: string;
  circuitBreakPlan?: string; powerRestorePlan?: string;
  ppe?: string; tempOpPlan?: string;
  shiftHandover?: string; accessControl?: string;
  trainingMethod?: string; drawings?: string;
}
function ElectricalSafetyForm() {
  const [d, u] = useSection<ElecSafetyData>("electrical_safety", {});
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: "#fef9c3", color: "#a16207", border: "1px solid #fde047" }}>
        ⚖️ 별표4 — 제318조 전기작업 (50V 초과 또는 250VA 초과) 작업계획서 필수 항목
      </div>
      <div className="grid grid-cols-3 gap-3">
        <TextField label="작업 목적" value={(d.workPurpose as string) ?? ""} onChange={(v) => u("workPurpose", v)} placeholder="작업 목적 요약" />
        <TextField label="근로자 자격" value={(d.workerQual as string) ?? ""} onChange={(v) => u("workerQual", v)} placeholder="전기기사, 산업전기기사 등" />
        <TextField label="적정 인원" value={(d.workerCount as string) ?? ""} onChange={(v) => u("workerCount", v)} placeholder="0명" type="number" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="작업 범위" value={(d.workScope as string) ?? ""} onChange={(v) => u("workScope", v)} placeholder="작업 구역 및 범위" />
        <TextField label="작업책임자" value={(d.supervisor as string) ?? ""} onChange={(v) => u("supervisor", v)} placeholder="성명 / 자격" />
      </div>
      <TextAreaField label="전기 위험요인 (전격·아크 섬광·아크 폭발 등)" value={(d.hazards as string) ?? ""} onChange={(v) => u("hazards", v)} rows={2} placeholder="위험 요인 파악 결과, 접근 한계거리" />
      <div className="grid grid-cols-2 gap-3">
        <TextAreaField label="전로차단 작업계획" value={(d.circuitBreakPlan as string) ?? ""} onChange={(v) => u("circuitBreakPlan", v)} rows={3} placeholder="정전 순서, 잠금 태그아웃(LOTO) 절차" />
        <TextAreaField label="전원 재투입 절차" value={(d.powerRestorePlan as string) ?? ""} onChange={(v) => u("powerRestorePlan", v)} rows={3} placeholder="재통전 전 확인사항, 순서" />
      </div>
      <TextAreaField label="절연보호구·방호구·활선작업용 기구 준비 및 점검" value={(d.ppe as string) ?? ""} onChange={(v) => u("ppe", v)} rows={2} placeholder="보호구 종류, 점검 주기, 착용 방법" />
      <TextAreaField label="점검·시운전·작업 중단 시 조치" value={(d.tempOpPlan as string) ?? ""} onChange={(v) => u("tempOpPlan", v)} rows={2} placeholder="일시 운전 허가 절차, 중단 시 조치" />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="교대근무 인계 사항" value={(d.shiftHandover as string) ?? ""} onChange={(v) => u("shiftHandover", v)} placeholder="인계 방법 및 기록 양식" />
        <TextField label="출입 금지 조치" value={(d.accessControl as string) ?? ""} onChange={(v) => u("accessControl", v)} placeholder="출입통제 방법, 표지판 설치" />
      </div>
      <TextAreaField label="작업자 교육 방법 및 계획서 평가·관리" value={(d.trainingMethod as string) ?? ""} onChange={(v) => u("trainingMethod", v)} rows={2} placeholder="교육 방법, 교육 확인 방식" />
      <TextAreaField label="전기 도면 및 기기 세부사항" value={(d.drawings as string) ?? ""} onChange={(v) => u("drawings", v)} rows={2} placeholder="관련 전기 도면 첨부 여부, 기기 명세" />
    </div>
  );
}

// ─── 중량물 취급 계획 [법정] (제38조 제11호) ──────────────────────
interface HeavyLoadData extends Record<string, unknown> {
  fallPrev?: string; dropPrev?: string; overturnPrev?: string;
  pinchPrev?: string; collapsePrev?: string; method?: string; equipment?: string;
}
function HeavyLoadPlanForm() {
  const [d, u] = useSection<HeavyLoadData>("heavy_load_plan", {});
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: "#fef9c3", color: "#a16207", border: "1px solid #fde047" }}>
        ⚖️ 별표4 — 중량물 취급 작업계획서 5대 위험 예방대책 (추락·낙하·전도·협착·붕괴)
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="취급 방법" value={(d.method as string) ?? ""} onChange={(v) => u("method", v)} placeholder="인력, 장비 등 취급 방법" />
        <TextField label="사용 장비" value={(d.equipment as string) ?? ""} onChange={(v) => u("equipment", v)} placeholder="크레인, 지게차 등" />
      </div>
      {[
        { key: "fallPrev",     label: "① 추락위험 예방대책",  hint: "안전난간, 안전망, 안전대 부착설비 등" },
        { key: "dropPrev",     label: "② 낙하위험 예방대책",  hint: "낙하물 방지망, 출입통제, 낙하 방호선반 등" },
        { key: "overturnPrev", label: "③ 전도위험 예방대책",  hint: "전도 방지 고정, 정격하중 준수 등" },
        { key: "pinchPrev",    label: "④ 협착위험 예방대책",  hint: "신호수 배치, 협착 방지 가이드 등" },
        { key: "collapsePrev", label: "⑤ 붕괴위험 예방대책",  hint: "지반 보강, 적재 한도 준수 등" },
      ].map(({ key, label, hint }) => (
        <TextAreaField
          key={key}
          label={label}
          value={(d[key] as string) ?? ""}
          onChange={(v) => u(key, v)}
          rows={2}
          placeholder={hint}
        />
      ))}
    </div>
  );
}

// ─── 터널굴착 계획 [법정] (제38조 제7호) ─────────────────────────
interface TunnelPlanData extends Record<string, unknown> {
  geoSurvey?: string; excavationMethod?: string;
  supportMethod?: string; liningMethod?: string; drainageMethod?: string;
  ventilationMethod?: string; lightingMethod?: string; emergencyPlan?: string;
}
function TunnelPlanForm() {
  const [d, u] = useSection<TunnelPlanData>("tunnel_plan", {});
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: "#fef9c3", color: "#a16207", border: "1px solid #fde047" }}>
        ⚖️ 별표4 — 터널굴착 작업계획서 (보링 등 사전조사 후 작성)
      </div>
      <TextAreaField label="사전조사 결과 (지형·지질·지층, 낙반·출수·가스폭발 위험)" value={(d.geoSurvey as string) ?? ""} onChange={(v) => u("geoSurvey", v)} rows={3} placeholder="보링 조사 결과, 지층 구성, 용수·가스 위험 여부" />
      <TextAreaField label="굴착 방법" value={(d.excavationMethod as string) ?? ""} onChange={(v) => u("excavationMethod", v)} rows={2} placeholder="NATM, 발파, 기계굴착 등 굴착 방법 및 순서" />
      <div className="grid grid-cols-2 gap-3">
        <TextAreaField label="터널 지보공 시공방법" value={(d.supportMethod as string) ?? ""} onChange={(v) => u("supportMethod", v)} rows={3} placeholder="록볼트, 숏크리트, 강지보 등 지보 방법" />
        <TextAreaField label="복공(覆工) 시공방법" value={(d.liningMethod as string) ?? ""} onChange={(v) => u("liningMethod", v)} rows={3} placeholder="콘크리트 라이닝 방법, 두께, 타설 순서" />
      </div>
      <TextAreaField label="용수(湧水) 처리방법" value={(d.drainageMethod as string) ?? ""} onChange={(v) => u("drainageMethod", v)} rows={2} placeholder="배수 펌프, 그라우팅, 차수공법 등" />
      <div className="grid grid-cols-2 gap-3">
        <TextAreaField label="환기시설 설치방법" value={(d.ventilationMethod as string) ?? ""} onChange={(v) => u("ventilationMethod", v)} rows={2} placeholder="송기식, 배기식 등 환기 방식 및 용량" />
        <TextAreaField label="조명시설 설치방법" value={(d.lightingMethod as string) ?? ""} onChange={(v) => u("lightingMethod", v)} rows={2} placeholder="조명 종류, 조도 기준, 비상조명 설치" />
      </div>
      <TextAreaField label="비상대피 및 응급처치 계획" value={(d.emergencyPlan as string) ?? ""} onChange={(v) => u("emergencyPlan", v)} rows={2} placeholder="대피 경로, 구난 장비, 비상연락망" />
    </div>
  );
}

// ─── 화학설비 운전계획 [법정] (제38조 제4호) ─────────────────────
interface ChemOpsData extends Record<string, unknown> {
  valveOps?: string; heatCoolOps?: string; instrControl?: string;
  safetyValveAdj?: string; leakInspection?: string; samplingMethod?: string;
  shutdownPlan?: string; restartPlan?: string; emergencyOps?: string;
  leakResponse?: string; fireExplosionPrev?: string;
}
function ChemicalOpsForm() {
  const [d, u] = useSection<ChemOpsData>("chemical_ops", {});
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: "#fef9c3", color: "#a16207", border: "1px solid #fde047" }}>
        ⚖️ 별표4 — 화학설비 및 부속설비 사용 작업계획서 10개 필수 항목
      </div>
      <TextAreaField label="① 밸브·콕 등의 조작 계획" value={(d.valveOps as string) ?? ""} onChange={(v) => u("valveOps", v)} rows={2} placeholder="원재료 공급·제품 추출 시 밸브·콕 조작 방법 및 순서" />
      <TextAreaField label="② 냉각·가열·교반·압축 장치 조작" value={(d.heatCoolOps as string) ?? ""} onChange={(v) => u("heatCoolOps", v)} rows={2} placeholder="각 장치별 조작 절차, 설정값, 이상 시 대응" />
      <TextAreaField label="③ 계측·제어 장치 감시 및 조정" value={(d.instrControl as string) ?? ""} onChange={(v) => u("instrControl", v)} rows={2} placeholder="온도·압력·유량 계측기 감시 기준, 경보 설정값" />
      <TextAreaField label="④ 안전밸브·긴급차단장치·방호장치·자동경보장치 조정" value={(d.safetyValveAdj as string) ?? ""} onChange={(v) => u("safetyValveAdj", v)} rows={2} placeholder="안전밸브 설정압력, 긴급차단장치 작동 조건" />
      <TextAreaField label="⑤ 접합부(플랜지·밸브·콕) 위험물 누출 점검" value={(d.leakInspection as string) ?? ""} onChange={(v) => u("leakInspection", v)} rows={2} placeholder="점검 주기, 점검 방법, 누출 기준" />
      <TextAreaField label="⑥ 시료 채취 방법" value={(d.samplingMethod as string) ?? ""} onChange={(v) => u("samplingMethod", v)} rows={2} placeholder="채취 위치, 방법, 보호구 착용 기준" />
      <div className="grid grid-cols-2 gap-3">
        <TextAreaField label="⑦ 운전 중단 시 작업방법" value={(d.shutdownPlan as string) ?? ""} onChange={(v) => u("shutdownPlan", v)} rows={3} placeholder="정상·비상 정지 절차, 잔류물 처리" />
        <TextAreaField label="운전 재개 시 작업방법" value={(d.restartPlan as string) ?? ""} onChange={(v) => u("restartPlan", v)} rows={3} placeholder="재가동 전 점검사항, 시운전 절차" />
      </div>
      <TextAreaField label="⑧ 이상 상태 발생 시 응급조치" value={(d.emergencyOps as string) ?? ""} onChange={(v) => u("emergencyOps", v)} rows={2} placeholder="이상징후 판단 기준, 비상정지 절차, 대피 방법" />
      <TextAreaField label="⑨ 위험물 누출 시 조치" value={(d.leakResponse as string) ?? ""} onChange={(v) => u("leakResponse", v)} rows={2} placeholder="누출 감지 기준, 차단 절차, 인원 대피, 제독 방법" />
      <TextAreaField label="⑩ 폭발·화재 방지 조치" value={(d.fireExplosionPrev as string) ?? ""} onChange={(v) => u("fireExplosionPrev", v)} rows={2} placeholder="점화원 제거, 불활성화, 방폭 장비 적용 등" />
    </div>
  );
}

// ─── 해체 계획 [법정] (제38조 제10호) ───────────────────────────
interface DemolitionPlanData extends Record<string, unknown> {
  method?: string; sequenceDiagram?: string;
  tempFacilities?: string; protectiveFacilities?: string;
  ventilationPlan?: string; waterFirePlan?: string;
  communication?: string; wasteDisposal?: string;
  explosivesPlan?: string; machineList?: string; note?: string;
}
function DemolitionPlanForm() {
  const [d, u] = useSection<DemolitionPlanData>("demolition_plan", {});
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: "#fef9c3", color: "#a16207", border: "1px solid #fde047" }}>
        ⚖️ 별표4 — 해체작업 계획서 필수 항목 (사전조사: 건물 구조·주변상황 별도 기록)
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextAreaField label="① 해체 방법" value={(d.method as string) ?? ""} onChange={(v) => u("method", v)} rows={3} placeholder="기계해체, 발파해체, 압쇄 등 방법" />
        <TextAreaField label="해체 순서 도면 (개요)" value={(d.sequenceDiagram as string) ?? ""} onChange={(v) => u("sequenceDiagram", v)} rows={3} placeholder="층별·구역별 해체 순서, 도면 첨부 여부" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextAreaField label="② 가설설비 설치계획" value={(d.tempFacilities as string) ?? ""} onChange={(v) => u("tempFacilities", v)} rows={2} placeholder="가설 비계, 낙하물 방지망 등" />
        <TextAreaField label="방호설비 설치계획" value={(d.protectiveFacilities as string) ?? ""} onChange={(v) => u("protectiveFacilities", v)} rows={2} placeholder="방호울, 낙하물 방지 선반 등" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextAreaField label="환기설비" value={(d.ventilationPlan as string) ?? ""} onChange={(v) => u("ventilationPlan", v)} rows={2} placeholder="분진·소음 환기 계획" />
        <TextAreaField label="살수·방화설비" value={(d.waterFirePlan as string) ?? ""} onChange={(v) => u("waterFirePlan", v)} rows={2} placeholder="분진 억제 살수, 소화기 배치" />
      </div>
      <TextField label="③ 사업장 내 연락방법" value={(d.communication as string) ?? ""} onChange={(v) => u("communication", v)} placeholder="무전기 채널, 비상연락망" />
      <TextAreaField label="④ 해체물 처분 계획" value={(d.wasteDisposal as string) ?? ""} onChange={(v) => u("wasteDisposal", v)} rows={2} placeholder="폐기물 분류, 수거 방법, 처리 업체" />
      <TextAreaField label="⑤ 해체작업용 기계·기구 목록" value={(d.machineList as string) ?? ""} onChange={(v) => u("machineList", v)} rows={2} placeholder="굴착기, 압쇄기, 크레인 등 기종명·수량" />
      <TextAreaField label="⑥ 화약류 사용 계획 (해당 시)" value={(d.explosivesPlan as string) ?? ""} onChange={(v) => u("explosivesPlan", v)} rows={2} placeholder="화약류 종류, 사용량, 보관·취급 방법 (발파 해체 시)" />
      <TextAreaField label="기타 안전·보건 사항" value={(d.note as string) ?? ""} onChange={(v) => u("note", v)} rows={2} placeholder="주변 주민 보호, 교통통제, 특이사항" />
    </div>
  );
}

// ─── 신규 장비별 점검표 / 작업계획 폼 ───────────────────────────

// 트럭 사전 점검표
function TruckChecklistForm() {
  const [d, u] = useSection<Record<string, boolean | string>>("truck_checklist", {});
  const checks = [
    "브레이크 / 클러치 / 유압장치 이상 없음",
    "적재함 고정철물 / 로프 / 사다리 이상 없음",
    "좌석 안전띠 착용 가능 상태",
    "후사경 / 후방영상표시장치 정상",
    "전조등 / 후미등 / 후진경보기 정상",
    "안전블록 / 지주 / 쐐기 비치 확인",
    "급강하 방지장치(유압밸브) 이상 없음",
  ];
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "2rem" }} />
          <col style={{ width: "44%" }} />
          <col />
        </colgroup>
        <thead>
          <tr style={{ background: PRIMARY_LIGHT }}>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs"></th>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">점검 항목</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">확인 내용 및 조치</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((c) => (
            <tr key={c} className="border-t border-slate-100">
              <td className="px-3 py-2 text-center">
                <div className="w-4 h-4 rounded border-2 flex items-center justify-center text-white text-xs cursor-pointer mx-auto"
                  style={{ background: (d[c] as boolean) ? PRIMARY : "white", borderColor: (d[c] as boolean) ? PRIMARY : "#cbd5e1" }}
                  onClick={() => u(c, !(d[c] as boolean))}
                >{(d[c] as boolean) && "✓"}</div>
              </td>
              <td className="px-3 py-2 text-xs font-medium whitespace-nowrap" style={{ color: (d[c] as boolean) ? PRIMARY : "#64748b" }}>{c}</td>
              <td className="px-2 py-1.5">
                <input type="text" value={(d[`${c}_note`] as string) ?? ""}
                  onChange={(e) => u(`${c}_note`, e.target.value)}
                  disabled={!(d[c] as boolean)}
                  className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-300"
                  placeholder={!(d[c] as boolean) ? "—" : "확인 내용 및 조치 입력"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 굴착기 사전 점검표
function ExcavatorChecklistForm() {
  const [d, u] = useSection<Record<string, boolean | string>>("excavator_checklist", {});
  const checks = [
    "브레이크 / 클러치 / 선회장치 이상 없음",
    "붐·암 작동 이상 없음",
    "훅 해지장치 이상 없음",
    "작업장치 이탈방지 안전핀 체결",
    "후사경 / 후미등 / 후진경보기 정상",
    "후방영상장치 정상",
    "좌석 안전띠 착용 가능 상태",
  ];
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "2rem" }} />
            <col style={{ width: "44%" }} />
            <col />
          </colgroup>
          <thead>
            <tr style={{ background: PRIMARY_LIGHT }}>
              <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs"></th>
              <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">점검 항목</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">확인 내용 및 조치</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((c) => (
              <tr key={c} className="border-t border-slate-100">
                <td className="px-3 py-2 text-center">
                  <div className="w-4 h-4 rounded border-2 flex items-center justify-center text-white text-xs cursor-pointer mx-auto"
                    style={{ background: (d[c] as boolean) ? PRIMARY : "white", borderColor: (d[c] as boolean) ? PRIMARY : "#cbd5e1" }}
                    onClick={() => u(c, !(d[c] as boolean))}
                  >{(d[c] as boolean) && "✓"}</div>
                </td>
                <td className="px-3 py-2 text-xs font-medium" style={{ color: (d[c] as boolean) ? PRIMARY : "#64748b" }}>{c}</td>
                <td className="px-2 py-1.5">
                  <input type="text" value={(d[`${c}_note`] as string) ?? ""}
                    onChange={(e) => u(`${c}_note`, e.target.value)}
                    disabled={!(d[c] as boolean)}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-300"
                    placeholder={!(d[c] as boolean) ? "—" : "확인 내용 및 조치 입력"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 고소작업대 작업 계획
function AerialLiftWorkPlanForm() {
  const [d, u] = useSection<Record<string, string>>("aerial_lift_work_plan", {});
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <TextField label="최대 작업높이 (m)" value={d.maxHeight ?? ""} onChange={(v) => u("maxHeight", v)} placeholder="예: 12.0" type="number" />
        <TextField label="최대 작업반경 (m)" value={d.maxRadius ?? ""} onChange={(v) => u("maxRadius", v)} placeholder="예: 8.0" type="number" />
        <TextField label="정격하중 (kg)" value={d.ratedLoad ?? ""} onChange={(v) => u("ratedLoad", v)} placeholder="예: 230" type="number" />
        <TextField label="최대허용풍속 (m/s)" value={d.maxWindSpeed ?? ""} onChange={(v) => u("maxWindSpeed", v)} placeholder="예: 10" type="number" />
      </div>
      <div className="grid grid-cols-4 gap-3 items-end">
        <TextField label="아웃트리거 최대폭 앞 (m)" value={d.outriggerFront ?? ""} onChange={(v) => u("outriggerFront", v)} placeholder="예: 3.5" />
        <TextField label="아웃트리거 최대폭 뒤 (m)" value={d.outriggerRear ?? ""} onChange={(v) => u("outriggerRear", v)} placeholder="예: 3.5" />
        <div className="col-span-2">
          <TextField label="작업 구역 및 특이사항" value={d.note ?? ""} onChange={(v) => u("note", v)} placeholder="작업 위치, 경사면 여부, 인접 구조물 등" />
        </div>
      </div>
    </div>
  );
}

// 고소작업대 사전 점검표
function AerialLiftChecklistForm() {
  const [d, u] = useSection<Record<string, boolean | string>>("aerial_lift_checklist", {});
  const checks = [
    "붐(와이어로프·체인 구동부) 이상 없음",
    "선회부 이상 없음",
    "붐 인출길이 표시장치 정상",
    "모멘트 감지장치(위치제어) 정상",
    "아웃트리거 전도방지 기능 정상",
    "과부하 방지장치 정상",
    "낙하방지 밸브 / 유압 이상 없음",
    "탑승함 고정 및 안전대 부착 고리 이상 없음",
  ];
  const YesNo = ({ field }: { field: string }) => (
    <div className="flex gap-1.5 flex-shrink-0">
      {(["유", "무"] as const).map((opt) => (
        <button key={opt} type="button"
          onClick={() => u(field, d[field] === opt ? "" : opt)}
          className="text-xs px-2.5 py-1 rounded-full border transition-all"
          style={{ background: d[field] === opt ? PRIMARY : "white", borderColor: d[field] === opt ? PRIMARY : "#e2e8f0", color: d[field] === opt ? "white" : "#64748b" }}>
          {opt}
        </button>
      ))}
    </div>
  );
  return (
    <div className="space-y-3">
      {/* 작업대 유/무 */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-slate-200">
        <span className="text-xs font-medium text-slate-600 w-24 flex-shrink-0">작업대</span>
        <YesNo field="workPlatform" />
        {d.workPlatform === "유" && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
            ⚠️ 고소작업대를 중량물 인양용으로 사용하지 말 것
          </div>
        )}
      </div>
      {/* 사용설명서 유/무 */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200">
        <span className="text-xs font-medium text-slate-600 w-24 flex-shrink-0">사용설명서</span>
        <YesNo field="manual" />
        <input type="text" value={(d.manualNote as string) ?? ""} onChange={(e) => u("manualNote", e.target.value)}
          placeholder="특이사항"
          className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
      </div>
      {/* 체크리스트 */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "2rem" }} />
            <col style={{ width: "44%" }} />
            <col />
          </colgroup>
          <thead>
            <tr style={{ background: PRIMARY_LIGHT }}>
              <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs"></th>
              <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">점검 항목</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">확인 내용 및 조치</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((c) => (
              <tr key={c} className="border-t border-slate-100">
                <td className="px-3 py-2 text-center">
                  <div className="w-4 h-4 rounded border-2 flex items-center justify-center text-white text-xs cursor-pointer mx-auto"
                    style={{ background: (d[c] as boolean) ? PRIMARY : "white", borderColor: (d[c] as boolean) ? PRIMARY : "#cbd5e1" }}
                    onClick={() => u(c, !(d[c] as boolean))}
                  >{(d[c] as boolean) && "✓"}</div>
                </td>
                <td className="px-3 py-2 text-xs font-medium" style={{ color: (d[c] as boolean) ? PRIMARY : "#64748b" }}>{c}</td>
                <td className="px-2 py-1.5">
                  <input type="text" value={(d[`${c}_note`] as string) ?? ""}
                    onChange={(e) => u(`${c}_note`, e.target.value)}
                    disabled={!(d[c] as boolean)}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-300"
                    placeholder={!(d[c] as boolean) ? "—" : "확인 내용 및 조치 입력"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 크레인 사전 점검표
function CraneChecklistForm() {
  const [d, u] = useSection<Record<string, boolean | string>>("crane_checklist", {});
  const checks = [
    "권과방지장치 정상",
    "과부하방지장치 정상",
    "훅 해지장치 정상",
    "아웃트리거 / 하부 철판 설치 확인",
    "브레이크 / 클러치 이상 없음",
    "붐 / 선회 작동 이상 없음",
    "달기기구(슬링·샤클) 점검 확인",
    "신호수 배치 및 신호 방법 확인",
  ];
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "2rem" }} />
          <col style={{ width: "44%" }} />
          <col />
        </colgroup>
        <thead>
          <tr style={{ background: PRIMARY_LIGHT }}>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs"></th>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">점검 항목</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">확인 내용 및 조치</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((c) => (
            <tr key={c} className="border-t border-slate-100">
              <td className="px-3 py-2 text-center">
                <div className="w-4 h-4 rounded border-2 flex items-center justify-center text-white text-xs cursor-pointer mx-auto"
                  style={{ background: (d[c] as boolean) ? PRIMARY : "white", borderColor: (d[c] as boolean) ? PRIMARY : "#cbd5e1" }}
                  onClick={() => u(c, !(d[c] as boolean))}
                >{(d[c] as boolean) && "✓"}</div>
              </td>
              <td className="px-3 py-2 text-xs font-medium whitespace-nowrap" style={{ color: (d[c] as boolean) ? PRIMARY : "#64748b" }}>{c}</td>
              <td className="px-2 py-1.5">
                <input type="text" value={(d[`${c}_note`] as string) ?? ""}
                  onChange={(e) => u(`${c}_note`, e.target.value)}
                  disabled={!(d[c] as boolean)}
                  className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-300"
                  placeholder={!(d[c] as boolean) ? "—" : "확인 내용 및 조치 입력"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 콘크리트펌프카 작업 계획
function ConcretePumpWorkPlanForm() {
  const [d, u] = useSection<Record<string, string>>("concrete_pump_work_plan", {});
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <TextField label="최대수송거리 수평 (m)" value={d.maxHorizontal ?? ""} onChange={(v) => u("maxHorizontal", v)} placeholder="예: 500" type="number" />
        <TextField label="최대수송거리 수직 (m)" value={d.maxVertical ?? ""} onChange={(v) => u("maxVertical", v)} placeholder="예: 100" type="number" />
        <TextField label="토출량 (㎥/hr)" value={d.outputRate ?? ""} onChange={(v) => u("outputRate", v)} placeholder="예: 90" type="number" />
        <TextField label="붐 수송관 지름 (mm)" value={d.pipeDiameter ?? ""} onChange={(v) => u("pipeDiameter", v)} placeholder="예: 125" type="number" />
      </div>
      <div className="grid grid-cols-4 gap-3 items-end">
        <TextField label="아웃트리거 최대폭 앞 (m)" value={d.outriggerFront ?? ""} onChange={(v) => u("outriggerFront", v)} placeholder="예: 7.9" />
        <TextField label="아웃트리거 최대폭 뒤 (m)" value={d.outriggerRear ?? ""} onChange={(v) => u("outriggerRear", v)} placeholder="예: 7.9" />
        <div className="col-span-2">
          <TextField label="타설 계획 및 특이사항" value={d.note ?? ""} onChange={(v) => u("note", v)} placeholder="타설 위치, 압송 경로, 배관 설치 계획 등" />
        </div>
      </div>
    </div>
  );
}

// 콘크리트펌프카 사전 점검표
function ConcretePumpChecklistForm() {
  const [d, u] = useSection<Record<string, boolean | string>>("concrete_pump_checklist", {});
  const checks = [
    "붐 / 배관 / 호스 가이드 이상 없음",
    "호퍼 / 펌프 이상 없음",
    "아웃트리거 전도방지 기능 정상",
    "비상정지 장치 정상",
    "브레이크 / 클러치 이상 없음",
    "붐 / 선회부 이상 없음",
    "좌석 안전띠 착용 가능 상태",
    "후사경 / 후미등 / 후진경보기 정상",
  ];
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "2rem" }} />
          <col style={{ width: "44%" }} />
          <col />
        </colgroup>
        <thead>
          <tr style={{ background: PRIMARY_LIGHT }}>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs"></th>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">점검 항목</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">확인 내용 및 조치</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((c) => (
            <tr key={c} className="border-t border-slate-100">
              <td className="px-3 py-2 text-center">
                <div className="w-4 h-4 rounded border-2 flex items-center justify-center text-white text-xs cursor-pointer mx-auto"
                  style={{ background: (d[c] as boolean) ? PRIMARY : "white", borderColor: (d[c] as boolean) ? PRIMARY : "#cbd5e1" }}
                  onClick={() => u(c, !(d[c] as boolean))}
                >{(d[c] as boolean) && "✓"}</div>
              </td>
              <td className="px-3 py-2 text-xs font-medium whitespace-nowrap" style={{ color: (d[c] as boolean) ? PRIMARY : "#64748b" }}>{c}</td>
              <td className="px-2 py-1.5">
                <input type="text" value={(d[`${c}_note`] as string) ?? ""}
                  onChange={(e) => u(`${c}_note`, e.target.value)}
                  disabled={!(d[c] as boolean)}
                  className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-300"
                  placeholder={!(d[c] as boolean) ? "—" : "확인 내용 및 조치 입력"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 항타기 사전 점검표
function PileChecklistForm() {
  const [d, u] = useSection<Record<string, boolean | string>>("pile_checklist", {});
  const checks = [
    "항타기 해머 / 항발기 / 오거 이상 없음",
    "와이어로프 이상 없음",
    "브레이크 / 백스테이 이상 없음",
    "붐 / 윈치 / 리더 이상 없음",
    "리더 경사각도계 정상",
    "역회전 방지 브레이크 정상",
    "쐐기 / 인발하중계 비치 확인",
    "후사경 / 후방영상장치 정상",
  ];
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "2rem" }} />
          <col style={{ width: "44%" }} />
          <col />
        </colgroup>
        <thead>
          <tr style={{ background: PRIMARY_LIGHT }}>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs"></th>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">점검 항목</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">확인 내용 및 조치</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((c) => (
            <tr key={c} className="border-t border-slate-100">
              <td className="px-3 py-2 text-center">
                <div className="w-4 h-4 rounded border-2 flex items-center justify-center text-white text-xs cursor-pointer mx-auto"
                  style={{ background: (d[c] as boolean) ? PRIMARY : "white", borderColor: (d[c] as boolean) ? PRIMARY : "#cbd5e1" }}
                  onClick={() => u(c, !(d[c] as boolean))}
                >{(d[c] as boolean) && "✓"}</div>
              </td>
              <td className="px-3 py-2 text-xs font-medium whitespace-nowrap" style={{ color: (d[c] as boolean) ? PRIMARY : "#64748b" }}>{c}</td>
              <td className="px-2 py-1.5">
                <input type="text" value={(d[`${c}_note`] as string) ?? ""}
                  onChange={(e) => u(`${c}_note`, e.target.value)}
                  disabled={!(d[c] as boolean)}
                  className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-300"
                  placeholder={!(d[c] as boolean) ? "—" : "확인 내용 및 조치 입력"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 지게차 작업 계획
function ForkliftWorkPlanForm() {
  const [d, u] = useSection<Record<string, string>>("forklift_work_plan", {});
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <TextField label="적재능력 규격 (kg)" value={d.capacity ?? ""} onChange={(v) => u("capacity", v)} placeholder="예: 3000" type="number" />
        <TextField label="동력형식" value={d.powerType ?? ""} onChange={(v) => u("powerType", v)} placeholder="디젤 / LPG / 전동" />
        <TextField label="최고속도 (km/h)" value={d.maxSpeed ?? ""} onChange={(v) => u("maxSpeed", v)} placeholder="예: 20" type="number" />
        <TextField label="마스트 최대높이 (m)" value={d.mastMaxHeight ?? ""} onChange={(v) => u("mastMaxHeight", v)} placeholder="예: 3.0" type="number" />
      </div>
      <div className="grid grid-cols-4 gap-3 items-end">
        <TextField label="마스트 경사각 전경 (°)" value={d.tiltFront ?? ""} onChange={(v) => u("tiltFront", v)} placeholder="예: 6" type="number" />
        <TextField label="마스트 경사각 후경 (°)" value={d.tiltRear ?? ""} onChange={(v) => u("tiltRear", v)} placeholder="예: 12" type="number" />
        <div className="col-span-2">
          <TextField label="작업 구역 및 특이사항" value={d.note ?? ""} onChange={(v) => u("note", v)} placeholder="통로 폭, 바닥 상태, 적재물 특성 등" />
        </div>
      </div>
    </div>
  );
}

// 지게차 사전 점검표
function ForkliftChecklistForm() {
  const [d, u] = useSection<Record<string, boolean | string>>("forklift_checklist", {});
  const checks = [
    "포크 / 마스트 / 틸트 실린더 이상 없음",
    "카운터웨이트 이상 없음",
    "조향 / 브레이크 / 전·후륜 이상 없음",
    "전조등 / 후미등 정상",
    "낙하물 보호구조(헤드가드) 이상 없음",
    "백레스트 이상 없음",
    "후방감지기 / 후진경보 / 경광등 정상",
    "후사경 / 후방영상 정상",
    "좌석 안전띠 착용 가능 상태",
  ];
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "2rem" }} />
          <col style={{ width: "44%" }} />
          <col />
        </colgroup>
        <thead>
          <tr style={{ background: PRIMARY_LIGHT }}>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs"></th>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">점검 항목</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">확인 내용 및 조치</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((c) => (
            <tr key={c} className="border-t border-slate-100">
              <td className="px-3 py-2 text-center">
                <div className="w-4 h-4 rounded border-2 flex items-center justify-center text-white text-xs cursor-pointer mx-auto"
                  style={{ background: (d[c] as boolean) ? PRIMARY : "white", borderColor: (d[c] as boolean) ? PRIMARY : "#cbd5e1" }}
                  onClick={() => u(c, !(d[c] as boolean))}
                >{(d[c] as boolean) && "✓"}</div>
              </td>
              <td className="px-3 py-2 text-xs font-medium whitespace-nowrap" style={{ color: (d[c] as boolean) ? PRIMARY : "#64748b" }}>{c}</td>
              <td className="px-2 py-1.5">
                <input type="text" value={(d[`${c}_note`] as string) ?? ""}
                  onChange={(e) => u(`${c}_note`, e.target.value)}
                  disabled={!(d[c] as boolean)}
                  className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-300"
                  placeholder={!(d[c] as boolean) ? "—" : "확인 내용 및 조치 입력"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 로더 사전 점검표
function LoaderChecklistForm() {
  const [d, u] = useSection<Record<string, boolean | string>>("loader_checklist", {});
  const checks = [
    "버킷 / 포크 / 블레이드 / 클램프 이상 없음",
    "브레이크 / 클러치 이상 없음",
    "암(붐) / 조향 / 주행 이상 없음",
    "암(붐) 전도방지 이상 없음",
    "낙하물 보호구조 이상 없음",
    "전조등 / 후미등 정상",
    "후사경 / 후방영상 정상",
    "후진경보 정상",
    "좌석 안전띠 착용 가능 상태",
  ];
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "2rem" }} />
          <col style={{ width: "44%" }} />
          <col />
        </colgroup>
        <thead>
          <tr style={{ background: PRIMARY_LIGHT }}>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs"></th>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">점검 항목</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">확인 내용 및 조치</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((c) => (
            <tr key={c} className="border-t border-slate-100">
              <td className="px-3 py-2 text-center">
                <div className="w-4 h-4 rounded border-2 flex items-center justify-center text-white text-xs cursor-pointer mx-auto"
                  style={{ background: (d[c] as boolean) ? PRIMARY : "white", borderColor: (d[c] as boolean) ? PRIMARY : "#cbd5e1" }}
                  onClick={() => u(c, !(d[c] as boolean))}
                >{(d[c] as boolean) && "✓"}</div>
              </td>
              <td className="px-3 py-2 text-xs font-medium whitespace-nowrap" style={{ color: (d[c] as boolean) ? PRIMARY : "#64748b" }}>{c}</td>
              <td className="px-2 py-1.5">
                <input type="text" value={(d[`${c}_note`] as string) ?? ""}
                  onChange={(e) => u(`${c}_note`, e.target.value)}
                  disabled={!(d[c] as boolean)}
                  className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-300"
                  placeholder={!(d[c] as boolean) ? "—" : "확인 내용 및 조치 입력"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 롤러 사전 점검표
function RollerChecklistForm() {
  const [d, u] = useSection<Record<string, boolean | string | string>>("roller_checklist", {});
  const checks = [
    "타이어 / 드럼 및 밸러스트 이상 없음",
    "롤 스크레이퍼 / 살수장치 이상 없음",
    "브레이크 / 클러치 / 진동장치 이상 없음",
    "낙하물 보호구조 이상 없음",
    "전조등 / 후미등 정상",
    "후사경 / 후진경보 정상",
    "후방영상 정상",
    "좌석 안전띠 착용 가능 상태",
  ];
  const rollerTypes = ["타이어식", "진동식", "탠덤식", "기타"];
  return (
    <div className="space-y-3">
      <div>
        <label className="ptw-label">롤러 종류</label>
        <div className="flex flex-wrap gap-2">
          {rollerTypes.map((t) => (
            <button key={t} onClick={() => u("rollerType", t)}
              className="text-xs px-3 py-1.5 rounded-full border transition-all"
              style={{ background: d.rollerType === t ? PRIMARY : "white", borderColor: d.rollerType === t ? PRIMARY : "#e2e8f0", color: d.rollerType === t ? "white" : "#64748b" }}
            >{t}</button>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "2rem" }} />
            <col style={{ width: "44%" }} />
            <col />
          </colgroup>
          <thead>
            <tr style={{ background: PRIMARY_LIGHT }}>
              <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs"></th>
              <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">점검 항목</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600 text-xs">확인 내용 및 조치</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((c) => (
              <tr key={c} className="border-t border-slate-100">
                <td className="px-3 py-2 text-center">
                  <div className="w-4 h-4 rounded border-2 flex items-center justify-center text-white text-xs cursor-pointer mx-auto"
                    style={{ background: (d[c] as boolean) ? PRIMARY : "white", borderColor: (d[c] as boolean) ? PRIMARY : "#cbd5e1" }}
                    onClick={() => u(c, !(d[c] as boolean))}
                  >{(d[c] as boolean) && "✓"}</div>
                </td>
                <td className="px-3 py-2 text-xs font-medium" style={{ color: (d[c] as boolean) ? PRIMARY : "#64748b" }}>{c}</td>
                <td className="px-2 py-1.5">
                  <input type="text" value={(d[`${c}_note`] as string) ?? ""}
                    onChange={(e) => u(`${c}_note`, e.target.value)}
                    disabled={!(d[c] as boolean)}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-300"
                    placeholder={!(d[c] as boolean) ? "—" : "확인 내용 및 조치 입력"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 섹션 레지스트리 ─────────────────────────────────────────────
const SECTION_COMPONENTS: Record<string, { title: string; Component: React.FC }> = {
  // 공통 섹션
  overview: { title: "작업 개요", Component: OverviewForm },
  equipment_info: { title: "사용 장비 정보", Component: EquipmentInfoForm },
  heavy_goods: { title: "중량물 취급", Component: HeavyGoodsForm },
  work_personnel: { title: "작업 인원 배치", Component: WorkPersonnelForm },
  schedule: { title: "추진 일정", Component: ScheduleForm },
  scope: { title: "업무 범위 및 산출물", Component: ScopeForm },
  personnel: { title: "투입 인력 및 역할", Component: WorkPersonnelForm },
  budget: { title: "예산 계획", Component: BudgetForm },
  risk: { title: "위험성평가", Component: RiskForm },
  safety_checklist: { title: "안전점검", Component: SafetyChecklistForm },
  emergency_contact: { title: "비상연락망", Component: EmergencyContactForm },
  work_description: { title: "작업 설명", Component: WorkDescriptionForm },
  work_environment: { title: "작업환경", Component: WorkEnvironmentForm },
  training: { title: "안전교육", Component: TrainingForm },
  disaster_prevention: { title: "재해예방 대책", Component: DisasterPreventionForm },
  legal_inspection: { title: "법정검사 기록", Component: LegalInspectionForm },
  signature: { title: "서명 및 결재", Component: SignatureForm },
  // 법정 의무 섹션 (별표4)
  pre_survey:        { title: "사전조사 기록 [법정]",    Component: PreSurveyForm },
  electrical_safety: { title: "전기안전작업계획 [법정]", Component: ElectricalSafetyForm },
  heavy_load_plan:   { title: "중량물 취급 계획 [법정]", Component: HeavyLoadPlanForm },
  tunnel_plan:       { title: "터널굴착 계획 [법정]",    Component: TunnelPlanForm },
  chemical_ops:      { title: "화학설비 운전계획 [법정]",Component: ChemicalOpsForm },
  demolition_plan:   { title: "해체 계획 [법정]",        Component: DemolitionPlanForm },
  drawing:           { title: "도면",                    Component: DrawingForm },
  other_files:       { title: "기타 첨부파일",           Component: OtherFilesForm },
  // 약식 섹션
  simplified_risk: { title: "주요 위험요인", Component: SimplifiedRiskForm },
  simplified_safety: { title: "안전 조치 사항", Component: SimplifiedSafetyForm },
  // 트럭 (1번)
  truck_spec:                { title: "트럭 전용 제원",      Component: TruckSpecForm },
  truck_route:               { title: "운행 경로",           Component: TruckRouteForm },
  truck_load:                { title: "최대 적재량 및 하중", Component: TruckLoadForm },
  truck_road_condition:      { title: "도로 상태 및 구배",   Component: TruckRoadForm },
  truck_overturn_prevention: { title: "전복·낙하 방지 조치", Component: TruckOverturnForm },
  truck_checklist:           { title: "사전 점검표",         Component: TruckChecklistForm },
  // 굴착기 (2번)
  excavator_depth:     { title: "굴착 깊이 및 기울기",           Component: ExcavatorDepthForm },
  excavator_ground:    { title: "지반 상태 (토질조사 결과)",     Component: ExcavatorGroundForm },
  excavator_utility:   { title: "매설물 확인 (가스/전기/통신)", Component: ExcavatorUtilityForm },
  excavator_retaining: { title: "흙막이 공법",                   Component: ExcavatorRetainingForm },
  excavator_checklist: { title: "작동상태 사전 점검표",           Component: ExcavatorChecklistForm },
  // 고소작업대 (3번)
  aerial_lift_work_plan:  { title: "작업 계획",   Component: AerialLiftWorkPlanForm },
  aerial_lift_checklist:  { title: "사전 점검표", Component: AerialLiftChecklistForm },
  // 크레인 (4번)
  crane_capacity: { title: "최대 인양하중 및 반경",    Component: CraneCapacityForm },
  crane_rigging:  { title: "달기기구 종류 및 수량",    Component: CraneRiggingForm },
  crane_swing:    { title: "선회 반경 내 장애물",      Component: CraneSwingForm },
  crane_signal:   { title: "신호 방법 및 신호수 배치", Component: CraneSignalForm },
  crane_ground:   { title: "하부지반 지지력 확인",     Component: CraneGroundForm },
  crane_checklist:{ title: "사전 점검표",              Component: CraneChecklistForm },
  // 콘크리트펌프카 (5번)
  concrete_pump_work_plan:  { title: "작업 계획",   Component: ConcretePumpWorkPlanForm },
  concrete_pump_checklist:  { title: "사전 점검표", Component: ConcretePumpChecklistForm },
  // 항타기 (6번)
  pile_method:    { title: "항타 공법",       Component: PileMethodForm },
  pile_type:      { title: "파일 종류",       Component: PileTypeForm },
  pile_noise:     { title: "소음·진동 관리", Component: PileNoiseForm },
  pile_checklist: { title: "사전 점검표",     Component: PileChecklistForm },
  // 지게차 (7번)
  forklift_work_plan:  { title: "작업 계획",   Component: ForkliftWorkPlanForm },
  forklift_checklist:  { title: "사전 점검표", Component: ForkliftChecklistForm },
  // 로더 (8번)
  loader_bucket:    { title: "작업계획",    Component: LoaderBucketForm },
  loader_checklist: { title: "사전 점검표", Component: LoaderChecklistForm },
  // 롤러 (9번)
  roller_section:    { title: "다짐 구간 및 면적", Component: RollerSectionForm },
  roller_count:      { title: "다짐 횟수 및 방법", Component: RollerCountForm },
  roller_compaction: { title: "다짐도 관리",       Component: RollerCompactionForm },
  roller_checklist:  { title: "사전 점검표",       Component: RollerChecklistForm },
  // 기계 제원 (장비별)
  truck_machine_spec:         { title: "기계 제원", Component: makeMachineSpecForm("truck_machine_spec") },
  excavator_machine_spec:     { title: "기계 제원", Component: makeMachineSpecForm("excavator_machine_spec") },
  aerial_lift_machine_spec:   { title: "기계 제원", Component: makeMachineSpecForm("aerial_lift_machine_spec") },
  crane_machine_spec:         { title: "기계 제원", Component: makeMachineSpecForm("crane_machine_spec") },
  concrete_pump_machine_spec: { title: "기계 제원", Component: makeMachineSpecForm("concrete_pump_machine_spec") },
  pile_driver_machine_spec:   { title: "기계 제원", Component: makeMachineSpecForm("pile_driver_machine_spec") },
  forklift_machine_spec:      { title: "기계 제원", Component: makeMachineSpecForm("forklift_machine_spec") },
  loader_machine_spec:        { title: "기계 제원", Component: makeMachineSpecForm("loader_machine_spec") },
  roller_machine_spec:        { title: "기계 제원", Component: makeMachineSpecForm("roller_machine_spec") },
};

// ─── 약식 개요 오버라이드 ─────────────────────────────────────────
// When simplified mode, overview uses the simplified form

const SECTION_HEADER_ACTIONS: Partial<Record<string, React.ReactNode>> = {
  risk: <SafeCardButton context="위험성평가" />,
  safety_checklist: <SafeCardButton context="안전점검" />,
  training: <SafeCardButton context="안전교육" />,
  emergency_contact: (
    <button
      onClick={() => alert("[SafeBuddy 연동 준비 중]\n주소 기반의 인근 응급의료기관·소방서·경찰서 연락처를 SafeBuddy에서 불러옵니다.")}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all hover:opacity-80"
      style={{ borderColor: `${PRIMARY}66`, color: PRIMARY, background: PRIMARY_LIGHT }}
    >
      📍 SafeBuddy에서 불러오기
    </button>
  ),
};

function SectionFormEntry({ sectionId, label, animDelay }: { sectionId: string; label: string; animDelay?: number }) {
  const { documentProfile } = useWorkPlanStore();
  const headerAction = SECTION_HEADER_ACTIONS[sectionId];

  // 장비 전용 섹션은 EquipmentInfoForm 내부에서 인라인 렌더링 — 별도 카드 생략
  if (SECTION_TO_EQUIPMENT[sectionId]) return null;

  // Lite (약식) mode uses simplified overview
  if (sectionId === "overview" && documentProfile === "lite") {
    return (
      <SectionBlock id={sectionId} title={label} animDelay={animDelay} headerAction={headerAction}>
        <SimplifiedOverviewForm />
      </SectionBlock>
    );
  }

  const entry = SECTION_COMPONENTS[sectionId];
  if (!entry) {
    return (
      <SectionBlock id={sectionId} title={label} animDelay={animDelay} headerAction={headerAction}>
        <CustomSectionForm sectionId={sectionId} />
      </SectionBlock>
    );
  }

  const { title, Component } = entry;
  return (
    <SectionBlock id={sectionId} title={title} animDelay={animDelay} headerAction={headerAction}>
      <Component />
    </SectionBlock>
  );
}

// ─── 작업 분류 프로필 배너 ────────────────────────────────────────
function ClassificationBanner() {
  const { classification } = useWorkPlanStore();
  const cat = getCategoryById(classification.categoryId);
  const sub = getSubcategoryById(classification.subcategoryId);
  if (!sub) return null;
  const subLabel = sub.isCustom ? (classification.customSubLabel || sub.label) : sub.label;
  const waList = classification.workAttributeIds.map((id) => WORK_ATTRIBUTES.find((a) => a.id === id)).filter(Boolean);
  const raList = classification.riskAttributeIds.map((id) => RISK_ATTRIBUTES.find((a) => a.id === id)).filter(Boolean);

  const handleReclassify = () => {
    window.dispatchEvent(new CustomEvent("ptw:openClassificationSelector"));
  };

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: `${PRIMARY}25` }}>
      <div className="flex items-center gap-2 px-4 py-2.5 flex-wrap" style={{ background: `${PRIMARY}08` }}>
        {cat && <span className="text-xs text-slate-500 flex-shrink-0">{cat.icon} {cat.label}</span>}
        <span className="text-xs font-semibold flex-shrink-0" style={{ color: PRIMARY }}>▶ {sub.num} {subLabel}</span>
        {sub.articleRef && (
          <span className="text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0" style={{ background: "#fef9c3", color: "#a16207" }}>⚖️ {sub.articleRef}</span>
        )}
        {(waList.length > 0 || raList.length > 0) && (
          <>
            <span className="text-xs text-slate-300 flex-shrink-0">|</span>
            <span className="text-xs text-slate-400 flex-shrink-0">작업 속성</span>
            {waList.map((wa) => wa && (
              <span key={wa.id} className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">{wa.label}</span>
            ))}
            {raList.length > 0 && <span className="text-xs text-slate-300 flex-shrink-0">·</span>}
            {raList.map((ra) => ra && (
              <span key={ra.id} className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: ra.color ?? "#dc2626" }}>⚠ {ra.label}</span>
            ))}
          </>
        )}
        <div className="flex-1" />
        <button
          onClick={handleReclassify}
          className="flex-shrink-0 text-xs px-2.5 py-1 rounded-lg border font-medium transition-all hover:bg-teal-50"
          style={{ borderColor: `${PRIMARY}55`, color: PRIMARY }}
        >
          ✏️ 작업분류 변경
        </button>
      </div>
    </div>
  );
}

// ─── Main SectionForm ────────────────────────────────────────────
export default function SectionForm() {
  const { sections } = useWorkPlanStore();
  const activeSections = sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-5 px-5 py-5">
      <ClassificationBanner />
      {activeSections.map((section, idx) => (
        <SectionFormEntry
          key={section.id}
          sectionId={section.id}
          label={section.label}
          animDelay={Math.min(idx * 40, 240)}
        />
      ))}
    </div>
  );
}

function SectionBlock({
  id,
  title,
  children,
  equipmentBadge,
  animDelay,
  headerAction,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
  equipmentBadge?: { icon: string; num: number; label: string };
  animDelay?: number;
  headerAction?: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className="bg-white rounded-xl border overflow-hidden anim-fade-in-up"
      style={{
        borderColor: "#e2e8f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        animationDelay: `${animDelay ?? 0}ms`,
      }}
    >
      {/* Section header */}
      <div
        className="flex items-center gap-3 px-5 py-3.5 border-b"
        style={{ borderColor: "#e8edf2", background: "#f8fafc" }}
      >
        <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: PRIMARY }} />
        <h3 className="text-sm font-bold text-slate-700 tracking-tight">{title}</h3>
        {equipmentBadge && (
          <span
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
            style={{ background: PRIMARY_LIGHT, color: PRIMARY }}
            title={`${equipmentBadge.label} 전용 섹션`}
          >
            <span>{equipmentBadge.icon}</span>
            <span>{equipmentBadge.num}번 · {equipmentBadge.label.split(" ")[0]}</span>
          </span>
        )}
        {headerAction && <div className="ml-auto">{headerAction}</div>}
      </div>
      {/* Section content */}
      <div className="px-5 py-5">
        {children}
      </div>
    </div>
  );
}

function CustomSectionForm({ sectionId }: { sectionId: string }) {
  const { formData, updateFormData } = useWorkPlanStore();
  const data = (formData[sectionId] as { content?: string }) ?? {};
  return (
    <textarea
      value={data.content ?? ""}
      onChange={(e) => updateFormData(sectionId, { content: e.target.value })}
      rows={5}
      placeholder="내용을 입력하세요"
      className="ptw-input w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
    />
  );
}
