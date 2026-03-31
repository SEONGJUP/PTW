"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWorkPlanStore, SectionFavorite } from "@/store/workPlanStore";
import { useFormDefaultStore, makeDefaultKey, PlanDefaults } from "@/store/formDefaultStore";
import {
  WORK_CATEGORIES,
  WORK_SUBCATEGORIES,
  EQUIPMENT_GROUPS,
  EQUIPMENT_GROUPS_DISPLAY,
  EQUIPMENT_MAP,
  WORK_ATTRIBUTES,
  RISK_ATTRIBUTES,
  getSubcategoriesByCategoryId,
} from "@/store/workPlanTaxonomy";
import {
  useSectionSubPresetStore,
  getEffectiveSections,
  getDefaultSections,
  SubProfile,
} from "@/store/sectionSubPresetStore";
import {
  useTaxonomyOverrideStore,
  SubOverride,
  getEffectiveRecommended,
} from "@/store/taxonomyOverrideStore";

const PRIMARY = "#00B7AF";
const PRIMARY_LIGHT = "#E6FAF9";

const SECTION_META: { id: string; label: string; icon: string; required?: boolean; legal?: boolean }[] = [
  { id: "overview",            icon: "📋", label: "작업 개요",           required: true },
  { id: "work_description",    icon: "📝", label: "작업 설명" },
  { id: "work_environment",    icon: "🌐", label: "작업환경" },
  { id: "heavy_goods",         icon: "⚖️", label: "중량물 취급" },
  { id: "equipment_info",      icon: "🚜", label: "사용 장비 정보" },
  { id: "work_personnel",      icon: "👷", label: "작업 인원 배치" },
  { id: "risk",                icon: "⚠️", label: "위험성평가" },
  { id: "safety_checklist",    icon: "✅", label: "안전점검" },
  { id: "training",            icon: "🎓", label: "안전교육" },
  { id: "emergency_contact",   icon: "📞", label: "비상연락망" },
  { id: "disaster_prevention", icon: "🛡️", label: "재해예방 대책" },
  { id: "pre_survey",          icon: "🔍", label: "사전조사 기록",     legal: true },
  { id: "electrical_safety",   icon: "⚡", label: "전기안전작업계획",  legal: true },
  { id: "heavy_load_plan",     icon: "🏗️", label: "중량물 취급 계획", legal: true },
  { id: "tunnel_plan",         icon: "🚇", label: "터널굴착 계획",     legal: true },
  { id: "chemical_ops",        icon: "🧪", label: "화학설비 운전계획", legal: true },
  { id: "demolition_plan",     icon: "🔨", label: "해체 계획",         legal: true },
  { id: "drawing",             icon: "📐", label: "도면" },
  { id: "other_files",         icon: "📎", label: "기타 첨부파일" },
];

const LEGAL_REFS: Record<string, string> = {
  pre_survey: "별표4 제1호", electrical_safety: "제38조 제5호",
  heavy_load_plan: "별표4", tunnel_plan: "제38조 제7호",
  chemical_ops: "제38조 제4호", demolition_plan: "제38조 제10호",
};

type FieldType = "text" | "date" | "number" | "textarea" | "table" | "file" | "radio" | "select" | "check";
interface FieldDef { label: string; type: FieldType; cols?: number; note?: string; tableHeaders?: string[] }

const SECTION_FIELDS: Record<string, FieldDef[]> = {
  overview: [
    { label: "작업명 (문서 제목)", type: "text", cols: 2 },
    { label: "공정", type: "text" }, { label: "작업 장소", type: "text" },
    { label: "작업 시작일", type: "date" }, { label: "작업 종료일", type: "date" },
    { label: "작성자", type: "text" }, { label: "협력사", type: "select" },
    { label: "작업인원", type: "number" },
    { label: "현장명", type: "text", note: "읽기 전용 (시스템 연동)" },
    { label: "작업순서 및 작업방법", type: "table", cols: 2, tableHeaders: ["작업명", "작업내용", "담당"] },
  ],
  work_description: [
    { label: "작업 목적", type: "textarea", cols: 2 },
    { label: "작업 세부내용", type: "textarea", cols: 2 },
    { label: "작업 범위", type: "textarea", cols: 2 },
  ],
  work_environment: [
    { label: "날씨", type: "text" }, { label: "온도", type: "text" },
    { label: "환기", type: "text" }, { label: "조명", type: "text" },
    { label: "소음", type: "text" }, { label: "주변 안전상태", type: "text" },
    { label: "진입로 상태", type: "text" }, { label: "상세내용", type: "textarea", cols: 2 },
  ],
  heavy_goods: [
    { label: "중량물 목록", type: "table", cols: 2, tableHeaders: ["중량물명", "무게", "형태", "크기", "취급방법", "안전장치"] },
  ],
  equipment_info: [
    { label: "건설기계 선택 및 제원", type: "check", cols: 2, note: "규격·수량·임차여부·전용 안전계획 포함" },
    { label: "기타 장비 목록", type: "table", cols: 2, tableHeaders: ["기종명", "규격", "수량", "임차/자사"] },
  ],
  work_personnel: [
    { label: "역할별 투입 인원 (자동 집계)", type: "text", cols: 2, note: "테이블 행 기준 자동 산출" },
    { label: "인원 목록", type: "table", cols: 2, tableHeaders: ["역할", "이름", "면허종류", "면허번호", "연락처", "교육이수"] },
  ],
  risk: [
    { label: "위험성평가 테이블", type: "table", cols: 2, tableHeaders: ["작업공정", "단위작업", "위험요인", "저감대책", "위험등급", "중점관리"] },
  ],
  safety_checklist: [
    { label: "작업 전 안전교육 실시", type: "radio", note: "양호 / 불량 / 해당없음" },
    { label: "개인보호구 착용 확인", type: "radio", note: "양호 / 불량 / 해당없음" },
    { label: "작업 구역 출입 통제 및 표지판 설치", type: "radio", note: "양호 / 불량 / 해당없음" },
    { label: "장비 점검 일지 확인", type: "radio", note: "양호 / 불량 / 해당없음" },
    { label: "작업 허가서(PTW) 발급 확인", type: "radio", note: "양호 / 불량 / 해당없음" },
    { label: "연락 체계 구축", type: "radio", note: "양호 / 불량 / 해당없음" },
    { label: "기상 조건 확인", type: "radio", note: "양호 / 불량 / 해당없음" },
    { label: "비상구 및 대피로 확인", type: "radio", note: "양호 / 불량 / 해당없음" },
    { label: "추가 조치 사항", type: "textarea", cols: 2 },
  ],
  emergency_contact: [
    { label: "응급의료기관", type: "text" }, { label: "소방서 (119)", type: "text" },
    { label: "경찰서 (112)", type: "text" }, { label: "관리감독자", type: "text" },
    { label: "안전관리자", type: "text" }, { label: "기타 연락처", type: "text" },
  ],
  training: [
    { label: "안전교육 이력", type: "table", cols: 2, tableHeaders: ["교육종류", "세부내용", "교육일자", "교육시간", "강사명", "수료인원"] },
  ],
  disaster_prevention: [
    { label: "추락 방지 대책", type: "textarea" }, { label: "전도·전복 방지 대책", type: "textarea" },
    { label: "낙하 방지 대책", type: "textarea" }, { label: "협착 방지 대책", type: "textarea" },
    { label: "붕괴 방지 대책", type: "textarea" }, { label: "출입 제한", type: "textarea" },
    { label: "기타 대책", type: "textarea", cols: 2 },
  ],
  drawing: [{ label: "도면 파일 첨부", type: "file", cols: 2, note: "JPG, PNG, PDF 등" }],
  other_files: [{ label: "기타 파일 첨부", type: "file", cols: 2, note: "관련 문서, 사진 등" }],
  pre_survey: [
    { label: "조사일자", type: "date" }, { label: "조사방법", type: "text" },
    { label: "조사자", type: "text" }, { label: "지형", type: "textarea" },
    { label: "지질", type: "textarea" }, { label: "지표면 상태", type: "text" },
    { label: "매설물", type: "textarea" }, { label: "지하수위", type: "textarea" },
    { label: "구조 상태", type: "textarea" }, { label: "주변환경", type: "textarea" },
    { label: "균열·함수·용수·동결 여부", type: "check", cols: 2 },
    { label: "비고", type: "textarea", cols: 2 },
  ],
  electrical_safety: [
    { label: "설계 검토", type: "textarea" }, { label: "안전점검", type: "textarea" },
    { label: "접지/누전 계획", type: "textarea" }, { label: "차단 계획", type: "textarea" },
    { label: "전력 복구 계획", type: "textarea" }, { label: "보호장비", type: "textarea" },
    { label: "임시 운영 계획", type: "textarea" }, { label: "인수인계", type: "textarea" },
    { label: "출입 통제", type: "textarea" }, { label: "교육 방법", type: "textarea" },
    { label: "도면", type: "textarea", cols: 2 },
  ],
  heavy_load_plan: [
    { label: "추락 방지", type: "textarea" }, { label: "낙하 방지", type: "textarea" },
    { label: "전도 방지", type: "textarea" }, { label: "협착 방지", type: "textarea" },
    { label: "붕괴 방지", type: "textarea" }, { label: "취급 방법", type: "textarea" },
    { label: "사용 장비", type: "textarea", cols: 2 },
  ],
  tunnel_plan: [
    { label: "지질조사", type: "textarea" }, { label: "굴착방법", type: "textarea" },
    { label: "지보공법", type: "textarea" }, { label: "라이닝공법", type: "textarea" },
    { label: "배수방법", type: "textarea" }, { label: "환기방법", type: "textarea" },
    { label: "조명방법", type: "textarea" }, { label: "긴급 계획", type: "textarea" },
  ],
  chemical_ops: [
    { label: "밸브 조작 절차", type: "textarea" }, { label: "가열·냉각 절차", type: "textarea" },
    { label: "계기 조작", type: "textarea" }, { label: "안전밸브 관리", type: "textarea" },
    { label: "누설 검사", type: "textarea" }, { label: "샘플링 절차", type: "textarea" },
    { label: "정지 절차", type: "textarea" }, { label: "재시작 절차", type: "textarea" },
    { label: "긴급 대응", type: "textarea" }, { label: "화재·폭발 방지", type: "textarea", cols: 2 },
  ],
  demolition_plan: [
    { label: "사전조사 결과", type: "textarea" }, { label: "해체 계획", type: "textarea" },
    { label: "임시 시설", type: "textarea" }, { label: "보호 시설", type: "textarea" },
    { label: "환기 계획", type: "textarea" }, { label: "수방·화재 계획", type: "textarea" },
    { label: "통신 계획", type: "textarea" }, { label: "폐기물 처리", type: "textarea" },
    { label: "폭발물 계획", type: "textarea" }, { label: "사용 기계 목록", type: "textarea" },
    { label: "비고", type: "textarea", cols: 2 },
  ],
  signature: [
    { label: "작성자 서명", type: "text" }, { label: "관리감독자 서명", type: "text" },
    { label: "안전관리자 서명", type: "text" }, { label: "결재 상태", type: "text", note: "시스템 자동 반영" },
  ],
};

function FieldPreview({ field }: { field: FieldDef }) {
  const base: React.CSSProperties = {
    border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc",
    fontSize: 11, color: "#94a3b8", padding: "5px 8px", width: "100%", boxSizing: "border-box",
  };
  if (field.type === "textarea") return (
    <div style={{ ...base, height: 52, display: "flex", alignItems: "flex-start", paddingTop: 6 }}>
      <span>{field.note ?? "입력"}</span>
    </div>
  );
  if (field.type === "table") return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 6, overflow: "hidden" }}>
      <div style={{ display: "flex", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
        {(field.tableHeaders ?? []).map((h) => (
          <div key={h} style={{ flex: 1, padding: "3px 6px", fontSize: 10, fontWeight: 600, color: "#64748b", borderRight: "1px solid #e2e8f0" }}>{h}</div>
        ))}
      </div>
      {[0, 1].map((i) => (
        <div key={i} style={{ display: "flex", borderBottom: i === 0 ? "1px solid #f1f5f9" : undefined }}>
          {(field.tableHeaders ?? []).map((h) => (
            <div key={h} style={{ flex: 1, padding: "4px 6px", fontSize: 10, color: "#cbd5e1", borderRight: "1px solid #f1f5f9", background: "white" }}>—</div>
          ))}
        </div>
      ))}
    </div>
  );
  if (field.type === "radio") return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {["양호", "불량", "해당없음"].map((opt) => (
        <span key={opt} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, color: "#94a3b8" }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", border: "1px solid #cbd5e1", display: "inline-block" }} />
          {opt}
        </span>
      ))}
    </div>
  );
  if (field.type === "file") return (
    <div style={{ ...base, background: "#f1f5f9", textAlign: "center", padding: "10px", fontStyle: "italic" }}>
      📎 파일 첨부 영역 {field.note && `(${field.note})`}
    </div>
  );
  if (field.type === "check") return (
    <div style={{ ...base, background: "#f1f5f9", padding: "6px 8px" }}>{field.note ?? "항목 선택"}</div>
  );
  return <div style={{ ...base }}>{field.note ? <span style={{ fontStyle: "italic" }}>{field.note}</span> : <span>—</span>}</div>;
}

// ── 편집 가능 필드 ─────────────────────────────────────────────────
function FieldInput({ field, value, onChange }: { field: FieldDef; value: string; onChange: (v: string) => void }) {
  const inp: React.CSSProperties = {
    border: "1px solid #e2e8f0", borderRadius: 6, background: "white",
    fontSize: 11, color: "#374151", padding: "5px 8px", width: "100%", boxSizing: "border-box", outline: "none",
  };
  if (field.type === "table" || field.type === "file") return <FieldPreview field={field} />;
  if (field.type === "textarea") return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder="입력"
      style={{ ...inp, height: 52, resize: "vertical" }} />
  );
  if (field.type === "radio") return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {["양호", "불량", "해당없음"].map((opt) => (
        <button key={opt} type="button" onClick={() => onChange(value === opt ? "" : opt)}
          style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, color: value === opt ? PRIMARY : "#94a3b8", cursor: "pointer" }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${value === opt ? PRIMARY : "#cbd5e1"}`, background: value === opt ? PRIMARY : "transparent", display: "inline-block" }} />
          {opt}
        </button>
      ))}
    </div>
  );
  return (
    <input type={field.type === "select" || field.type === "check" ? "text" : field.type}
      value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={field.note ?? (field.type === "select" ? "선택 또는 직접 입력" : "입력")}
      style={inp} />
  );
}

async function exportTaxonomyExcel(
  overrides: Record<string, SubOverride>,
  presets: Record<string, string[]>
) {
  const XLSX = await import("xlsx");

  // ── 시트 1: 분류체계 ──────────────────────────────────────────────
  type Row1 = { 대분류번호: number; 대분류명: string; 상세분류번호: string; 상세분류명: string; 법령조문: string; 작업속성기본값: string; 위험속성기본값: string; 투입건설기계추천: string; 커스텀여부: string };
  const rows1: Row1[] = [];
  for (const cat of WORK_CATEGORIES) {
    for (const sub of WORK_SUBCATEGORIES.filter((s) => s.categoryId === cat.id)) {
      const eff = overrides[sub.id] ?? { recommendedWorkAttrIds: sub.recommendedWorkAttrIds, recommendedRiskAttrIds: sub.recommendedRiskAttrIds, recommendedEquipmentIds: sub.recommendedEquipmentIds };
      rows1.push({
        대분류번호: cat.num, 대분류명: cat.label, 상세분류번호: sub.num, 상세분류명: sub.label,
        법령조문: sub.articleRef ?? "",
        작업속성기본값: eff.recommendedWorkAttrIds.map((id) => WORK_ATTRIBUTES.find((a) => a.id === id)?.label ?? id).join(", "),
        위험속성기본값: eff.recommendedRiskAttrIds.map((id) => RISK_ATTRIBUTES.find((a) => a.id === id)?.label ?? id).join(", "),
        투입건설기계추천: eff.recommendedEquipmentIds.map((id) => EQUIPMENT_MAP[id]?.label ?? id).join(", "),
        커스텀여부: overrides[sub.id] ? "커스텀" : "기본값",
      });
    }
  }
  const ws1 = XLSX.utils.json_to_sheet(rows1);
  ws1["!cols"] = [{ wch: 8 }, { wch: 22 }, { wch: 10 }, { wch: 26 }, { wch: 24 }, { wch: 30 }, { wch: 30 }, { wch: 36 }, { wch: 8 }];

  // ── 시트 2: 섹션 구성 기본값 ────────────────────────────────────
  type Row2 = { 대분류명: string; 상세분류번호: string; 상세분류명: string; 문서유형: string; 활성섹션수: number; 활성섹션목록: string; 커스텀여부: string };
  const rows2: Row2[] = [];
  for (const cat of WORK_CATEGORIES) {
    for (const sub of WORK_SUBCATEGORIES.filter((s) => s.categoryId === cat.id)) {
      for (const profile of ["full", "lite"] as const) {
        const key = `${sub.id}_${profile}`;
        const sectionIds = presets[key] ?? getDefaultSections(sub.id, cat.id, profile);
        const sectionLabels = sectionIds
          .map((id) => SECTION_META.find((m) => m.id === id)?.label ?? id)
          .join(", ");
        rows2.push({
          대분류명: `${cat.icon} ${cat.label}`,
          상세분류번호: sub.num,
          상세분류명: sub.label,
          문서유형: profile === "full" ? "정식" : "약식",
          활성섹션수: sectionIds.length,
          활성섹션목록: sectionLabels,
          커스텀여부: presets[key] ? "커스텀" : "기본값",
        });
      }
    }
  }
  const ws2 = XLSX.utils.json_to_sheet(rows2);
  ws2["!cols"] = [{ wch: 22 }, { wch: 10 }, { wch: 26 }, { wch: 8 }, { wch: 10 }, { wch: 60 }, { wch: 8 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, "분류체계");
  XLSX.utils.book_append_sheet(wb, ws2, "섹션구성기본값");
  XLSX.writeFile(wb, `PTW_분류체계_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

type Step = "classify" | "configure";

export default function WorkPlanSettingsPage() {
  const { sectionFavorites, saveFavorite, deleteFavorite, renameFavorite, loadFavorite, overwriteFavorite } = useWorkPlanStore();
  const { presets, setPreset, resetPreset } = useSectionSubPresetStore();
  const { overrides, setOverride, resetOverride, resetAll, defaultEquipmentGroupIds, setDefaultEquipmentGroups } = useTaxonomyOverrideStore();
  const { setDefault, getDefault } = useFormDefaultStore();

  const [step, setStep] = useState<Step>("classify");

  // ── Phase 1 ──────────────────────────────────────────────────────
  const [catId, setCatId] = useState(WORK_CATEGORIES[0].id);
  const [subId, setSubId] = useState("");
  const [customEqInput, setCustomEqInput] = useState("");

  const subcategories = getSubcategoriesByCategoryId(catId);
  const selectedSub = WORK_SUBCATEGORIES.find((s) => s.id === subId);
  const effective = selectedSub ? getEffectiveRecommended(selectedSub, overrides, subId) : null;
  const isOverridden = subId ? !!overrides[subId] : false;
  const overrideCount = Object.keys(overrides).length;
  const cat = WORK_CATEGORIES.find((c) => c.id === catId);

  const updateWa = (id: string) => {
    if (!effective || !subId) return;
    const next = effective.recommendedWorkAttrIds.includes(id)
      ? effective.recommendedWorkAttrIds.filter((x) => x !== id)
      : [...effective.recommendedWorkAttrIds, id];
    setOverride(subId, { ...effective, recommendedWorkAttrIds: next });
  };
  const updateRa = (id: string) => {
    if (!effective || !subId) return;
    const next = effective.recommendedRiskAttrIds.includes(id)
      ? effective.recommendedRiskAttrIds.filter((x) => x !== id)
      : [...effective.recommendedRiskAttrIds, id];
    setOverride(subId, { ...effective, recommendedRiskAttrIds: next });
  };
  const updateEq = (id: string) => {
    if (!effective || !subId) return;
    const next = effective.recommendedEquipmentIds.includes(id)
      ? effective.recommendedEquipmentIds.filter((x) => x !== id)
      : [...effective.recommendedEquipmentIds, id];
    setOverride(subId, { ...effective, recommendedEquipmentIds: next });
  };
  const toggleEqGroup = (grpId: string) => {
    if (!effective || !subId) return;
    const grp = EQUIPMENT_GROUPS.find((g) => g.id === grpId);
    if (!grp) return;
    const itemIds = grp.items.map((i) => i.id);
    const allSel = itemIds.every((id) => effective.recommendedEquipmentIds.includes(id));
    const next = allSel
      ? effective.recommendedEquipmentIds.filter((id) => !itemIds.includes(id))
      : [...new Set([...effective.recommendedEquipmentIds, ...itemIds])];
    setOverride(subId, { ...effective, recommendedEquipmentIds: next });
  };
  const toggleDefaultGroup = (grpId: string) => {
    const next = defaultEquipmentGroupIds.includes(grpId)
      ? defaultEquipmentGroupIds.filter((id) => id !== grpId)
      : [...defaultEquipmentGroupIds, grpId];
    setDefaultEquipmentGroups(next);
  };

  const addCustomEqLabel = () => {
    if (!effective || !subId || !customEqInput.trim()) return;
    const next = [...(effective.customEquipmentLabels ?? []), customEqInput.trim()];
    setOverride(subId, { ...effective, customEquipmentLabels: next });
    setCustomEqInput("");
  };
  const removeCustomEqLabel = (i: number) => {
    if (!effective || !subId) return;
    const next = (effective.customEquipmentLabels ?? []).filter((_, idx) => idx !== i);
    setOverride(subId, { ...effective, customEquipmentLabels: next });
  };

  // ── Phase 2 ──────────────────────────────────────────────────────
  const [editProfile, setEditProfile] = useState<SubProfile>("full");
  const [editEnabled, setEditEnabled] = useState<Set<string>>(new Set());
  const [sectionChanged, setSectionChanged] = useState(false);

  const presetKey = `${subId}_${editProfile}`;
  const isCustomized = subId ? !!presets[presetKey] : false;

  // ── 폼 기본값 ────────────────────────────────────────────────────
  const [formDefaults, setFormDefaults] = useState<PlanDefaults>({});

  useEffect(() => {
    if (!subId || !selectedSub) { setEditEnabled(new Set()); setSectionChanged(false); setFormDefaults({}); return; }
    const ids = getEffectiveSections(subId, selectedSub.categoryId, editProfile, presets);
    setEditEnabled(new Set(ids));
    setSectionChanged(false);
    setFormDefaults(getDefault(makeDefaultKey(subId, editProfile)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subId, editProfile, presets]);

  const toggleSection = (id: string, required?: boolean) => {
    if (required) return;
    const next = new Set(editEnabled);
    next.has(id) ? next.delete(id) : next.add(id);
    setEditEnabled(next); setSectionChanged(true);
  };

  const handleSaveSections = () => {
    if (!subId) return;
    setPreset(subId, editProfile, Array.from(editEnabled));
    setDefault(makeDefaultKey(subId, editProfile), formDefaults);
    setSectionChanged(false);
  };

  const handleReset = () => {
    if (!subId || !selectedSub) return;
    resetPreset(subId, editProfile);
    setEditEnabled(new Set(getDefaultSections(subId, selectedSub.categoryId, editProfile)));
    setSectionChanged(false);
  };

  // ── Favorites ────────────────────────────────────────────────────
  const [saveMode, setSaveMode] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [loadedFavId, setLoadedFavId] = useState<string | null>(null);

  const handleFavSave = () => {
    if (!saveName.trim()) return;
    saveFavorite(saveName.trim()); setSaveName(""); setSaveMode(false);
  };
  const handleRenameConfirm = () => {
    if (renamingId && renameVal.trim()) renameFavorite(renamingId, renameVal.trim());
    setRenamingId(null);
  };

  const enabledSectionsForPreview = SECTION_META.filter((m) => editEnabled.has(m.id));

  const handleLoadFav = (fav: SectionFavorite) => {
    if (fav.classification) {
      setCatId(fav.classification.categoryId);
      setSubId(fav.classification.subcategoryId);
    }
    setEditEnabled(new Set(fav.sections.filter((s) => s.enabled).map((s) => s.id)));
    setLoadedFavId(fav.id);
    setSaveMode(false);
    setStep("configure");
  };

  const handleOverwrite = () => {
    if (!loadedFavId) return;
    overwriteFavorite(loadedFavId);
    setLoadedFavId(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "#f8fafc" }}>

      {/* ── Header ── */}
      <div className="px-5 py-3 border-b bg-white border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/work-plan/create" className="text-slate-400 hover:text-teal-500 text-sm flex-shrink-0">← 작업계획서</Link>
          <span className="text-slate-300">/</span>
          <h1 className="text-sm font-bold text-slate-800 flex-shrink-0">⚙ 상세설정</h1>
          <div className="flex-1" />
          {overrideCount > 0 && (
            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium flex-shrink-0" style={{ background: `${PRIMARY}15`, color: PRIMARY }}>
              {overrideCount}개 커스텀
            </span>
          )}
          <button
            onClick={() => { if (confirm("모든 커스텀 설정을 초기화하시겠습니까?")) resetAll(); }}
            className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs flex-shrink-0"
            style={{ fontSize: 11, padding: "4px 10px", color: "#64748b" }}
          >
            전체 초기화
          </button>
          <button
            onClick={() => exportTaxonomyExcel(overrides, presets)}
            className="rounded-lg border font-medium flex items-center gap-1 flex-shrink-0"
            style={{ fontSize: 11, padding: "4px 10px", borderColor: "#16a34a", color: "#16a34a", background: "#f0fdf4" }}
          >
            ⬇ 엑셀
          </button>
        </div>

        {/* Step tabs */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => setStep("classify")}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all"
            style={{ background: step === "classify" ? PRIMARY : "#e2e8f0", color: step === "classify" ? "white" : "#64748b" }}
          >
            <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center" style={{ fontSize: 9 }}>1</span>
            분류 선택
          </button>
          <span className="text-slate-300 text-xs">→</span>
          <button
            onClick={() => { if (subId) setStep("configure"); }}
            disabled={!subId}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all"
            style={{
              background: step === "configure" ? PRIMARY : "#e2e8f0",
              color: step === "configure" ? "white" : !subId ? "#cbd5e1" : "#64748b",
              cursor: subId ? "pointer" : "not-allowed",
            }}
          >
            <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center" style={{ fontSize: 9 }}>2</span>
            섹션 구성
          </button>
          {subId && selectedSub && cat && (
            <span className="text-xs text-slate-400 ml-1 truncate">
              {cat.icon} {cat.label} › {selectedSub.num} {selectedSub.label}
            </span>
          )}
        </div>
      </div>


      {/* ── Body: step content + favorites sidebar ── */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden">

      {/* ── Phase 1: classify ── */}
      {step === "classify" && (
        <div className="flex flex-1 overflow-hidden">

          {/* Col 1: 대분류 */}
          <div className="flex-shrink-0 overflow-y-auto bg-white border-r border-slate-200" style={{ width: 260 }}>
            <div className="px-3 py-2 border-b border-slate-100 uppercase tracking-wider font-semibold text-slate-400" style={{ fontSize: 11 }}>
              대분류
            </div>
            {WORK_CATEGORIES.map((c) => {
              const active = c.id === catId;
              const subs = getSubcategoriesByCategoryId(c.id);
              const customized = subs.filter((s) => overrides[s.id]).length;
              return (
                <button
                  key={c.id}
                  onClick={() => { setCatId(c.id); setSubId(""); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left border-b border-slate-50 transition-colors"
                  style={{ background: active ? PRIMARY_LIGHT : "white", borderLeft: `3px solid ${active ? PRIMARY : "transparent"}` }}
                >
                  <span style={{ fontSize: 15, width: 22, textAlign: "center", flexShrink: 0 }}>{c.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: active ? PRIMARY : "#374151" }}>{c.num}. {c.label}</div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {customized > 0 && (
                      <span className="rounded-full" style={{ fontSize: 10, fontWeight: 600, padding: "1px 5px", background: `${PRIMARY}20`, color: PRIMARY }}>{customized}</span>
                    )}
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{subs.length}종</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Col 2: 상세분류 */}
          <div className="flex-shrink-0 overflow-y-auto bg-white border-r border-slate-200" style={{ width: 300 }}>
            <div className="px-3 py-2 border-b border-slate-100 uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-2" style={{ fontSize: 11 }}>
              <span>상세분류</span>
              {cat && <span style={{ fontSize: 11, fontWeight: 600, color: PRIMARY, textTransform: "none", letterSpacing: 0 }}>{cat.icon} {cat.label}</span>}
            </div>
            <div className="p-2 space-y-1">
              {subcategories.map((sub) => {
                const active = sub.id === subId;
                const hasOverride = !!overrides[sub.id];
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSubId(sub.id)}
                    className="w-full text-left rounded-xl px-3 py-2.5 transition-all"
                    style={{ background: active ? PRIMARY : hasOverride ? `${PRIMARY}08` : "#f8fafc", border: `1.5px solid ${active ? PRIMARY : hasOverride ? `${PRIMARY}40` : "#e2e8f0"}` }}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 6px", borderRadius: 999, background: active ? "rgba(255,255,255,0.25)" : `${PRIMARY}15`, color: active ? "white" : PRIMARY }}>
                        {sub.num}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, flex: 1, color: active ? "white" : "#1e293b" }}>{sub.label}</span>
                      {hasOverride && !active && (
                        <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 999, background: `${PRIMARY}20`, color: PRIMARY }}>수정됨</span>
                      )}
                    </div>
                    {sub.articleRef && (
                      <div style={{ fontSize: 11, marginTop: 3, color: active ? "rgba(255,255,255,0.75)" : "#f59e0b" }}>⚖️ {sub.articleRef}</div>
                    )}
                  </button>
                );
              })}
              {subcategories.length === 0 && (
                <p className="text-center py-8 text-slate-400" style={{ fontSize: 12 }}>대분류를 선택하세요</p>
              )}
            </div>
          </div>

          {/* Col 3: 작업속성/위험속성/건설기계 */}
          <div className="flex-1 overflow-y-auto">
            {!subId || !selectedSub || !effective ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                <span style={{ fontSize: 36 }}>👈</span>
                <p style={{ fontSize: 14, textAlign: "center", lineHeight: 1.7 }}>상세분류를 선택하면<br />기본값을 편집할 수 있습니다</p>
              </div>
            ) : (
              <div>
                {/* 패널 헤더 */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 sticky top-0 bg-white z-10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 6px", borderRadius: 999, background: PRIMARY_LIGHT, color: PRIMARY }}>{selectedSub.num}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{selectedSub.label}</span>
                      {isOverridden && <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 999, background: "#fef9c3", color: "#a16207" }}>커스텀 적용중</span>}
                    </div>
                    {selectedSub.articleRef && <p style={{ fontSize: 11, color: "#f59e0b", marginTop: 2 }}>⚖️ {selectedSub.articleRef}</p>}
                  </div>
                  <div className="flex gap-2">
                    {isOverridden && (
                      <button onClick={() => resetOverride(subId)} className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors" style={{ fontSize: 12, padding: "5px 12px", color: "#64748b" }}>
                        이 항목 초기화
                      </button>
                    )}
                    <button
                      onClick={() => setStep("configure")}
                      className="rounded-lg font-semibold text-white"
                      style={{ fontSize: 12, padding: "5px 16px", background: PRIMARY }}
                    >
                      다음 단계: 섹션 구성 →
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-6">
                  <div className="flex items-start gap-2 px-4 py-3 rounded-xl" style={{ background: `${PRIMARY}08`, border: `1px solid ${PRIMARY}20` }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>ℹ️</span>
                    <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                      아래 값은 이 상세분류 선택 시 <strong>자동으로 체크되는 기본값</strong>입니다. 변경 즉시 저장됩니다.
                    </p>
                  </div>

                  {/* 작업속성 */}
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>📋 작업속성 기본값</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{effective.recommendedWorkAttrIds.length}/{WORK_ATTRIBUTES.length}개 선택</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {WORK_ATTRIBUTES.map((wa) => {
                        const sel = effective.recommendedWorkAttrIds.includes(wa.id);
                        return (
                          <button key={wa.id} onClick={() => updateWa(wa.id)}
                            className="rounded-full border font-medium transition-all flex items-center gap-1.5"
                            style={{ fontSize: 12, padding: "6px 14px", background: sel ? "#0f766e" : "white", borderColor: sel ? "#0f766e" : "#cbd5e1", color: sel ? "white" : "#475569" }}>
                            <span className="w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0"
                              style={{ borderColor: sel ? "rgba(255,255,255,0.8)" : "#94a3b8", background: sel ? "rgba(255,255,255,0.25)" : "transparent" }}>
                              {sel && <span style={{ fontSize: 8, color: "white" }}>✓</span>}
                            </span>
                            {wa.label}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <div className="border-t border-slate-100" />

                  {/* 위험속성 */}
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>⚠️ 위험속성 기본값</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{effective.recommendedRiskAttrIds.length}/{RISK_ATTRIBUTES.length}개 선택</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {RISK_ATTRIBUTES.map((ra) => {
                        const sel = effective.recommendedRiskAttrIds.includes(ra.id);
                        const color = ra.color ?? "#dc2626";
                        return (
                          <button key={ra.id} onClick={() => updateRa(ra.id)}
                            className="rounded-full border font-medium transition-all flex items-center gap-1.5"
                            style={{ fontSize: 12, padding: "6px 14px", background: sel ? color : "white", borderColor: sel ? color : "#cbd5e1", color: sel ? "white" : "#475569" }}>
                            <span className="w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0"
                              style={{ borderColor: sel ? "rgba(255,255,255,0.8)" : "#94a3b8", background: sel ? "rgba(255,255,255,0.25)" : "transparent" }}>
                              {sel && <span style={{ fontSize: 8, color: "white" }}>✓</span>}
                            </span>
                            {ra.label}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <div className="border-t border-slate-100" />

                  {/* 건설기계 */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>🔧 투입 건설기계 추천</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {effective.recommendedEquipmentIds.length + (effective.customEquipmentLabels?.length ?? 0)}개 선택
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {EQUIPMENT_GROUPS.map((grp) => {
                        const itemIds = grp.items.map((i) => i.id);
                        const selCount = itemIds.filter((id) => effective.recommendedEquipmentIds.includes(id)).length;
                        const allSel = selCount === itemIds.length;
                        const partSel = selCount > 0 && !allSel;
                        return (
                          <button key={grp.id} onClick={() => toggleEqGroup(grp.id)}
                            className="flex items-center gap-1.5 rounded-full border font-medium transition-all"
                            style={{ fontSize: 12, padding: "6px 14px",
                              background: allSel ? PRIMARY : partSel ? PRIMARY_LIGHT : "white",
                              borderColor: selCount > 0 ? PRIMARY : "#cbd5e1",
                              color: allSel ? "white" : selCount > 0 ? PRIMARY : "#475569" }}>
                            <span>{grp.icon}</span>
                            <span>{grp.label}</span>
                            {allSel && <span style={{ fontSize: 10 }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>

                      {/* 기타 직접입력 */}
                      <div className="rounded-xl border border-dashed border-slate-200 p-4" style={{ background: "#f8fafc" }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>➕ 기타 장비 직접입력</p>
                        {(effective.customEquipmentLabels?.length ?? 0) > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {(effective.customEquipmentLabels ?? []).map((label, i) => (
                              <span key={i} className="flex items-center gap-1 rounded-full" style={{ fontSize: 12, padding: "5px 12px", background: PRIMARY, color: "white" }}>
                                {label}
                                <button onClick={() => removeCustomEqLabel(i)} style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>✕</button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customEqInput}
                            onChange={(e) => setCustomEqInput(e.target.value)}
                            placeholder="장비명 입력 후 Enter 또는 추가 버튼"
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomEqLabel(); } }}
                            className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-teal-400"
                            style={{ fontSize: 12 }}
                          />
                          <button
                            onClick={addCustomEqLabel}
                            disabled={!customEqInput.trim() || !subId}
                            className="rounded-lg font-semibold text-white"
                            style={{ fontSize: 12, padding: "6px 14px", background: customEqInput.trim() && subId ? PRIMARY : "#cbd5e1", cursor: customEqInput.trim() && subId ? "pointer" : "not-allowed" }}
                          >
                            추가
                          </button>
                        </div>
                      </div>
                  </section>

                  {/* 현재 기본값 요약 */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>현재 기본값 요약</p>
                    <div className="flex flex-wrap gap-1.5">
                      {effective.recommendedWorkAttrIds.map((id) => (
                        <span key={id} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#ccfbf1", color: "#0f766e", fontWeight: 500 }}>
                          {WORK_ATTRIBUTES.find((a) => a.id === id)?.label}
                        </span>
                      ))}
                      {effective.recommendedRiskAttrIds.map((id) => {
                        const ra = RISK_ATTRIBUTES.find((a) => a.id === id);
                        return <span key={id} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: ra?.color ?? "#dc2626", color: "white", fontWeight: 500 }}>⚠ {ra?.label}</span>;
                      })}
                      {(() => {
                        const selGrps = EQUIPMENT_GROUPS.filter((g) =>
                          g.items.some((i) => effective.recommendedEquipmentIds.includes(i.id))
                        );
                        return selGrps.map((g) => (
                          <span key={g.id} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: `${PRIMARY}15`, color: PRIMARY, fontWeight: 500 }}>
                            {g.icon} {g.label}
                          </span>
                        ));
                      })()}
                      {(effective.customEquipmentLabels ?? []).map((label, i) => (
                        <span key={`c${i}`} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: `${PRIMARY}15`, color: PRIMARY, fontWeight: 500 }}>
                          🔧 {label} (기타)
                        </span>
                      ))}
                      {effective.recommendedWorkAttrIds.length === 0 && effective.recommendedRiskAttrIds.length === 0 && effective.recommendedEquipmentIds.length === 0 && (effective.customEquipmentLabels?.length ?? 0) === 0 && (
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>선택된 기본값 없음</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Phase 2: configure ── */}
      {step === "configure" && (
        <div className="flex flex-1 overflow-hidden">

          {/* Left: 선택값 요약 */}
          <div className="flex-shrink-0 flex flex-col border-r border-slate-200 bg-white overflow-hidden" style={{ width: 280 }}>
            {/* 선택된 분류 */}
            <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0" style={{ background: PRIMARY_LIGHT }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 12, fontWeight: 700, color: PRIMARY }}>선택된 분류</span>
                <button onClick={() => setStep("classify")} style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, padding: "3px 9px", borderRadius: 999, background: "rgba(255,255,255,0.7)", border: `1px solid ${PRIMARY}40` }}>
                  ← 재선택
                </button>
              </div>
              {cat && selectedSub && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>{cat.icon} {cat.num}. {cat.label}</div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>› {selectedSub.num} {selectedSub.label}</div>
                </>
              )}
            </div>

            {/* 선택된 wa/ra/eq */}
            {effective && (
              <div className="px-4 py-3 border-b border-slate-100 space-y-2 flex-shrink-0">
                {effective.recommendedWorkAttrIds.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>📋 작업속성</p>
                    <div className="flex flex-wrap gap-1">
                      {effective.recommendedWorkAttrIds.map((id) => (
                        <span key={id} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#ccfbf1", color: "#0f766e" }}>
                          {WORK_ATTRIBUTES.find((a) => a.id === id)?.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {effective.recommendedRiskAttrIds.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>⚠️ 위험속성</p>
                    <div className="flex flex-wrap gap-1">
                      {effective.recommendedRiskAttrIds.map((id) => {
                        const ra = RISK_ATTRIBUTES.find((a) => a.id === id);
                        return <span key={id} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: ra?.color ?? "#dc2626", color: "white" }}>{ra?.label}</span>;
                      })}
                    </div>
                  </div>
                )}
                {(effective.recommendedEquipmentIds.length + (effective.customEquipmentLabels?.length ?? 0)) > 0 && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>🔧 건설기계</p>
                    <div className="flex flex-wrap gap-1">
                      {effective.recommendedEquipmentIds.map((id) => (
                        <span key={id} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: PRIMARY_LIGHT, color: PRIMARY }}>
                          {EQUIPMENT_MAP[id]?.label ?? id}
                        </span>
                      ))}
                      {(effective.customEquipmentLabels ?? []).map((label, i) => (
                        <span key={`c${i}`} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: PRIMARY_LIGHT, color: PRIMARY }}>
                          {label} (기타)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {effective.recommendedWorkAttrIds.length === 0 && effective.recommendedRiskAttrIds.length === 0 && effective.recommendedEquipmentIds.length === 0 && (
                  <p style={{ fontSize: 11, color: "#94a3b8" }}>선택된 기본값 없음</p>
                )}
              </div>
            )}

          </div>

          {/* Center: 섹션 구성 */}
          <div className="flex-shrink-0 flex flex-col overflow-y-auto border-r border-slate-200 bg-white" style={{ width: 320 }}>
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>섹션 구성 기본값</h2>
                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>정식/약식별 활성 섹션을 설정합니다</p>
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{editEnabled.size}/{SECTION_META.length}</span>
            </div>

            <div className="p-4 space-y-3">
              {/* 문서 유형 탭 */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>문서 유형</label>
                <div className="flex rounded-xl overflow-hidden border border-slate-200">
                  {(["full", "lite"] as SubProfile[]).map((p) => (
                    <button key={p} onClick={() => setEditProfile(p)}
                      className="flex-1 py-2 text-xs font-semibold transition-all"
                      style={{ background: editProfile === p ? PRIMARY : "white", color: editProfile === p ? "white" : "#64748b" }}>
                      {p === "full" ? "📄 정식" : "📝 약식"}
                    </button>
                  ))}
                </div>
              </div>

              {isCustomized && (
                <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 999, background: "#fef9c3", color: "#a16207", fontWeight: 600 }}>사용자 설정</span>
              )}

              {/* 법정 섹션 안내 */}
              {(() => {
                const legalActive = SECTION_META.filter((m) => m.legal && editEnabled.has(m.id));
                if (!legalActive.length) return null;
                return (
                  <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 flex items-start gap-1.5">
                    <span style={{ fontSize: 11, flexShrink: 0 }}>⚖️</span>
                    <p style={{ fontSize: 10, color: "#92400e", lineHeight: 1.5 }}>법정 필수: {legalActive.map((m) => m.label).join(" · ")}</p>
                  </div>
                );
              })()}

              {/* 섹션 토글 목록 */}
              <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-50">
                {SECTION_META.map(({ id, icon, label, required, legal }) => {
                  const enabled = editEnabled.has(id);
                  return (
                    <button key={id} onClick={() => toggleSection(id, required)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${required ? "cursor-default" : "hover:bg-slate-50"}`}
                      style={{ background: enabled ? `${PRIMARY}06` : "white" }}>
                      <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                        style={{ background: enabled ? PRIMARY : "white", borderColor: enabled ? PRIMARY : "#cbd5e1" }}>
                        {enabled && <span className="text-white" style={{ fontSize: 9 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 11, flexShrink: 0 }}>{icon}</span>
                      <span style={{ fontSize: 12, flex: 1, color: enabled ? "#334155" : "#94a3b8", fontWeight: enabled ? 500 : 400 }}>{label}</span>
                      {required && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 999, background: `${PRIMARY}15`, color: PRIMARY, fontWeight: 600, flexShrink: 0 }}>필수</span>}
                      {legal && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 999, background: "#fef3c7", color: "#d97706", fontWeight: 600, flexShrink: 0 }}>⚖️</span>}
                    </button>
                  );
                })}
              </div>

              <button onClick={handleReset}
                className="w-full rounded-xl font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                style={{ fontSize: 12, padding: "7px 0" }}>
                {isCustomized ? "기본값으로 초기화" : "기본값 보기"}
              </button>
            </div>
          </div>

          {/* Right: 미리보기 */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="mb-4">
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>📄 작업계획서 미리보기</h2>
              {subId && selectedSub && cat ? (
                <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                  {cat.icon} {cat.label} › {selectedSub.num} {selectedSub.label} · {editProfile === "full" ? "정식" : "약식"} · 섹션 {editEnabled.size}개
                </p>
              ) : (
                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>분류체계를 선택하면 미리보기가 표시됩니다</p>
              )}
            </div>

            {enabledSectionsForPreview.length > 0 ? (
              <div className="space-y-3 max-w-2xl">
                {enabledSectionsForPreview.map((meta) => {
                  const fields = SECTION_FIELDS[meta.id] ?? [];
                  return (
                    <div key={meta.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                      <div className="px-4 py-2.5 flex items-center gap-2 border-b border-slate-100"
                        style={{ background: meta.legal ? "#fffbeb" : meta.required ? PRIMARY_LIGHT : "#f8fafc" }}>
                        <span style={{ fontSize: 14 }}>{meta.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: meta.legal ? "#92400e" : meta.required ? PRIMARY : "#334155", flex: 1 }}>{meta.label}</span>
                        {meta.required && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 999, background: `${PRIMARY}20`, color: PRIMARY, fontWeight: 600 }}>필수</span>}
                        {meta.legal && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 999, background: "#fef3c7", color: "#d97706", fontWeight: 600 }}>⚖️ {LEGAL_REFS[meta.id]}</span>}
                      </div>
                      <div className="p-4">
                        <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                          {fields.map((field, i) => (
                            <div key={i} style={{ gridColumn: field.cols === 2 ? "1 / -1" : undefined }}>
                              <div style={{ fontSize: 10, fontWeight: 600, color: "#475569", marginBottom: 3 }}>{field.label}</div>
                              <FieldInput
                                field={field}
                                value={(formDefaults[meta.id] ?? {})[field.label] ?? ""}
                                onChange={(v) => setFormDefaults((prev) => ({
                                  ...prev,
                                  [meta.id]: { ...(prev[meta.id] ?? {}), [field.label]: v },
                                }))}
                              />
                            </div>
                          ))}
                        </div>
                        {fields.length === 0 && <p style={{ fontSize: 11, color: "#94a3b8" }}>입력 항목 없음</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 rounded-2xl border-2 border-dashed border-slate-200">
                <div className="text-center">
                  <p style={{ fontSize: 32, marginBottom: 8 }}>📄</p>
                  <p style={{ fontSize: 13, color: "#94a3b8" }}>섹션을 활성화하면<br />미리보기가 나타납니다</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Phase 2 하단 액션 바 ── */}
      {step === "configure" && (
        <div className="flex-shrink-0 border-t border-slate-200 bg-white px-5 py-3 flex items-center justify-end gap-3">
          <button
            onClick={handleSaveSections}
            className="rounded-xl font-semibold text-white text-sm"
            style={{ padding: "8px 20px", background: PRIMARY }}
          >
            {sectionChanged ? "💾 기본값으로 저장" : "✓ 저장됨"}
          </button>
        </div>
      )}

        </div>{/* end flex-col flex-1 */}

        {/* ── Favorites sidebar (always visible) ── */}
        <div className="flex-shrink-0 flex flex-col border-l border-slate-200 bg-white overflow-hidden" style={{ width: 256 }}>
          <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0" style={{ background: PRIMARY_LIGHT }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: PRIMARY }}>⭐ 즐겨찾기</h2>
            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
              {step === "configure" && subId ? "섹션 구성 후 등록 가능" : "섹션 구성 단계에서 등록"}
            </p>
          </div>

          {/* 등록/업데이트 버튼 - configure + subId일 때만 */}
          {step === "configure" && subId && (
            <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0 space-y-2">
              {/* 불러온 즐겨찾기 업데이트 */}
              {loadedFavId && (() => {
                const loadedFav = sectionFavorites.find((f) => f.id === loadedFavId);
                return loadedFav ? (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-2.5">
                    <p className="text-xs text-blue-600 font-semibold mb-1.5 truncate">↩ {loadedFav.name}</p>
                    <div className="flex gap-1.5">
                      <button onClick={handleOverwrite} className="flex-1 text-xs py-1.5 rounded-lg text-white font-medium" style={{ background: "#2563eb" }}>
                        ♻ 덮어쓰기
                      </button>
                      <button onClick={() => setLoadedFavId(null)} className="text-xs px-2 py-1.5 rounded-lg text-slate-500 bg-slate-100">
                        해제
                      </button>
                    </div>
                  </div>
                ) : null;
              })()}
              {/* 새 즐겨찾기 등록 */}
              {saveMode ? (
                <div className="space-y-1.5">
                  <input
                    type="text" value={saveName} onChange={(e) => setSaveName(e.target.value)}
                    placeholder="즐겨찾기 이름" autoFocus
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-teal-400"
                    onKeyDown={(e) => { if (e.key === "Enter") handleFavSave(); if (e.key === "Escape") setSaveMode(false); }}
                  />
                  <div className="flex gap-1.5">
                    <button onClick={handleFavSave} className="flex-1 text-xs py-1.5 rounded-lg text-white font-medium" style={{ background: "#f59e0b" }}>저장</button>
                    <button onClick={() => setSaveMode(false)} className="flex-1 text-xs py-1.5 rounded-lg text-slate-500 bg-slate-100">취소</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setSaveMode(true)} className="w-full rounded-xl font-semibold text-xs" style={{ padding: "7px 0", background: "#fef3c7", color: "#d97706", border: "1px solid #fde68a" }}>
                  ⭐ {loadedFavId ? "새 즐겨찾기로 저장" : "즐겨찾기 등록"}
                </button>
              )}
            </div>
          )}

          {/* 즐겨찾기 목록 */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <h2 style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8 }}>
              목록 ({sectionFavorites.length})
            </h2>
            {sectionFavorites.length === 0 ? (
              <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", paddingTop: 16 }}>저장된 즐겨찾기 없음</p>
            ) : (
              <div className="space-y-1.5">
                {sectionFavorites.map((fav: SectionFavorite) => {
                  const cl = fav.classification;
                  const favCat = cl ? WORK_CATEGORIES.find((c) => c.id === cl.categoryId) : null;
                  const favSub = cl ? WORK_SUBCATEGORIES.find((s) => s.id === cl.subcategoryId) : null;
                  return (
                    <div key={fav.id} className="rounded-lg border border-slate-100 overflow-hidden">
                      <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50">
                        {renamingId === fav.id ? (
                          <div className="flex gap-1 flex-1">
                            <input type="text" value={renameVal} onChange={(e) => setRenameVal(e.target.value)}
                              className="flex-1 text-xs px-2 py-0.5 border border-slate-200 rounded outline-none focus:border-teal-400"
                              onKeyDown={(e) => { if (e.key === "Enter") handleRenameConfirm(); if (e.key === "Escape") setRenamingId(null); }}
                              autoFocus />
                            <button onClick={handleRenameConfirm} className="text-xs px-1.5 py-0.5 rounded text-white" style={{ background: PRIMARY }}>확인</button>
                            <button onClick={() => setRenamingId(null)} className="text-xs px-1.5 py-0.5 rounded text-slate-500 bg-slate-200">취소</button>
                          </div>
                        ) : (
                          <>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#334155", flex: 1 }} className="truncate">⭐ {fav.name}</span>
                            <button onClick={() => { setRenamingId(fav.id); setRenameVal(fav.name); }} className="text-slate-300 hover:text-teal-500 flex-shrink-0" style={{ fontSize: 12 }}>✏</button>
                            <button onClick={() => handleLoadFav(fav)}
                              className="text-xs px-2 py-0.5 rounded text-white font-medium flex-shrink-0" style={{ background: PRIMARY }}>불러오기</button>
                            <button onClick={() => deleteFavorite(fav.id)} className="text-slate-300 hover:text-red-400 flex-shrink-0" style={{ fontSize: 11 }}>🗑</button>
                          </>
                        )}
                      </div>
                      {(favCat || favSub) && (
                        <div className="px-3 py-1 flex items-center gap-1 flex-wrap" style={{ borderTop: "1px solid #f1f5f9" }}>
                          {favCat && <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 999, background: "#e2e8f0", color: "#475569" }}>{favCat.icon} {favCat.label}</span>}
                          {favSub && <>
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>›</span>
                            <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 999, background: PRIMARY_LIGHT, color: PRIMARY, fontWeight: 600 }}>{favSub.num} {favSub.label}</span>
                          </>}
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginLeft: "auto", padding: "2px 7px", borderRadius: 999, background: "#f1f5f9" }}>섹션 {fav.sections.filter((s) => s.enabled).length}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>{/* end favorites sidebar */}

      </div>{/* end body flex */}
    </div>
  );
}
