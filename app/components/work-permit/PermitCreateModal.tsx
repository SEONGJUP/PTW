"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useWorkPermitStore,
  WorkPermitType,
  WorkPermit,
  WORK_PERMIT_TYPE_LABELS,
} from "@/store/workPermitStore";
import { useWorkPlanStore, PlanCategory, SavedCard } from "@/store/workPlanStore";

const PRIMARY = "#00B7AF";
const PRIMARY_LIGHT = "#E6FAF9";

const CATEGORY_TO_PERMIT_TYPE: Record<PlanCategory, WorkPermitType> = {
  hot_work: "hot_work",
  confined_space: "confined_space",
  working_at_height: "working_at_height",
  excavation: "excavation",
  construction_equipment: "general",
  lifting: "heavy_load",
  general: "general",
};

const PERMIT_TYPES: { type: WorkPermitType; icon: string; label: string; desc: string; legal?: boolean }[] = [
  { type: "general",           icon: "📋", label: "일반작업 허가서",            desc: "일반 작업 허가" },
  { type: "hot_work",          icon: "🔥", label: "화기작업 허가서",            desc: "용접·절단 등 화기",     legal: true },
  { type: "electrical",        icon: "⚡", label: "전기작업 허가서",            desc: "전기 차단·활선 작업",   legal: true },
  { type: "confined_space",    icon: "🚪", label: "밀폐공간작업 허가서",        desc: "맨홀·탱크 진입",        legal: true },
  { type: "working_at_height", icon: "🏗️", label: "고소작업 허가서",            desc: "2m 이상 고소 작업",     legal: true },
  { type: "excavation",        icon: "⛏️", label: "굴착작업 허가서",            desc: "굴착·터파기 작업" },
  { type: "heavy_load",        icon: "🏋️", label: "중량물작업 허가서",          desc: "중량물 양중·운반" },
  { type: "night_overtime",    icon: "🌙", label: "야간·조출·휴일 작업허가서",   desc: "야간·조출·휴일 작업" },
  { type: "short_time",        icon: "⏱️", label: "단시간 작업허가서",           desc: "단시간 작업 (2시간 이내)" },
];

export default function PermitCreateModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { createPermit } = useWorkPermitStore();
  const { savedCards, formData, planCategory, classification, selectedEquipments, documentProfile, sections } = useWorkPlanStore();

  const currentOverview = (formData["overview"] as Record<string, string>) ?? {};
  const hasCurrentPlan = !!(currentOverview.title || currentOverview.siteName);

  const currentPlan: SavedCard | null = hasCurrentPlan
    ? {
        id: "current",
        title: currentOverview.title ?? "(현재 작업계획서)",
        savedAt: new Date().toISOString(),
        classification: useWorkPlanStore.getState().classification,
        planCategory,
        selectedEquipments,
        documentProfile,
        sections,
        formData: useWorkPlanStore.getState().formData,
      }
    : null;

  const suggestedType = CATEGORY_TO_PERMIT_TYPE[planCategory] ?? "general";

  const [selectedTypes, setSelectedTypes] = useState<WorkPermitType[]>([suggestedType]);
  const [selectedPlan, setSelectedPlan] = useState<SavedCard | null>(null);
  const [customTypeName, setCustomTypeName] = useState("");

  const toggleType = (type: WorkPermitType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const canCreate = selectedTypes.length > 0;

  const handleCreate = () => {
    if (selectedTypes.length === 0) return;
    const [primaryType, ...extraTypes] = selectedTypes;
    const plan = selectedPlan;
    const ov = plan ? (plan.formData["overview"] as Record<string, string>) ?? {} : {};
    const prefill: Partial<WorkPermit> = plan
      ? {
          extraTypes,
          customTypeName: customTypeName.trim(),
          workPlanId: plan.id === "current" ? "current" : plan.id,
          workPlanTitle: ov.title || plan.title || "",
          title: ov.title ?? "",
          siteName: ov.siteName ?? "",
          location: ov.location ?? "",
          contractor: ov.contractor ?? "",
          startDate: ov.workStartDate ?? ov.startDate ?? "",
          endDate: ov.workEndDate ?? ov.endDate ?? "",
          requestedBy: ov.author ?? "",
          description: ov.description ?? "",
        }
      : { extraTypes, customTypeName: customTypeName.trim() };
    const newId = createPermit(primaryType, prefill);
    onClose();
    router.push(`/safety-board?permit=${newId}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(15,23,42,0.55)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full mx-4"
        style={{ maxWidth: 780, maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0" style={{ background: PRIMARY_LIGHT }}>
          <div>
            <h2 className="text-sm font-bold" style={{ color: PRIMARY }}>🔑 새 작업허가서 생성</h2>
            <p className="text-xs text-slate-500 mt-0.5">허가서 유형을 선택하고, 작업계획서를 연동할 수 있습니다</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {/* 본문: 좌 / 우 */}
        <div className="flex flex-1 overflow-hidden">

          {/* 좌: 허가서 유형 */}
          <div className="flex-shrink-0 flex flex-col border-r border-slate-200 overflow-y-auto" style={{ width: 340 }}>
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">새 허가서 생성</p>
              <p className="text-xs text-slate-400 mt-0.5">복수 선택 가능 · 첫 번째 선택이 주 유형이 됩니다 *</p>
            </div>
            <div className="p-3 space-y-1.5">
              {PERMIT_TYPES.map(({ type, icon, label, desc, legal }) => {
                const sel = selectedTypes.includes(type);
                const isPrimary = selectedTypes[0] === type;
                const isSuggested = type === suggestedType && !!selectedPlan;
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all"
                    style={{
                      borderColor: sel ? PRIMARY : "#e2e8f0",
                      background: sel ? PRIMARY_LIGHT : "white",
                      boxShadow: sel ? `0 0 0 2px ${PRIMARY}33` : "none",
                    }}
                  >
                    {/* 체크박스 */}
                    <div
                      className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        background: sel ? PRIMARY : "white",
                        borderColor: sel ? PRIMARY : "#cbd5e1",
                      }}
                    >
                      {sel && <span className="text-white" style={{ fontSize: 9 }}>✓</span>}
                    </div>
                    <span className="text-xl flex-shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold" style={{ color: sel ? PRIMARY : "#334155" }}>{label}</p>
                        {legal && <span className="text-xs px-1 py-0.5 rounded bg-amber-100 text-amber-700 font-medium" style={{ fontSize: 10 }}>⚖️법정</span>}
                        {isPrimary && sel && <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: PRIMARY, color: "white", fontSize: 10 }}>주 유형</span>}
                        {isSuggested && !sel && <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#f1f5f9", color: "#64748b", fontSize: 10 }}>추천</span>}
                      </div>
                      <p className="text-xs text-slate-400">{desc}</p>
                    </div>
                  </button>
                );
              })}

              {/* 기타 작업명 직접입력 */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-1.5 px-1">🖊️ 기타 작업명 직접입력 <span className="text-slate-300 font-normal">(선택사항)</span></p>
                <input
                  value={customTypeName}
                  onChange={(e) => setCustomTypeName(e.target.value)}
                  placeholder="예: 도장작업, 비계설치작업, 해체작업 등"
                  className="w-full px-3 py-2 border border-dashed rounded-xl text-xs outline-none transition-colors"
                  style={{
                    borderColor: customTypeName ? PRIMARY : "#cbd5e1",
                    background: customTypeName ? PRIMARY_LIGHT : "#f8fafc",
                    color: customTypeName ? "#0f766e" : "#94a3b8",
                  }}
                />
                {customTypeName && (
                  <p className="text-xs mt-1.5 px-1" style={{ color: PRIMARY }}>
                    ✓ 허가서 상단에 <strong>"{customTypeName}"</strong> 으로 표시됩니다
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 우: 작업계획서 연동 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">작업계획서 연동</p>
              <p className="text-xs text-slate-400 mt-0.5">선택 시 기본 정보가 자동으로 채워집니다 (선택사항)</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {currentPlan && (
                <div>
                  <p className="text-xs text-slate-400 px-1 mb-1.5">📋 현재 작업계획서</p>
                  <button
                    onClick={() => setSelectedPlan(selectedPlan?.id === currentPlan.id ? null : currentPlan)}
                    className="w-full rounded-xl border p-3 text-left transition-all"
                    style={{
                      borderColor: selectedPlan?.id === currentPlan.id ? PRIMARY : `${PRIMARY}44`,
                      background: selectedPlan?.id === currentPlan.id ? PRIMARY_LIGHT : "#f8ffff",
                      boxShadow: selectedPlan?.id === currentPlan.id ? `0 0 0 2px ${PRIMARY}33` : "none",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: selectedPlan?.id === currentPlan.id ? PRIMARY : "#334155" }}>
                          {(currentPlan.formData["overview"] as Record<string, string>)?.title || "(제목 없음)"}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">현재 편집 중인 계획서</p>
                      </div>
                      {selectedPlan?.id === currentPlan.id && <span style={{ color: PRIMARY }}>✓</span>}
                    </div>
                  </button>
                </div>
              )}

              {savedCards.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 px-1 mb-1.5">저장된 계획서 {savedCards.length}건</p>
                  <div className="space-y-1.5">
                    {[...savedCards]
                      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
                      .map((card) => {
                        const ov = (card.formData["overview"] as Record<string, string>) ?? {};
                        const docTitle = ov.title || card.title || "(제목 없음)";
                        const dateStr = ov.documentDate
                          ? new Date(ov.documentDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
                          : new Date(card.savedAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
                        const sel = selectedPlan?.id === card.id;
                        return (
                          <button
                            key={card.id}
                            onClick={() => setSelectedPlan(sel ? null : card)}
                            className="w-full rounded-xl border px-3 py-2.5 text-left transition-all"
                            style={{
                              borderColor: sel ? PRIMARY : "#e2e8f0",
                              background: sel ? PRIMARY_LIGHT : "white",
                              boxShadow: sel ? `0 0 0 2px ${PRIMARY}33` : "none",
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate" style={{ color: sel ? PRIMARY : "#334155" }}>{docTitle}</p>
                                <p className="text-xs text-slate-400 mt-0.5">저장 {dateStr}</p>
                              </div>
                              {sel && <span style={{ color: PRIMARY }}>✓</span>}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {!currentPlan && savedCards.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <p className="text-2xl mb-2">📋</p>
                  <p className="text-xs text-slate-400">저장된 작업계획서가 없습니다<br />허가서 유형만 선택하여 생성할 수 있습니다</p>
                </div>
              )}
            </div>

            {selectedPlan && (
              <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                <p className="text-xs text-slate-500">
                  <span className="font-semibold" style={{ color: PRIMARY }}>연동됨:</span>{" "}
                  {(selectedPlan.formData["overview"] as Record<string, string>)?.title || selectedPlan.title}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 하단 액션 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white flex-shrink-0">
          <div className="flex-1 min-w-0 mr-4">
            {selectedTypes.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedTypes.map((t, i) => {
                  const meta = PERMIT_TYPES.find((p) => p.type === t);
                  return (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: i === 0 ? PRIMARY : PRIMARY_LIGHT, color: i === 0 ? "white" : PRIMARY }}>
                      {meta?.icon} {WORK_PERMIT_TYPE_LABELS[t]}
                    </span>
                  );
                })}
                {customTypeName.trim() && (
                  <span className="text-xs text-slate-400">— {customTypeName.trim()}</span>
                )}
                {selectedPlan && <span className="text-xs text-teal-500">+ 계획서 연동</span>}
              </div>
            ) : (
              <span className="text-xs text-red-400">* 허가서 유형을 선택하세요</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
              취소
            </button>
            <button
              onClick={handleCreate}
              disabled={!canCreate}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all"
              style={{
                background: canCreate ? PRIMARY : "#cbd5e1",
                cursor: canCreate ? "pointer" : "not-allowed",
                boxShadow: canCreate ? `0 2px 8px ${PRIMARY}44` : "none",
              }}
            >
              🔑 생성
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
