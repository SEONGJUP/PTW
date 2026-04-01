"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useWorkPlanStore,
  WorkClassification,
  EquipmentType,
  PlanCategory,
  SavedCard,
} from "@/store/workPlanStore";
import WorkPlanEditor from "@/components/work-plan/WorkPlanEditor";
import WorkTypeSelector from "@/components/work-plan/WorkTypeSelector";
import {
  getCategoryById,
  getSubcategoryById,
  toLegacyPlanCategory,
  toLegacyEquipmentTypes,
} from "@/store/workPlanTaxonomy";

const PRIMARY = "#00B7AF";
const PRIMARY_LIGHT = "#E6FAF9";

export default function CreateWorkPlanPage() {
  const router = useRouter();
  const {
    classification,
    setClassification,
    setPlanCategory,
    clearEquipments,
    toggleEquipment,
    updateFormData,
    savedCards,
    loadCard,
    deleteCard,
    resetPlan,
    saveCard,
    sectionFavorites,
    loadFavorite,
  } = useWorkPlanStore();

  const [showSelector, setShowSelector] = useState(false);
  const [classified, setClassified] = useState(false);
  const [showSavedCards, setShowSavedCards] = useState(false);

  // On mount: reset plan and open selector
  useEffect(() => {
    resetPlan();
    setShowSelector(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 분류 배너 "분류 변경" 버튼 이벤트 수신
  useEffect(() => {
    const handler = () => setShowSelector(true);
    window.addEventListener("ptw:openClassificationSelector", handler);
    return () => window.removeEventListener("ptw:openClassificationSelector", handler);
  }, []);

  const handleConfirmType = (next: WorkClassification) => {
    const subInfo = getSubcategoryById(next.subcategoryId);
    const defaultEqIds = subInfo?.recommendedEquipmentIds ?? [];
    const merged: WorkClassification = { ...next, equipmentIds: defaultEqIds };
    setClassification(merged);
    setPlanCategory(toLegacyPlanCategory(merged.subcategoryId) as PlanCategory);
    clearEquipments();
    toLegacyEquipmentTypes(defaultEqIds).forEach((t) =>
      toggleEquipment(t as EquipmentType)
    );
    const catInfo = getCategoryById(next.categoryId);
    if (catInfo && subInfo) {
      const subLabel = subInfo.isCustom
        ? next.customSubLabel || subInfo.label
        : subInfo.label;
      updateFormData("overview", {
        title: `작업계획서[${catInfo.label} / ${subLabel}]`,
      });
    }
    setShowSelector(false);
    setClassified(true);
  };

  const handleLoadCard = (card: SavedCard) => {
    loadCard(card.id);
    setShowSelector(false);
    setShowSavedCards(false);
    setClassified(true);
  };

  const handleLoadFavorite = (favId: string) => {
    loadFavorite(favId);
    setShowSelector(false);
    setClassified(true);
  };

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Editor (always rendered, blurred until classified) */}
      <div
        className="flex-1 overflow-hidden transition-all duration-300"
        style={{
          filter: classified ? "none" : "blur(4px)",
          pointerEvents: classified ? "auto" : "none",
          opacity: classified ? 1 : 0.5,
        }}
      >
        <WorkPlanEditor />
      </div>

      {/* Blur overlay with prompt when not classified */}
      {!classified && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4"
          style={{ background: "rgba(248,250,252,0.7)" }}
        >
          <div className="text-center">
            <p className="text-2xl mb-2">📋</p>
            <h2 className="text-base font-bold text-slate-700 mb-1">작업 종류를 선택하세요</h2>
            <p className="text-sm text-slate-500">작업 분류를 선택하면 맞춤형 섹션 구성으로 작성을 시작합니다</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSelector(true)}
              className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-md transition-all hover:shadow-lg active:scale-95"
              style={{ background: PRIMARY }}
            >
              작업 종류 선택
            </button>
            {savedCards.length > 0 && (
              <button
                onClick={() => setShowSavedCards(true)}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all"
                style={{ borderColor: PRIMARY, color: PRIMARY }}
              >
                📋 저장된 계획서 불러오기 ({savedCards.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* WorkTypeSelector modal */}
      {showSelector && (
        <WorkTypeSelector
          value={classification}
          onConfirm={handleConfirmType}
          onLoadFavorite={handleLoadFavorite}
          onClose={() => {
            if (classified) {
              setShowSelector(false);
            } else {
              router.back();
            }
          }}
          hideEquipment
        />
      )}

      {/* Saved cards panel */}
      {showSavedCards && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setShowSavedCards(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-5 py-4 border-b"
              style={{ background: PRIMARY_LIGHT, borderColor: "#b2ece9" }}
            >
              <h2 className="text-sm font-bold" style={{ color: PRIMARY }}>
                📋 안전카드 게시판
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">저장된 작업계획서를 불러옵니다</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {[...savedCards].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()).map((card) => {
                const ov = (card.formData["overview"] as Record<string, string>) ?? {};
                const docTitle = ov.title || card.title || "(제목 없음)";
                const workDate = ov.documentDate
                  ? new Date(ov.documentDate).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })
                  : null;
                return (
                <button
                  key={card.id}
                  onClick={() => handleLoadCard(card)}
                  className="w-full flex items-start gap-3 px-4 py-3 border-b text-left hover:bg-teal-50 transition-colors"
                  style={{ borderColor: "#f1f5f9" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{docTitle}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {workDate ? `작성일 ${workDate}` : `저장 ${new Date(card.savedAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`}
                    </p>
                  </div>
                  <span
                    className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: PRIMARY_LIGHT, color: PRIMARY }}
                  >
                    불러오기
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }}
                    className="flex-shrink-0 text-slate-300 hover:text-red-400 text-sm"
                  >
                    ✕
                  </button>
                </button>
                );
              })}
            </div>
            <div className="p-4">
              <button
                onClick={() => setShowSavedCards(false)}
                className="w-full py-2 rounded-xl text-sm text-slate-500 bg-slate-100 font-medium"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
