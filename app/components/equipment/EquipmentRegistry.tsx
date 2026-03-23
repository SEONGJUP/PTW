"use client";
import React, { useState } from "react";
import {
  useEquipmentRegistryStore,
  EquipmentRecord,
  EquipmentStatus,
  InspectionRecord,
  getEquipmentTypeLabel,
} from "@/store/equipmentRegistryStore";
import { CONSTRUCTION_EQUIPMENT_TYPES, EquipmentType } from "@/store/workPlanStore";

const PRIMARY = "#00B7AF";
const PRIMARY_DARK = "#00A099";
const PRIMARY_LIGHT = "#E6FAF9";

const STATUS_LABELS: Record<EquipmentStatus, string> = {
  active: "운용 중",
  maintenance: "점검/수리 중",
  inactive: "미운용",
};

const STATUS_COLORS: Record<EquipmentStatus, { bg: string; text: string }> = {
  active: { bg: "#d1fae5", text: "#065f46" },
  maintenance: { bg: "#fef3c7", text: "#92400e" },
  inactive: { bg: "#f1f5f9", text: "#64748b" },
};

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

function EquipmentCard({
  record,
  onOpen,
  onDelete,
}: {
  record: EquipmentRecord;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const sc = STATUS_COLORS[record.status];
  const equipLabel = getEquipmentTypeLabel(record.equipmentType);
  const isDue = record.nextInspectionDate && new Date(record.nextInspectionDate) <= new Date();

  return (
    <div
      className="rounded-2xl border p-4 cursor-pointer hover:shadow-md transition-shadow bg-white"
      style={{ borderColor: "#e2e8f0" }}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-800">{record.name || "(이름 없음)"}</p>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: sc.bg, color: sc.text }}
            >
              {STATUS_LABELS[record.status]}
            </span>
            {isDue && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600">
                점검 기한 초과
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {equipLabel} · {record.model || "모델 미입력"}
            {record.registrationNumber && ` · ${record.registrationNumber}`}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-slate-300 hover:text-red-400 transition-colors text-sm flex-shrink-0"
        >
          ✕
        </button>
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
        {record.operatorName && <span>👤 {record.operatorName}</span>}
        {record.capacity && <span>⚖ {record.capacity}</span>}
        {record.lastInspectionDate && (
          <span>🔧 마지막 점검 {record.lastInspectionDate}</span>
        )}
        {record.nextInspectionDate && (
          <span style={{ color: isDue ? "#dc2626" : "#64748b" }}>
            📅 다음 점검 {record.nextInspectionDate}
          </span>
        )}
      </div>
    </div>
  );
}

const EMPTY_FORM: Omit<EquipmentRecord, "id" | "createdAt" | "updatedAt" | "inspectionHistory"> = {
  name: "",
  equipmentType: "excavator",
  model: "",
  manufacturer: "",
  year: "",
  serialNumber: "",
  registrationNumber: "",
  capacity: "",
  weight: "",
  dimensions: "",
  enginePower: "",
  status: "active",
  operatorName: "",
  operatorLicense: "",
  purchaseDate: "",
  lastInspectionDate: "",
  nextInspectionDate: "",
  inspectionCycle: "6개월",
  insuranceExpiry: "",
  notes: "",
};

function EquipmentForm({
  record,
  onClose,
}: {
  record: EquipmentRecord;
  onClose: () => void;
}) {
  const { updateRecord, addInspection } = useEquipmentRegistryStore();
  const [tab, setTab] = useState<"basic" | "spec" | "history">("basic");
  const [showAddInspection, setShowAddInspection] = useState(false);
  const [newInspection, setNewInspection] = useState<Omit<InspectionRecord, "id">>({
    date: new Date().toISOString().split("T")[0],
    type: "자체점검",
    result: "합격",
    inspector: "",
    notes: "",
  });

  const update = (key: keyof EquipmentRecord, val: unknown) =>
    updateRecord(record.id, { [key]: val });

  const handleAddInspection = () => {
    addInspection(record.id, newInspection);
    setShowAddInspection(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-2xl mx-4" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#e2e8f0" }}>
          <div>
            <h3 className="font-semibold text-slate-800">{record.name || "장비 정보"}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {getEquipmentTypeLabel(record.equipmentType)} · {record.model || "모델 미입력"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={record.status}
              onChange={(e) => update("status", e.target.value)}
              className="text-xs border rounded-xl px-3 py-1.5 outline-none font-medium"
              style={{ borderColor: "#e2e8f0", color: STATUS_COLORS[record.status].text }}
            >
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6" style={{ borderColor: "#e2e8f0" }}>
          {(["basic", "spec", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="text-xs px-4 py-2.5 font-medium border-b-2 transition-colors"
              style={{
                borderColor: tab === t ? PRIMARY : "transparent",
                color: tab === t ? PRIMARY : "#64748b",
              }}
            >
              {t === "basic" ? "기본 정보" : t === "spec" ? "제원" : `점검 이력 (${record.inspectionHistory.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {tab === "basic" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="장비명" value={record.name} onChange={(v) => update("name", v)} required placeholder="예: 굴착기 #1" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">장비 종류<span className="text-red-400 ml-0.5">*</span></label>
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
              <Field label="모델명" value={record.model} onChange={(v) => update("model", v)} placeholder="예: PC200-10M0" />
              <Field label="제조사" value={record.manufacturer} onChange={(v) => update("manufacturer", v)} placeholder="예: 현대건설기계" />
              <Field label="제조연도" value={record.year} onChange={(v) => update("year", v)} placeholder="예: 2021" />
              <Field label="기계번호/차대번호" value={record.serialNumber} onChange={(v) => update("serialNumber", v)} />
              <Field label="건설기계등록번호" value={record.registrationNumber} onChange={(v) => update("registrationNumber", v)} placeholder="예: 서울02가1234" />
              <Field label="담당 운전원" value={record.operatorName} onChange={(v) => update("operatorName", v)} />
              <Field label="운전원 면허번호" value={record.operatorLicense} onChange={(v) => update("operatorLicense", v)} />
              <Field label="구입일" type="date" value={record.purchaseDate} onChange={(v) => update("purchaseDate", v)} />
              <Field label="보험 만료일" type="date" value={record.insuranceExpiry} onChange={(v) => update("insuranceExpiry", v)} />
              <Field label="마지막 점검일" type="date" value={record.lastInspectionDate} onChange={(v) => update("lastInspectionDate", v)} />
              <Field label="다음 점검 예정일" type="date" value={record.nextInspectionDate} onChange={(v) => update("nextInspectionDate", v)} />
              <Field label="점검 주기" value={record.inspectionCycle} onChange={(v) => update("inspectionCycle", v)} placeholder="예: 6개월" />
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">비고</label>
                <textarea
                  value={record.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-teal-400 resize-none"
                  style={{ borderColor: "#e2e8f0" }}
                />
              </div>
            </div>
          )}

          {tab === "spec" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="정격하중 / 버킷용량 / 정격출력" value={record.capacity} onChange={(v) => update("capacity", v)} placeholder="예: 20ton / 1.0m³" />
              <Field label="자중 (ton)" value={record.weight} onChange={(v) => update("weight", v)} placeholder="예: 20.5" />
              <div className="col-span-2">
                <Field label="제원 (길이 × 폭 × 높이)" value={record.dimensions} onChange={(v) => update("dimensions", v)} placeholder="예: 9,455 × 2,800 × 2,970mm" />
              </div>
              <div className="col-span-2">
                <Field label="엔진 출력" value={record.enginePower} onChange={(v) => update("enginePower", v)} placeholder="예: 110kW / 150PS" />
              </div>
            </div>
          )}

          {tab === "history" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">점검 이력</p>
                <button
                  onClick={() => setShowAddInspection(true)}
                  className="text-xs px-3 py-1.5 rounded-xl font-medium text-white"
                  style={{ background: PRIMARY }}
                >
                  + 점검 추가
                </button>
              </div>
              {record.inspectionHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">등록된 점검 이력이 없습니다</div>
              ) : (
                record.inspectionHistory.map((ins) => (
                  <div
                    key={ins.id}
                    className="rounded-xl border p-3"
                    style={{ borderColor: "#e2e8f0" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-700">{ins.date}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{ins.type}</span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: ins.result === "합격" ? "#d1fae5" : "#fee2e2",
                            color: ins.result === "합격" ? "#065f46" : "#991b1b",
                          }}
                        >
                          {ins.result}
                        </span>
                      </div>
                      {ins.inspector && (
                        <span className="text-xs text-slate-400">점검자: {ins.inspector}</span>
                      )}
                    </div>
                    {ins.notes && (
                      <p className="text-xs text-slate-500 mt-1">{ins.notes}</p>
                    )}
                  </div>
                ))
              )}

              {showAddInspection && (
                <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: `${PRIMARY}44`, background: PRIMARY_LIGHT }}>
                  <p className="text-xs font-semibold" style={{ color: PRIMARY_DARK }}>새 점검 기록 추가</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="점검일" type="date" value={newInspection.date} onChange={(v) => setNewInspection((s) => ({ ...s, date: v }))} />
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">점검 유형</label>
                      <select
                        value={newInspection.type}
                        onChange={(e) => setNewInspection((s) => ({ ...s, type: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-xl text-sm outline-none"
                        style={{ borderColor: "#e2e8f0", background: "white" }}
                      >
                        {["자체점검", "정기검사", "이상점검", "출고전점검"].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">결과</label>
                      <select
                        value={newInspection.result}
                        onChange={(e) => setNewInspection((s) => ({ ...s, result: e.target.value as InspectionRecord["result"] }))}
                        className="w-full px-3 py-2 border rounded-xl text-sm outline-none"
                        style={{ borderColor: "#e2e8f0", background: "white" }}
                      >
                        <option value="합격">합격</option>
                        <option value="불합격">불합격</option>
                        <option value="조건부합격">조건부합격</option>
                      </select>
                    </div>
                    <Field label="점검자" value={newInspection.inspector} onChange={(v) => setNewInspection((s) => ({ ...s, inspector: v }))} />
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">비고</label>
                      <textarea
                        value={newInspection.notes}
                        onChange={(e) => setNewInspection((s) => ({ ...s, notes: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border rounded-xl text-sm outline-none resize-none"
                        style={{ borderColor: "#e2e8f0", background: "white" }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowAddInspection(false)}
                      className="text-xs px-3 py-1.5 rounded-xl border font-medium text-slate-600"
                      style={{ borderColor: "#e2e8f0" }}
                    >
                      취소
                    </button>
                    <button
                      onClick={handleAddInspection}
                      className="text-xs px-3 py-1.5 rounded-xl font-medium text-white"
                      style={{ background: PRIMARY }}
                    >
                      저장
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EquipmentRegistry() {
  const { records, addRecord, deleteRecord } = useEquipmentRegistryStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState<EquipmentStatus | "all">("all");
  const [search, setSearch] = useState("");

  const EMPTY_FORM_DATA: Omit<EquipmentRecord, "id" | "createdAt" | "updatedAt" | "inspectionHistory"> = {
    name: "",
    equipmentType: "excavator",
    model: "",
    manufacturer: "",
    year: "",
    serialNumber: "",
    registrationNumber: "",
    capacity: "",
    weight: "",
    dimensions: "",
    enginePower: "",
    status: "active",
    operatorName: "",
    operatorLicense: "",
    purchaseDate: "",
    lastInspectionDate: "",
    nextInspectionDate: "",
    inspectionCycle: "6개월",
    insuranceExpiry: "",
    notes: "",
  };

  const activeRecord = activeId ? records.find((r) => r.id === activeId) : null;

  const filtered = records.filter((r) => {
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchSearch =
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.model.toLowerCase().includes(search.toLowerCase()) ||
      r.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.operatorName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleCreate = () => {
    const id = addRecord(EMPTY_FORM_DATA);
    setActiveId(id);
    setShowCreate(false);
  };

  const dueCount = records.filter(
    (r) => r.nextInspectionDate && new Date(r.nextInspectionDate) <= new Date()
  ).length;

  return (
    <div className="flex flex-col h-full" style={{ background: "#f8fafc" }}>
      {/* Header */}
      <div
        className="px-5 py-4 border-b flex-shrink-0"
        style={{ background: "white", borderColor: "#e2e8f0" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-800">장비 관리대장</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              총 {records.length}대
              {dueCount > 0 && (
                <span className="ml-2 text-red-500 font-medium">· 점검 기한 초과 {dueCount}대</span>
              )}
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="text-sm px-4 py-2 rounded-xl font-medium text-white transition-colors"
            style={{ background: PRIMARY }}
          >
            + 장비 등록
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="장비명, 모델, 등록번호, 운전원 검색..."
            className="flex-1 px-3 py-1.5 border rounded-xl text-sm outline-none focus:border-teal-400"
            style={{ borderColor: "#e2e8f0" }}
          />
          <div className="flex gap-1">
            {(["all", "active", "maintenance", "inactive"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="text-xs px-2.5 py-1.5 rounded-xl font-medium transition-colors"
                style={{
                  background: filterStatus === s ? PRIMARY : "white",
                  color: filterStatus === s ? "white" : "#64748b",
                  border: `1px solid ${filterStatus === s ? PRIMARY : "#e2e8f0"}`,
                }}
              >
                {s === "all" ? "전체" : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-3">🚜</div>
            <p className="text-sm">등록된 장비가 없습니다</p>
            <button
              onClick={handleCreate}
              className="mt-3 text-sm px-4 py-2 rounded-xl text-white font-medium"
              style={{ background: PRIMARY }}
            >
              첫 장비 등록하기
            </button>
          </div>
        ) : (
          filtered.map((record) => (
            <EquipmentCard
              key={record.id}
              record={record}
              onOpen={() => setActiveId(record.id)}
              onDelete={() => {
                if (window.confirm(`"${record.name}" 장비를 삭제하시겠습니까?`)) {
                  deleteRecord(record.id);
                  if (activeId === record.id) setActiveId(null);
                }
              }}
            />
          ))
        )}
      </div>

      {/* Detail modal */}
      {activeRecord && (
        <EquipmentForm
          record={activeRecord}
          onClose={() => setActiveId(null)}
        />
      )}
    </div>
  );
}
