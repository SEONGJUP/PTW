"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LEGAL_CARD_TYPES, type LegalCardTypeDef } from "@/config/safetyCard/legalCardTypeDefs";
import { EQUIP_EXTRA_FORMS, type ExtraData } from "./EquipExtraForms";

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "ptw_legal_cards_v1";

interface CardOverview {
  siteName: string;
  docName: string;
  workName: string;
  createdDate: string;
  companyName: string;
  author: string;
  authorSignature?: string;
  showReviewer?: boolean;
  reviewer?: string;
  reviewerSignature?: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

// ── Personnel types ───────────────────────────────────────────────────────────

const PERSONNEL_ROLES = ["작업자", "운전원", "유도자", "작업지휘자", "신호수", "감시자", "기타"] as const;
type PersonnelRole = typeof PERSONNEL_ROLES[number];

interface PersonnelDetailRow {
  id: string;
  role: PersonnelRole;
  name: string;
  contact: string;
  affiliation: string;
  license: string;
  signalMethod: string;
  position: string;
  extraNote: string;
  trained: boolean;
}

interface PersonnelData {
  counts: Partial<Record<PersonnelRole, number>>;
  details: PersonnelDetailRow[];
}

// ── Equipment types ───────────────────────────────────────────────────────────

const EQUIP_TYPES = {
  truck:         { label: "트럭",           num: 1, icon: "🚛" },
  excavator:     { label: "굴착기",         num: 2, icon: "⛏️" },
  aerial_lift:   { label: "고소작업대",     num: 3, icon: "🪜" },
  crane:         { label: "크레인",         num: 4, icon: "🏗" },
  concrete_pump: { label: "콘크리트펌프카", num: 5, icon: "🪣" },
  pile_driver:   { label: "항타기",         num: 6, icon: "🔨" },
  forklift:      { label: "지게차",         num: 7, icon: "🔩" },
  loader:        { label: "로더",           num: 8, icon: "🏗️" },
  roller:        { label: "롤러",           num: 9, icon: "🛞" },
} as const;
type EquipKey = keyof typeof EQUIP_TYPES;

interface DetailSpecRow { id: string; key: string; value: string }
interface DetailSpec { id: string; title: string; rows: DetailSpecRow[] }
interface MachineRow {
  id: string;
  machineName: string;
  maker: string;
  regNo: string;
  year: string;
  capacity: string;
  dimensions: string;
  workRadius: string;
  note: string;
  inspectionExpiry: string;
  inspectionNA: boolean;
  insuranceNA: boolean;
  insuranceTypeName: string;
  insuranceEnd: string;
  detailSpecs: DetailSpec[];
}
interface EquipRow {
  id: string;
  equipKey?: EquipKey;
  name: string;
  spec: string;
  qty: string;
  ownership: string;
  note?: string;
}
interface EquipmentData {
  selectedKeys: string[];
  rows: EquipRow[];
  machineSpecs: Record<string, MachineRow[]>;
  extraData?: Record<string, ExtraData>;
}

// ── Risk / Safety / Training / Emergency / Files types ───────────────────────

interface RiskRow { id: string; process: string; unitTask: string; risk: string; mitigation: string; grade: string; keyManagement: boolean }
interface RiskData { rows: RiskRow[] }

type SafetyResult = "양호" | "불량" | "해당없음";
interface SafetyCheckData { checks: Record<string, SafetyResult>; note: string }

interface TrainingRow { id: string; trainingType: string; subType: string; date: string; duration: string; instructor: string; completedCount: string }
interface TrainingData { rows: TrainingRow[] }

interface EmergencyData { hospital: string; fire: string; police: string; supervisor: string; safetyManager: string; note: string }

interface DrawingFile { id: string; name: string; type: string; dataUrl: string; markup?: string }
interface DrawingsData { files: DrawingFile[] }

interface OtherFile { id: string; name: string; type: string }
interface EquipDocFile { id: string; name: string; mimeType: string; docCategory: string }
interface OtherFilesData { files: OtherFile[]; equipFiles: Record<string, EquipDocFile[]> }

// ── CardDoc ───────────────────────────────────────────────────────────────────

interface CardDoc {
  id: string;
  typeId: string;
  status: "draft" | "completed";
  createdAt: string;
  updatedAt: string;
  overview: CardOverview;
  personnel: PersonnelData;
  equipment: EquipmentData;
  riskAssessment: RiskData;
  safetyChecklist: SafetyCheckData;
  training: TrainingData;
  emergency: EmergencyData;
  drawings: DrawingsData;
  otherFiles: OtherFilesData;
  preSurvey: Record<string, string>;
  plan: Record<string, string>;
  checkboxItems: Record<string, Record<string, boolean>>;
  checkboxNotes: Record<string, Record<string, string>>;
}

function emptyOverview(): CardOverview {
  const today = new Date().toISOString().split("T")[0];
  return { siteName: "", docName: "", workName: "", createdDate: today, companyName: "", author: "", authorSignature: "", showReviewer: false, reviewer: "", reviewerSignature: "", location: "", startDate: today, endDate: today, description: "" };
}

function emptyPersonnel(): PersonnelData { return { counts: {}, details: [] }; }
function emptyEquipment(): EquipmentData { return { selectedKeys: [], rows: [], machineSpecs: {}, extraData: {} }; }
function emptyMachineRow(): MachineRow {
  return { id: `ms${Date.now()}`, machineName: "", maker: "", regNo: "", year: "", capacity: "", dimensions: "", workRadius: "", note: "", inspectionExpiry: "", inspectionNA: false, insuranceNA: false, insuranceTypeName: "", insuranceEnd: "", detailSpecs: [] };
}
function emptyRisk(): RiskData { return { rows: [{ id: "r1", process: "", unitTask: "", risk: "", mitigation: "", grade: "중", keyManagement: false }] }; }
function emptySafetyChecklist(): SafetyCheckData { return { checks: {}, note: "" }; }
function emptyTraining(): TrainingData { return { rows: [] }; }
function emptyEmergency(): EmergencyData { return { hospital: "", fire: "", police: "", supervisor: "", safetyManager: "", note: "" }; }
function emptyDrawings(): DrawingsData { return { files: [] }; }
function emptyOtherFiles(): OtherFilesData { return { files: [], equipFiles: {} }; }

function newDoc(typeId: string): CardDoc {
  const now = new Date().toISOString();
  return {
    id: `card-${Date.now()}`, typeId, status: "draft", createdAt: now, updatedAt: now,
    overview: emptyOverview(), personnel: emptyPersonnel(), equipment: emptyEquipment(),
    riskAssessment: emptyRisk(), safetyChecklist: emptySafetyChecklist(),
    training: emptyTraining(), emergency: emptyEmergency(),
    drawings: emptyDrawings(), otherFiles: emptyOtherFiles(),
    preSurvey: {}, plan: {}, checkboxItems: {}, checkboxNotes: {},
  };
}

function loadAll(): CardDoc[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}

function saveAll(docs: CardDoc[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 bg-white";
const txa = `${inp} resize-none`;

const btn = (v: "primary" | "secondary" | "ghost" | "danger") => {
  const cls: Record<string, string> = {
    primary: "bg-[#00B7AF] hover:bg-teal-600 text-white",
    secondary: "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700",
    ghost: "hover:bg-gray-100 text-gray-600",
    danger: "bg-red-500 hover:bg-red-600 text-white",
  };
  return `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${cls[v]}`;
};

const PRIMARY = "#00B7AF";
const PRIMARY_LIGHT = "#E6FAF9";
const si = "w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 bg-white";

// ── Personnel Section ─────────────────────────────────────────────────────────

const ROLE_EXTRA: Record<PersonnelRole, { label: string; placeholder: string; field: "license" | "signalMethod" | "position" | "extraNote" }> = {
  운전원:     { label: "면허",     placeholder: "건설기계면허 00-000000",           field: "license" },
  유도자:     { label: "신호방법", placeholder: "수신호 / 무전",                    field: "signalMethod" },
  작업지휘자: { label: "직책",     placeholder: "공사팀장",                         field: "position" },
  작업자:     { label: "교육이수", placeholder: "기초안전보건교육 등",              field: "extraNote" },
  신호수:     { label: "교육이수", placeholder: "기초안전보건교육 등",              field: "extraNote" },
  감시자:     { label: "교육이수", placeholder: "기초안전보건교육 등",              field: "extraNote" },
  기타:       { label: "비고",     placeholder: "기타 정보",                        field: "extraNote" },
};

function emptyPersonnelDetailRow(): PersonnelDetailRow {
  return { id: `pd${Date.now()}`, role: "작업자", name: "", contact: "", affiliation: "", license: "", signalMethod: "", position: "", extraNote: "", trained: false };
}

function PersonnelSection({ data, onChange }: { data: PersonnelData; onChange: (d: PersonnelData) => void }) {
  const [showDetail, setShowDetail] = useState(false);
  const counts = data.counts ?? {};
  const details = data.details ?? [];
  const total = PERSONNEL_ROLES.reduce((s, r) => s + (counts[r] ?? 0), 0);

  const setCount = (role: PersonnelRole, val: string) => {
    const n = parseInt(val, 10);
    onChange({ ...data, counts: { ...counts, [role]: isNaN(n) || n < 0 ? 0 : n } });
  };
  const updateDetail = (id: string, key: keyof PersonnelDetailRow, value: string | boolean) =>
    onChange({ ...data, details: details.map((r) => r.id === id ? { ...r, [key]: value } : r) });
  const addDetail = () => onChange({ ...data, details: [...details, emptyPersonnelDetailRow()] });
  const removeDetail = (id: string) => onChange({ ...data, details: details.filter((r) => r.id !== id) });

  return (
    <div className="space-y-3">
      {/* 역할별 인원 수 */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1 pr-2 border-r border-slate-200 mr-1">
          <span className="text-xs text-slate-400">총</span>
          <span className="text-sm font-bold tabular-nums" style={{ color: total > 0 ? PRIMARY : "#94a3b8" }}>{total}명</span>
        </div>
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
      </div>

      {/* 상세 입력 토글 */}
      <div>
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setShowDetail(!showDetail)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-teal-600 transition-colors">
            <span>{showDetail ? "▲" : "▼"}</span>
            <span>인원정보 상세 입력</span>
          </button>
          {showDetail && (
            <button type="button" onClick={addDetail}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
              style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>
              <span>+</span><span>작업자 추가</span>
            </button>
          )}
        </div>
        {showDetail && (
          <div className="mt-2 rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <colgroup>
                  <col style={{ width: "3%" }} /><col style={{ width: "8%" }} /><col style={{ width: "10%" }} />
                  <col style={{ width: "12%" }} /><col style={{ width: "20%" }} /><col style={{ width: "40%" }} />
                  <col style={{ width: "6%" }} /><col style={{ width: "3%" }} />
                </colgroup>
                <thead>
                  <tr style={{ background: PRIMARY_LIGHT }}>
                    {["#", "역할", "성명", "연락처", "소속", "추가정보", "교육이수", ""].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {details.length === 0 && (
                    <tr><td colSpan={8} className="px-3 py-4 text-center text-xs text-slate-400">+ 작업자 추가 버튼을 눌러 추가하세요</td></tr>
                  )}
                  {details.map((r, idx) => {
                    const extra = ROLE_EXTRA[r.role];
                    return (
                      <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-2 py-1.5 text-center text-xs text-slate-400 tabular-nums">{idx + 1}</td>
                        <td className="px-2 py-1.5">
                          <select value={r.role} onChange={(e) => updateDetail(r.id, "role", e.target.value as PersonnelRole)}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg outline-none focus:border-teal-400 bg-white text-xs">
                            {PERSONNEL_ROLES.map((role) => <option key={role}>{role}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1.5"><input type="text" value={r.name} onChange={(e) => updateDetail(r.id, "name", e.target.value)} className={si} placeholder="홍길동" /></td>
                        <td className="px-2 py-1.5"><input type="tel" value={r.contact} onChange={(e) => updateDetail(r.id, "contact", e.target.value)} className={si} placeholder="010-0000-0000" /></td>
                        <td className="px-2 py-1.5"><input type="text" value={r.affiliation} onChange={(e) => updateDetail(r.id, "affiliation", e.target.value)} className={si} placeholder="소속" /></td>
                        <td className="px-2 py-1.5">
                          <input type="text" value={r[extra.field] as string} onChange={(e) => updateDetail(r.id, extra.field, e.target.value)}
                            className={si} placeholder={`${extra.label}: ${extra.placeholder}`} />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <div className="w-5 h-5 rounded border-2 flex items-center justify-center text-white text-xs cursor-pointer mx-auto transition-colors"
                            style={{ background: r.trained ? PRIMARY : "white", borderColor: r.trained ? PRIMARY : "#cbd5e1" }}
                            onClick={() => updateDetail(r.id, "trained", !r.trained)}
                          >{r.trained ? "✓" : ""}</div>
                        </td>
                        <td className="px-2 py-1.5"><button type="button" onClick={() => removeDetail(r.id)} className="text-slate-300 hover:text-red-400 px-1">✕</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-2 border-t border-slate-100">
              <button type="button" onClick={addDetail} className="text-xs text-slate-400 hover:text-teal-500 transition-colors">+ 행 추가</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Equipment Section ─────────────────────────────────────────────────────────

const OWNERSHIP_OPTIONS = ["자사", "임차"];

function MachineSpecCard({ row, onChange, onRemove }: {
  row: MachineRow;
  onChange: (key: keyof MachineRow, value: string | boolean | DetailSpec[]) => void;
  onRemove: () => void;
}) {
  const specs = row.detailSpecs ?? [];
  const newSpecId = () => `sp${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const newRowId = () => `sr${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const addSpec = () =>
    onChange("detailSpecs", [...specs, { id: newSpecId(), title: "", rows: [{ id: newRowId(), key: "", value: "" }] }]);
  const removeSpec = (specId: string) =>
    onChange("detailSpecs", specs.filter((s) => s.id !== specId));
  const updateSpecTitle = (specId: string, title: string) =>
    onChange("detailSpecs", specs.map((s) => s.id === specId ? { ...s, title } : s));
  const addSpecRow = (specId: string) =>
    onChange("detailSpecs", specs.map((s) => s.id === specId ? { ...s, rows: [...s.rows, { id: newRowId(), key: "", value: "" }] } : s));
  const removeSpecRow = (specId: string, rowId: string) =>
    onChange("detailSpecs", specs.map((s) => s.id === specId ? { ...s, rows: s.rows.filter((r) => r.id !== rowId) } : s));
  const updateSpecRow = (specId: string, rowId: string, field: "key" | "value", val: string) =>
    onChange("detailSpecs", specs.map((s) => s.id === specId ? { ...s, rows: s.rows.map((r) => r.id === rowId ? { ...r, [field]: val } : r) } : s));

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      {/* 카드 헤더 */}
      <div className="flex items-center justify-between px-3 py-2" style={{ background: PRIMARY_LIGHT }}>
        <span className="text-xs font-semibold" style={{ color: PRIMARY }}>기계 제원</span>
        <button type="button" onClick={onRemove} className="text-slate-400 hover:text-red-400 text-sm transition-colors">✕</button>
      </div>
      <div className="p-3 space-y-2">
        {/* Row 1: 장비명 · 제조사/모델명 · 등록번호 · 연식 · 정격하중 */}
        <div className="overflow-x-auto">
          <div className="grid gap-2 min-w-[560px]" style={{ gridTemplateColumns: "3fr 2.5fr 1.8fr 0.6fr 1fr" }}>
            <div>
              <label className="ptw-label">장비명/장비종류</label>
              <input type="text" value={row.machineName} onChange={(e) => onChange("machineName", e.target.value)} className={`w-full ${si}`} placeholder="예: 굴삭기 / 차량계건설기계" />
            </div>
            <div>
              <label className="ptw-label">제조사/모델명</label>
              <input type="text" value={row.maker} onChange={(e) => onChange("maker", e.target.value)} className={`w-full ${si}`} placeholder="예: 현대건설기계 HX220L" />
            </div>
            <div>
              <label className="ptw-label">등록번호</label>
              <input type="text" value={row.regNo} onChange={(e) => onChange("regNo", e.target.value)} className={`w-full ${si}`} placeholder="예: 서울02가1234" />
            </div>
            <div>
              <label className="ptw-label">연식</label>
              <input type="text" value={row.year} onChange={(e) => onChange("year", e.target.value)} className={`w-full ${si}`} placeholder="2021" />
            </div>
            <div>
              <label className="ptw-label">정격하중/용량</label>
              <input type="text" value={row.capacity} onChange={(e) => onChange("capacity", e.target.value)} className={`w-full ${si}`} placeholder="예: 22t" />
            </div>
          </div>
        </div>
        {/* Row 2: 제원 · 작업반경 · 특이사항 · 점검 · 보험 */}
        <div className="overflow-x-auto">
          <div className="grid gap-2 min-w-[560px]" style={{ gridTemplateColumns: "1.8fr 0.7fr 1.5fr 1.5fr 2.5fr" }}>
            <div>
              <label className="ptw-label">제원 (L×W×H)</label>
              <input type="text" value={row.dimensions} onChange={(e) => onChange("dimensions", e.target.value)} className={`w-full ${si}`} placeholder="예: 9.7×2.8×3.0m" />
            </div>
            <div>
              <label className="ptw-label">작업반경</label>
              <input type="text" value={row.workRadius} onChange={(e) => onChange("workRadius", e.target.value)} className={`w-full ${si}`} placeholder="예: 5m" />
            </div>
            <div>
              <label className="ptw-label">특이사항</label>
              <input type="text" value={row.note} onChange={(e) => onChange("note", e.target.value)} className={`w-full ${si}`} placeholder="특이사항" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1 gap-1">
                <label className="ptw-label mb-0">점검/검사 유효기간</label>
                <div className="flex items-center gap-1 cursor-pointer shrink-0" onClick={() => onChange("inspectionNA", !row.inspectionNA)}>
                  <div className="w-3.5 h-3.5 rounded border-2 flex items-center justify-center"
                    style={{ background: row.inspectionNA ? PRIMARY : "white", borderColor: row.inspectionNA ? PRIMARY : "#cbd5e1", fontSize: "0.55rem", color: "white" }}>
                    {row.inspectionNA ? "✓" : ""}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">해당없음</span>
                </div>
              </div>
              <input type="date" value={row.inspectionNA ? "" : row.inspectionExpiry} disabled={row.inspectionNA}
                onChange={(e) => onChange("inspectionExpiry", e.target.value)}
                className={`w-full ${si} disabled:bg-slate-50 disabled:text-slate-300`} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1 gap-1">
                <label className="ptw-label mb-0">보험 여부 / 유효기간</label>
                <div className="flex items-center gap-1 cursor-pointer shrink-0" onClick={() => onChange("insuranceNA", !row.insuranceNA)}>
                  <div className="w-3.5 h-3.5 rounded border-2 flex items-center justify-center"
                    style={{ background: row.insuranceNA ? PRIMARY : "white", borderColor: row.insuranceNA ? PRIMARY : "#cbd5e1", fontSize: "0.55rem", color: "white" }}>
                    {row.insuranceNA ? "✓" : ""}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">해당없음</span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <input type="text" value={row.insuranceNA ? "" : row.insuranceTypeName} disabled={row.insuranceNA}
                  onChange={(e) => onChange("insuranceTypeName", e.target.value)}
                  placeholder="보험 종류" className="flex-1 min-w-0 px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 bg-white disabled:bg-slate-50 disabled:text-slate-300" />
                <input type="date" value={row.insuranceNA ? "" : row.insuranceEnd} disabled={row.insuranceNA}
                  onChange={(e) => onChange("insuranceEnd", e.target.value)}
                  className="w-32 shrink-0 px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 bg-white disabled:bg-slate-50 disabled:text-slate-300" />
              </div>
            </div>
          </div>
        </div>

        {/* 상세규격 — 항상 노출, 추가 버튼 인라인 */}
        <div className="pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs font-medium text-slate-500">상세규격 / 추가 설치부품</span>
            <button type="button" onClick={addSpec}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-dashed hover:border-teal-400 hover:text-teal-600 text-slate-400 transition-colors"
              style={{ borderColor: "#d1d5db" }}>
              + 추가
            </button>
          </div>
          {specs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              {specs.map((spec, idx) => (
                <div key={spec.id} className="rounded-xl border border-slate-200 p-3 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                    <button type="button" onClick={() => removeSpec(spec.id)}
                      className="text-slate-300 hover:text-red-400 leading-none">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {/* 좌: 상세 규격 타이틀 */}
                    <div className="w-20 shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-2 flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400">상세 규격</span>
                      <input type="text" value={spec.title} onChange={(e) => updateSpecTitle(spec.id, e.target.value)}
                        placeholder="줄걸이"
                        className="w-full text-xs font-medium outline-none bg-transparent border-b border-dashed border-slate-200 focus:border-teal-400 pb-0.5"
                        style={{ color: PRIMARY }} />
                    </div>
                    {/* 우: 행 목록 */}
                    <div className="flex-1 space-y-1.5">
                      {spec.rows.map((r) => (
                        <div key={r.id} className="flex items-center gap-1.5">
                          <input type="text" value={r.key} onChange={(e) => updateSpecRow(spec.id, r.id, "key", e.target.value)}
                            placeholder="항목"
                            className="w-20 shrink-0 px-2 py-1 rounded border border-slate-200 text-xs outline-none focus:border-teal-400 bg-white"
                            style={{ color: "#3b82f6" }} />
                          <input type="text" value={r.value} onChange={(e) => updateSpecRow(spec.id, r.id, "value", e.target.value)}
                            placeholder="값"
                            className="flex-1 px-2 py-1 rounded border border-slate-200 text-xs outline-none focus:border-teal-400 bg-white" />
                          <button type="button" onClick={() => removeSpecRow(spec.id, r.id)}
                            className="text-slate-300 hover:text-red-400 text-base leading-none shrink-0">−</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addSpecRow(spec.id)}
                        className="text-xs text-slate-400 hover:text-teal-500 pt-0.5">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Equipment image upload ────────────────────────────────────────────────────

function EquipDetailPanel({ equipKey, extraData, onExtraChange }: {
  equipKey: string;
  extraData: ExtraData;
  onExtraChange: (sectionKey: string, val: Record<string, unknown>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ExtraForm = EQUIP_EXTRA_FORMS[equipKey];
  if (!ExtraForm) return null;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: `${PRIMARY}30` }}>
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold transition-colors"
        style={{ background: open ? `${PRIMARY}0d` : "#f8fafc", color: open ? PRIMARY : "#475569" }}>
        <span className="flex items-center gap-2">
          <span>📋</span>
          <span>장비별 작업조건 및 사전점검표</span>
        </span>
        <span className="inline-block transition-transform" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
      </button>
      {open && (
        <div className="p-3 bg-white border-t" style={{ borderColor: `${PRIMARY}20` }}>
          <ExtraForm data={extraData} onChange={onExtraChange} />
        </div>
      )}
    </div>
  );
}

// ── Equipment Section ─────────────────────────────────────────────────────────

function EquipmentSection({ data, onChange, allowedEquipKeys }: { data: EquipmentData; onChange: (d: EquipmentData) => void; allowedEquipKeys?: string[] }) {
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const selectedKeys = data.selectedKeys ?? [];
  const rows = data.rows ?? [];
  const machineSpecs = data.machineSpecs ?? {};

  const toggleExpand = (key: string) => setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleEquip = (key: EquipKey) => {
    const isSelected = selectedKeys.includes(key);
    if (isSelected) {
      const newSpecs = { ...machineSpecs };
      delete newSpecs[key];
      onChange({ ...data, selectedKeys: selectedKeys.filter((k) => k !== key), rows: rows.filter((r) => r.equipKey !== key), machineSpecs: newSpecs });
    } else {
      const newRow: EquipRow = { id: key, equipKey: key, name: EQUIP_TYPES[key].label, spec: "", qty: "1", ownership: "자사" };
      onChange({ ...data, selectedKeys: [...selectedKeys, key], rows: [...rows, newRow], machineSpecs: { ...machineSpecs, [key]: [emptyMachineRow()] } });
      setExpandedKeys((prev) => ({ ...prev, [key]: true }));
    }
  };

  const addCustomRow = () => onChange({ ...data, rows: [...rows, { id: `eq${Date.now()}`, name: "", spec: "", qty: "1", ownership: "자사" }] });

  const updateRow = (id: string, key: keyof EquipRow, value: string) =>
    onChange({ ...data, rows: rows.map((r) => r.id === id ? { ...r, [key]: value } : r) });

  const removeCustomRow = (id: string) => onChange({ ...data, rows: rows.filter((r) => r.id !== id) });

  const updateMachineRow = (equipKey: string, rowId: string, key: keyof MachineRow, value: string | boolean | DetailSpec[]) => {
    const specs = machineSpecs[equipKey] ?? [];
    onChange({ ...data, machineSpecs: { ...machineSpecs, [equipKey]: specs.map((r) => r.id === rowId ? { ...r, [key]: value } : r) } });
  };

  const addMachineRow = (equipKey: string) => {
    const specs = machineSpecs[equipKey] ?? [];
    onChange({ ...data, machineSpecs: { ...machineSpecs, [equipKey]: [...specs, emptyMachineRow()] } });
  };

  const removeMachineRow = (equipKey: string, rowId: string) => {
    const specs = (machineSpecs[equipKey] ?? []).filter((r) => r.id !== rowId);
    onChange({ ...data, machineSpecs: { ...machineSpecs, [equipKey]: specs } });
  };

  const allExtraData = data.extraData ?? {};

  const updateEquipExtra = (eqKey: string, sectionKey: string, val: Record<string, unknown>) => {
    const prev = allExtraData[eqKey] ?? {};
    onChange({ ...data, extraData: { ...allExtraData, [eqKey]: { ...prev, [sectionKey]: val } } });
  };

  const customRows = rows.filter((r) => !r.equipKey);

  return (
    <div className="space-y-4">
      {/* 투입 건설기계 선택 */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">투입 건설기계 선택 (복수 선택 가능)</p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(EQUIP_TYPES) as [EquipKey, typeof EQUIP_TYPES[EquipKey]][]).map(([key, info]) => {
            const isSelected = selectedKeys.includes(key);
            const disabled = allowedEquipKeys !== undefined && !allowedEquipKeys.includes(key);
            return (
              <button key={key} type="button"
                onClick={() => !disabled && toggleEquip(key)}
                disabled={disabled}
                title={disabled ? "이 작업유형에서 사용할 수 없는 장비입니다" : undefined}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all"
                style={disabled
                  ? { background: "#f8fafc", color: "#cbd5e1", borderColor: "#e2e8f0", cursor: "not-allowed" }
                  : { background: isSelected ? PRIMARY_LIGHT : "white", color: isSelected ? PRIMARY : "#64748b", borderColor: isSelected ? PRIMARY : "#e2e8f0" }}>
                <span style={disabled ? { opacity: 0.35 } : {}}>{info.icon}</span>
                <span className="font-semibold">{info.num}.</span>
                <span>{info.label}</span>
                {isSelected && !disabled && <span className="font-bold">✓</span>}
              </button>
            );
          })}
          {(() => {
            const customDisabled = allowedEquipKeys !== undefined && !allowedEquipKeys.includes("custom");
            return (
              <button type="button"
                onClick={() => !customDisabled && addCustomRow()}
                disabled={customDisabled}
                title={customDisabled ? "이 작업유형에서 사용할 수 없는 장비입니다" : undefined}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all"
                style={customDisabled
                  ? { background: "#f8fafc", color: "#cbd5e1", borderColor: "#e2e8f0", cursor: "not-allowed" }
                  : { background: customRows.length > 0 ? PRIMARY_LIGHT : "white", color: customRows.length > 0 ? PRIMARY : "#64748b", borderColor: customRows.length > 0 ? PRIMARY : "#e2e8f0" }}>
                <span style={customDisabled ? { opacity: 0.35 } : {}}>🔧</span>
                <span className="font-semibold">10.</span><span>기타</span>
                {customRows.length > 0 && !customDisabled && <span className="font-bold">✓</span>}
              </button>
            );
          })()}
        </div>
      </div>

      {/* 빈 상태 */}
      {selectedKeys.length === 0 && customRows.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
          <p className="text-sm text-slate-400">위에서 투입할 건설기계를 선택하세요</p>
        </div>
      )}

      {/* 선택된 장비별 카드 */}
      {[...selectedKeys].sort((a, b) => (EQUIP_TYPES[a as EquipKey]?.num ?? 99) - (EQUIP_TYPES[b as EquipKey]?.num ?? 99)).map((key) => {
        const info = EQUIP_TYPES[key as EquipKey];
        const row = rows.find((r) => r.equipKey === key);
        const isOpen = expandedKeys[key] !== false;
        if (!row) return null;
        const specs = machineSpecs[key] ?? [];
        return (
          <div key={key} className="rounded-xl border overflow-hidden" style={{ borderColor: `${PRIMARY}30` }}>
            {/* 기본 정보 행 */}
            <div className="flex items-center gap-2 px-3 py-2 flex-wrap" style={{ background: `${PRIMARY}0d` }}>
              <span className="text-xs px-1.5 py-0.5 rounded font-bold shrink-0" style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>{info.num}번</span>
              <span className="text-sm shrink-0">{info.icon}</span>
              <span className="text-xs font-semibold text-slate-700 shrink-0">{info.label}</span>
              <input type="text" value={row.spec} onChange={(e) => updateRow(row.id, "spec", e.target.value)}
                className="flex-1 min-w-24 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 bg-white"
                placeholder="규격 (예: 20t)" />
              <div className="flex items-center gap-1 shrink-0">
                <input type="number" value={row.qty} min="1" onChange={(e) => updateRow(row.id, "qty", e.target.value)}
                  className="w-14 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 bg-white" />
                <span className="text-xs text-slate-400">대</span>
              </div>
              <select value={row.ownership} onChange={(e) => updateRow(row.id, "ownership", e.target.value)}
                className="shrink-0 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 bg-white">
                {OWNERSHIP_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
              <button type="button" onClick={() => toggleExpand(key)}
                className="shrink-0 text-xs px-2 py-1 rounded-lg font-medium transition-colors"
                style={{ background: isOpen ? `${PRIMARY}15` : "#f1f5f9", color: isOpen ? PRIMARY : "#64748b" }}>
                {isOpen ? "▲ 접기" : "▼ 기계제원"}
              </button>
              <button type="button" onClick={() => toggleEquip(key as EquipKey)}
                className="text-slate-300 hover:text-red-400 text-sm px-1 shrink-0">✕</button>
            </div>
            {/* 기계 제원 + 작업조건 */}
            {isOpen && (
              <div className="p-3 space-y-3 bg-white">
                {specs.map((spec) => (
                  <MachineSpecCard key={spec.id} row={spec}
                    onChange={(k, v) => updateMachineRow(key, spec.id, k, v)}
                    onRemove={() => removeMachineRow(key, spec.id)} />
                ))}
                <button type="button" onClick={() => addMachineRow(key)}
                  className="text-xs text-slate-400 hover:text-teal-500 px-1">+ 기계 추가</button>
                <EquipDetailPanel
                  equipKey={key}
                  extraData={allExtraData[key] ?? {}}
                  onExtraChange={(s, v) => updateEquipExtra(key, s, v)}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* 기타 장비 */}
      {customRows.length > 0 && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-100" style={{ background: "#f8fafc" }}>기타 장비</div>
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
                  <td className="px-2 py-1.5"><input type="text" value={r.name} onChange={(e) => updateRow(r.id, "name", e.target.value)} className={si} placeholder="기종명 입력" /></td>
                  <td className="px-2 py-1.5"><input type="text" value={r.spec} onChange={(e) => updateRow(r.id, "spec", e.target.value)} className={si} placeholder="규격 (예: 20t)" /></td>
                  <td className="px-2 py-1.5"><input type="number" value={r.qty} min="1" onChange={(e) => updateRow(r.id, "qty", e.target.value)} className="w-14 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 bg-white" /></td>
                  <td className="px-2 py-1.5">
                    <select value={r.ownership} onChange={(e) => updateRow(r.id, "ownership", e.target.value)} className="px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 bg-white">
                      {OWNERSHIP_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5"><input type="text" value={r.note ?? ""} onChange={(e) => updateRow(r.id, "note", e.target.value)} className={si} placeholder="특이사항" /></td>
                  <td className="px-2 py-1.5"><button type="button" onClick={() => removeCustomRow(r.id)} className="text-slate-300 hover:text-red-400 text-sm px-1">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Risk Assessment Section ───────────────────────────────────────────────────

const RISK_GRADE_COLORS: Record<string, string> = { 상: "bg-red-100 text-red-600", 중: "bg-amber-100 text-amber-600", 하: "bg-green-100 text-green-600" };

function RiskAssessmentSection({ data, onChange }: { data: RiskData; onChange: (d: RiskData) => void }) {
  const rows = data.rows ?? [];
  const updateRow = (id: string, key: keyof RiskRow, value: string | boolean) =>
    onChange({ rows: rows.map((r) => r.id === id ? { ...r, [key]: value } : r) });
  const addRow = () =>
    onChange({ rows: [...rows, { id: `r${Date.now()}`, process: "", unitTask: "", risk: "", mitigation: "", grade: "중", keyManagement: false }] });
  const removeRow = (id: string) => onChange({ rows: rows.filter((r) => r.id !== id) });

  return (
    <div className="rounded-xl border border-slate-200 overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr style={{ background: PRIMARY_LIGHT }}>
            {["작업공정", "단위작업", "위험요인", "저감대책", "위험등급", "중점관리", ""].map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium text-slate-600 text-xs whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-slate-100">
              <td className="px-2 py-1.5"><input type="text" value={r.process} onChange={(e) => updateRow(r.id, "process", e.target.value)} className={si} placeholder="굴착" /></td>
              <td className="px-2 py-1.5"><input type="text" value={r.unitTask} onChange={(e) => updateRow(r.id, "unitTask", e.target.value)} className={si} placeholder="터파기" /></td>
              <td className="px-2 py-1.5"><input type="text" value={r.risk} onChange={(e) => updateRow(r.id, "risk", e.target.value)} className={si} placeholder="위험요인 기술" /></td>
              <td className="px-2 py-1.5"><input type="text" value={r.mitigation} onChange={(e) => updateRow(r.id, "mitigation", e.target.value)} className={si} placeholder="저감대책 기술" /></td>
              <td className="px-2 py-1.5">
                <select value={r.grade} onChange={(e) => updateRow(r.id, "grade", e.target.value)}
                  className={`px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 font-semibold ${RISK_GRADE_COLORS[r.grade] ?? ""}`}>
                  <option value="상">상</option>
                  <option value="중">중</option>
                  <option value="하">하</option>
                </select>
              </td>
              <td className="px-2 py-1.5 text-center">
                <div className="w-4 h-4 rounded border-2 flex items-center justify-center text-white text-xs cursor-pointer mx-auto"
                  style={{ background: r.keyManagement ? PRIMARY : "white", borderColor: r.keyManagement ? PRIMARY : "#cbd5e1" }}
                  onClick={() => updateRow(r.id, "keyManagement", !r.keyManagement)}>
                  {r.keyManagement ? "✓" : ""}
                </div>
              </td>
              <td className="px-2 py-1.5"><button type="button" onClick={() => removeRow(r.id)} className="text-slate-300 hover:text-red-400 text-sm px-1">✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 border-t border-slate-100">
        <button type="button" onClick={addRow} className="text-xs text-slate-400 hover:text-teal-500">+ 행 추가</button>
      </div>
    </div>
  );
}

// ── Safety Checklist Section ──────────────────────────────────────────────────

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
const SAFETY_RESULT_OPTIONS: SafetyResult[] = ["양호", "불량", "해당없음"];
const SAFETY_RESULT_COLORS: Record<SafetyResult, string> = { 양호: "#00B7AF", 불량: "#dc2626", 해당없음: "#94a3b8" };

function SafetyChecklistSection({ data, onChange }: { data: SafetyCheckData; onChange: (d: SafetyCheckData) => void }) {
  const [showNote, setShowNote] = useState(!!(data.note));
  const setResult = (item: string, v: SafetyResult) =>
    onChange({ ...data, checks: { ...data.checks, [item]: v } });

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="grid text-xs font-medium text-slate-500 px-4 py-2 border-b border-slate-100" style={{ background: PRIMARY_LIGHT, gridTemplateColumns: "1fr auto" }}>
          <span>점검 항목</span>
          <div className="flex gap-4">
            {SAFETY_RESULT_OPTIONS.map((r) => (
              <span key={r} className="w-14 text-center">{r}</span>
            ))}
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {COMMON_SAFETY_ITEMS.map((item) => {
            const current = data.checks?.[item] ?? null;
            return (
              <div key={item} className="flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors">
                <span className="text-sm text-slate-600 flex-1 mr-4">{item}</span>
                <div className="flex gap-4 flex-shrink-0">
                  {SAFETY_RESULT_OPTIONS.map((opt) => (
                    <button key={opt} type="button" onClick={() => setResult(item, opt)} className="w-14 flex justify-center">
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all"
                        style={{ borderColor: current === opt ? SAFETY_RESULT_COLORS[opt] : "#cbd5e1", background: current === opt ? SAFETY_RESULT_COLORS[opt] : "white" }}>
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
      {showNote ? (
        <div>
          <textarea
            value={data.note}
            onChange={(e) => onChange({ ...data, note: e.target.value })}
            placeholder="기타 안전 조치 사항을 입력하세요"
            rows={2}
            className={`${txa} h-16`}
          />
          <button type="button" onClick={() => { setShowNote(false); onChange({ ...data, note: "" }); }}
            className="mt-1 text-xs text-slate-400 hover:text-slate-600">− 접기</button>
        </div>
      ) : (
        <button type="button" onClick={() => setShowNote(true)}
          className="text-xs px-3 py-1 rounded-lg border border-dashed hover:border-teal-300 hover:text-teal-600 text-slate-400"
          style={{ borderColor: "#d1d5db" }}>
          + 추가 조치 사항
        </button>
      )}
    </div>
  );
}

// ── Training Section ──────────────────────────────────────────────────────────

const TRAINING_TYPE_OPTIONS = ["정기교육", "채용 시 교육", "작업내용 변경 시", "특별교육", "관리감독자 교육", "기타"];

function TrainingSection({ data, onChange }: { data: TrainingData; onChange: (d: TrainingData) => void }) {
  const rows = data.rows ?? [];
  const updateRow = (id: string, key: keyof TrainingRow, value: string) =>
    onChange({ rows: rows.map((r) => r.id === id ? { ...r, [key]: value } : r) });
  const addRow = (trainingType = "") =>
    onChange({ rows: [...rows, { id: `tr${Date.now()}`, trainingType, subType: "", date: "", duration: "", instructor: "", completedCount: "" }] });
  const removeRow = (id: string) => onChange({ rows: rows.filter((r) => r.id !== id) });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TRAINING_TYPE_OPTIONS.map((t) => (
          <button key={t} type="button" onClick={() => addRow(t)}
            className="text-xs px-3 py-1.5 rounded-full border transition-all"
            style={{ borderColor: `${PRIMARY}55`, color: PRIMARY, background: PRIMARY_LIGHT }}>
            + {t}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr style={{ background: PRIMARY_LIGHT }}>
              {["교육종류", "교육세부종류", "교육날짜", "교육시간", "강사명", "수료자 수", ""].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium text-slate-600 text-xs whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-xs text-slate-400">위 버튼으로 교육 유형을 선택하거나 직접 추가하세요</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-2 py-1">
                  <select value={r.trainingType} onChange={(e) => updateRow(r.id, "trainingType", e.target.value)}
                    className="px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 bg-white">
                    <option value="">선택</option>
                    {TRAINING_TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1"><input type="text" value={r.subType} onChange={(e) => updateRow(r.id, "subType", e.target.value)} className={si} placeholder="세부 내용" /></td>
                <td className="px-2 py-1"><input type="date" value={r.date} onChange={(e) => updateRow(r.id, "date", e.target.value)} className={si} /></td>
                <td className="px-2 py-1"><input type="text" value={r.duration} onChange={(e) => updateRow(r.id, "duration", e.target.value)} className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 bg-white" placeholder="1시간" /></td>
                <td className="px-2 py-1"><input type="text" value={r.instructor} onChange={(e) => updateRow(r.id, "instructor", e.target.value)} className={si} placeholder="홍길동" /></td>
                <td className="px-2 py-1"><input type="number" value={r.completedCount} onChange={(e) => updateRow(r.id, "completedCount", e.target.value)} className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 bg-white" placeholder="0" /></td>
                <td className="px-2 py-1"><button type="button" onClick={() => removeRow(r.id)} className="text-slate-300 hover:text-red-400 text-sm px-1">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-3 py-2 border-t border-slate-100">
          <button type="button" onClick={() => addRow()} className="text-xs text-slate-400 hover:text-teal-500">+ 행 추가</button>
        </div>
      </div>
    </div>
  );
}

// ── Emergency Contact Section ─────────────────────────────────────────────────

function EmergencyContactSection({ data, onChange }: { data: EmergencyData; onChange: (d: EmergencyData) => void }) {
  const f = (key: keyof EmergencyData) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">
        {{ hospital: "응급의료기관", fire: "소방서 (119)", police: "경찰서 (112)", supervisor: "관리감독자", safetyManager: "안전관리자", note: "기타 연락처" }[key]}
      </label>
      <input type="text" value={data[key]} onChange={(e) => onChange({ ...data, [key]: e.target.value })}
        className={inp} placeholder={{ hospital: "병원명 및 전화번호", fire: "관할 소방서", police: "관할 경찰서", supervisor: "이름 / 연락처", safetyManager: "이름 / 연락처", note: "기타 비상연락 정보" }[key]} />
    </div>
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {f("hospital")}{f("fire")}{f("police")}{f("supervisor")}{f("safetyManager")}{f("note")}
    </div>
  );
}

// ── Drawing Canvas Modal ──────────────────────────────────────────────────────

type DrawTool = "pen" | "arrow" | "rect" | "circle" | "text";
interface DrawPoint { x: number; y: number }
interface DrawAction { tool: DrawTool; color: string; lineWidth: number; points: DrawPoint[]; text?: string }

function DrawingCanvasModal({
  backgroundImage,
  initialMarkup,
  onSave,
  onClose,
}: {
  backgroundImage: string;
  initialMarkup?: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<DrawTool>("pen");
  const [color, setColor] = useState("#ef4444");
  const [lineWidth, setLineWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<DrawPoint[]>([]);
  const [actions, setActions] = useState<DrawAction[]>([]);
  const [pendingText, setPendingText] = useState<DrawPoint | null>(null);
  const [textInput, setTextInput] = useState("");
  const startRef = useRef<DrawPoint | null>(null);

  const drawAll = useCallback((ctx: CanvasRenderingContext2D, acts: DrawAction[]) => {
    acts.forEach((a) => {
      ctx.strokeStyle = a.color;
      ctx.fillStyle = a.color;
      ctx.lineWidth = a.lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (a.tool === "pen" && a.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(a.points[0].x, a.points[0].y);
        a.points.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      } else if (a.tool === "arrow" && a.points.length >= 2) {
        const s = a.points[0], e = a.points[a.points.length - 1];
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(e.x, e.y); ctx.stroke();
        const ang = Math.atan2(e.y - s.y, e.x - s.x), hl = 14;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x - hl * Math.cos(ang - Math.PI / 7), e.y - hl * Math.sin(ang - Math.PI / 7));
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x - hl * Math.cos(ang + Math.PI / 7), e.y - hl * Math.sin(ang + Math.PI / 7));
        ctx.stroke();
      } else if (a.tool === "rect" && a.points.length >= 2) {
        const p0 = a.points[0], p1 = a.points[a.points.length - 1];
        ctx.strokeRect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
      } else if (a.tool === "circle" && a.points.length >= 2) {
        const p0 = a.points[0], p1 = a.points[a.points.length - 1];
        ctx.beginPath();
        ctx.ellipse(p0.x + (p1.x - p0.x) / 2, p0.y + (p1.y - p0.y) / 2, Math.abs(p1.x - p0.x) / 2, Math.abs(p1.y - p0.y) / 2, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (a.tool === "text" && a.text && a.points.length > 0) {
        ctx.font = `${a.lineWidth * 6 + 10}px sans-serif`;
        ctx.fillText(a.text, a.points[0].x, a.points[0].y);
      }
    });
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const src = initialMarkup ?? backgroundImage;
    const img = new Image();
    img.src = src;
    img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); drawAll(ctx, actions); };
  }, [backgroundImage, initialMarkup, actions, drawAll]);

  useEffect(() => { redraw(); }, [redraw]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>): DrawPoint => {
    const r = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvasRef.current!.width / r.width),
      y: (e.clientY - r.top) * (canvasRef.current!.height / r.height),
    };
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const p = getPos(e);
    if (tool === "text") { setPendingText(p); return; }
    setIsDrawing(true); startRef.current = p; setCurrentPoints([p]);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const p = getPos(e);
    const pts = tool === "pen" ? [...currentPoints, p] : [startRef.current!, p];
    if (tool === "pen") setCurrentPoints(pts);
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const src = initialMarkup ?? backgroundImage;
    const img = new Image(); img.src = src;
    img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); drawAll(ctx, [...actions, { tool, color, lineWidth, points: pts }]); };
  };

  const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const p = getPos(e);
    const pts = tool === "pen" ? [...currentPoints, p] : [startRef.current!, p];
    if (pts.length > 0) setActions((prev) => [...prev, { tool, color, lineWidth, points: pts }]);
    setCurrentPoints([]);
  };

  const handleTextConfirm = () => {
    if (pendingText && textInput.trim())
      setActions((prev) => [...prev, { tool: "text", color, lineWidth, points: [pendingText], text: textInput.trim() }]);
    setPendingText(null); setTextInput("");
  };

  const handleSave = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    onSave(canvas.toDataURL("image/png"));
  };

  const drawTools: { id: DrawTool; icon: string; label: string }[] = [
    { id: "pen", icon: "✏️", label: "펜" },
    { id: "arrow", icon: "→", label: "화살표" },
    { id: "rect", icon: "□", label: "사각형" },
    { id: "circle", icon: "○", label: "원" },
    { id: "text", icon: "T", label: "텍스트" },
  ];
  const palette = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#000000"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)" }}>
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl mx-4 overflow-hidden" style={{ maxHeight: "92vh" }}>
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 flex-wrap shrink-0">
          <span className="text-sm font-semibold text-slate-700">도면 편집</span>
          <div className="flex gap-1">
            {drawTools.map((t) => (
              <button key={t.id} type="button" onClick={() => setTool(t.id)} title={t.label}
                className="w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
                style={{ background: tool === t.id ? PRIMARY : "#f1f5f9", color: tool === t.id ? "white" : "#64748b" }}>
                {t.icon}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-slate-200" />
          <div className="flex gap-1">
            {palette.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className="w-6 h-6 rounded-full border-2 transition-transform"
                style={{ background: c, borderColor: color === c ? "#1e293b" : "transparent", transform: color === c ? "scale(1.2)" : "scale(1)" }} />
            ))}
          </div>
          <div className="w-px h-5 bg-slate-200" />
          <select value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none">
            <option value={1}>얇게</option>
            <option value={2}>보통</option>
            <option value={4}>굵게</option>
          </select>
          <div className="flex-1" />
          <button type="button" onClick={() => setActions((p) => p.slice(0, -1))}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">실행 취소</button>
          <button type="button" onClick={handleSave}
            className="text-xs px-3 py-1.5 rounded-lg text-white font-medium" style={{ background: PRIMARY }}>저장</button>
          <button type="button" onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600">닫기</button>
        </div>
        {/* Canvas */}
        <div className="flex-1 overflow-auto p-4 bg-slate-100 relative">
          <canvas ref={canvasRef} width={900} height={560}
            className="block mx-auto rounded-lg shadow-md"
            style={{ cursor: tool === "text" ? "text" : "crosshair", maxWidth: "100%" }}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} />
          {pendingText && (
            <div className="absolute flex gap-2 items-center" style={{ left: "calc(50% - 145px)", bottom: "1.5rem" }}>
              <input autoFocus type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleTextConfirm(); if (e.key === "Escape") { setPendingText(null); setTextInput(""); } }}
                placeholder="텍스트 입력 후 Enter"
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none bg-white shadow-md w-60" />
              <button type="button" onClick={handleTextConfirm}
                className="px-3 py-2 rounded-lg text-white text-sm" style={{ background: PRIMARY }}>확인</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Drawings Section ──────────────────────────────────────────────────────────

function DrawingsSection({ data, onChange }: { data: DrawingsData; onChange: (d: DrawingsData) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [zoomId, setZoomId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const files = data.files ?? [];
  const newId = () => `f_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    let pending = picked.length;
    if (!pending) return;
    const added: DrawingFile[] = [];
    picked.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        added.push({ id: newId(), name: file.name, type: file.type, dataUrl: ev.target?.result as string });
        if (--pending === 0) onChange({ files: [...files, ...added] });
      };
      reader.readAsDataURL(file);
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (id: string) => onChange({ files: files.filter((f) => f.id !== id) });

  const saveMarkup = (id: string, markupUrl: string) => {
    onChange({ files: files.map((f) => f.id === id ? { ...f, markup: markupUrl } : f) });
    setEditingId(null);
  };

  const images = files.filter((f) => f.type.startsWith("image/"));
  const docs = files.filter((f) => !f.type.startsWith("image/"));
  const editingFile = editingId ? files.find((f) => f.id === editingId) ?? null : null;

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 transition-colors"
        style={{ borderColor: "#b2ece9", background: PRIMARY_LIGHT }}
        onClick={() => inputRef.current?.click()}>
        <div className="text-3xl mb-2">📎</div>
        <p className="text-sm text-slate-500">클릭하여 파일 업로드</p>
        <p className="text-xs text-slate-400 mt-0.5">이미지, PDF, 문서 파일 지원</p>
        <input ref={inputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleFiles} />
      </div>

      {images.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">이미지 ({images.length})</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((f) => (
              <div key={f.id} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100" style={{ aspectRatio: "4/3" }}>
                <img src={f.markup ?? f.dataUrl} alt={f.name} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setZoomId(f.id)} />
                {f.markup && (
                  <div className="absolute top-2 left-2">
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium text-white" style={{ background: PRIMARY }}>마크업</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end justify-between p-2 opacity-0 group-hover:opacity-100">
                  <span className="text-xs text-white bg-black/40 px-1.5 py-0.5 rounded truncate max-w-[55%]">{f.name}</span>
                  <div className="flex gap-1">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setEditingId(f.id); }}
                      className="text-xs px-2 py-1 rounded-lg text-white font-medium shadow"
                      style={{ background: PRIMARY }} title="이미지 수정">✏</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); remove(f.id); }}
                      className="text-xs px-2 py-1 rounded-lg text-white bg-red-500 shadow">✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {docs.length > 0 && (
        <div className="space-y-2">
          {docs.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg flex-shrink-0">📄</div>
              <p className="flex-1 min-w-0 text-sm text-slate-700 truncate">{f.name}</p>
              <button type="button" onClick={() => remove(f.id)} className="text-xs px-2.5 py-1 rounded-lg text-slate-400 bg-slate-50 hover:bg-red-50 hover:text-red-500">삭제</button>
            </div>
          ))}
        </div>
      )}

      {/* Zoom lightbox */}
      {zoomId && (() => {
        const f = files.find((x) => x.id === zoomId);
        if (!f) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.85)" }} onClick={() => setZoomId(null)}>
            <div className="relative max-w-5xl w-full mx-4 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <img src={f.markup ?? f.dataUrl} alt={f.name} className="w-full object-contain" style={{ maxHeight: "85vh" }} />
              <div className="absolute top-3 right-3 flex gap-2">
                <button type="button"
                  onClick={() => { setZoomId(null); setEditingId(f.id); }}
                  className="text-xs px-3 py-1.5 rounded-lg text-white font-medium shadow"
                  style={{ background: PRIMARY }}>✏ 이미지 수정</button>
                <button type="button" onClick={() => setZoomId(null)}
                  className="text-xs px-3 py-1.5 rounded-lg text-white bg-slate-700 shadow">닫기</button>
              </div>
              {f.name && (
                <div className="absolute bottom-3 left-3">
                  <span className="text-xs text-white bg-black/50 px-2 py-1 rounded-lg">{f.name}</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Drawing canvas editor */}
      {editingFile && (
        <DrawingCanvasModal
          backgroundImage={editingFile.dataUrl}
          initialMarkup={editingFile.markup}
          onSave={(url) => saveMarkup(editingFile.id, url)}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

// ── Other Files Section ───────────────────────────────────────────────────────

const EQUIP_DOC_TYPES: Record<string, readonly string[]> = {
  truck: [
    "건설기계 등록·검사증", "운전원 자격·면허 사본", "제조·임대사 사용설명서",
    "기계 대여사항 기록부", "건설기계 수리·보수·점검이력", "보험등록증",
    "기타(제원표, 사전검토사항)",
  ],
  excavator: [
    "건설기계 등록·검사증", "운전원 자격·면허 사본", "제조·임대사 사용설명서",
    "인양능력표", "작업반경도(높이별 작업반경)",
    "기계 대여사항 기록부", "건설기계 수리·보수·점검이력", "보험등록증",
    "기타(제원표, 사전검토사항)",
  ],
  aerial_lift: [
    "자동차등록증", "안전검사·인증합격증", "운전원 자격·면허 사본",
    "제조·임대사 사용설명서", "작업반경표(아웃트리거 슬라이드 길이에 따른 작업반경)",
    "선회부 비파괴검사 자료", "보험등록증",
    "기타(제원표, 사전검토사항)",
  ],
  crane: [
    "자동차등록증", "건설기계 등록·검사증", "안전검사·인증합격증",
    "운전원 자격·면허 사본", "제조·임대사 사용설명서",
    "인양하중표(아웃트리거 슬라이드 길이에 따른 작업반경)", "선회부 비파괴검사 자료",
    "보험등록증", "기타(제원표, 사전검토사항)",
  ],
  concrete_pump: [
    "건설기계 등록·검사증", "운전원 자격·면허 사본", "제조·임대사 사용설명서",
    "작업반경도(높이별 작업반경)",
    "기계 대여사항 기록부", "건설기계 수리·보수·점검이력", "보험등록증",
    "기타(제원표, 사전검토사항)",
  ],
  pile_driver: [
    "건설기계 등록·검사증", "운전원 자격·면허 사본", "제조·임대사 사용설명서",
    "건설기계 수리·보수·점검이력", "보험등록증",
    "기타(제원표, 사전검토사항)",
  ],
  forklift: [
    "건설기계 등록·검사증", "운전원 자격·면허 사본", "제조·임대사 사용설명서",
    "기계 대여사항 기록부", "건설기계 수리·보수·점검이력", "보험등록증",
    "기타(제원표, 사전검토사항)",
  ],
  loader: [
    "건설기계 등록·검사증", "운전원 자격·면허 사본", "제조·임대사 사용설명서",
    "인양능력표", "작업반경도(높이별 작업반경)",
    "기계 대여사항 기록부", "건설기계 수리·보수·점검이력", "보험등록증",
    "기타(제원표, 사전검토사항)",
  ],
  roller: [
    "건설기계 등록·검사증", "운전원 자격·면허 사본", "제조·임대사 사용설명서",
    "기계 대여사항 기록부", "건설기계 수리·보수·점검이력", "보험등록증",
    "기타(제원표, 사전검토사항)",
  ],
};
const DEFAULT_DOC_TYPES: readonly string[] = [
  "건설기계 등록·검사증", "운전원 자격·면허 사본", "제조·임대사 사용설명서",
  "기계 대여사항 기록부", "건설기계 수리·보수·점검이력", "보험등록증",
  "기타(제원표, 사전검토사항)",
];

function OtherFilesSection({ data, onChange, selectedEquipKeys }: {
  data: OtherFilesData;
  onChange: (d: OtherFilesData) => void;
  selectedEquipKeys: string[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const eqInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [expandedEq, setExpandedEq] = useState<Set<string>>(new Set());
  const files = data.files ?? [];
  const equipFiles = data.equipFiles ?? {};
  const newId = () => `f_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const fileIcon = (type: string) => type.includes("pdf") ? "📄" : type.startsWith("image/") ? "🖼️" : "📎";

  const handleGeneral = (e: React.ChangeEvent<HTMLInputElement>) => {
    const added: OtherFile[] = Array.from(e.target.files ?? []).map((f) => ({ id: newId(), name: f.name, type: f.type }));
    onChange({ ...data, files: [...files, ...added] });
    if (inputRef.current) inputRef.current.value = "";
  };
  const removeGeneral = (id: string) => onChange({ ...data, files: files.filter((f) => f.id !== id) });

  const handleEqFile = (eqKey: string, docCategory: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const added: EquipDocFile[] = Array.from(e.target.files ?? []).map((f) => ({ id: newId(), name: f.name, mimeType: f.type, docCategory }));
    const existing = equipFiles[eqKey] ?? [];
    onChange({ ...data, equipFiles: { ...equipFiles, [eqKey]: [...existing, ...added] } });
    const el = eqInputRefs.current[`${eqKey}__${docCategory}`];
    if (el) el.value = "";
  };
  const removeEqFile = (eqKey: string, fileId: string) =>
    onChange({ ...data, equipFiles: { ...equipFiles, [eqKey]: (equipFiles[eqKey] ?? []).filter((f) => f.id !== fileId) } });

  const toggleEq = (key: string) =>
    setExpandedEq((prev) => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });

  return (
    <div className="space-y-4">
      {selectedEquipKeys.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">장비별 서류 첨부 <span className="normal-case font-normal text-slate-400">(선택)</span></p>
          {selectedEquipKeys.map((key) => {
            const info = EQUIP_TYPES[key as EquipKey];
            if (!info) return null;
            const eqf = equipFiles[key] ?? [];
            const isOpen = expandedEq.has(key);
            return (
              <div key={key} className="rounded-xl border border-slate-200 overflow-hidden">
                <button type="button" onClick={() => toggleEq(key)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-medium text-slate-700">{info.icon} {info.label}</span>
                  <div className="flex items-center gap-2">
                    {eqf.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>{eqf.length}건</span>
                    )}
                    <span className="text-slate-400 text-xs">{isOpen ? "▲" : "▼"}</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 divide-y divide-slate-50">
                    {(EQUIP_DOC_TYPES[key] ?? DEFAULT_DOC_TYPES).map((docType) => {
                      const docFiles = eqf.filter((f) => f.docCategory === docType);
                      const refKey = `${key}__${docType}`;
                      return (
                        <div key={docType} className="px-4 py-2.5 flex items-start gap-3">
                          <span className="text-xs text-slate-500 w-44 shrink-0 pt-0.5">{docType}</span>
                          <div className="flex flex-wrap items-center gap-1.5 flex-1">
                            {docFiles.map((f) => (
                              <div key={f.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-slate-200 bg-slate-50">
                                <span>{fileIcon(f.mimeType)}</span>
                                <span className="text-slate-700 max-w-[8rem] truncate">{f.name}</span>
                                <button type="button" onClick={() => removeEqFile(key, f.id)} className="text-slate-300 hover:text-red-400 ml-0.5">✕</button>
                              </div>
                            ))}
                            <button type="button" onClick={() => eqInputRefs.current[refKey]?.click()}
                              className="text-xs px-2.5 py-1 rounded-full border border-dashed hover:border-teal-400 hover:text-teal-600 text-slate-400"
                              style={{ borderColor: "#cbd5e1" }}>+ 첨부</button>
                            <input ref={(el) => { eqInputRefs.current[refKey] = el; }}
                              type="file" multiple accept="image/*,.pdf" className="hidden"
                              onChange={(e) => handleEqFile(key, docType, e)} />
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
      <div className="space-y-2">
        {selectedEquipKeys.length > 0 && (
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">일반 첨부파일 <span className="normal-case font-normal text-slate-400">(선택)</span></p>
        )}
        <div className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-teal-400 transition-colors"
          style={{ borderColor: "#b2ece9", background: PRIMARY_LIGHT }}
          onClick={() => inputRef.current?.click()}>
          <p className="text-sm text-slate-500">클릭하여 파일 업로드</p>
          <p className="text-xs text-slate-400 mt-0.5">이미지, PDF 파일 지원</p>
          <input ref={inputRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleGeneral} />
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
                  <button type="button" onClick={() => removeGeneral(f.id)} className="text-slate-300 hover:text-red-400 text-xs px-1 flex-shrink-0">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PDF Modal ─────────────────────────────────────────────────────────────────

function PdfModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-4xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="flex-1 overflow-hidden">
          <iframe src={url} className="w-full h-full" title={title} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-amber-600 mt-0.5">※ {hint}</p>}
    </div>
  );
}

// ── Safety Card Import Modal ──────────────────────────────────────────────────

type ImportSection = "riskAssessment" | "safetyChecklist" | "training";

function SafetyCardImportModal({
  section,
  onImport,
  onClose,
}: {
  section: ImportSection;
  onImport: (doc: CardDoc) => void;
  onClose: () => void;
}) {
  const [docs] = useState<CardDoc[]>(() => loadAll());
  const candidates = docs.filter((d) => {
    if (section === "riskAssessment") return (d.riskAssessment?.rows?.length ?? 0) > 0;
    if (section === "safetyChecklist") return Object.keys(d.safetyChecklist?.checks ?? {}).length > 0;
    if (section === "training") return (d.training?.rows?.length ?? 0) > 0;
    return false;
  });

  const sectionLabel: Record<ImportSection, string> = {
    riskAssessment: "위험성평가",
    safetyChecklist: "안전점검",
    training: "안전교육",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.45)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">안전카드 불러오기</h2>
            <p className="text-xs text-gray-500 mt-0.5">{sectionLabel[section]} 데이터를 가진 카드를 선택하면 현재 내용을 덮어씁니다</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1">✕</button>
        </div>
        <div className="overflow-y-auto max-h-80 divide-y divide-gray-100">
          {candidates.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              불러올 수 있는 {sectionLabel[section]} 데이터가 없습니다
            </div>
          ) : (
            candidates.map((d) => {
              const typeDef = LEGAL_CARD_TYPES.find((t) => t.id === d.typeId);
              const rowCount =
                section === "riskAssessment" ? d.riskAssessment?.rows?.length ?? 0
                : section === "training" ? d.training?.rows?.length ?? 0
                : Object.keys(d.safetyChecklist?.checks ?? {}).length;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => { onImport(d); onClose(); }}
                  className="w-full text-left px-5 py-3 hover:bg-teal-50 transition-colors flex items-center gap-3"
                >
                  <span className="text-xl">{typeDef?.icon ?? "📄"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{typeDef?.shortLabel ?? d.typeId}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{d.overview?.workName || d.overview?.siteName || "제목 없음"} · {new Date(d.updatedAt).toLocaleDateString("ko-KR")}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 border border-teal-200 flex-shrink-0">
                    {rowCount}건
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ id, no, title, headerAction, children }: { id: string; no?: string; title: string; headerAction?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={`sec-${id}`} className="scroll-mt-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          {no && <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded px-1.5 py-0.5">{no}</span>}
          <h3 className="text-sm font-semibold text-gray-700 flex-1">{title}</h3>
          {headerAction}
        </div>
        <div className="p-5">{children}</div>
      </div>
    </section>
  );
}

// ── Type Selection Grid ───────────────────────────────────────────────────────

function TypeSelectView({ onSelect }: { onSelect: (type: LegalCardTypeDef) => void }) {
  const categoryColors: Record<string, string> = {
    중장비: "bg-blue-50 text-blue-700 border-blue-200",
    차량계: "bg-orange-50 text-orange-700 border-orange-200",
    화학: "bg-purple-50 text-purple-700 border-purple-200",
    전기: "bg-yellow-50 text-yellow-700 border-yellow-200",
    토공: "bg-amber-50 text-amber-700 border-amber-200",
    구조물: "bg-indigo-50 text-indigo-700 border-indigo-200",
    해체: "bg-red-50 text-red-700 border-red-200",
    중량물: "bg-teal-50 text-teal-700 border-teal-200",
    궤도: "bg-green-50 text-green-700 border-green-200",
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50">
      <div className="max-w-5xl mx-auto w-full px-6 py-8">
        <div className="mb-7">
          <h1 className="text-xl font-bold text-gray-800">법정 작업계획서 작성</h1>
          <p className="text-sm text-gray-500 mt-1">
            산업안전보건기준에 관한 규칙 제38조 제1항 — 13개 작업유형 중 해당하는 유형을 선택하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEGAL_CARD_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className="text-left bg-white rounded-xl border border-gray-200 hover:border-teal-400 hover:shadow-md transition-all p-5 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{t.icon}</span>
                  <span className="text-lg font-bold text-gray-400">#{t.no.toString().padStart(2, "0")}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded border ${categoryColors[t.category] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                  {t.category}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-800 group-hover:text-teal-700 leading-snug mb-2">{t.shortLabel}</p>
              <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{t.description}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                {t.preSurveyFields.length > 0 && (
                  <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span> 사전조사 필요</span>
                )}
                <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block"></span> 작업계획 {t.planFields.length}항목</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Document List for a type ──────────────────────────────────────────────────

function DocListView({
  type,
  docs,
  onNew,
  onOpen,
  onDelete,
  onBack,
}: {
  type: LegalCardTypeDef;
  docs: CardDoc[];
  onNew: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}) {
  const statusLabel: Record<string, string> = { draft: "작성중", completed: "완료" };
  const statusCls: Record<string, string> = { draft: "bg-amber-100 text-amber-700", completed: "bg-green-100 text-green-700" };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50">
      <div className="max-w-3xl mx-auto w-full px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <button onClick={onBack} className={btn("ghost") + " px-2"}>← 뒤로</button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{type.icon}</span>
              <h1 className="text-lg font-bold text-gray-800">{type.shortLabel}</h1>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{type.legalBasis}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">저장된 작업계획서 <span className="font-bold text-gray-800">{docs.length}건</span></p>
          <button onClick={onNew} className={btn("primary")}>+ 새 작업계획서 작성</button>
        </div>

        {docs.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-400 text-sm mb-4">작성된 작업계획서가 없습니다.</p>
            <button onClick={onNew} className={btn("primary")}>첫 번째 작성하기</button>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((d) => (
              <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer" onClick={() => onOpen(d.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800 truncate">{d.overview.workName || "(제목 없음)"}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusCls[d.status]}`}>{statusLabel[d.status]}</span>
                  </div>
                  <p className="text-xs text-gray-400">{d.overview.createdDate} · {d.overview.location || "-"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); onOpen(d.id); }} className={btn("secondary") + " text-xs"}>열기</button>
                  <button onClick={(e) => { e.stopPropagation(); if (confirm("삭제하시겠습니까?")) onDelete(d.id); }} className="text-xs text-red-400 hover:text-red-600 px-2">삭제</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Signature Modal ───────────────────────────────────────────────────────────

type SignMode = "draw" | "load" | "request";
const SIGN_MODES: { key: SignMode; label: string }[] = [
  { key: "draw",    label: "✏️ 직접 서명" },
  { key: "load",    label: "👥 직원명단 불러오기" },
  { key: "request", label: "📨 요청하기" },
];

function SignatureModal({ fieldLabel, onSave, onClose }: {
  fieldLabel: string;
  onSave: (dataUrl: string, name?: string) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<SignMode>("draw");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [loadName, setLoadName] = useState("");
  const [reqName, setReqName] = useState("");
  const [reqContact, setReqContact] = useState("");

  const getPos = (e: React.MouseEvent | React.TouchEvent, c: HTMLCanvasElement) => {
    const r = c.getBoundingClientRect();
    if ("touches" in e) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    return { x: (e as React.MouseEvent).clientX - r.left, y: (e as React.MouseEvent).clientY - r.top };
  };
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const p = getPos(e, c);
    ctx.beginPath(); ctx.moveTo(p.x, p.y);
    setIsDrawing(true); setHasDrawn(true);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const p = getPos(e, c);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.stroke();
  };
  const stopDraw = () => setIsDrawing(false);
  const clearCanvas = () => {
    const c = canvasRef.current; if (!c) return;
    c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    setHasDrawn(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <span className="text-sm font-semibold text-slate-700">{fieldLabel} 서명</span>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <div className="flex border-b border-slate-100">
          {SIGN_MODES.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setMode(key)}
              className="flex-1 py-2.5 text-xs font-medium transition-colors"
              style={{ borderBottom: mode === key ? `2px solid ${PRIMARY}` : "2px solid transparent", color: mode === key ? PRIMARY : "#64748b" }}>
              {label}
            </button>
          ))}
        </div>
        <div className="p-5">
          {mode === "draw" && (
            <div className="space-y-3">
              <canvas ref={canvasRef} width={440} height={160}
                className="w-full rounded-xl border-2 border-dashed border-slate-200 bg-white cursor-crosshair touch-none"
                style={{ height: 160 }}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
              <p className="text-xs text-center text-slate-400">서명란에 마우스 또는 터치로 서명하세요</p>
              <div className="flex gap-2">
                <button type="button" onClick={clearCanvas}
                  className="flex-1 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">초기화</button>
                <button type="button" disabled={!hasDrawn}
                  onClick={() => { const c = canvasRef.current; if (c) onSave(c.toDataURL("image/png")); }}
                  className="flex-1 py-2 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-40"
                  style={{ background: PRIMARY }}>서명 저장</button>
              </div>
            </div>
          )}
          {mode === "load" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">직원명단에서 담당자를 선택하세요</p>
              <input type="text" value={loadName} onChange={(e) => setLoadName(e.target.value)}
                placeholder="이름 검색"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-400" />
              <div className="rounded-xl border border-slate-100 divide-y divide-slate-50 max-h-40 overflow-y-auto">
                {loadName.trim() ? (
                  <button type="button" onMouseDown={() => onSave("", loadName.trim())}
                    className="w-full px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors">
                    {loadName}
                  </button>
                ) : (
                  <div className="px-3 py-6 text-center text-xs text-slate-400">이름을 입력하여 검색하세요</div>
                )}
              </div>
              <p className="text-[11px] text-slate-400">※ 직원명단 연동은 SafeBuddy 시스템 설정에서 구성할 수 있습니다</p>
            </div>
          )}
          {mode === "request" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">서명 요청을 보낼 담당자 정보를 입력하세요</p>
              <div>
                <label className="ptw-label">담당자 이름</label>
                <input type="text" value={reqName} onChange={(e) => setReqName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-400" />
              </div>
              <div>
                <label className="ptw-label">연락처 (전화번호 또는 이메일)</label>
                <input type="text" value={reqContact} onChange={(e) => setReqContact(e.target.value)}
                  placeholder="010-0000-0000 또는 name@company.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-400" />
              </div>
              <button type="button" disabled={!reqName.trim() || !reqContact.trim()}
                onClick={() => { alert(`${reqName}(${reqContact})에게 서명 요청을 보냈습니다.`); onClose(); }}
                className="w-full py-2 rounded-lg text-xs font-medium text-white disabled:opacity-40 transition-colors"
                style={{ background: PRIMARY }}>
                서명 요청 보내기
              </button>
              <p className="text-[11px] text-slate-400">※ 실제 알림 발송은 SafeBuddy 알림 설정이 필요합니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Overview Section ──────────────────────────────────────────────────────────

function SignerCard({ label, name, onNameChange, signature, onSignClick, placeholder, onRemove }: {
  label: string; name: string; onNameChange: (v: string) => void;
  signature: string; onSignClick: () => void; placeholder?: string;
  onRemove?: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-gray-200">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <div className="flex items-center gap-1.5">
          {onRemove && (
            <button type="button" onClick={onRemove}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors"
              style={{ borderColor: "#fca5a5", color: "#ef4444", background: "#fef2f2" }}>
              − 제거
            </button>
          )}
          <button type="button" onClick={onSignClick}
            className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors"
            style={{ background: signature ? PRIMARY_LIGHT : "#f1f5f9", color: signature ? PRIMARY : "#64748b" }}>
            {signature ? "재서명" : "서명"}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-center h-20 bg-white">
        {signature
          ? <img src={signature} alt="서명" className="h-16 object-contain max-w-full px-2" />
          : <span className="text-slate-300 text-[11px]">서명 없음</span>
        }
      </div>
      <div className="border-t border-gray-100">
        <input type="text" value={name} onChange={(e) => onNameChange(e.target.value)}
          placeholder={placeholder ?? "홍길동"}
          className="w-full px-3 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-inset bg-white"
          style={{ "--tw-ring-color": PRIMARY } as React.CSSProperties} />
      </div>
    </div>
  );
}

function OverviewSection({ data, onChange, typeId }: { data: CardOverview; onChange: (k: keyof CardOverview, v: string | boolean) => void; typeId?: string }) {
  const [signFor, setSignFor] = useState<"author" | "reviewer" | null>(null);

  const typeDef = typeId ? LEGAL_CARD_TYPES.find((t) => t.id === typeId) : undefined;
  const workNameFallback = typeDef?.shortLabel ?? "";

  const autoDocName = (() => {
    const d = data.createdDate ? new Date(data.createdDate) : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const wn = data.workName || workNameFallback;
    return `${y}년 ${m}월 ${day}일 ${wn ? `${wn} ` : ""}작업계획서`;
  })();

  const durationDays = (() => {
    if (!data.startDate || !data.endDate) return null;
    const diff = Math.round((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / 86400000);
    return diff >= 0 ? diff + 1 : null;
  })();

  return (
    <div className="space-y-3">
      {/* 사업장명 */}
      <div>
        <label className="ptw-label flex items-center gap-1.5">
          사업장명
          <span className="text-xs px-1.5 py-0.5 rounded font-normal" style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>연동</span>
        </label>
        <input type="text" value={data.siteName} readOnly placeholder="SafeBuddy 연동"
          className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
          style={{ borderColor: `${PRIMARY}22` }} />
      </div>

      {/* 문서명 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="ptw-label mb-0">문서명</label>
          {data.docName && (
            <button type="button" onClick={() => onChange("docName", "")}
              className="text-[11px] text-slate-400 hover:text-teal-500 transition-colors">↺ 기본값으로</button>
          )}
        </div>
        <input type="text" value={data.docName} onChange={(e) => onChange("docName", e.target.value)}
          placeholder={autoDocName} className={inp} />
        {!data.docName && <p className="text-[11px] text-slate-400 mt-0.5">기본값: {autoDocName}</p>}
      </div>

      {/* 작업명 + 작성일 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Field label="작업명" required>
            <input className={inp} value={data.workName} onChange={(e) => onChange("workName", e.target.value)} placeholder={workNameFallback || "예: 굴착기 작업"} />
          </Field>
        </div>
        <Field label="작성일">
          <input className={inp} type="date" value={data.createdDate} onChange={(e) => onChange("createdDate", e.target.value)} />
        </Field>
      </div>

      {/* 업체명/작업장소 + 작성자/검토자 */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left: 업체명 (top) + 작업장소 (bottom) */}
        <div className="space-y-3">
          <Field label="업체명">
            <input className={inp} value={data.companyName} onChange={(e) => onChange("companyName", e.target.value)} placeholder="업체명" />
          </Field>
          <Field label="작업장소">
            <input className={inp} value={data.location} onChange={(e) => onChange("location", e.target.value)} placeholder="예: 제1공장 3층" />
          </Field>
        </div>
        {/* Right: 작성자 + 검토자(조건부) — 좌우 배치 */}
        <div className="grid grid-cols-2 gap-3">
          <SignerCard
            label={data.showReviewer ? "작성자(작업업체 담당자)" : "작성자(담당자)"}
            name={data.author} onNameChange={(v) => onChange("author", v)}
            signature={data.authorSignature ?? ""}
            onSignClick={() => setSignFor("author")}
            placeholder="홍길동" />
          {data.showReviewer ? (
            <SignerCard
              label="검토자(작업업체 책임자)"
              name={data.reviewer ?? ""} onNameChange={(v) => onChange("reviewer", v)}
              signature={data.reviewerSignature ?? ""}
              onSignClick={() => setSignFor("reviewer")}
              onRemove={() => { onChange("showReviewer", false); onChange("reviewer", ""); onChange("reviewerSignature", ""); }}
              placeholder="홍길동" />
          ) : (
            <div className="flex items-center justify-center">
              <button type="button"
                onClick={() => onChange("showReviewer", true)}
                className="flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-full border transition-colors"
                style={{ borderColor: PRIMARY, color: PRIMARY, background: PRIMARY_LIGHT }}>
                + 검토자 서명 추가
              </button>
            </div>
          )}
        </div>
      </div>

      {signFor && (
        <SignatureModal
          fieldLabel={signFor === "author" ? (data.showReviewer ? "작성자(작업업체 담당자)" : "작성자(담당자)") : "검토자(작업업체 책임자)"}
          onSave={(dataUrl, name) => {
            if (signFor === "author") {
              if (name) onChange("author", name);
              if (dataUrl) onChange("authorSignature", dataUrl);
            } else {
              if (name) onChange("reviewer", name);
              if (dataUrl) onChange("reviewerSignature", dataUrl);
            }
            setSignFor(null);
          }}
          onClose={() => setSignFor(null)}
        />
      )}

      {/* 작업기간 */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <label className="ptw-label mb-0">작업기간</label>
          {durationDays !== null
            ? <span className="px-2 py-0.5 rounded-md text-xs font-semibold" style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>📅 총 {durationDays}일</span>
            : <span className="text-xs text-slate-400">시작일·종료일 입력 시 총 기간 표시</span>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="작업시작일">
            <input className={inp} type="date" value={data.startDate} onChange={(e) => onChange("startDate", e.target.value)} />
          </Field>
          <Field label="작업종료일">
            <input className={inp} type="date" value={data.endDate} onChange={(e) => onChange("endDate", e.target.value)} />
          </Field>
        </div>
      </div>

      {/* 작업개요 */}
      <Field label="작업개요">
        <textarea className={`${txa} h-24`} value={data.description} onChange={(e) => onChange("description", e.target.value)}
          placeholder="작업의 목적, 내용, 방법 등을 간략히 기재하세요" />
      </Field>
    </div>
  );
}

// ── Plan Fields Renderer ──────────────────────────────────────────────────────

function PlanFieldsRenderer({
  fields,
  values,
  checkboxItems,
  checkboxNotes,
  onChangeValue,
  onToggleCheckbox,
  onChangeCheckboxNote,
}: {
  fields: LegalCardTypeDef["planFields"];
  values: Record<string, string>;
  checkboxItems: Record<string, Record<string, boolean>>;
  checkboxNotes: Record<string, Record<string, string>>;
  onChangeValue: (fieldId: string, value: string) => void;
  onToggleCheckbox: (fieldId: string, item: string) => void;
  onChangeCheckboxNote: (fieldId: string, item: string, note: string) => void;
}) {
  return (
    <div className="space-y-5">
      {fields.map((f) => (
        <div key={f.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
          <div className="mb-2 flex items-start gap-2">
            <span className="inline-block text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded px-1.5 py-0.5 shrink-0 mt-0.5">{f.no}</span>
            <div>
              <p className="text-sm font-medium text-gray-700">{f.label}{f.required && <span className="text-red-500 ml-1">*</span>}</p>
              {f.hint && <p className="text-xs text-amber-600 mt-0.5">※ {f.hint}</p>}
            </div>
          </div>

          {f.type === "checkboxItems" && f.items ? (
            <div className="space-y-2 mt-3">
              {f.items.map((item) => {
                const checked = checkboxItems[f.id]?.[item] ?? false;
                const note = checkboxNotes[f.id]?.[item] ?? "";
                return (
                  <div key={item} className="bg-white rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        id={`cb-${f.id}-${item}`}
                        checked={checked}
                        onChange={() => onToggleCheckbox(f.id, item)}
                        className="w-4 h-4 accent-teal-500 shrink-0"
                      />
                      <label htmlFor={`cb-${f.id}-${item}`} className="text-sm text-gray-700 font-medium cursor-pointer">{item}</label>
                    </div>
                    <textarea
                      className={`${txa} h-16 mt-1`}
                      value={note}
                      onChange={(e) => onChangeCheckboxNote(f.id, item, e.target.value)}
                      placeholder={`${item}에 대한 구체적인 대책을 기재하세요`}
                    />
                  </div>
                );
              })}
            </div>
          ) : f.type === "textarea" ? (
            <textarea
              className={`${txa} h-28 mt-1`}
              value={values[f.id] ?? ""}
              onChange={(e) => onChangeValue(f.id, e.target.value)}
              placeholder={f.placeholder}
            />
          ) : f.type === "select" && f.options ? (
            <select className={inp + " mt-1"} value={values[f.id] ?? ""} onChange={(e) => onChangeValue(f.id, e.target.value)}>
              <option value="">선택하세요</option>
              {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input
              className={inp + " mt-1"}
              value={values[f.id] ?? ""}
              onChange={(e) => onChangeValue(f.id, e.target.value)}
              placeholder={f.placeholder}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Form View ─────────────────────────────────────────────────────────────────

type NavItem = { id: string; label: string };

function FormView({
  type,
  doc,
  onSave,
  onBack,
}: {
  type: LegalCardTypeDef;
  doc: CardDoc;
  onSave: (updated: CardDoc) => void;
  onBack: () => void;
}) {
  const [data, setData] = useState<CardDoc>(doc);
  const [isDirty, setIsDirty] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [activeNav, setActiveNav] = useState("overview");
  const [pdfModal, setPdfModal] = useState<{ url: string; title: string } | null>(null);
  const [importModal, setImportModal] = useState<ImportSection | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const navItems: NavItem[] = [
    { id: "overview", label: "작업 개요" },
    { id: "personnel", label: "작업인원 배치" },
    { id: "equipment", label: "사용 장비" },
    ...(type.preSurveyFields.length > 0 ? [{ id: "preSurvey", label: "사전조사" }] : []),
    { id: "plan", label: "작업계획서 내용" },
    { id: "drawings", label: "운행경로 및 작업계획 도면" },
    { id: "riskAssessment", label: "위험성평가" },
    { id: "safetyChecklist", label: "안전점검" },
    { id: "training", label: "안전교육" },
    { id: "emergency", label: "비상연락망" },
    { id: "otherFiles", label: "기타 첨부파일" },
  ];

  const mark = useCallback(<K extends keyof CardDoc>(key: K, value: CardDoc[K]) => {
    setData((prev) => ({ ...prev, [key]: value, updatedAt: new Date().toISOString() }));
    setIsDirty(true);
  }, []);

  const handleOverview = useCallback((k: keyof CardOverview, v: string | boolean) => {
    setData((prev) => ({ ...prev, overview: { ...prev.overview, [k]: v }, updatedAt: new Date().toISOString() }));
    setIsDirty(true);
  }, []);

  const handlePersonnel = useCallback((d: PersonnelData) => {
    setData((prev) => ({ ...prev, personnel: d, updatedAt: new Date().toISOString() }));
    setIsDirty(true);
  }, []);

  const handleEquipment = useCallback((d: EquipmentData) => {
    setData((prev) => ({ ...prev, equipment: d, updatedAt: new Date().toISOString() }));
    setIsDirty(true);
  }, []);

  const handleRisk = useCallback((d: RiskData) => {
    setData((prev) => ({ ...prev, riskAssessment: d, updatedAt: new Date().toISOString() }));
    setIsDirty(true);
  }, []);

  const handleSafetyChecklist = useCallback((d: SafetyCheckData) => {
    setData((prev) => ({ ...prev, safetyChecklist: d, updatedAt: new Date().toISOString() }));
    setIsDirty(true);
  }, []);

  const handleTraining = useCallback((d: TrainingData) => {
    setData((prev) => ({ ...prev, training: d, updatedAt: new Date().toISOString() }));
    setIsDirty(true);
  }, []);

  const handleEmergency = useCallback((d: EmergencyData) => {
    setData((prev) => ({ ...prev, emergency: d, updatedAt: new Date().toISOString() }));
    setIsDirty(true);
  }, []);

  const handleDrawings = useCallback((d: DrawingsData) => {
    setData((prev) => ({ ...prev, drawings: d, updatedAt: new Date().toISOString() }));
    setIsDirty(true);
  }, []);

  const handleOtherFiles = useCallback((d: OtherFilesData) => {
    setData((prev) => ({ ...prev, otherFiles: d, updatedAt: new Date().toISOString() }));
    setIsDirty(true);
  }, []);

  const handlePreSurvey = useCallback((fieldId: string, value: string) => {
    setData((prev) => ({ ...prev, preSurvey: { ...prev.preSurvey, [fieldId]: value }, updatedAt: new Date().toISOString() }));
    setIsDirty(true);
  }, []);

  const handlePlanValue = useCallback((fieldId: string, value: string) => {
    setData((prev) => ({ ...prev, plan: { ...prev.plan, [fieldId]: value }, updatedAt: new Date().toISOString() }));
    setIsDirty(true);
  }, []);

  const handleImport = useCallback((section: ImportSection, source: CardDoc) => {
    setData((prev) => ({
      ...prev,
      ...(section === "riskAssessment" ? { riskAssessment: source.riskAssessment } : {}),
      ...(section === "safetyChecklist" ? { safetyChecklist: source.safetyChecklist } : {}),
      ...(section === "training" ? { training: source.training } : {}),
      updatedAt: new Date().toISOString(),
    }));
    setIsDirty(true);
  }, []);

  const handleToggleCheckbox = useCallback((fieldId: string, item: string) => {
    setData((prev) => {
      const prev_ = prev.checkboxItems[fieldId] ?? {};
      return { ...prev, checkboxItems: { ...prev.checkboxItems, [fieldId]: { ...prev_, [item]: !prev_[item] } }, updatedAt: new Date().toISOString() };
    });
    setIsDirty(true);
  }, []);

  const handleCheckboxNote = useCallback((fieldId: string, item: string, note: string) => {
    setData((prev) => {
      const prev_ = prev.checkboxNotes[fieldId] ?? {};
      return { ...prev, checkboxNotes: { ...prev.checkboxNotes, [fieldId]: { ...prev_, [item]: note } }, updatedAt: new Date().toISOString() };
    });
    setIsDirty(true);
  }, []);

  const handleSave = () => {
    onSave(data);
    setIsDirty(false);
    setSaveMsg("저장됨");
    setTimeout(() => setSaveMsg(""), 2000);
  };

  const handleComplete = () => {
    const updated = { ...data, status: "completed" as const, updatedAt: new Date().toISOString() };
    setData(updated);
    onSave(updated);
    setIsDirty(false);
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(`sec-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveNav(id);
  };

  useEffect(() => {
    observerRef.current?.disconnect();
    const root = scrollRef.current;
    if (!root) return;
    const handler = (entries: IntersectionObserverEntry[]) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length > 0) setActiveNav(visible[0].target.id.replace("sec-", ""));
    };
    observerRef.current = new IntersectionObserver(handler, { root, rootMargin: "-5% 0px -65% 0px", threshold: [0, 0.25, 0.5, 1] });
    navItems.forEach(({ id }) => {
      const el = document.getElementById(`sec-${id}`);
      if (el) observerRef.current!.observe(el);
    });
    return () => observerRef.current?.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type.id]);

  const statusCls: Record<string, string> = { draft: "bg-amber-100 text-amber-700", completed: "bg-green-100 text-green-700" };
  const statusLabel: Record<string, string> = { draft: "작성중", completed: "완료" };

  return (
    <>
    {pdfModal && (
      <PdfModal url={pdfModal.url} title={pdfModal.title} onClose={() => setPdfModal(null)} />
    )}
    {importModal && (
      <SafetyCardImportModal
        section={importModal}
        onImport={(source) => handleImport(importModal, source)}
        onClose={() => setImportModal(null)}
      />
    )}
    <div className="flex h-full overflow-hidden">
      {/* ── Left sidebar (lg+) ── */}
      <aside className="hidden lg:flex w-52 bg-white border-r border-gray-200 flex-col shrink-0">
        <div className="px-4 py-3 border-b border-gray-100">
          <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-2">← 목록으로</button>
          <div className="flex items-center gap-2">
            <span className="text-lg">{type.icon}</span>
            <span className="text-xs font-semibold text-gray-700 leading-tight">{type.shortLabel}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusCls[data.status]}`}>{statusLabel[data.status]}</span>
            {isDirty && <span className="text-xs text-amber-500">미저장</span>}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((n) => (
            <button
              key={n.id}
              onClick={() => scrollTo(n.id)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                activeNav === n.id
                  ? "bg-[#E6FAF9] text-teal-700 font-semibold border-r-2 border-[#00B7AF]"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {n.label}
            </button>
          ))}
          {activeNav === "plan" && (
            <div className="pl-4 border-l-2 border-gray-100 ml-4 mt-1 space-y-0.5">
              {type.planFields.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    const el = document.getElementById(`pf-${f.id}`);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="w-full text-left text-xs px-2 py-1.5 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors"
                >
                  {f.no}. {f.label.slice(0, 20)}{f.label.length > 20 ? "…" : ""}
                </button>
              ))}
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-2">
          <button onClick={handleSave} className={`${btn("primary")} w-full justify-center`}>
            {saveMsg ? "✓ 저장됨" : isDirty ? "저장" : "저장됨"}
          </button>
          {data.status === "draft" && (
            <button onClick={handleComplete} className={`${btn("secondary")} w-full justify-center text-xs`}>
              작성 완료
            </button>
          )}
          {data.status === "completed" && (
            <button onClick={() => mark("status", "draft")} className={`${btn("ghost")} w-full justify-center text-xs`}>
              수정하기
            </button>
          )}
        </div>
      </aside>

      {/* ── Main content ── */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto bg-gray-50">

        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2">
              <button onClick={onBack} className="text-xs text-gray-500 hover:text-gray-700 mr-1">← 목록</button>
              <span className="text-base">{type.icon}</span>
              <span className="text-xs font-semibold text-gray-700 truncate max-w-[140px]">{type.shortLabel}</span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusCls[data.status]}`}>{statusLabel[data.status]}</span>
              {isDirty && <span className="text-xs text-amber-500">미저장</span>}
            </div>
            <div className="flex items-center gap-1.5">
              {data.status === "draft" && (
                <button onClick={handleComplete} className={`${btn("secondary")} text-xs py-1 px-2`}>완료</button>
              )}
              <button onClick={handleSave} className={`${btn("primary")} text-xs py-1 px-2`}>
                {saveMsg ? "✓" : "저장"}
              </button>
            </div>
          </div>
          {/* Mobile nav tabs */}
          <div className="flex overflow-x-auto scrollbar-hide border-t border-gray-100 px-2">
            {navItems.map((n) => (
              <button
                key={n.id}
                onClick={() => scrollTo(n.id)}
                className={`shrink-0 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeNav === n.id
                    ? "border-[#00B7AF] text-teal-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">

          {/* Type header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-xl p-5 text-white">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">{type.icon}</span>
              <div>
                <p className="text-xs opacity-80">{type.legalBasis}</p>
                <h2 className="text-lg font-bold leading-snug">{type.label}</h2>
              </div>
            </div>
            <p className="text-sm opacity-80">{type.description}</p>
          </div>

          {/* 작업 개요 */}
          <SectionCard id="overview" title="작업 개요">
            <OverviewSection data={data.overview} onChange={handleOverview} typeId={data.typeId} />
          </SectionCard>

          {/* 작업인원 배치 */}
          <SectionCard id="personnel" title="작업인원 배치">
            <PersonnelSection data={data.personnel ?? emptyPersonnel()} onChange={handlePersonnel} />
          </SectionCard>

          {/* 사용 장비 정보 */}
          <SectionCard id="equipment" title="사용 장비 정보">
            <EquipmentSection data={data.equipment ?? emptyEquipment()} onChange={handleEquipment} allowedEquipKeys={type.allowedEquipKeys} />
          </SectionCard>

          {/* 사전조사 */}
          {type.preSurveyFields.length > 0 && (
            <SectionCard id="preSurvey" title="사전조사 내용">
              {type.preSurveyNote && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <span className="font-semibold">사전조사 목적:</span> {type.preSurveyNote}
                </div>
              )}
              <div className="space-y-4">
                {type.preSurveyFields.map((f) => (
                  <div key={f.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 shrink-0 mt-0.5">{f.no}</span>
                      <p className="text-sm font-medium text-gray-700">{f.label}{f.required && <span className="text-red-500 ml-1">*</span>}</p>
                    </div>
                    <textarea
                      className={`${txa} h-24`}
                      value={data.preSurvey[f.id] ?? ""}
                      onChange={(e) => handlePreSurvey(f.id, e.target.value)}
                      placeholder={f.placeholder}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* 작업계획서 내용 */}
          <SectionCard id="plan" title="작업계획서 내용">
            <div id="plan-top" className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
              <span className="font-semibold">별표 4 기준:</span> {type.legalBasis}에 따른 작업계획서 작성 항목
            </div>
            <div className="space-y-4">
              {type.planFields.map((f) => (
                <div key={f.id} id={`pf-${f.id}`} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                  <div className="mb-2 flex items-start gap-2">
                    <span className="inline-block text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded px-1.5 py-0.5 shrink-0 mt-0.5">{f.no}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{f.label}{f.required && <span className="text-red-500 ml-1">*</span>}</p>
                      {f.hint && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-amber-600">※ {f.hint}</p>
                          {f.pdfUrl && (
                            <button
                              type="button"
                              onClick={() => setPdfModal({ url: f.pdfUrl!, title: f.label })}
                              className="text-xs text-teal-600 border border-teal-300 bg-teal-50 hover:bg-teal-100 rounded px-2 py-0.5 font-medium transition-colors shrink-0"
                            >
                              상세보기
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {f.type === "checkboxItems" && f.items ? (
                    <div className="space-y-2 mt-2">
                      {f.items.map((item) => {
                        const checked = data.checkboxItems[f.id]?.[item] ?? false;
                        const note = data.checkboxNotes[f.id]?.[item] ?? "";
                        return (
                          <div key={item} className="bg-white rounded-lg border border-gray-200 p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <input
                                type="checkbox"
                                id={`cb-${f.id}-${item}`}
                                checked={checked}
                                onChange={() => handleToggleCheckbox(f.id, item)}
                                className="w-4 h-4 accent-teal-500 shrink-0"
                              />
                              <label htmlFor={`cb-${f.id}-${item}`} className={`text-sm font-medium cursor-pointer ${checked ? "text-gray-800" : "text-gray-500"}`}>
                                {item}
                              </label>
                              {checked && <span className="ml-auto text-xs text-teal-600 font-medium">✓ 대책 수립</span>}
                            </div>
                            <textarea
                              className={`${txa} h-20`}
                              value={note}
                              onChange={(e) => handleCheckboxNote(f.id, item, e.target.value)}
                              placeholder={`${item}에 대한 구체적인 예방대책을 기재하세요`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : f.type === "textarea" ? (
                    <textarea
                      className={`${txa} h-28 mt-1`}
                      value={data.plan[f.id] ?? ""}
                      onChange={(e) => handlePlanValue(f.id, e.target.value)}
                      placeholder={f.placeholder}
                    />
                  ) : f.type === "select" && f.options ? (
                    <select className={inp + " mt-1"} value={data.plan[f.id] ?? ""} onChange={(e) => handlePlanValue(f.id, e.target.value)}>
                      <option value="">선택하세요</option>
                      {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      className={inp + " mt-1"}
                      value={data.plan[f.id] ?? ""}
                      onChange={(e) => handlePlanValue(f.id, e.target.value)}
                      placeholder={f.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 도면 */}
          <SectionCard id="drawings" title="운행경로 및 작업계획 도면">
            <DrawingsSection data={data.drawings ?? emptyDrawings()} onChange={handleDrawings} />
          </SectionCard>

          {/* 위험성평가 */}
          <SectionCard id="riskAssessment" title="위험성평가"
            headerAction={
              <button type="button" onClick={() => setImportModal("riskAssessment")}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-teal-200 text-teal-600 bg-teal-50 hover:bg-teal-100 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4 4m0 0l4-4m-4 4V4" /></svg>
                안전카드 불러오기
              </button>
            }>
            <RiskAssessmentSection data={data.riskAssessment ?? emptyRisk()} onChange={handleRisk} />
          </SectionCard>

          {/* 안전점검 */}
          <SectionCard id="safetyChecklist" title="안전점검"
            headerAction={
              <button type="button" onClick={() => setImportModal("safetyChecklist")}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-teal-200 text-teal-600 bg-teal-50 hover:bg-teal-100 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4 4m0 0l4-4m-4 4V4" /></svg>
                안전카드 불러오기
              </button>
            }>
            <SafetyChecklistSection data={data.safetyChecklist ?? emptySafetyChecklist()} onChange={handleSafetyChecklist} />
          </SectionCard>

          {/* 안전교육 */}
          <SectionCard id="training" title="안전교육"
            headerAction={
              <button type="button" onClick={() => setImportModal("training")}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-teal-200 text-teal-600 bg-teal-50 hover:bg-teal-100 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4 4m0 0l4-4m-4 4V4" /></svg>
                안전카드 불러오기
              </button>
            }>
            <TrainingSection data={data.training ?? emptyTraining()} onChange={handleTraining} />
          </SectionCard>

          {/* 비상연락망 */}
          <SectionCard id="emergency" title="비상연락망">
            <EmergencyContactSection data={data.emergency ?? emptyEmergency()} onChange={handleEmergency} />
          </SectionCard>

          {/* 기타 첨부파일 */}
          <SectionCard id="otherFiles" title="기타 첨부파일">
            <OtherFilesSection
              data={data.otherFiles ?? emptyOtherFiles()}
              onChange={handleOtherFiles}
              selectedEquipKeys={data.equipment?.selectedKeys ?? []}
            />
          </SectionCard>

          <div className="h-20" />
        </div>
      </main>
    </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type ViewState = "typeSelect" | "docList" | "form";

export default function SafetyCardWritePage() {
  const [view, setView] = useState<ViewState>("typeSelect");
  const [selectedType, setSelectedType] = useState<LegalCardTypeDef | null>(null);
  const [docs, setDocs] = useState<CardDoc[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  useEffect(() => {
    setDocs(loadAll());
  }, []);

  const docsForType = selectedType ? docs.filter((d) => d.typeId === selectedType.id) : [];
  const activeDoc = activeDocId ? docs.find((d) => d.id === activeDocId) ?? null : null;

  const handleSelectType = (type: LegalCardTypeDef) => {
    setSelectedType(type);
    setView("docList");
  };

  const handleNewDoc = () => {
    if (!selectedType) return;
    const doc = newDoc(selectedType.id);
    const updated = [...docs, doc];
    setDocs(updated);
    saveAll(updated);
    setActiveDocId(doc.id);
    setView("form");
  };

  const handleOpenDoc = (id: string) => {
    setActiveDocId(id);
    setView("form");
  };

  const handleDeleteDoc = (id: string) => {
    const updated = docs.filter((d) => d.id !== id);
    setDocs(updated);
    saveAll(updated);
  };

  const handleSaveDoc = (updated: CardDoc) => {
    const newDocs = docs.map((d) => (d.id === updated.id ? updated : d));
    setDocs(newDocs);
    saveAll(newDocs);
  };

  const handleBackToList = () => {
    setActiveDocId(null);
    setView("docList");
  };

  const handleBackToTypes = () => {
    setSelectedType(null);
    setActiveDocId(null);
    setView("typeSelect");
  };

  if (view === "typeSelect") {
    return <TypeSelectView onSelect={handleSelectType} />;
  }

  if (view === "docList" && selectedType) {
    return (
      <DocListView
        type={selectedType}
        docs={docsForType}
        onNew={handleNewDoc}
        onOpen={handleOpenDoc}
        onDelete={handleDeleteDoc}
        onBack={handleBackToTypes}
      />
    );
  }

  if (view === "form" && selectedType && activeDoc) {
    return (
      <FormView
        type={selectedType}
        doc={activeDoc}
        onSave={handleSaveDoc}
        onBack={handleBackToList}
      />
    );
  }

  return null;
}
