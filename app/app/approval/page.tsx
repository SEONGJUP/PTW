"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWorkPermitStore, WORK_PERMIT_TYPE_LABELS, WORK_PERMIT_STATUS_LABELS, WorkPermitStatus } from "@/store/workPermitStore";
import { useWorkPlanStore, PLAN_CATEGORY_LABELS, OverviewData } from "@/store/workPlanStore";

// ─── 색상 ─────────────────────────────────────────────────────────
const PRIMARY = "#00B7AF";
const PRIMARY_LIGHT = "#E6FAF9";

const PERMIT_STATUS_STYLE: Record<WorkPermitStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  conditionally_approved: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-600",
  completed: "bg-green-100 text-green-700",
  expired: "bg-slate-100 text-slate-400",
};

// ─── 작업계획서 mock + 현재 실 데이터 혼합 ──────────────────────────
const MOCK_PLANS = [
  { id: "WP-0012", title: "3호기 배관 보수공사",  category: "hot_work",             siteName: "울산공장 3동",    author: "김안전", contractor: "현대엔지니어링", startDate: "2026-03-18", endDate: "2026-03-20", status: "승인대기" },
  { id: "WP-0011", title: "탱크 맨홀 청소 작업",  category: "confined_space",       siteName: "여수공장 저장동", author: "이현장", contractor: "자사",           startDate: "2026-03-17", endDate: "2026-03-17", status: "진행중" },
  { id: "WP-0010", title: "옥상 방수 보수",        category: "working_at_height",    siteName: "본사 건물",       author: "박감독", contractor: "삼성물산",       startDate: "2026-03-15", endDate: "2026-03-16", status: "완료" },
  { id: "WP-0009", title: "굴착기 투입 기초공사",  category: "construction_equipment", siteName: "신축현장 A구역", author: "최운전", contractor: "GS건설",         startDate: "2026-03-10", endDate: "2026-03-14", status: "완료" },
  { id: "WP-0008", title: "전기실 패널 점검",      category: "general",              siteName: "본사 전기실",     author: "정전기", contractor: "자사",           startDate: "2026-03-08", endDate: "2026-03-08", status: "완료" },
];

const PLAN_STATUS_STYLE: Record<string, string> = {
  진행중: "bg-blue-100 text-blue-700",
  승인대기: "bg-amber-100 text-amber-700",
  승인됨: "bg-violet-100 text-violet-700",
  완료: "bg-emerald-100 text-emerald-700",
  초안: "bg-slate-100 text-slate-600",
};

// (KpiCard removed — dashboard-style KPI rendered inline)


// ─── 작업 간트 차트 ───────────────────────────────────────────────
type CalendarEvent = {
  id: string; startDate: string; endDate: string;
  label: string; color: string;
  typeLabel: string; statusLabel: string;
  href: string;
};

function WorkGantt({
  events,
  collapsed,
  onToggle,
  cursor,
}: {
  events: CalendarEvent[];
  collapsed: boolean;
  onToggle: () => void;
  cursor: { year: number; month: number };
}) {
  const router = useRouter();

  const { year, month } = cursor;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const now = new Date();
  const todayD = now.getDate(), todayM = now.getMonth(), todayY = now.getFullYear();

  const mm = String(month + 1).padStart(2, "0");
  const monthStart = `${year}-${mm}-01`;
  const monthEnd = `${year}-${mm}-${String(daysInMonth).padStart(2, "0")}`;
  const visible = events.filter((e) => e.startDate <= monthEnd && e.endDate >= monthStart);

  function getBar(e: CalendarEvent): { start: number; end: number } | null {
    if (e.startDate > monthEnd || e.endDate < monthStart) return null;
    const sd = new Date(e.startDate), ed = new Date(e.endDate);
    const clipStart = sd.getFullYear() === year && sd.getMonth() === month ? sd.getDate() : 1;
    const clipEnd = ed.getFullYear() === year && ed.getMonth() === month ? ed.getDate() : daysInMonth;
    return { start: clipStart - 1, end: clipEnd - 1 };
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Toolbar — 월 nav 제거됨 (KPI 위로 이동) */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-700">📅 작업 스케줄</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 font-medium">
            {visible.length}건
          </span>
        </div>
        <button
          onClick={onToggle}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors text-xs"
          title={collapsed ? "펼치기" : "접기"}
          style={{ transform: collapsed ? "none" : "rotate(180deg)", transition: "transform 0.2s" }}
        >▾</button>
      </div>

      {!collapsed && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: `${320 + daysInMonth * 26}px` }}>
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 bg-white sticky left-0 z-10" style={{ width: 180 }}>작업명</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 w-16">유형</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 w-14">상태</th>
                  {days.map((d) => {
                    const isToday = d === todayD && month === todayM && year === todayY;
                    return (
                      <th
                        key={d}
                        className="text-center px-0.5 py-2.5 text-xs w-7"
                        style={{ color: isToday ? PRIMARY : "#94a3b8", fontWeight: isToday ? 700 : 400 }}
                      >
                        {d}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={3 + daysInMonth} className="px-4 py-8 text-center text-xs text-slate-400">
                      이번달 일정이 없습니다
                    </td>
                  </tr>
                ) : (
                  visible.map((event) => {
                    const bar = getBar(event);
                    return (
                      <tr
                        key={event.id}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => router.push(event.href)}
                      >
                        <td className="px-4 py-2.5 bg-white sticky left-0 z-10 group-hover:bg-slate-50">
                          <p className="text-xs font-medium text-slate-700 truncate max-w-44 hover:text-teal-600">{event.label}</p>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{event.typeLabel}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{event.statusLabel}</td>
                        {days.map((d, i) => {
                          const inRange = bar != null && i >= bar.start && i <= bar.end;
                          const isFirst = bar != null && i === bar.start;
                          const isLast = bar != null && i === bar.end;
                          const isToday = d === todayD && month === todayM && year === todayY;
                          return (
                            <td
                              key={i}
                              className="px-0.5 py-2.5"
                              style={{ background: isToday ? "#f0fdfc" : undefined }}
                            >
                              {inRange && (
                                <div
                                  className={`h-4 opacity-85 ${isFirst ? "rounded-l-full" : ""} ${isLast ? "rounded-r-full" : ""}`}
                                  style={{ background: event.color }}
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Legend — 2개만 표시 */}
          <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 flex gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: "#3b82f6" }} />
              <span className="text-xs text-slate-500 font-medium">작업승인 완료</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: "#f59e0b" }} />
              <span className="text-xs text-slate-500 font-medium">승인 대기</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── 보기 설정 드롭다운 ───────────────────────────────────────────
type ViewConfig = {
  kpi: boolean;
  calendar: boolean;
  plans: boolean;
  permits: boolean;
  pendingAlert: boolean;
};

const VIEW_LABELS: Record<keyof ViewConfig, string> = {
  kpi: "KPI 요약 카드",
  calendar: "작업 캘린더",
  plans: "작업계획서 목록",
  permits: "작업허가서 목록",
  pendingAlert: "승인 대기 알림",
};

const VIEW_ICONS: Record<keyof ViewConfig, string> = {
  kpi: "📊",
  calendar: "📅",
  plans: "📝",
  permits: "🔑",
  pendingAlert: "⚠️",
};

function ViewSettingsDropdown({
  view,
  onChange,
}: {
  view: ViewConfig;
  onChange: (key: keyof ViewConfig, val: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const activeCount = Object.values(view).filter(Boolean).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-medium transition-colors"
        style={{
          borderColor: open ? PRIMARY : "#e2e8f0",
          color: open ? PRIMARY : "#64748b",
          background: open ? PRIMARY_LIGHT : "white",
        }}
      >
        <span>⚙</span>
        <span>보기 설정</span>
        {activeCount < 4 && (
          <span
            className="w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
            style={{ background: PRIMARY, fontSize: "0.6rem" }}
          >
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* panel */}
          <div
            className="absolute right-0 top-full mt-2 z-50 rounded-2xl border shadow-xl p-4 w-56"
            style={{ background: "white", borderColor: "#e2e8f0" }}
          >
            <p className="text-xs font-semibold text-slate-500 mb-3">표시 항목 설정</p>
            <div className="space-y-1">
              {(Object.keys(VIEW_LABELS) as (keyof ViewConfig)[]).map((key) => {
                const on = view[key];
                return (
                  <label
                    key={key}
                    className="flex items-center justify-between gap-3 px-2 py-2 rounded-xl cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2">
                      <span>{VIEW_ICONS[key]}</span>
                      <span className="text-sm text-slate-700">{VIEW_LABELS[key]}</span>
                    </div>
                    {/* Toggle switch */}
                    <div
                      onClick={() => onChange(key, !on)}
                      className="relative w-9 h-5 rounded-full transition-colors flex-shrink-0 cursor-pointer"
                      style={{ background: on ? PRIMARY : "#cbd5e1" }}
                    >
                      <div
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                        style={{ transform: on ? "translateX(18px)" : "translateX(2px)" }}
                      />
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => { (Object.keys(VIEW_LABELS) as (keyof ViewConfig)[]).forEach((k) => onChange(k, true)); }}
                className="flex-1 text-xs py-1.5 rounded-xl border font-medium text-slate-600 hover:bg-slate-50"
                style={{ borderColor: "#e2e8f0" }}
              >
                전체 표시
              </button>
              <button
                onClick={() => { (Object.keys(VIEW_LABELS) as (keyof ViewConfig)[]).forEach((k) => onChange(k, false)); }}
                className="flex-1 text-xs py-1.5 rounded-xl border font-medium text-slate-500 hover:bg-slate-50"
                style={{ borderColor: "#e2e8f0" }}
              >
                전체 숨김
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────
export default function ApprovalPage() {
  const { permits } = useWorkPermitStore();
  const { formData, planCategory } = useWorkPlanStore();

  const [view, setView] = useState<ViewConfig>({ kpi: true, calendar: true, plans: true, permits: true, pendingAlert: true });
  const [calendarCollapsed, setCalendarCollapsed] = useState(false);
  const setViewKey = (key: keyof ViewConfig, val: boolean) => setView((v) => ({ ...v, [key]: val }));

  // 월 네비게이션 — KPI 위에 표시하기 위해 상위로 리프트업
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const prevMonth = () => setCursor(({ year: y, month: m }) => m === 0 ? { year: y - 1, month: 11 } : { year: y, month: m - 1 });
  const nextMonth = () => setCursor(({ year: y, month: m }) => m === 11 ? { year: y + 1, month: 0 } : { year: y, month: m + 1 });
  const monthLabel = new Date(cursor.year, cursor.month).toLocaleDateString("ko-KR", { year: "numeric", month: "long" });

  // 현재 작업계획서 데이터 → 목록에 추가
  const overview = (formData["overview"] as OverviewData | undefined) ?? {};
  const currentPlan = overview.title
    ? [{
        id: "WP-현재",
        title: overview.title,
        category: planCategory,
        siteName: overview.siteName ?? "",
        author: overview.author ?? "",
        contractor: overview.contractor ?? "",
        startDate: overview.startDate ?? "",
        endDate: overview.endDate ?? "",
        status: "초안",
      }]
    : [];
  const allPlans = [...currentPlan, ...MOCK_PLANS];

  // KPI 계산
  const pendingPermits = permits.filter((p) => p.status === "pending");
  const approvedPermits = permits.filter((p) => p.status === "approved");
  const activePlans = allPlans.filter((p) => p.status === "진행중" || p.status === "초안");
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  // Dashboard-style KPI
  const kpis = [
    { label: "금일 진행중 작업계획서",    value: activePlans.length,     unit: "건", change: "+1", up: true,  color: "border-blue-200 bg-blue-50",     text: "text-blue-700" },
    { label: "작업계획서 승인 대기",      value: pendingPermits.length,  unit: "건", change: pendingPermits.length > 0 ? "+1" : "0", up: false, color: "border-amber-200 bg-amber-50",   text: "text-amber-700" },
    { label: "작업계획서 승인 완료",      value: approvedPermits.length, unit: "건", change: "+2", up: true,  color: "border-emerald-200 bg-emerald-50", text: "text-emerald-700" },
  ];

  // 테이블 미리보기용 상위 5건
  const previewPlans = allPlans.slice(0, 5);
  const previewPermits = permits.slice(0, 5);

  // 간트 이벤트 빌드
  // 파란색=승인완료, 주황색=승인대기, 나머지=gray
  const planColor = (status: string) =>
    status === "승인됨" || status === "완료" ? "#3b82f6"
    : status === "승인대기" ? "#f59e0b"
    : "#94a3b8";
  const permitColor = (status: string) =>
    status === "approved" ? "#3b82f6" : status === "pending" ? "#f59e0b" : "#94a3b8";

  const calendarEvents: CalendarEvent[] = [
    ...allPlans
      .filter((p) => p.startDate)
      .map((p) => ({
        id: p.id,
        startDate: p.startDate,
        endDate: p.endDate || p.startDate,
        label: p.title,
        color: planColor(p.status),
        typeLabel: PLAN_CATEGORY_LABELS[p.category as keyof typeof PLAN_CATEGORY_LABELS] ?? p.category,
        statusLabel: p.status,
        href: "/work-plan/create",
      })),
    ...permits
      .filter((p) => p.startDate)
      .map((p) => ({
        id: p.id,
        startDate: p.startDate,
        endDate: p.endDate || p.startDate,
        label: p.title || "허가서",
        color: permitColor(p.status),
        typeLabel: WORK_PERMIT_TYPE_LABELS[p.type].replace(" 작업허가서", ""),
        statusLabel: WORK_PERMIT_STATUS_LABELS[p.status],
        href: "/work-plan/permits",
      })),
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: "#f8fafc" }}>
      <div className="flex-1 px-6 py-5 space-y-5 max-w-7xl w-full mx-auto">

        {/* ─── 페이지 헤더 ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">작업계획·허가서 승인</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-slate-400">{today} 기준 현황</p>
              <button
                onClick={() => window.location.reload()}
                className="w-5 h-5 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="새로고침"
              >
                ↻
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/work-plan/create"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium transition-colors"
              style={{ background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe" }}
            >
              <span>📝</span>
              <span>작업계획서 생성</span>
            </Link>
            <Link
              href="/work-plan/permits"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium transition-colors"
              style={{ background: PRIMARY_LIGHT, color: PRIMARY, border: `1px solid ${PRIMARY}55` }}
            >
              <span>🔑</span>
              <span>작업허가서 작성</span>
            </Link>
            <ViewSettingsDropdown view={view} onChange={setViewKey} />
          </div>
        </div>

        {/* ─── 월 네비게이션 (KPI 위) ──────────────────────────────── */}
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-100 font-medium transition-colors">◀ 이전</button>
          <span className="text-sm px-4 py-1.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 min-w-36 text-center">{monthLabel}</span>
          <button onClick={nextMonth} className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-100 font-medium transition-colors">다음 ▶</button>
        </div>

        {/* ─── KPI 카드 (대시보드 스타일) ─────────────────────────── */}
        {view.kpi && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {kpis.map((k) => (
              <div key={k.label} className={`rounded-xl border p-4 ${k.color}`}>
                <div className={`text-2xl font-bold ${k.text}`}>
                  {k.value}<span className="text-base ml-1">{k.unit}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{k.label}</div>
                <div className={`text-xs mt-1 font-medium ${k.up ? "text-emerald-600" : "text-red-500"}`}>
                  {k.change} 전일 대비
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── 작업 스케줄 (간트) ──────────────────────────────────── */}
        {view.calendar && (
          <WorkGantt
            events={calendarEvents}
            collapsed={calendarCollapsed}
            onToggle={() => setCalendarCollapsed((v) => !v)}
            cursor={cursor}
          />
        )}

        {/* ─── 두 컬럼 테이블 ───────────────────────────────────────── */}
        {(view.plans || view.permits) && (
        <div className={`grid gap-4 ${view.plans && view.permits ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>

          {/* ── 작업계획서 ─────────────────────────────────────────── */}
          {view.plans && <div className="bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* 섹션 헤더 */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-base">📝</span>
                <h2 className="text-sm font-bold text-slate-700">작업계획서</h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-500">
                  {allPlans.length}건
                </span>
              </div>
              <Link
                href="/safety-board"
                className="text-xs font-medium transition-colors hover:underline"
                style={{ color: PRIMARY }}
              >
                전체보기 →
              </Link>
            </div>

            {/* 테이블 */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400">작업명</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 w-20">유형</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 w-20">작성일</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 w-16">담당자</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 w-24">업체명</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 w-20">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {previewPlans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                        등록된 작업계획서가 없습니다
                      </td>
                    </tr>
                  ) : (
                    previewPlans.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 cursor-pointer transition-colors">
                        <td className="px-4 py-2.5">
                          <p className="text-sm font-medium text-slate-700 truncate max-w-40">{row.title}</p>
                          {row.siteName && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate">{row.siteName}</p>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                          {PLAN_CATEGORY_LABELS[row.category as keyof typeof PLAN_CATEGORY_LABELS] ?? row.category}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">{row.startDate || "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{row.author || "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{(row as typeof row & { contractor?: string }).contractor || "—"}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${PLAN_STATUS_STYLE[row.status] ?? "bg-slate-100 text-slate-500"}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 더보기 표시 */}
            {allPlans.length > 5 && (
              <div className="px-4 py-2 border-t border-slate-50 text-center">
                <Link href="/safety-board" className="text-xs text-slate-400 hover:text-teal-500 transition-colors">
                  +{allPlans.length - 5}건 더 보기
                </Link>
              </div>
            )}
          </div>}

          {/* ── 작업허가서 ─────────────────────────────────────────── */}
          {view.permits && <div className="bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* 섹션 헤더 */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-base">🔑</span>
                <h2 className="text-sm font-bold text-slate-700">작업허가서</h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-500">
                  {permits.length}건
                </span>
                {pendingPermits.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 animate-pulse">
                    승인대기 {pendingPermits.length}
                  </span>
                )}
              </div>
              <Link
                href="/safety-board"
                className="text-xs font-medium transition-colors hover:underline"
                style={{ color: PRIMARY }}
              >
                전체보기 →
              </Link>
            </div>

            {/* 테이블 */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400">허가서명</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 w-20">유형</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 w-20">작성일</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 w-16">담당자</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 w-24">업체명</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 w-20">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {previewPermits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                        등록된 작업허가서가 없습니다
                        <br />
                        <span className="text-teal-500">작업허가서 관리</span>에서 생성하세요
                      </td>
                    </tr>
                  ) : (
                    previewPermits.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 cursor-pointer transition-colors">
                        <td className="px-4 py-2.5">
                          <p className="text-sm font-medium text-slate-700 truncate max-w-40">
                            {p.title || "(제목 없음)"}
                          </p>
                          {p.siteName && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate">{p.siteName}</p>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                          {WORK_PERMIT_TYPE_LABELS[p.type].replace(" 작업허가서", "")}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{p.requestedBy || "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{p.contractor || "—"}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${PERMIT_STATUS_STYLE[p.status]}`}>
                            {WORK_PERMIT_STATUS_LABELS[p.status]}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 더보기 표시 */}
            {permits.length > 5 && (
              <div className="px-4 py-2 border-t border-slate-50 text-center">
                <Link href="/safety-board" className="text-xs text-slate-400 hover:text-teal-500 transition-colors">
                  +{permits.length - 5}건 더 보기
                </Link>
              </div>
            )}
          </div>}
        </div>
        )}

        {/* ─── 승인 대기 작업허가서 (있을 때만) ────────────────────── */}
        {view.pendingAlert && pendingPermits.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-200">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-amber-100">
              <span className="text-base">⚠️</span>
              <h2 className="text-sm font-bold text-amber-700">승인 대기 중인 작업허가서</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                {pendingPermits.length}건
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-amber-50 bg-amber-50">
                    {["허가서명", "유형", "현장명", "업체", "작성자", "시작일", "조치"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-amber-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {pendingPermits.map((p) => (
                    <tr key={p.id} className="hover:bg-amber-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-700">{p.title || "(제목 없음)"}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{WORK_PERMIT_TYPE_LABELS[p.type].replace(" 작업허가서", "")}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{p.siteName || "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{p.contractor || "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{p.requestedBy || "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{p.startDate || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <ApproveButton permitId={p.id} action="approved" label="승인" color="bg-emerald-500 hover:bg-emerald-600" />
                          <ApproveButton permitId={p.id} action="rejected" label="반려" color="bg-red-400 hover:bg-red-500" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

// ─── 승인/반려 인라인 버튼 ─────────────────────────────────────────
function ApproveButton({ permitId, action, label, color }: {
  permitId: string;
  action: WorkPermitStatus;
  label: string;
  color: string;
}) {
  const { setPermitStatus } = useWorkPermitStore();
  return (
    <button
      onClick={() => {
        if (action === "rejected") {
          const reason = window.prompt("반려 사유를 입력하세요:");
          if (reason !== null) setPermitStatus(permitId, action, reason);
        } else {
          setPermitStatus(permitId, action);
        }
      }}
      className={`text-xs px-2.5 py-1 rounded-lg font-medium text-white transition-colors ${color}`}
    >
      {label}
    </button>
  );
}
