"use client";
import React, { useState } from "react";

const PRIMARY = "#00B7AF";
const PRIMARY_LIGHT = "#E6FAF9";

// ── Shared types ──────────────────────────────────────────────────────────────

export type ExtraData = Record<string, Record<string, unknown>>;
export interface ExtraFormProps {
  data: ExtraData;
  onChange: (sectionKey: string, val: Record<string, unknown>) => void;
}

// ── Shared field helpers ──────────────────────────────────────────────────────

const fi = "w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400 bg-white";

function EqF({ label, value, onChange, placeholder, type = "text", colSpan, tooltip }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; colSpan?: number; tooltip?: string;
}) {
  return (
    <div className={colSpan === 2 ? "col-span-2" : colSpan === 3 ? "col-span-3" : ""}>
      <label className="ptw-label flex items-center gap-1">
        {label}
        {tooltip && (
          <span className="relative group/tip cursor-help inline-flex items-center">
            <span className="w-3.5 h-3.5 rounded-full border border-slate-300 text-slate-400 flex items-center justify-center text-[9px] font-bold leading-none hover:border-teal-400 hover:text-teal-500 transition-colors select-none">?</span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-2.5 py-2 rounded-lg bg-slate-800 text-white text-[11px] leading-snug z-50 pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity shadow-lg whitespace-normal">
              {tooltip}
              <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
            </span>
          </span>
        )}
      </label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={fi} />
    </div>
  );
}

function EqTA({ label, value, onChange, placeholder, rows = 2 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label className="ptw-label">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className={`${fi} resize-none`} />
    </div>
  );
}

function EqSub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-500 border-b border-slate-100 pb-1">{title}</p>
      {children}
    </div>
  );
}

interface CheckRow { checked: boolean; note: string }
type CheckTableData = Record<string, CheckRow>;

function EqChecklist({ items, data, onChange }: {
  items: string[];
  data: CheckTableData;
  onChange: (d: CheckTableData) => void;
}) {
  const upd = (item: string, field: keyof CheckRow, val: boolean | string) =>
    onChange({ ...data, [item]: { checked: data[item]?.checked ?? false, note: data[item]?.note ?? "", [field]: val } });
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-xs" style={{ tableLayout: "fixed" }}>
        <colgroup><col style={{ width: "2rem" }} /><col style={{ width: "44%" }} /><col /></colgroup>
        <thead>
          <tr style={{ background: PRIMARY_LIGHT }}>
            <th className="px-3 py-2" />
            <th className="px-3 py-2 text-left font-medium text-slate-600">점검 항목</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">확인 내용 및 조치</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => {
            const row = data[c] ?? { checked: false, note: "" };
            return (
              <tr key={c} className="border-t border-slate-100">
                <td className="px-3 py-2 text-center">
                  <div className="w-4 h-4 rounded border-2 flex items-center justify-center text-white cursor-pointer mx-auto"
                    style={{ background: row.checked ? PRIMARY : "white", borderColor: row.checked ? PRIMARY : "#cbd5e1", fontSize: "0.55rem" }}
                    onClick={() => upd(c, "checked", !row.checked)}>{row.checked ? "✓" : ""}</div>
                </td>
                <td className="px-3 py-2 font-medium" style={{ color: row.checked ? PRIMARY : "#64748b" }}>{c}</td>
                <td className="px-2 py-1.5">
                  <input type="text" value={row.note} onChange={(e) => upd(c, "note", e.target.value)}
                    disabled={!row.checked}
                    className={`${fi} disabled:bg-slate-50 disabled:text-slate-300`}
                    placeholder={row.checked ? "확인 내용 및 조치 입력" : "—"} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EqTokens({ label, items, selected, onToggle, customKey, customVal, onCustomChange }: {
  label: string; items: string[]; selected: string; onToggle: (v: string) => void;
  customKey?: string; customVal?: string; onCustomChange?: (v: string) => void;
}) {
  return (
    <div>
      {label && <label className="ptw-label">{label}</label>}
      <div className="flex flex-wrap gap-1.5 mt-1">
        {items.map((m) => (
          <button key={m} type="button" onClick={() => onToggle(m)}
            className="text-xs px-3 py-1 rounded-full border transition-all"
            style={{ background: selected === m ? PRIMARY : "white", borderColor: selected === m ? PRIMARY : "#e2e8f0", color: selected === m ? "white" : "#64748b" }}>
            {m}
          </button>
        ))}
        {customKey && selected === customKey && (
          <input type="text" value={customVal ?? ""} onChange={(e) => onCustomChange?.(e.target.value)}
            placeholder="직접 입력" autoFocus
            className="px-3 py-1 border border-slate-200 rounded-full text-xs outline-none focus:border-teal-400 w-36" />
        )}
      </div>
    </div>
  );
}

function EqMultiTokens({ label, items, selected, onToggle, customVal, onCustomChange }: {
  label: string; items: string[]; selected: string[]; onToggle: (v: string) => void;
  customVal?: string; onCustomChange?: (v: string) => void;
}) {
  return (
    <div>
      {label && <label className="ptw-label">{label}</label>}
      <div className="flex flex-wrap gap-1.5 mt-1">
        {items.map((m) => {
          const active = selected.includes(m);
          return (
            <button key={m} type="button" onClick={() => onToggle(m)}
              className="text-xs px-3 py-1 rounded-full border transition-all"
              style={{ background: active ? PRIMARY : "white", borderColor: active ? PRIMARY : "#e2e8f0", color: active ? "white" : "#64748b" }}>
              {m}
            </button>
          );
        })}
        {selected.includes("기타") && (
          <input type="text" value={customVal ?? ""} onChange={(e) => onCustomChange?.(e.target.value)}
            placeholder="직접 입력" autoFocus
            className="px-3 py-1 border border-slate-200 rounded-full text-xs outline-none focus:border-teal-400 w-36" />
        )}
      </div>
    </div>
  );
}

function EqCheckboxList({ items, data, onChange }: {
  items: string[]; data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 px-4 py-3 space-y-1">
      {items.map((c) => (
        <div key={c} className="flex items-center gap-2 py-0.5">
          <div className="w-4 h-4 rounded border-2 flex items-center justify-center text-white cursor-pointer shrink-0"
            style={{ background: data[c] ? PRIMARY : "white", borderColor: data[c] ? PRIMARY : "#cbd5e1", fontSize: "0.55rem" }}
            onClick={() => onChange({ ...data, [c]: !data[c] })}>{data[c] ? "✓" : ""}</div>
          <span className="text-xs" style={{ color: data[c] ? PRIMARY : "#64748b" }}>{c}</span>
        </div>
      ))}
    </div>
  );
}

// ── Utility row table (crane swing / excavator utility) ───────────────────────

function EqRowTable({ items, colLabel, data, onChange }: {
  items: string[]; colLabel: string;
  data: CheckTableData; onChange: (d: CheckTableData) => void;
}) {
  const upd = (item: string, field: keyof CheckRow, val: boolean | string) =>
    onChange({ ...data, [item]: { checked: data[item]?.checked ?? false, note: data[item]?.note ?? "", [field]: val } });
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-xs" style={{ tableLayout: "fixed" }}>
        <colgroup><col style={{ width: "2rem" }} /><col style={{ width: "40%" }} /><col /></colgroup>
        <thead>
          <tr style={{ background: PRIMARY_LIGHT }}>
            <th className="px-3 py-2" />
            <th className="px-3 py-2 text-left font-medium text-slate-600">{colLabel}</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">확인 내용 및 조치</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const row = data[item] ?? { checked: false, note: "" };
            return (
              <tr key={item} className="border-t border-slate-100">
                <td className="px-3 py-2 text-center">
                  <div className="w-4 h-4 rounded border-2 flex items-center justify-center text-white cursor-pointer mx-auto"
                    style={{ background: row.checked ? PRIMARY : "white", borderColor: row.checked ? PRIMARY : "#cbd5e1", fontSize: "0.55rem" }}
                    onClick={() => upd(item, "checked", !row.checked)}>{row.checked ? "✓" : ""}</div>
                </td>
                <td className="px-3 py-2 font-medium" style={{ color: row.checked ? PRIMARY : "#64748b" }}>{item}</td>
                <td className="px-2 py-1.5">
                  <input type="text" value={row.note} onChange={(e) => upd(item, "note", e.target.value)}
                    disabled={!row.checked} className={`${fi} disabled:bg-slate-50 disabled:text-slate-300`}
                    placeholder={row.checked ? "내용 및 조치 기재" : "—"} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Truck ─────────────────────────────────────────────────────────────────────

const TRUCK_VEHICLE_TYPES = ["덤프트럭", "화물자동차", "특수운반차량(트레일러)", "특수운반차량(윙바디)", "기타"];
const TRUCK_OVERTURN_ITEMS = ["전복 방지 장치 설치", "후진 경보 장치 작동 확인", "경광등 설치 확인", "안전 속도 준수 (20km/h 이하)", "과적 여부 확인"];
const TRUCK_CHECKLIST_ITEMS = [
  "브레이크 / 클러치 / 유압장치 이상 없음",
  "적재함 고정철물 / 로프 / 사다리 이상 없음",
  "좌석 안전띠 착용 가능 상태",
  "후사경 / 후방영상표시장치 정상",
  "전조등 / 후미등 / 후진경보기 정상",
  "안전블록 / 지주 / 쐐기 비치 확인",
  "급강하 방지장치(유압밸브) 이상 없음",
];

export function TruckExtraForms({ data, onChange }: ExtraFormProps) {
  const s = <K extends string>(k: K) => ((data[k] ?? {}) as Record<string, unknown>);
  const u = (k: string, v: Record<string, unknown>) => onChange(k, v);
  const f = (k: string, fk: string) => (s(k)[fk] as string) ?? "";
  const upd = (k: string, fk: string, v: unknown) => u(k, { ...s(k), [fk]: v });
  return (
    <div className="space-y-5">
      <EqSub title="차량 제원">
        <EqTokens label="차량 종류" items={TRUCK_VEHICLE_TYPES} selected={f("spec","vehicleType")}
          onToggle={(v) => upd("spec","vehicleType", f("spec","vehicleType") === v ? "" : v)} />
        <div className="grid grid-cols-4 gap-2 mt-2">
          <EqF label="제한속도 (km/h)" value={f("spec","speedLimit")} onChange={(v) => upd("spec","speedLimit",v)} placeholder="예: 30" type="number" />
          <EqF label="최고속도 (km/h)" value={f("spec","speedMax")} onChange={(v) => upd("spec","speedMax",v)} placeholder="예: 80" type="number" />
          <EqF label="등판능력 (최대경사각)" value={f("spec","climbAngle")} onChange={(v) => upd("spec","climbAngle",v)} placeholder="예: 25°"
            tooltip="최대적재중량 상태의 트럭이 경사면을 올라갈 수 있는 능력(경사지면 최대경사각으로 표시)" />
          <div />
        </div>
        <div className="grid grid-cols-4 gap-2 mt-1">
          <EqF label="덤프 최대경사각 (도)" value={f("spec","dumpAngle")} onChange={(v) => upd("spec","dumpAngle",v)} placeholder="예: 50" type="number" />
          <EqF label="덤프 상승시간 (sec)" value={f("spec","dumpRiseTime")} onChange={(v) => upd("spec","dumpRiseTime",v)} placeholder="예: 15" type="number" />
        </div>
      </EqSub>
      <EqSub title="운행 경로">
        <div className="grid grid-cols-4 gap-2">
          <EqF label="운행 경로 (경유지 포함)" value={f("route","route")} onChange={(v) => upd("route","route",v)} placeholder="출발지 → 경유지 → 목적지" colSpan={2} />
          <EqF label="운행 거리 (km)" value={f("route","distance")} onChange={(v) => upd("route","distance",v)} placeholder="예: 2.5" type="number" />
          <EqF label="예상 소요 시간" value={f("route","duration")} onChange={(v) => upd("route","duration",v)} placeholder="예: 30분" />
        </div>
      </EqSub>
      <EqSub title="최대 적재량 및 하중">
        <div className="grid grid-cols-4 gap-2">
          <EqF label="최대 적재량 (ton)" value={f("load","maxLoad")} onChange={(v) => upd("load","maxLoad",v)} placeholder="예: 15" type="number" />
          <EqF label="실제 적재량 (ton)" value={f("load","actualLoad")} onChange={(v) => upd("load","actualLoad",v)} placeholder="예: 12" type="number" />
          <EqF label="적재물 종류" value={f("load","material")} onChange={(v) => upd("load","material",v)} placeholder="예: 콘크리트 폐기물" />
          <EqF label="낙하 방지 조치" value={f("load","fallPrevention")} onChange={(v) => upd("load","fallPrevention",v)} placeholder="덮개 설치, 결속 방법 등" />
        </div>
      </EqSub>
      <EqSub title="도로 상태 및 구배">
        <div className="grid grid-cols-4 gap-2">
          <EqF label="도로 폭원 (m)" value={f("road","width")} onChange={(v) => upd("road","width",v)} placeholder="예: 6.0" type="number" />
          <EqF label="최대 구배 (%)" value={f("road","slope")} onChange={(v) => upd("road","slope",v)} placeholder="예: 8" type="number" />
          <EqF label="도로 상태 특이사항" value={f("road","note")} onChange={(v) => upd("road","note",v)} placeholder="노면 상태, 주의 구간 등" colSpan={2} />
        </div>
      </EqSub>
      <EqSub title="전복·낙하 방지 조치">
        <EqCheckboxList items={TRUCK_OVERTURN_ITEMS} data={s("overturn")} onChange={(d) => u("overturn",d)} />
      </EqSub>
      <EqSub title="사전 점검표">
        <EqChecklist items={TRUCK_CHECKLIST_ITEMS} data={s("checklist") as CheckTableData} onChange={(d) => u("checklist",d)} />
      </EqSub>
    </div>
  );
}

// ── Excavator ─────────────────────────────────────────────────────────────────

const EXC_SOIL_TYPES = ["점토", "실트", "사질토", "자갈", "풍화암", "연암", "경암", "기타"];
const EXC_UTILITY_TYPES = ["도시가스관", "상수도관", "하수도관", "전력케이블 (지중)", "통신케이블", "난방배관", "기타 매설물"];
const EXC_RETAINING_METHODS = ["엄지말뚝 + 토류판", "시트파일", "CIP (현장타설말뚝)", "SCW", "흙막이 불필요", "기타"];
const EXC_ATTACHMENTS = ["버킷", "브레이커", "크램셸", "인양용 달기구", "기타"];
const EXC_CHECKLIST_ITEMS = [
  "브레이크 / 클러치 / 선회장치 이상 없음",
  "붐·암 작동 이상 없음",
  "훅 해지장치 이상 없음",
  "작업장치 이탈방지 안전핀 체결",
  "후사경 / 후미등 / 후진경보기 정상",
  "후방영상장치 정상",
  "좌석 안전띠 착용 가능 상태",
];

export function ExcavatorExtraForms({ data, onChange }: ExtraFormProps) {
  const s = (k: string) => ((data[k] ?? {}) as Record<string, unknown>);
  const u = (k: string, v: Record<string, unknown>) => onChange(k, v);
  const f = (k: string, fk: string) => (s(k)[fk] as string) ?? "";
  const upd = (k: string, fk: string, v: unknown) => u(k, { ...s(k), [fk]: v });
  const soilSelected: string[] = Array.isArray(s("ground").soilTypes) ? s("ground").soilTypes as string[] : [];
  const toggleSoil = (t: string) => upd("ground", "soilTypes", soilSelected.includes(t) ? soilSelected.filter(x=>x!==t) : [...soilSelected, t]);
  const attachSelected: string[] = Array.isArray(s("retaining").attachments) ? s("retaining").attachments as string[] : [];
  const toggleAttach = (t: string) => upd("retaining", "attachments", attachSelected.includes(t) ? attachSelected.filter(x=>x!==t) : [...attachSelected, t]);
  return (
    <div className="space-y-5">
      <EqSub title="굴착 깊이 및 기울기">
        <div className="grid grid-cols-4 gap-2">
          <EqF label="최대 굴착 깊이 (m)" value={f("depth","depth")} onChange={(v) => upd("depth","depth",v)} placeholder="예: 3.5" type="number" />
          <EqF label="굴착 기울기 (구배)" value={f("depth","slope")} onChange={(v) => upd("depth","slope",v)} placeholder="예: 1:1" />
          <EqF label="굴착 폭 (m)" value={f("depth","width")} onChange={(v) => upd("depth","width",v)} placeholder="예: 4.0" type="number" />
          <EqF label="굴착 연장 (m)" value={f("depth","length")} onChange={(v) => upd("depth","length",v)} placeholder="예: 50" type="number" />
        </div>
      </EqSub>
      <EqSub title="지반 상태 (토질조사 결과)">
        <div className="grid grid-cols-2 gap-3">
          <EqMultiTokens label="토질 분류 (복수 선택 가능)" items={EXC_SOIL_TYPES} selected={soilSelected} onToggle={toggleSoil}
            customVal={f("ground","soilTypeOther")} onCustomChange={(v) => upd("ground","soilTypeOther",v)} />
          <EqF label="토질조사 결과" value={f("ground","surveyResult")} onChange={(v) => upd("ground","surveyResult",v)} placeholder="지반조사 결과, 지하수위 등" />
        </div>
      </EqSub>
      <EqSub title="매설물 확인 (가스/전기/통신)">
        <EqRowTable items={EXC_UTILITY_TYPES} colLabel="매설물 종류" data={s("utility") as CheckTableData} onChange={(d) => u("utility",d)} />
      </EqSub>
      <EqSub title="흙막이 공법">
        <div className="space-y-3">
          <EqTokens label="흙막이 공법" items={EXC_RETAINING_METHODS} selected={f("retaining","method")}
            onToggle={(v) => upd("retaining","method", v === f("retaining","method") ? "" : v)}
            customKey="기타" customVal={f("retaining","methodCustom")} onCustomChange={(v) => upd("retaining","methodCustom",v)} />
          <EqMultiTokens label="작업장치 선택" items={EXC_ATTACHMENTS} selected={attachSelected} onToggle={toggleAttach}
            customVal={f("retaining","attachmentCustom")} onCustomChange={(v) => upd("retaining","attachmentCustom",v)} />
          <EqTA label="흙막이 설계 및 시공 특이사항" value={f("retaining","note")} onChange={(v) => upd("retaining","note",v)} placeholder="흙막이 공법 상세, 계측 계획 등" rows={3} />
        </div>
      </EqSub>
      <EqSub title="작동상태 사전 점검표">
        <EqChecklist items={EXC_CHECKLIST_ITEMS} data={s("checklist") as CheckTableData} onChange={(d) => u("checklist",d)} />
      </EqSub>
    </div>
  );
}

// ── Aerial Lift ───────────────────────────────────────────────────────────────

const AERIAL_CHECKLIST_ITEMS = [
  "붐(와이어로프·체인 구동부) 이상 없음",
  "선회부 이상 없음",
  "붐 인출길이 표시장치 정상",
  "모멘트 감지장치(위치제어) 정상",
  "아웃트리거 전도방지 기능 정상",
  "과부하 방지장치 정상",
  "낙하방지 밸브 / 유압 이상 없음",
  "탑승함 고정 및 안전대 부착 고리 이상 없음",
];

export function AerialLiftExtraForms({ data, onChange }: ExtraFormProps) {
  const s = (k: string) => ((data[k] ?? {}) as Record<string, unknown>);
  const u = (k: string, v: Record<string, unknown>) => onChange(k, v);
  const f = (k: string, fk: string) => (s(k)[fk] as string) ?? "";
  const upd = (k: string, fk: string, v: unknown) => u(k, { ...s(k), [fk]: v });
  const YN = ({ field, skey }: { field: string; skey: string }) => (
    <div className="flex gap-1.5">
      {(["유","무"] as const).map((opt) => (
        <button key={opt} type="button" onClick={() => upd(skey, field, s(skey)[field] === opt ? "" : opt)}
          className="text-xs px-2.5 py-1 rounded-full border transition-all"
          style={{ background: s(skey)[field] === opt ? PRIMARY : "white", borderColor: s(skey)[field] === opt ? PRIMARY : "#e2e8f0", color: s(skey)[field] === opt ? "white" : "#64748b" }}>
          {opt}
        </button>
      ))}
    </div>
  );
  return (
    <div className="space-y-5">
      <EqSub title="작업 계획">
        <div className="grid grid-cols-4 gap-2">
          <EqF label="최대 작업높이 (m)" value={f("workPlan","maxHeight")} onChange={(v) => upd("workPlan","maxHeight",v)} placeholder="예: 12.0" type="number" />
          <EqF label="최대 작업반경 (m)" value={f("workPlan","maxRadius")} onChange={(v) => upd("workPlan","maxRadius",v)} placeholder="예: 8.0" type="number" />
          <EqF label="정격하중 (kg)" value={f("workPlan","ratedLoad")} onChange={(v) => upd("workPlan","ratedLoad",v)} placeholder="예: 230" type="number" />
          <EqF label="최대허용풍속 (m/s)" value={f("workPlan","maxWindSpeed")} onChange={(v) => upd("workPlan","maxWindSpeed",v)} placeholder="예: 10" type="number" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          <EqF label="아웃트리거 최대폭 앞 (m)" value={f("workPlan","outriggerFront")} onChange={(v) => upd("workPlan","outriggerFront",v)} placeholder="예: 3.5" />
          <EqF label="아웃트리거 최대폭 뒤 (m)" value={f("workPlan","outriggerRear")} onChange={(v) => upd("workPlan","outriggerRear",v)} placeholder="예: 3.5" />
          <EqF label="작업 구역 및 특이사항" value={f("workPlan","note")} onChange={(v) => upd("workPlan","note",v)} placeholder="작업 위치, 경사면 여부 등" colSpan={2} />
        </div>
      </EqSub>
      <EqSub title="사전 점검표">
        <div className="space-y-3">
          <div className="flex items-center gap-4 px-4 py-2 rounded-xl border border-slate-200">
            <span className="text-xs font-medium text-slate-600 w-20 shrink-0">작업대</span>
            <YN field="workPlatform" skey="checklist" />
            {s("checklist").workPlatform === "유" && (
              <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
                ⚠️ 고소작업대를 중량물 인양용으로 사용하지 말 것
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 px-4 py-2 rounded-xl border border-slate-200">
            <span className="text-xs font-medium text-slate-600 w-20 shrink-0">사용설명서</span>
            <YN field="manual" skey="checklist" />
            <input type="text" value={f("checklist","manualNote")} onChange={(e) => upd("checklist","manualNote",e.target.value)}
              placeholder="특이사항" className={`flex-1 ${fi}`} />
          </div>
          <EqChecklist items={AERIAL_CHECKLIST_ITEMS} data={s("checklist") as CheckTableData} onChange={(d) => u("checklist",d)} />
        </div>
      </EqSub>
    </div>
  );
}

// ── Crane ─────────────────────────────────────────────────────────────────────

const CRANE_GROUND_CHECKS = ["지내력 확인 (지반조사 결과)", "아웃트리거 설치 위치 확인", "아웃트리거 하부 철판 설치", "연약지반 보강 조치"];
const CRANE_SWING_ITEMS = ["전력선 유무 확인", "구조물 접촉 위험 확인", "출입 인원 통제 확인", "과부하 방지장치 작동 확인", "기타 장애물"];
const CRANE_CHECKLIST_ITEMS = [
  "권과방지장치 정상",
  "과부하방지장치 정상",
  "훅 해지장치 정상",
  "아웃트리거 / 하부 철판 설치 확인",
  "브레이크 / 클러치 이상 없음",
  "붐 / 선회 작동 이상 없음",
  "달기기구(슬링·샤클) 점검 확인",
  "신호수 배치 및 신호 방법 확인",
];

export function CraneExtraForms({ data, onChange }: ExtraFormProps) {
  const s = (k: string) => ((data[k] ?? {}) as Record<string, unknown>);
  const u = (k: string, v: Record<string, unknown>) => onChange(k, v);
  const f = (k: string, fk: string) => (s(k)[fk] as string) ?? "";
  const upd = (k: string, fk: string, v: unknown) => u(k, { ...s(k), [fk]: v });
  return (
    <div className="space-y-5">
      <EqSub title="인양 작업 조건">
        <div className="grid grid-cols-3 gap-2">
          <EqF label="작업반경 (m)" value={f("capacity","workRadius")} onChange={(v) => upd("capacity","workRadius",v)} placeholder="예: 12.0" type="number" />
          <EqF label="붐 길이 (m)" value={f("capacity","boomLength")} onChange={(v) => upd("capacity","boomLength",v)} placeholder="예: 30.0" type="number" />
          <EqF label="붐 각도 (°)" value={f("capacity","boomAngle")} onChange={(v) => upd("capacity","boomAngle",v)} placeholder="예: 70" type="number" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <EqF label="정격총하중-제조사표 (ton)" value={f("capacity","ratedGrossCapacity")} onChange={(v) => upd("capacity","ratedGrossCapacity",v)} placeholder="예: 8.5" type="number" />
          <EqF label="훅블록 중량 (ton)" value={f("capacity","hookBlockWeight")} onChange={(v) => upd("capacity","hookBlockWeight",v)} placeholder="예: 0.3" type="number" />
          <EqF label="달기기구 중량 (ton)" value={f("capacity","liftingGearWeight")} onChange={(v) => upd("capacity","liftingGearWeight",v)} placeholder="예: 0.1" type="number" />
        </div>
      </EqSub>
      <EqSub title="달기기구 종류 및 수량">
        <div className="grid grid-cols-3 gap-2">
          <EqF label="슬링 종류" value={f("rigging","slingType")} onChange={(v) => upd("rigging","slingType",v)} placeholder="예: 와이어로프 슬링" />
          <EqF label="슬링 수량 (개)" value={f("rigging","slingQty")} onChange={(v) => upd("rigging","slingQty",v)} placeholder="예: 4" type="number" />
          <EqF label="슬링 1본당 WLL (ton)" value={f("rigging","slingWllTon")} onChange={(v) => upd("rigging","slingWllTon",v)} placeholder="예: 3.2" type="number" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <EqF label="샤클 규격" value={f("rigging","shackleSpec")} onChange={(v) => upd("rigging","shackleSpec",v)} placeholder="예: G2130 3/4″" />
          <EqF label="샤클 수량 (개)" value={f("rigging","shackleQty")} onChange={(v) => upd("rigging","shackleQty",v)} placeholder="예: 4" type="number" />
          <EqF label="샤클 1개당 WLL (ton)" value={f("rigging","shackleWllTon")} onChange={(v) => upd("rigging","shackleWllTon",v)} placeholder="예: 4.75" type="number" />
        </div>
        <EqTA label="달기기구 점검 상태" value={f("rigging","condition")} onChange={(v) => upd("rigging","condition",v)} placeholder="점검일, 이상 여부 등" />
      </EqSub>
      <EqSub title="선회 반경 내 장애물">
        <EqRowTable items={CRANE_SWING_ITEMS} colLabel="확인 항목" data={s("swing") as CheckTableData} onChange={(d) => u("swing",d)} />
      </EqSub>
      <EqSub title="신호 방법 및 신호수 배치">
        <div className="grid grid-cols-4 gap-2">
          <EqF label="신호 방법" value={f("signal","method")} onChange={(v) => upd("signal","method",v)} placeholder="예: 무전기 + 수신호" />
          <EqF label="신호수 이름" value={f("signal","signalPerson")} onChange={(v) => upd("signal","signalPerson",v)} placeholder="홍길동" />
          <EqF label="신호수 배치 위치" value={f("signal","position")} onChange={(v) => upd("signal","position",v)} placeholder="예: 인양물 북측" />
          <EqF label="비상 신호 방법" value={f("signal","emergency")} onChange={(v) => upd("signal","emergency",v)} placeholder="비상 중지 신호 등" />
        </div>
      </EqSub>
      <EqSub title="하부지반 지지력 확인">
        <div className="grid grid-cols-4 gap-2 mb-2">
          <EqF label="지내력 (kN/m²)" value={f("ground","bearing")} onChange={(v) => upd("ground","bearing",v)} placeholder="예: 150" type="number" />
          <EqF label="지반 보강 방법" value={f("ground","reinforcement")} onChange={(v) => upd("ground","reinforcement",v)} placeholder="지반 보강 조치 내용" colSpan={3} />
        </div>
        <EqCheckboxList items={CRANE_GROUND_CHECKS} data={s("ground")} onChange={(d) => u("ground",d)} />
      </EqSub>
      <EqSub title="사전 점검표">
        <EqChecklist items={CRANE_CHECKLIST_ITEMS} data={s("checklist") as CheckTableData} onChange={(d) => u("checklist",d)} />
      </EqSub>
    </div>
  );
}

// ── Concrete Pump ─────────────────────────────────────────────────────────────

const CP_CHECKLIST_ITEMS = [
  "붐 / 배관 / 호스 가이드 이상 없음",
  "호퍼 / 펌프 이상 없음",
  "아웃트리거 전도방지 기능 정상",
  "비상정지 장치 정상",
  "브레이크 / 클러치 이상 없음",
  "붐 / 선회부 이상 없음",
  "좌석 안전띠 착용 가능 상태",
  "후사경 / 후미등 / 후진경보기 정상",
];

export function ConcretePumpExtraForms({ data, onChange }: ExtraFormProps) {
  const s = (k: string) => ((data[k] ?? {}) as Record<string, unknown>);
  const u = (k: string, v: Record<string, unknown>) => onChange(k, v);
  const f = (k: string, fk: string) => (s(k)[fk] as string) ?? "";
  const upd = (k: string, fk: string, v: unknown) => u(k, { ...s(k), [fk]: v });
  return (
    <div className="space-y-5">
      <EqSub title="작업 계획">
        <div className="grid grid-cols-4 gap-2">
          <EqF label="최대수송거리 수평 (m)" value={f("workPlan","maxHorizontal")} onChange={(v) => upd("workPlan","maxHorizontal",v)} placeholder="예: 500" type="number" />
          <EqF label="최대수송거리 수직 (m)" value={f("workPlan","maxVertical")} onChange={(v) => upd("workPlan","maxVertical",v)} placeholder="예: 100" type="number" />
          <EqF label="토출량 (㎥/hr)" value={f("workPlan","outputRate")} onChange={(v) => upd("workPlan","outputRate",v)} placeholder="예: 90" type="number" />
          <EqF label="붐 수송관 지름 (mm)" value={f("workPlan","pipeDiameter")} onChange={(v) => upd("workPlan","pipeDiameter",v)} placeholder="예: 125" type="number" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          <EqF label="아웃트리거 최대폭 앞 (m)" value={f("workPlan","outriggerFront")} onChange={(v) => upd("workPlan","outriggerFront",v)} placeholder="예: 7.9" />
          <EqF label="아웃트리거 최대폭 뒤 (m)" value={f("workPlan","outriggerRear")} onChange={(v) => upd("workPlan","outriggerRear",v)} placeholder="예: 7.9" />
          <EqF label="타설 계획 및 특이사항" value={f("workPlan","note")} onChange={(v) => upd("workPlan","note",v)} placeholder="타설 위치, 압송 경로 등" colSpan={2} />
        </div>
      </EqSub>
      <EqSub title="사전 점검표">
        <EqChecklist items={CP_CHECKLIST_ITEMS} data={s("checklist") as CheckTableData} onChange={(d) => u("checklist",d)} />
      </EqSub>
    </div>
  );
}

// ── Pile Driver ───────────────────────────────────────────────────────────────

const PILE_METHODS = ["디젤해머", "유압해머", "바이브로해머", "오거 (매입공법)", "SIP 공법", "PRD 공법", "기타"];
const PILE_TYPES = ["PHC파일", "강관파일", "H-파일", "RC파일", "목파일", "기타"];
const PILE_NOISE_CHECKS = ["소음 측정 실시 계획", "방음벽 설치", "진동 모니터링 계획", "인접 구조물 안전 확인", "주민 민원 대응 계획"];
const PILE_CHECKLIST_ITEMS = [
  "항타기 해머 / 항발기 / 오거 이상 없음",
  "와이어로프 이상 없음",
  "브레이크 / 백스테이 이상 없음",
  "붐 / 윈치 / 리더 이상 없음",
  "리더 경사각도계 정상",
  "역회전 방지 브레이크 정상",
  "쐐기 / 인발하중계 비치 확인",
  "후사경 / 후방영상장치 정상",
];

export function PileExtraForms({ data, onChange }: ExtraFormProps) {
  const s = (k: string) => ((data[k] ?? {}) as Record<string, unknown>);
  const u = (k: string, v: Record<string, unknown>) => onChange(k, v);
  const f = (k: string, fk: string) => (s(k)[fk] as string) ?? "";
  const upd = (k: string, fk: string, v: unknown) => u(k, { ...s(k), [fk]: v });
  return (
    <div className="space-y-5">
      <EqSub title="항타 공법">
        <EqTokens label="항타 공법" items={PILE_METHODS} selected={f("method","method")}
          onToggle={(v) => upd("method","method", v === f("method","method") ? "" : v)}
          customKey="기타" customVal={f("method","methodCustom")} onCustomChange={(v) => upd("method","methodCustom",v)} />
        <EqTA label="공법 상세" value={f("method","detail")} onChange={(v) => upd("method","detail",v)} placeholder="항타 에너지, 타격 횟수 등" />
      </EqSub>
      <EqSub title="파일 종류">
        <EqTokens label="파일 종류" items={PILE_TYPES} selected={f("pileType","type")}
          onToggle={(v) => upd("pileType","type", v === f("pileType","type") ? "" : v)}
          customKey="기타" customVal={f("pileType","typeCustom")} onCustomChange={(v) => upd("pileType","typeCustom",v)} />
        <div className="grid grid-cols-4 gap-2 mt-2">
          <EqF label="규격 (mm)" value={f("pileType","spec")} onChange={(v) => upd("pileType","spec",v)} placeholder="예: φ400" />
          <EqF label="길이 (m)" value={f("pileType","length")} onChange={(v) => upd("pileType","length",v)} placeholder="예: 12" type="number" />
          <EqF label="본수 (본)" value={f("pileType","count")} onChange={(v) => upd("pileType","count",v)} placeholder="예: 50" type="number" />
        </div>
      </EqSub>
      <EqSub title="소음·진동 관리">
        <div className="grid grid-cols-4 gap-2 mb-2">
          <EqF label="소음 기준 (dB)" value={f("noise","noiseLimit")} onChange={(v) => upd("noise","noiseLimit",v)} placeholder="예: 75" type="number" />
          <EqF label="진동 기준 (cm/s)" value={f("noise","vibrationLimit")} onChange={(v) => upd("noise","vibrationLimit",v)} placeholder="예: 0.2" type="number" />
          <EqF label="소음·진동 저감 방법" value={f("noise","note")} onChange={(v) => upd("noise","note",v)} placeholder="저감 대책 및 관리 방법" colSpan={2} />
        </div>
        <EqCheckboxList items={PILE_NOISE_CHECKS} data={s("noise")} onChange={(d) => u("noise",d)} />
      </EqSub>
      <EqSub title="사전 점검표">
        <EqChecklist items={PILE_CHECKLIST_ITEMS} data={s("checklist") as CheckTableData} onChange={(d) => u("checklist",d)} />
      </EqSub>
    </div>
  );
}

// ── Forklift ──────────────────────────────────────────────────────────────────

const FORKLIFT_CHECKLIST_ITEMS = [
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

export function ForkliftExtraForms({ data, onChange }: ExtraFormProps) {
  const s = (k: string) => ((data[k] ?? {}) as Record<string, unknown>);
  const u = (k: string, v: Record<string, unknown>) => onChange(k, v);
  const f = (k: string, fk: string) => (s(k)[fk] as string) ?? "";
  const upd = (k: string, fk: string, v: unknown) => u(k, { ...s(k), [fk]: v });
  return (
    <div className="space-y-5">
      <EqSub title="작업 계획">
        <div className="grid grid-cols-4 gap-2">
          <EqF label="적재능력 규격 (kg)" value={f("workPlan","capacity")} onChange={(v) => upd("workPlan","capacity",v)} placeholder="예: 3000" type="number" />
          <EqF label="동력형식" value={f("workPlan","powerType")} onChange={(v) => upd("workPlan","powerType",v)} placeholder="디젤 / LPG / 전동" />
          <EqF label="최고속도 (km/h)" value={f("workPlan","maxSpeed")} onChange={(v) => upd("workPlan","maxSpeed",v)} placeholder="예: 20" type="number" />
          <EqF label="마스트 최대높이 (m)" value={f("workPlan","mastMaxHeight")} onChange={(v) => upd("workPlan","mastMaxHeight",v)} placeholder="예: 3.0" type="number" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          <EqF label="마스트 경사각 전경 (°)" value={f("workPlan","tiltFront")} onChange={(v) => upd("workPlan","tiltFront",v)} placeholder="예: 6" type="number" />
          <EqF label="마스트 경사각 후경 (°)" value={f("workPlan","tiltRear")} onChange={(v) => upd("workPlan","tiltRear",v)} placeholder="예: 12" type="number" />
          <EqF label="작업 구역 및 특이사항" value={f("workPlan","note")} onChange={(v) => upd("workPlan","note",v)} placeholder="통로 폭, 바닥 상태, 적재물 특성 등" colSpan={2} />
        </div>
      </EqSub>
      <EqSub title="사전 점검표">
        <EqChecklist items={FORKLIFT_CHECKLIST_ITEMS} data={s("checklist") as CheckTableData} onChange={(d) => u("checklist",d)} />
      </EqSub>
    </div>
  );
}

// ── Loader ────────────────────────────────────────────────────────────────────

const LOADER_CHECKLIST_ITEMS = [
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

export function LoaderExtraForms({ data, onChange }: ExtraFormProps) {
  const s = (k: string) => ((data[k] ?? {}) as Record<string, unknown>);
  const u = (k: string, v: Record<string, unknown>) => onChange(k, v);
  const f = (k: string, fk: string) => (s(k)[fk] as string) ?? "";
  const upd = (k: string, fk: string, v: unknown) => u(k, { ...s(k), [fk]: v });
  return (
    <div className="space-y-5">
      <EqSub title="작업 계획">
        <div className="grid grid-cols-4 gap-2">
          <EqF label="버킷 용량 (m³)" value={f("workPlan","capacity")} onChange={(v) => upd("workPlan","capacity",v)} placeholder="예: 1.5" type="number" />
          <EqF label="최대 인양하중 (ton)" value={f("workPlan","maxLoad")} onChange={(v) => upd("workPlan","maxLoad",v)} placeholder="예: 3.0" type="number" />
          <EqF label="최대 작업 반경 (m)" value={f("workPlan","radius")} onChange={(v) => upd("workPlan","radius",v)} placeholder="예: 5.0" type="number" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <EqF label="작업 반경 내 장애물" value={f("workPlan","obstacles")} onChange={(v) => upd("workPlan","obstacles",v)} placeholder="장애물 현황 기술" />
          <EqF label="적재 방법 및 주의사항" value={f("workPlan","method")} onChange={(v) => upd("workPlan","method",v)} placeholder="적재 순서, 균형 유지 방법 등" />
        </div>
      </EqSub>
      <EqSub title="사전 점검표">
        <EqChecklist items={LOADER_CHECKLIST_ITEMS} data={s("checklist") as CheckTableData} onChange={(d) => u("checklist",d)} />
      </EqSub>
    </div>
  );
}

// ── Roller ────────────────────────────────────────────────────────────────────

const ROLLER_METHODS = ["진동 다짐", "정적 다짐", "타이어 다짐", "진동+정적 병행"];
const ROLLER_TYPES = ["타이어식", "진동식", "탠덤식", "기타"];
const ROLLER_COMPACTION_CHECKS = ["현장밀도시험 계획 수립", "다짐 관리 기준 확인", "함수비 관리 계획"];
const ROLLER_CHECKLIST_ITEMS = [
  "타이어 / 드럼 및 밸러스트 이상 없음",
  "롤 스크레이퍼 / 살수장치 이상 없음",
  "브레이크 / 클러치 / 진동장치 이상 없음",
  "낙하물 보호구조 이상 없음",
  "전조등 / 후미등 정상",
  "후사경 / 후진경보 정상",
  "후방영상 정상",
  "좌석 안전띠 착용 가능 상태",
];

export function RollerExtraForms({ data, onChange }: ExtraFormProps) {
  const s = (k: string) => ((data[k] ?? {}) as Record<string, unknown>);
  const u = (k: string, v: Record<string, unknown>) => onChange(k, v);
  const f = (k: string, fk: string) => (s(k)[fk] as string) ?? "";
  const upd = (k: string, fk: string, v: unknown) => u(k, { ...s(k), [fk]: v });
  return (
    <div className="space-y-5">
      <EqSub title="다짐 구간 및 면적">
        <div className="grid grid-cols-4 gap-2">
          <EqF label="다짐 면적 (m²)" value={f("section","area")} onChange={(v) => upd("section","area",v)} placeholder="예: 1500" type="number" />
          <EqF label="층별 다짐 두께 (cm)" value={f("section","thickness")} onChange={(v) => upd("section","thickness",v)} placeholder="예: 20" type="number" />
          <EqF label="다짐 구간" value={f("section","section")} onChange={(v) => upd("section","section",v)} placeholder="다짐 시점 ~ 종점" colSpan={2} />
        </div>
      </EqSub>
      <EqSub title="다짐 횟수 및 방법">
        <EqTokens label="다짐 방법" items={ROLLER_METHODS} selected={f("count","method")}
          onToggle={(v) => upd("count","method", v === f("count","method") ? "" : v)} />
        <div className="grid grid-cols-4 gap-2 mt-2">
          <EqF label="다짐 횟수 (회)" value={f("count","count")} onChange={(v) => upd("count","count",v)} placeholder="예: 6" type="number" />
          <EqF label="다짐 속도 (km/h)" value={f("count","speed")} onChange={(v) => upd("count","speed",v)} placeholder="예: 3" type="number" />
          <EqF label="목표 다짐도 (%)" value={f("count","targetDensity")} onChange={(v) => upd("count","targetDensity",v)} placeholder="예: 95" type="number" />
          <EqF label="시험 빈도" value={f("count","testFreq")} onChange={(v) => upd("count","testFreq",v)} placeholder="예: 500m²당 1회" />
        </div>
      </EqSub>
      <EqSub title="다짐도 관리">
        <EqCheckboxList items={ROLLER_COMPACTION_CHECKS} data={s("compaction")} onChange={(d) => u("compaction",d)} />
        <EqTA label="다짐도 관리 방법" value={f("compaction","note")} onChange={(v) => upd("compaction","note",v)} placeholder="품질관리 기준 및 방법" />
      </EqSub>
      <EqSub title="사전 점검표 (롤러 종류 선택)">
        <EqTokens label="롤러 종류" items={ROLLER_TYPES} selected={f("checklist","rollerType")}
          onToggle={(v) => upd("checklist","rollerType", v === f("checklist","rollerType") ? "" : v)} />
        <div className="mt-2">
          <EqChecklist items={ROLLER_CHECKLIST_ITEMS} data={s("checklist") as CheckTableData} onChange={(d) => u("checklist",d)} />
        </div>
      </EqSub>
    </div>
  );
}

// ── Registry ──────────────────────────────────────────────────────────────────

export const EQUIP_EXTRA_FORMS: Partial<Record<string, React.FC<ExtraFormProps>>> = {
  truck: TruckExtraForms,
  excavator: ExcavatorExtraForms,
  aerial_lift: AerialLiftExtraForms,
  crane: CraneExtraForms,
  concrete_pump: ConcretePumpExtraForms,
  pile_driver: PileExtraForms,
  forklift: ForkliftExtraForms,
  loader: LoaderExtraForms,
  roller: RollerExtraForms,
};
