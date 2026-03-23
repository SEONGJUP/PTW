"use client";
import React, { useState } from "react";
import {
  WORK_PERMIT_TYPE_LABELS,
  WORK_PERMIT_TYPE_ICONS,
  PERMIT_SAFETY_CHECKLIST,
  COMMON_SAFETY_MEASURES,
  GAS_STANDARDS,
  LEGALLY_REQUIRED_PERMIT_TYPES,
  PERMIT_SPECIFICS_FIELDS,
  WorkPermitType,
  PERMIT_SIGNATURE_STAGES,
  WORK_PERMIT_STATUS_LABELS,
} from "@/store/workPermitStore";
import { CONSTRUCTION_EQUIPMENT_TYPES } from "@/store/workPlanStore";
import { WORK_CATEGORIES, WORK_SUBCATEGORIES } from "@/store/workPlanTaxonomy";

const PRIMARY = "#00B7AF";
const PRIMARY_LIGHT = "#E6FAF9";

// WorkPermit 필드 정의
const PERMIT_FIELDS = [
  { field: "id",                    type: "string",                   desc: "허가서 고유 ID (자동생성)" },
  { field: "type",                  type: "WorkPermitType",           desc: "주 허가서 유형" },
  { field: "extraTypes",            type: "WorkPermitType[]",         desc: "추가 허가서 유형 (복수선택)" },
  { field: "customTypeIds",         type: "string[]",                 desc: "사용자 정의 허가서 유형 IDs" },
  { field: "customTypeName",        type: "string",                   desc: "기타 유형 직접입력 (쉼표 구분 복수)" },
  { field: "status",                type: "WorkPermitStatus",         desc: "허가서 상태 (draft/pending/approved/...)" },
  { field: "title",                 type: "string",                   desc: "작업명 (문서 제목)" },
  { field: "siteName",              type: "string",                   desc: "사업장명" },
  { field: "location",              type: "string",                   desc: "작업 장소" },
  { field: "contractor",            type: "string",                   desc: "협력사" },
  { field: "requestedBy",           type: "string",                   desc: "신청인 성명" },
  { field: "requestedByDept",       type: "string",                   desc: "신청인 부서" },
  { field: "requestedByPosition",   type: "string",                   desc: "신청인 직책" },
  { field: "startDate",             type: "string (YYYY-MM-DD)",      desc: "작업 시작일" },
  { field: "endDate",               type: "string (YYYY-MM-DD)",      desc: "작업 종료일" },
  { field: "startTime",             type: "string (HH:MM)",           desc: "작업 시작시간" },
  { field: "endTime",               type: "string (HH:MM)",           desc: "작업 종료시간" },
  { field: "description",           type: "string",                   desc: "작업 개요" },
  { field: "personnelCount",        type: "string",                   desc: "투입 인원" },
  { field: "equipmentTypes",        type: "string[]",                 desc: "건설기계 9종 선택 (키 배열)" },
  { field: "equipmentCustomList",   type: "string[]",                 desc: "기타 장비 직접입력 목록" },
  { field: "safetyMeasures",        type: "Record<string,boolean>",   desc: "공통 안전조치 (항목→boolean)" },
  { field: "safetyChecklist",       type: "Record<string,string>",    desc: "안전 체크리스트 (항목→양호/불량/해당없음/\"\")" },
  { field: "customChecklistItems",  type: "string[]",                 desc: "사용자 직접추가 체크항목" },
  { field: "specifics",             type: "Record<string,string>",    desc: "유형별 확인사항 (key→value)" },
  { field: "gasMeasurements",       type: "GasMeasurement[]",         desc: "가스농도 측정 결과 (화기/밀폐공간시)" },
  { field: "signatures",            type: "PermitSignature[]",        desc: "5단계 서명결재" },
  { field: "approvalDecision",      type: "PermitApprovalDecision",   desc: "결재 결과" },
  { field: "approvalConditions",    type: "string",                   desc: "조건부 승인 조건 내용" },
  { field: "completionNote",        type: "string",                   desc: "작업완료 확인 메모" },
  { field: "workPlanId",            type: "string",                   desc: "연동된 작업계획서 ID" },
  { field: "workPlanTitle",         type: "string",                   desc: "연동된 작업계획서 제목" },
  { field: "ppeRequired",           type: "string[]",                 desc: "필요 PPE 목록" },
  { field: "additionalMeasures",    type: "string",                   desc: "추가 안전조치 사항" },
  { field: "createdAt",             type: "string (ISO 8601)",        desc: "생성 일시" },
  { field: "updatedAt",             type: "string (ISO 8601)",        desc: "최종 수정 일시" },
];

const WORKPLAN_OVERVIEW_FIELDS = [
  { field: "title",        label: "작업명(문서제목)",  type: "string",      permitField: "title" },
  { field: "documentDate", label: "문서작성일",        type: "YYYY-MM-DD",  permitField: "" },
  { field: "author",       label: "작성자",            type: "string",      permitField: "requestedBy" },
  { field: "siteName",     label: "사업장명",          type: "string",      permitField: "siteName" },
  { field: "process",      label: "공정",              type: "string",      permitField: "" },
  { field: "location",     label: "작업 장소",         type: "string",      permitField: "location" },
  { field: "headCount",    label: "작업인원",          type: "number (string)", permitField: "personnelCount" },
  { field: "contractor",   label: "협력사",            type: "string",      permitField: "contractor" },
  { field: "workStartDate",label: "작업 시작일",       type: "YYYY-MM-DD",  permitField: "startDate" },
  { field: "workEndDate",  label: "작업 종료일",       type: "YYYY-MM-DD",  permitField: "endDate" },
  { field: "description",  label: "작업개요",          type: "string",      permitField: "description" },
  { field: "team",         label: "팀/부서",           type: "string",      permitField: "requestedByDept" },
];

const PERMIT_TYPES = Object.keys(WORK_PERMIT_TYPE_LABELS) as WorkPermitType[];

const STATUS_INFO = Object.entries(WORK_PERMIT_STATUS_LABELS).map(([key, label]) => ({
  key, label,
  color: key === "draft" ? "#94a3b8" : key === "pending" ? "#f59e0b" : key === "approved" ? "#10b981"
    : key === "conditionally_approved" ? "#3b82f6" : key === "rejected" ? "#ef4444"
    : key === "completed" ? "#059669" : "#cbd5e1",
}));

// CSS 클래스 레퍼런스
const CSS_CLASSES = [
  { cls: "ptw-label",            desc: "폼 라벨 (text-xs font-semibold text-slate-600 mb-1)" },
  { cls: "ptw-input",            desc: "입력 필드 기본 스타일 (outline-none focus 효과)" },
  { cls: "ptw-section-card",     desc: "섹션 카드 래퍼 (bg-white, rounded-2xl, border)" },
  { cls: "ptw-section-card-header", desc: "섹션 헤더 (teal 배경, 아이콘+타이틀+배지)" },
  { cls: "ptw-section-card-body",   desc: "섹션 본문 (p-4 padding)" },
];

type TabId = "overview" | "schema" | "checklist" | "specifics" | "equipment-gas" | "taxonomy" | "ui-guide";

export default function DeveloperPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const exportAllExcel = async () => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    // Sheet 1: 허가서 필드 스키마
    const s1 = PERMIT_FIELDS.map(f => ({ 필드명: f.field, 타입: f.type, 설명: f.desc }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s1), "허가서_스키마");

    // Sheet 2: 작업계획서 overview 필드
    const s2 = WORKPLAN_OVERVIEW_FIELDS.map(f => ({ 필드키: f.field, 라벨: f.label, 타입: f.type, 허가서연동필드: f.permitField }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s2), "작업계획서_개요_필드");

    // Sheet 3: 허가서 유형 목록
    const s3 = PERMIT_TYPES.map((t, i) => ({
      순번: i + 1, 유형키: t, 유형명: WORK_PERMIT_TYPE_LABELS[t],
      아이콘: WORK_PERMIT_TYPE_ICONS[t], 법정의무: LEGALLY_REQUIRED_PERMIT_TYPES.includes(t) ? "Y" : "",
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s3), "허가서_유형");

    // Sheet 4: 체크리스트 기본값
    const s4: Record<string, string>[] = [];
    for (const t of PERMIT_TYPES) {
      for (const item of PERMIT_SAFETY_CHECKLIST[t]) {
        s4.push({ 유형키: t, 유형명: WORK_PERMIT_TYPE_LABELS[t], 항목: item });
      }
    }
    for (const item of COMMON_SAFETY_MEASURES) {
      s4.push({ 유형키: "(공통)", 유형명: "공통 안전조치", 항목: item });
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s4), "체크리스트_기본값");

    // Sheet 5: 확인사항 필드 기본값
    const s5: Record<string, string>[] = [];
    for (const t of PERMIT_TYPES) {
      for (const f of PERMIT_SPECIFICS_FIELDS[t] ?? []) {
        s5.push({ 유형키: t, 유형명: WORK_PERMIT_TYPE_LABELS[t], 필드키: f.key, 필드명: f.label });
      }
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s5), "확인사항_기본값");

    // Sheet 6: 건설기계 9종
    const s6 = Object.entries(CONSTRUCTION_EQUIPMENT_TYPES).map(([k, v]) => ({
      키: k, 순번: v.num, 아이콘: v.icon, 명칭: v.label,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s6), "건설기계_9종");

    // Sheet 7: 가스 측정 기준
    const s7 = GAS_STANDARDS.map(g => ({ 가스종류: g.type, 단위: g.unit, 판정기준: g.standard }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s7), "가스측정_기준");

    // Sheet 8: 작업 대분류
    const s8 = WORK_CATEGORIES.map(c => ({ 순번: c.num, ID: c.id, 아이콘: c.icon, 대분류명: c.label }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s8), "작업_대분류");

    // Sheet 9: 작업 상세분류
    const s9 = WORK_SUBCATEGORIES.map(s => ({
      번호: s.num, ID: s.id, 대분류ID: s.categoryId, 상세분류명: s.label,
      법령참조: s.articleRef ?? "", 직접입력여부: s.isCustom ? "Y" : "",
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s9), "작업_상세분류");

    // Sheet 10: 서명 단계
    const s10 = PERMIT_SIGNATURE_STAGES.map(st => ({
      단계: st.stage, 역할: st.role, 단계명: st.label, 설명: st.desc,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s10), "서명_단계");

    XLSX.writeFile(wb, "PTW_개발자참고_전체스키마.xlsx");
  };

  const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: "overview",      label: "프로젝트 개요",    icon: "🏗" },
    { id: "schema",        label: "데이터 스키마",    icon: "📐" },
    { id: "checklist",     label: "체크리스트",       icon: "✅" },
    { id: "specifics",     label: "확인사항 필드",    icon: "📋" },
    { id: "equipment-gas", label: "건설기계 & 가스",  icon: "⚙️" },
    { id: "taxonomy",      label: "작업분류 체계",    icon: "🗂" },
    { id: "ui-guide",      label: "UI 가이드",        icon: "🎨" },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "#f8fafc" }}>
      {/* 헤더 */}
      <div className="px-5 py-3 border-b bg-white border-slate-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-slate-800">💻 개발자 참고사항</h1>
            <p className="text-xs text-slate-400 mt-0.5">PTW 시스템 프로토타입 — 데이터 구조, 스키마, 기본값 레퍼런스</p>
          </div>
          <button
            onClick={exportAllExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "#10b981" }}
          >
            📥 전체 스키마 엑셀 다운로드
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div className="bg-white border-b border-slate-200 px-5 flex gap-1 flex-shrink-0 overflow-x-auto">
        {TABS.map(({ id, label, icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5"
            style={{ borderColor: activeTab === id ? PRIMARY : "transparent", color: activeTab === id ? PRIMARY : "#64748b" }}>
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto p-5">

        {/* ══ 프로젝트 개요 ══ */}
        {activeTab === "overview" && (
          <div className="max-w-3xl space-y-5">

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b" style={{ background: PRIMARY_LIGHT }}>
                <p className="text-sm font-bold" style={{ color: PRIMARY }}>📋 프로젝트 개요</p>
              </div>
              <div className="p-4 space-y-2 text-sm text-slate-600">
                <p><strong>프로젝트명:</strong> PTW (Permit to Work / Plan to Work) 시스템</p>
                <p><strong>목적:</strong> 건설현장 작업 허가 및 계획 수립·공유·추적 프로토타입</p>
                <p><strong>기술 스택:</strong> Next.js 15 (App Router), TypeScript, Tailwind CSS, Zustand (persist), xlsx</p>
                <p><strong>주요 색상:</strong> <span className="inline-block px-2 py-0.5 rounded font-mono text-white text-xs" style={{ background: PRIMARY }}>#00B7AF</span> (teal primary)</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50">
                <p className="text-sm font-bold text-slate-700">🗂 파일 구조 (주요)</p>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {[
                  { file: "store/workPermitStore.ts",                    desc: "허가서 상태, 유형 정의, 체크리스트, 가스기준, 서명" },
                  { file: "store/workPlanStore.ts",                      desc: "작업계획서 상태, 섹션 구성, 장비, 서명" },
                  { file: "store/workPlanTaxonomy.ts",                   desc: "작업 분류 체계 (대분류/상세분류/장비/속성)" },
                  { file: "components/work-permit/WorkPermitEditor.tsx", desc: "허가서 상세 편집 UI (PermitDetail, PermitDetailPage)" },
                  { file: "components/work-permit/PermitCreateModal.tsx",desc: "허가서 생성 모달 (유형선택 + 계획서 연동)" },
                  { file: "components/work-plan/WorkPlanEditor.tsx",     desc: "작업계획서 편집 UI (상단바, 섹션패널, 서명)" },
                  { file: "components/work-plan/SectionForm.tsx",        desc: "작업계획서 각 섹션 폼" },
                  { file: "app/work-plan/create/page.tsx",               desc: "작업계획서 작성 페이지" },
                  { file: "app/work-plan/permits/page.tsx",              desc: "작업허가서 목록/상세 페이지" },
                  { file: "app/work-plan/permit-settings/page.tsx",      desc: "허가서 상세 설정 (체크리스트/확인사항 커스텀)" },
                  { file: "app/safety-board/page.tsx",                   desc: "안전카드 게시판 (허가서 현황 모니터링)" },
                  { file: "app/approval/page.tsx",                       desc: "결재 페이지" },
                  { file: "app/developer/page.tsx",                      desc: "개발자 참고사항 (현재 페이지)" },
                ].map(({ file, desc }) => (
                  <div key={file} className="flex items-start gap-3 px-4 py-2.5">
                    <code className="text-teal-700 font-mono flex-shrink-0 w-80">{file}</code>
                    <span className="text-slate-500">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50">
                <p className="text-sm font-bold text-slate-700">🔑 허가서 상태 흐름</p>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {STATUS_INFO.map(({ key, label, color }) => (
                    <span key={key} className="px-2.5 py-1 rounded-full text-white text-xs font-medium" style={{ background: color }}>{label}</span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-3">draft → pending → approved | conditionally_approved | rejected → completed | expired</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50">
                <p className="text-sm font-bold text-slate-700">✍️ 5단계 서명 워크플로</p>
              </div>
              <div className="divide-y divide-slate-100">
                {PERMIT_SIGNATURE_STAGES.map((s) => (
                  <div key={s.stage} className="flex items-start gap-3 px-4 py-2.5 text-xs">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5" style={{ background: PRIMARY, fontSize: 10 }}>{s.stage}</span>
                    <span className="text-sm flex-shrink-0">{s.icon}</span>
                    <div>
                      <span className="font-semibold text-slate-700">{s.label}</span>
                      <span className="text-slate-400 ml-1.5">({s.role})</span>
                      <p className="text-slate-500 mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50">
                <p className="text-sm font-bold text-slate-700">🔗 WorkPlan ↔ WorkPermit 연동 필드</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: PRIMARY_LIGHT }}>
                      {["작업계획서 필드", "허가서 필드", "설명"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left font-semibold" style={{ color: PRIMARY }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {WORKPLAN_OVERVIEW_FIELDS.filter(f => f.permitField).map(f => (
                      <tr key={f.field} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-mono text-teal-700">overview.{f.field}</td>
                        <td className="px-4 py-2 font-mono text-purple-600">{f.permitField}</td>
                        <td className="px-4 py-2 text-slate-500">{f.label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ 데이터 스키마 ══ */}
        {activeTab === "schema" && (
          <div className="max-w-4xl space-y-5">
            {/* WorkPermit 스키마 */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50">
                <p className="text-sm font-bold text-slate-700">WorkPermit 인터페이스 ({PERMIT_FIELDS.length}개 필드)</p>
                <p className="text-xs text-slate-400 mt-0.5">store/workPermitStore.ts → WorkPermit interface</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: PRIMARY_LIGHT }}>
                      {["필드명", "타입", "설명"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left font-semibold" style={{ color: PRIMARY }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {PERMIT_FIELDS.map((f) => (
                      <tr key={f.field} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-mono text-teal-700">{f.field}</td>
                        <td className="px-4 py-2 font-mono text-purple-600">{f.type}</td>
                        <td className="px-4 py-2 text-slate-600">{f.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 작업계획서 스키마 */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50">
                <p className="text-sm font-bold text-slate-700">작업계획서 개요(overview) 필드 ({WORKPLAN_OVERVIEW_FIELDS.length}개)</p>
                <p className="text-xs text-slate-400 mt-0.5">formData[&quot;overview&quot;] 에 저장되는 필드들</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: PRIMARY_LIGHT }}>
                      {["필드키", "라벨", "타입", "허가서 연동 필드"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left font-semibold" style={{ color: PRIMARY }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {WORKPLAN_OVERVIEW_FIELDS.map((f) => (
                      <tr key={f.field} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-mono text-teal-700">{f.field}</td>
                        <td className="px-4 py-2 text-slate-700">{f.label}</td>
                        <td className="px-4 py-2 font-mono text-purple-600">{f.type}</td>
                        <td className="px-4 py-2 font-mono text-slate-400">{f.permitField || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 허가서 유형 목록 */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50">
                <p className="text-sm font-bold text-slate-700">WorkPermitType 유형 ({PERMIT_TYPES.length}개)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: PRIMARY_LIGHT }}>
                      {["유형키", "아이콘", "유형명", "법정의무"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left font-semibold" style={{ color: PRIMARY }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {PERMIT_TYPES.map((t) => (
                      <tr key={t} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-mono text-teal-700">{t}</td>
                        <td className="px-4 py-2 text-xl">{WORK_PERMIT_TYPE_ICONS[t]}</td>
                        <td className="px-4 py-2 text-slate-700">{WORK_PERMIT_TYPE_LABELS[t]}</td>
                        <td className="px-4 py-2">
                          {LEGALLY_REQUIRED_PERMIT_TYPES.includes(t) && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">⚖️ 법정</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ 체크리스트 ══ */}
        {activeTab === "checklist" && (
          <div className="max-w-3xl space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50">
                <p className="text-sm font-bold text-slate-700">공통 안전조치 ({COMMON_SAFETY_MEASURES.length}개)</p>
                <p className="text-xs text-slate-400 mt-0.5">모든 허가서 유형에 공통 적용 · COMMON_SAFETY_MEASURES</p>
              </div>
              <div className="divide-y divide-slate-100">
                {COMMON_SAFETY_MEASURES.map((item, i) => (
                  <div key={item} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <span className="text-xs text-slate-300 w-5 text-right">{i + 1}</span>
                    <span className="text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {PERMIT_TYPES.map((t) => {
              const items = PERMIT_SAFETY_CHECKLIST[t] ?? [];
              if (!items.length) return null;
              return (
                <div key={t} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <div className="px-4 py-3 border-b bg-slate-50 flex items-center gap-2">
                    <span>{WORK_PERMIT_TYPE_ICONS[t]}</span>
                    <p className="text-sm font-bold text-slate-700">{WORK_PERMIT_TYPE_LABELS[t]}</p>
                    <span className="text-xs text-slate-400">({items.length}개)</span>
                    {LEGALLY_REQUIRED_PERMIT_TYPES.includes(t) && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">⚖️ 법정</span>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100">
                    {items.map((item, i) => (
                      <div key={item} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                        <span className="text-xs text-slate-300 w-5 text-right">{i + 1}</span>
                        <span className="text-slate-600">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ 확인사항 필드 ══ */}
        {activeTab === "specifics" && (
          <div className="max-w-3xl space-y-4">
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              <strong>PERMIT_SPECIFICS_FIELDS</strong> — 유형별 특화 확인사항 기본 필드 정의 (store/workPermitStore.ts).<br />
              커스텀 오버라이드는 <code className="font-mono">workPermitStore.specificsOverrides[typeId]</code>에 저장됩니다.
            </div>
            {PERMIT_TYPES.map((t) => {
              const fields = PERMIT_SPECIFICS_FIELDS[t] ?? [];
              if (!fields.length) return (
                <div key={t} className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-2 text-xs text-slate-400">
                  <span>{WORK_PERMIT_TYPE_ICONS[t]}</span>
                  <span>{WORK_PERMIT_TYPE_LABELS[t]}</span>
                  <span>— 전용 확인사항 없음 (공통만 적용)</span>
                </div>
              );
              return (
                <div key={t} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <div className="px-4 py-3 border-b bg-slate-50 flex items-center gap-2">
                    <span>{WORK_PERMIT_TYPE_ICONS[t]}</span>
                    <p className="text-sm font-bold text-slate-700">{WORK_PERMIT_TYPE_LABELS[t]}</p>
                    <span className="text-xs text-slate-400">({fields.length}개 필드)</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: PRIMARY_LIGHT }}>
                          {["필드키", "라벨"].map(h => (
                            <th key={h} className="px-4 py-2 text-left font-semibold" style={{ color: PRIMARY }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {fields.map((f) => (
                          <tr key={f.key} className="hover:bg-slate-50">
                            <td className="px-4 py-2 font-mono text-teal-700">{f.key}</td>
                            <td className="px-4 py-2 text-slate-600">{f.label}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ 건설기계 & 가스기준 ══ */}
        {activeTab === "equipment-gas" && (
          <div className="max-w-3xl space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50">
                <p className="text-sm font-bold text-slate-700">건설기계 9종 (산업안전보건법 기준)</p>
                <p className="text-xs text-slate-400 mt-0.5">CONSTRUCTION_EQUIPMENT_TYPES — store/workPlanStore.ts</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: PRIMARY_LIGHT }}>
                    {["키", "순번", "아이콘", "명칭"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-semibold text-xs" style={{ color: PRIMARY }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(CONSTRUCTION_EQUIPMENT_TYPES).map(([k, v]) => (
                    <tr key={k} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-mono text-xs text-teal-700">{k}</td>
                      <td className="px-4 py-2.5 text-slate-500">{v.num}</td>
                      <td className="px-4 py-2.5 text-xl">{v.icon}</td>
                      <td className="px-4 py-2.5 text-slate-700">{v.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50">
                <p className="text-sm font-bold text-slate-700">가스농도 측정 기준</p>
                <p className="text-xs text-slate-400 mt-0.5">GAS_STANDARDS — store/workPermitStore.ts · 화기작업·밀폐공간 시 의무 측정</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: PRIMARY_LIGHT }}>
                    {["가스종류", "단위", "판정기준"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-semibold text-xs" style={{ color: PRIMARY }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {GAS_STANDARDS.map((g) => (
                    <tr key={g.type} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-semibold text-slate-700">{g.type}</td>
                      <td className="px-4 py-2.5 text-slate-500">{g.unit}</td>
                      <td className="px-4 py-2.5 text-slate-600">{g.standard}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ 작업분류 체계 ══ */}
        {activeTab === "taxonomy" && (
          <div className="max-w-4xl space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50">
                <p className="text-sm font-bold text-slate-700">대분류 ({WORK_CATEGORIES.length}개)</p>
                <p className="text-xs text-slate-400 mt-0.5">WORK_CATEGORIES — store/workPlanTaxonomy.ts</p>
              </div>
              <div className="divide-y divide-slate-100">
                {WORK_CATEGORIES.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                    <span className="text-slate-400 w-6">{c.num}.</span>
                    <span className="text-base">{c.icon}</span>
                    <span className="font-semibold text-slate-700">{c.label}</span>
                    <code className="text-teal-600 font-mono ml-auto">{c.id}</code>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50">
                <p className="text-sm font-bold text-slate-700">상세분류 ({WORK_SUBCATEGORIES.length}개)</p>
                <p className="text-xs text-slate-400 mt-0.5">WORK_SUBCATEGORIES — store/workPlanTaxonomy.ts</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: PRIMARY_LIGHT }}>
                      {["번호", "ID", "대분류", "상세분류명", "법령참조"].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: PRIMARY }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {WORK_SUBCATEGORIES.map((s) => {
                      const cat = WORK_CATEGORIES.find(c => c.id === s.categoryId);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-400 font-mono">{s.num}</td>
                          <td className="px-3 py-2 font-mono text-teal-700">{s.id}</td>
                          <td className="px-3 py-2 text-slate-500">{cat?.icon} {cat?.label}</td>
                          <td className="px-3 py-2 font-semibold text-slate-700">
                            {s.label}
                            {s.isCustom && <span className="ml-1 text-xs px-1 rounded" style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>직접입력</span>}
                          </td>
                          <td className="px-3 py-2 text-slate-400">{s.articleRef || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ UI 가이드 ══ */}
        {activeTab === "ui-guide" && (
          <div className="max-w-3xl space-y-5">

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50">
                <p className="text-sm font-bold text-slate-700">🎨 컬러 토큰</p>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { name: "PRIMARY",       value: "#00B7AF", note: "주 색상 — 헤더, 버튼, 강조" },
                  { name: "PRIMARY_LIGHT", value: "#E6FAF9", note: "배경 강조 — 선택된 카드, 헤더 배경" },
                  { name: "PRIMARY_DARK",  value: "#00A099", note: "호버 상태 (일부 컴포넌트)" },
                  { name: "slate-800",     value: "#1e293b", note: "본문 강한 텍스트" },
                  { name: "slate-500",     value: "#64748b", note: "보조 텍스트" },
                  { name: "slate-200",     value: "#e2e8f0", note: "기본 테두리" },
                  { name: "#10b981",       value: "#10b981", note: "녹색 — 완료/양호 상태" },
                  { name: "#ef4444",       value: "#ef4444", note: "빨강 — 오류/불량/반려" },
                  { name: "#f59e0b",       value: "#f59e0b", note: "노랑 — 경고/승인대기" },
                ].map(({ name, value, note }) => (
                  <div key={name} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md border border-slate-200 flex-shrink-0" style={{ background: value }} />
                    <code className="font-mono text-xs text-slate-700 w-32">{value}</code>
                    <span className="text-xs font-semibold text-slate-600 w-28">{name}</span>
                    <span className="text-xs text-slate-400">{note}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50">
                <p className="text-sm font-bold text-slate-700">📐 CSS 클래스 레퍼런스 (globals.css)</p>
              </div>
              <div className="divide-y divide-slate-100">
                {CSS_CLASSES.map(({ cls, desc }) => (
                  <div key={cls} className="flex items-start gap-3 px-4 py-3 text-xs">
                    <code className="font-mono text-teal-700 w-52 flex-shrink-0">.{cls}</code>
                    <span className="text-slate-500">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50">
                <p className="text-sm font-bold text-slate-700">🧩 컴포넌트 패턴</p>
              </div>
              <div className="p-4 space-y-3 text-xs text-slate-600">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-700">섹션 카드</p>
                  <pre className="bg-slate-50 rounded-lg p-3 text-xs font-mono text-slate-600 overflow-x-auto">{`<div className="ptw-section-card">
  <SectionHeader icon="📋" title="섹션명" badge="5/10" />
  <div className="ptw-section-card-body">
    {/* 내용 */}
  </div>
</div>`}</pre>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-700">폼 필드</p>
                  <pre className="bg-slate-50 rounded-lg p-3 text-xs font-mono text-slate-600 overflow-x-auto">{`<label className="ptw-label">필드명</label>
<input className="ptw-input w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" />`}</pre>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-700">기본 버튼 (Primary CTA)</p>
                  <pre className="bg-slate-50 rounded-lg p-3 text-xs font-mono text-slate-600 overflow-x-auto">{`<button
  className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
  style={{ background: PRIMARY, boxShadow: \`0 2px 8px \${PRIMARY}44\` }}
>
  버튼
</button>`}</pre>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50">
                <p className="text-sm font-bold text-slate-700">📱 레이아웃 구조</p>
              </div>
              <div className="p-4 text-xs text-slate-600 space-y-2">
                <p><strong>전체 레이아웃:</strong> Sidebar (고정 너비) + Main (flex-1)</p>
                <p><strong>페이지 높이:</strong> h-full overflow-hidden (스크롤은 내부 영역만)</p>
                <p><strong>반응형:</strong> sm: 브레이크포인트 사용 (640px), 모바일 우선 미적용</p>
                <p><strong>모달:</strong> fixed inset-0 z-50, backdrop rgba(0,0,0,0.6)</p>
                <p><strong>카드 border-radius:</strong> rounded-2xl (상위), rounded-xl (내부)</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
