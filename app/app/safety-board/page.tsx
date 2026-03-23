"use client";
import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useWorkPermitStore,
  WorkPermitType,
  WORK_PERMIT_TYPE_LABELS,
  WORK_PERMIT_STATUS_LABELS,
} from "@/store/workPermitStore";
import { PermitDetailPage } from "@/components/work-permit/WorkPermitEditor";
import { useWorkPlanStore, PLAN_CATEGORY_LABELS, OverviewData } from "@/store/workPlanStore";

// ─── 상수 ──────────────────────────────────────────────────────────
const PRIMARY = "#00B7AF";
const PRIMARY_DARK = "#00A099";
const PRIMARY_LIGHT = "#E6FAF9";

const PERMIT_TYPE_ICONS: Record<WorkPermitType, string> = {
  general: "📋",
  hot_work: "🔥",
  electrical: "⚡",
  confined_space: "🚪",
  working_at_height: "🏗️",
  excavation: "⛏️",
  heavy_load: "🏋️",
  night_overtime: "🌙",
  short_time: "⏱️",
};

// 허가서 상태 스타일
const PERMIT_STATUS_CLS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-500",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-600",
  expired: "bg-slate-100 text-slate-400",
};

// 계획서 상태 스타일
const PLAN_STATUS_CLS: Record<string, string> = {
  초안: "bg-slate-100 text-slate-500",
  진행중: "bg-blue-100 text-blue-700",
  승인대기: "bg-amber-100 text-amber-700",
  승인됨: "bg-violet-100 text-violet-700",
  완료: "bg-emerald-100 text-emerald-700",
};

// mock 작업계획서 데이터 (실제 저장된 계획서 목록이 없을 때 데모용)
const MOCK_PLANS = [
  { id: "WP-0012", title: "3호기 배관 보수공사", category: "hot_work", siteName: "울산공장 3동", author: "김안전", startDate: "2026-03-18", endDate: "2026-03-20", status: "승인됨", createdAt: "2026-03-15" },
  { id: "WP-0011", title: "탱크 맨홀 청소 작업", category: "confined_space", siteName: "여수공장 저장동", author: "이현장", startDate: "2026-03-17", endDate: "2026-03-17", status: "진행중", createdAt: "2026-03-16" },
  { id: "WP-0010", title: "옥상 방수 보수", category: "working_at_height", siteName: "본사 건물", author: "박감독", startDate: "2026-03-15", endDate: "2026-03-16", status: "완료", createdAt: "2026-03-14" },
  { id: "WP-0009", title: "굴착기 투입 기초공사", category: "construction_equipment", siteName: "신축현장 A구역", author: "최운전", startDate: "2026-03-10", endDate: "2026-03-14", status: "완료", createdAt: "2026-03-09" },
  { id: "WP-0008", title: "전기실 패널 점검", category: "general", siteName: "본사 전기실", author: "정전기", startDate: "2026-03-08", endDate: "2026-03-08", status: "완료", createdAt: "2026-03-07" },
];


// ─── 통합 행 타입 ─────────────────────────────────────────────────
type DocType = "plan" | "permit";

interface BoardRow {
  key: string;
  docType: DocType;
  permitId?: string;  // 허가서 행일 때 실제 permit id
  seq: string;
  title: string;
  subLabel: string;
  siteName: string;
  period: string;
  author: string;
  status: string;
  statusCls: string;
  createdAt: string;
}

// ─── 메인 ─────────────────────────────────────────────────────────
function SafetyBoardPage() {
  const { permits } = useWorkPermitStore();
  const { formData, planCategory } = useWorkPlanStore();
  const [search, setSearch] = useState("");
  const [docFilter, setDocFilter] = useState<DocType | "all">("all");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [sortKey, setSortKey] = useState<"createdAt" | "period" | "title">("createdAt");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [selectedPermitId, setSelectedPermitId] = useState<string | null>(null);
  const { createPermit } = useWorkPermitStore();
  const handleCreatePermit = () => {
    const newId = createPermit("general");
    setSelectedPermitId(newId);
  };
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get("permit");
    if (id) setSelectedPermitId(id);
  }, [searchParams]);

  // 현재 편집 중인 계획서
  const overview = (formData["overview"] as OverviewData | undefined) ?? {};
  const liveRows = overview.title
    ? [{ id: "WP-현재", title: overview.title, category: planCategory, siteName: overview.siteName ?? "", author: overview.author ?? "", startDate: overview.startDate ?? "", endDate: overview.endDate ?? "", status: "초안", createdAt: new Date().toISOString().slice(0, 10) }]
    : [];
  const allPlans = [...liveRows, ...MOCK_PLANS];

  // 통합 rows 빌드
  const rows: BoardRow[] = useMemo(() => {
    const planRows: BoardRow[] = allPlans.map((p, i) => ({
      key: `plan-${p.id}`,
      docType: "plan",
      seq: p.id,
      title: p.title,
      subLabel: PLAN_CATEGORY_LABELS[p.category as keyof typeof PLAN_CATEGORY_LABELS] ?? p.category,
      siteName: p.siteName,
      period: p.startDate ? `${p.startDate}${p.endDate && p.endDate !== p.startDate ? ` ~ ${p.endDate}` : ""}` : "—",
      author: p.author,
      status: p.status,
      statusCls: PLAN_STATUS_CLS[p.status] ?? "bg-slate-100 text-slate-500",
      createdAt: p.createdAt ?? p.startDate ?? "",
    }));

    const permitRows: BoardRow[] = permits.map((p, i) => ({
      key: `permit-${p.id}`,
      docType: "permit",
      permitId: p.id,
      seq: `PTW-${String(i + 1).padStart(4, "0")}`,
      title: p.title || "(제목 없음)",
      subLabel: WORK_PERMIT_TYPE_LABELS[p.type].replace(" 작업허가서", ""),
      siteName: p.siteName || "—",
      period: p.startDate ? `${p.startDate}${p.endDate && p.endDate !== p.startDate ? ` ~ ${p.endDate}` : ""}` : "—",
      author: p.requestedBy || p.contractor || "—",
      status: WORK_PERMIT_STATUS_LABELS[p.status],
      statusCls: PERMIT_STATUS_CLS[p.status] ?? "bg-slate-100 text-slate-500",
      createdAt: p.createdAt?.slice(0, 10) ?? "",
    }));

    return [...planRows, ...permitRows];
  }, [allPlans, permits]);

  // 필터 + 검색
  const allStatuses = useMemo(() => {
    const s = new Set(rows.map((r) => r.status));
    return ["전체", ...Array.from(s)];
  }, [rows]);

  const filtered = useMemo(() => {
    let r = rows;
    if (docFilter !== "all") r = r.filter((x) => x.docType === docFilter);
    if (statusFilter !== "전체") r = r.filter((x) => x.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((x) =>
        x.title.toLowerCase().includes(q) ||
        x.siteName.toLowerCase().includes(q) ||
        x.author.toLowerCase().includes(q) ||
        x.subLabel.toLowerCase().includes(q)
      );
    }
    return [...r].sort((a, b) => {
      const va = a[sortKey] ?? "";
      const vb = b[sortKey] ?? "";
      return sortDir === "desc" ? vb.localeCompare(va) : va.localeCompare(vb);
    });
  }, [rows, docFilter, statusFilter, search, sortKey, sortDir]);

  const planCount = rows.filter((r) => r.docType === "plan").length;
  const permitCount = rows.filter((r) => r.docType === "permit").length;

    const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ k }: { k: typeof sortKey }) =>
    sortKey === k ? <span className="ml-0.5">{sortDir === "desc" ? "↓" : "↑"}</span> : null;

  return (
    <div className="relative flex flex-col h-full" style={{ background: "#f8fafc" }}>

      {/* ─── 상단 헤더 바 ──────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-6 py-4 border-b"
        style={{ background: "white", borderColor: "#e2e8f0" }}
      >
        {/* 제목 + 생성 버튼 */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              🛡 안전카드 게시판
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              작업계획서 <span className="font-semibold text-slate-600">{planCount}건</span>
              <span className="mx-2 text-slate-200">|</span>
              작업허가서 <span className="font-semibold text-slate-600">{permitCount}건</span>
              <span className="mx-2 text-slate-200">|</span>
              합계 <span className="font-semibold" style={{ color: PRIMARY }}>{rows.length}건</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/work-plan/create"
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium border transition-colors text-slate-600 hover:border-teal-300 hover:text-teal-600"
              style={{ borderColor: "#e2e8f0", background: "white" }}
            >
              <span>📝</span>
              <span>작업계획서 작성</span>
            </Link>
            <button
              onClick={handleCreatePermit}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium text-white transition-colors"
              style={{ background: PRIMARY }}
              onMouseOver={(e) => (e.currentTarget.style.background = PRIMARY_DARK)}
              onMouseOut={(e) => (e.currentTarget.style.background = PRIMARY)}
            >
              <span>🔑</span>
              <span>작업허가서 작성</span>
            </button>
          </div>
        </div>

        {/* 필터 바 */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* 검색 */}
          <div className="relative flex-1 min-w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="제목, 현장명, 작성자, 유형 검색..."
              className="w-full pl-8 pr-3 py-1.5 border rounded-xl text-sm outline-none focus:border-teal-400"
              style={{ borderColor: "#e2e8f0" }}
            />
          </div>

          {/* 문서 유형 탭 */}
          <div className="flex items-center gap-1 rounded-xl border p-0.5" style={{ borderColor: "#e2e8f0" }}>
            {([
              { val: "all", label: `전체 ${rows.length}` },
              { val: "plan", label: `📝 계획서 ${planCount}` },
              { val: "permit", label: `🔑 허가서 ${permitCount}` },
            ] as const).map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setDocFilter(val)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                style={{
                  background: docFilter === val ? PRIMARY : "transparent",
                  color: docFilter === val ? "white" : "#64748b",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 상태 필터 */}
          <div className="flex items-center gap-1 flex-wrap">
            {allStatuses.slice(0, 6).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="text-xs px-2.5 py-1.5 rounded-xl font-medium border transition-colors"
                style={{
                  borderColor: statusFilter === s ? PRIMARY : "#e2e8f0",
                  background: statusFilter === s ? PRIMARY_LIGHT : "white",
                  color: statusFilter === s ? PRIMARY_DARK : "#64748b",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 테이블 ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm" style={{ minWidth: 900 }}>
          <thead className="sticky top-0 z-10" style={{ background: "white" }}>
            <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 w-28">번호</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 w-24">구분</th>
              <th
                className="text-left px-4 py-3 text-xs font-semibold text-slate-400 cursor-pointer hover:text-teal-500"
                onClick={() => toggleSort("title")}
              >
                제목 <SortIcon k="title" />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 w-28">유형</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 w-32">현장명</th>
              <th
                className="text-left px-4 py-3 text-xs font-semibold text-slate-400 w-44 cursor-pointer hover:text-teal-500"
                onClick={() => toggleSort("period")}
              >
                작업 기간 <SortIcon k="period" />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 w-24">작성자/업체</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 w-24">상태</th>
              <th
                className="text-left px-4 py-3 text-xs font-semibold text-slate-400 w-28 cursor-pointer hover:text-teal-500"
                onClick={() => toggleSort("createdAt")}
              >
                등록일 <SortIcon k="createdAt" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-20 text-slate-400">
                  <div className="text-4xl mb-3">🛡</div>
                  <p className="text-sm">조건에 맞는 문서가 없습니다</p>
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.key}
                  className="border-b hover:bg-slate-50 transition-colors cursor-pointer"
                  style={{ borderColor: "#f1f5f9" }}
                  onClick={() => { if (row.docType === "permit" && row.permitId) setSelectedPermitId(row.permitId); }}
                >
                  {/* 번호 */}
                  <td className="px-4 py-3 text-xs font-mono text-slate-400">{row.seq}</td>

                  {/* 구분 컬럼 */}
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={
                        row.docType === "plan"
                          ? { background: "#eff6ff", color: "#1d4ed8" }
                          : { background: PRIMARY_LIGHT, color: PRIMARY_DARK }
                      }
                    >
                      {row.docType === "plan" ? "📝 계획서" : "🔑 허가서"}
                    </span>
                  </td>

                  {/* 제목 */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 truncate max-w-64">{row.title}</p>
                  </td>

                  {/* 유형 */}
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{row.subLabel}</td>

                  {/* 현장명 */}
                  <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-32">{row.siteName}</td>

                  {/* 기간 */}
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{row.period}</td>

                  {/* 작성자/업체 */}
                  <td className="px-4 py-3 text-xs text-slate-500">{row.author}</td>

                  {/* 상태 */}
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${row.statusCls}`}>
                      {row.status}
                    </span>
                  </td>

                  {/* 등록일 */}
                  <td className="px-4 py-3 text-xs text-slate-400">{row.createdAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── 하단 집계 바 ──────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-6 py-2.5 border-t text-xs text-slate-400"
        style={{ background: "white", borderColor: "#e2e8f0" }}
      >
        <span>
          전체 {rows.length}건 중 <span className="font-semibold text-slate-600">{filtered.length}건</span> 표시
        </span>
        <div className="flex items-center gap-4">
          <span>📝 계획서 {rows.filter((r) => r.docType === "plan").length}건</span>
          <span>🔑 허가서 {rows.filter((r) => r.docType === "permit").length}건</span>
        </div>
      </div>


      {/* ─── 허가서 상세 오버레이 ─────────────────────────────────── */}
      {selectedPermitId && (() => {
        const permit = permits.find((p) => p.id === selectedPermitId);
        if (!permit) return null;
        return (
          <div className="absolute inset-0 z-10 flex flex-col" style={{ background: "#f8fafc" }}>
            <PermitDetailPage
              permit={permit}
              onClose={() => setSelectedPermitId(null)}
            />
          </div>
        );
      })()}
    </div>
  );
}

export default function SafetyBoardPageWrapper() {
  return (
    <React.Suspense fallback={null}>
      <SafetyBoardPage />
    </React.Suspense>
  );
}
