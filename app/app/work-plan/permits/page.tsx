"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  useWorkPermitStore,
  WORK_PERMIT_TYPE_LABELS,
  WORK_PERMIT_STATUS_LABELS,
  WORK_PERMIT_TYPE_ICONS,
  WorkPermitStatus,
  LEGALLY_REQUIRED_PERMIT_TYPES,
} from "@/store/workPermitStore";
import { PermitDetailPage } from "@/components/work-permit/WorkPermitEditor";

const PRIMARY = "#00B7AF";
const PRIMARY_LIGHT = "#E6FAF9";

const PERMIT_STATUS_STYLE: Record<WorkPermitStatus, { dot: string; text: string }> = {
  draft:                  { dot: "#94a3b8", text: "초안" },
  pending:                { dot: "#f59e0b", text: "승인대기" },
  approved:               { dot: "#10b981", text: "승인" },
  conditionally_approved: { dot: "#3b82f6", text: "조건부승인" },
  rejected:               { dot: "#ef4444", text: "반려" },
  completed:              { dot: "#059669", text: "완료" },
  expired:                { dot: "#cbd5e1", text: "만료" },
};

// ── 내부 컴포넌트 (useSearchParams 사용) ────────────────────────
function WorkPermitsInner() {
  const { permits, deletePermit, createPermit } = useWorkPermitStore();
  const searchParams = useSearchParams();

  const [activePermitId, setActivePermitId] = useState<string | null>(null);

  // URL ?permit=<id> 로 직접 열기 (WorkPlanEditor에서 생성 후 이동)
  useEffect(() => {
    const paramId = searchParams.get("permit");
    if (paramId && permits.some((p) => p.id === paramId)) {
      setActivePermitId(paramId);
    }
  }, [searchParams, permits]);

  const handleCreatePermit = () => {
    const newId = createPermit("general");
    setActivePermitId(newId);
  };

  const activePermit = permits.find((p) => p.id === activePermitId) ?? null;

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#f8fafc" }}>

      {/* ── 사이드바: 허가서 목록 ── */}
      <div className="flex-shrink-0 flex flex-col bg-white border-r border-slate-200 overflow-hidden" style={{ width: 264 }}>

        {/* 헤더 + 생성 버튼 */}
        <div className="px-4 py-3 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-sm font-bold text-slate-800">작업허가서 관리</h2>
          <p className="text-xs text-slate-400 mt-0.5 mb-3">허가서 생성 및 작업계획서 연동</p>
          <button
            onClick={handleCreatePermit}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2"
            style={{ background: PRIMARY, boxShadow: `0 2px 8px ${PRIMARY}44` }}
          >
            🔑 새 허가서 생성
          </button>
        </div>

        {/* 허가서 목록 */}
        <div className="flex-1 overflow-y-auto">
          {permits.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-xs text-slate-400">등록된 허가서가 없습니다</p>
            </div>
          ) : (
            <>
              <div className="px-4 pt-3 pb-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  허가서 목록 ({permits.length}건)
                </p>
              </div>
              {[...permits].reverse().map((p) => {
                const s = PERMIT_STATUS_STYLE[p.status];
                const isActive = activePermitId === p.id;
                const sigsDone = p.signatures?.filter((sig) => sig.status === "signed").length ?? 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActivePermitId(p.id)}
                    className="w-full flex items-start gap-2.5 px-4 py-3 border-b text-left transition-colors hover:bg-slate-50"
                    style={{
                      borderColor: "#f1f5f9",
                      background: isActive ? PRIMARY_LIGHT : "white",
                      borderLeft: `3px solid ${isActive ? PRIMARY : "transparent"}`,
                    }}
                  >
                    <span className="text-lg flex-shrink-0 mt-0.5">{WORK_PERMIT_TYPE_ICONS[p.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: isActive ? PRIMARY : "#334155" }}>
                        {p.title || "(제목 없음)"}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{WORK_PERMIT_TYPE_LABELS[p.type]}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
                        <span className="text-xs" style={{ color: s.dot }}>{s.text}</span>
                        {p.workPlanTitle && <span className="text-xs text-teal-400 ml-auto">📋</span>}
                        <span className="text-xs text-slate-300 ml-auto">{sigsDone}/5</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePermit(p.id);
                        if (activePermitId === p.id) setActivePermitId(null);
                      }}
                      className="text-slate-300 hover:text-red-400 flex-shrink-0 mt-0.5"
                      style={{ fontSize: 12 }}
                    >
                      ✕
                    </button>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* ── 우측: 상세 페이지 또는 빈 화면 ── */}
      <div className="flex-1 overflow-hidden">
        {activePermit ? (
          <PermitDetailPage
            key={activePermit.id}
            permit={activePermit}
            onClose={() => setActivePermitId(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <p className="text-5xl mb-4">🔑</p>
            <h3 className="text-base font-bold text-slate-700 mb-2">작업허가서</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              좌측에서 허가서를 선택하거나<br />새 허가서를 생성하세요
            </p>
            <button
              onClick={handleCreatePermit}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: PRIMARY, boxShadow: `0 2px 12px ${PRIMARY}44` }}
            >
              🔑 새 허가서 생성
            </button>
          </div>
        )}
      </div>


    </div>
  );
}

// ── 메인 페이지 (Suspense 래퍼) ──────────────────────────────────
export default function WorkPermitsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><p className="text-sm text-slate-400">로딩 중...</p></div>}>
      <WorkPermitsInner />
    </Suspense>
  );
}
