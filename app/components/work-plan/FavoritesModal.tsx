"use client";
import React, { useState } from "react";
import { useWorkPlanStore, PLAN_CATEGORY_LABELS, CONSTRUCTION_EQUIPMENT_TYPES } from "@/store/workPlanStore";

const PRIMARY = "#00B7AF";
const PRIMARY_LIGHT = "#E6FAF9";

export default function FavoritesModal({ onClose }: { onClose: () => void }) {
  const { sectionFavorites, saveFavorite, loadFavorite, deleteFavorite, renameFavorite, planCategory, selectedEquipments, sections } = useWorkPlanStore();
  const [saveMode, setSaveMode] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");

  const handleSave = () => {
    if (!saveName.trim()) return;
    saveFavorite(saveName.trim());
    setSaveName("");
    setSaveMode(false);
  };

  const handleRenameStart = (id: string, name: string) => {
    setRenamingId(id);
    setRenameVal(name);
  };

  const handleRenameConfirm = () => {
    if (renamingId && renameVal.trim()) {
      renameFavorite(renamingId, renameVal.trim());
    }
    setRenamingId(null);
  };

  const handleLoad = (id: string) => {
    loadFavorite(id);
    onClose();
  };

  const enabledCount = sections.filter((s) => s.enabled).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ background: PRIMARY_LIGHT, borderColor: "#b2ece9" }}>
          <div>
            <h2 className="text-sm font-bold" style={{ color: PRIMARY }}>⭐ 즐겨찾기 섹션 구성</h2>
            <p className="text-xs text-slate-500 mt-0.5">현재 섹션 구성을 저장하거나 불러옵니다</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Current config summary */}
          <div className="rounded-xl border p-3 space-y-1" style={{ borderColor: `${PRIMARY}30`, background: `${PRIMARY}08` }}>
            <p className="text-xs font-semibold text-slate-600">현재 섹션 구성</p>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>
                {PLAN_CATEGORY_LABELS[planCategory]}
              </span>
              {selectedEquipments.map((eq) => (
                <span key={eq} className="text-xs px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-600">
                  {CONSTRUCTION_EQUIPMENT_TYPES[eq].icon} {CONSTRUCTION_EQUIPMENT_TYPES[eq].num}번
                </span>
              ))}
              <span className="text-xs text-slate-400">활성 섹션 {enabledCount}개</span>
            </div>
          </div>

          {/* Save current */}
          {saveMode ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="즐겨찾기 이름 입력"
                className="flex-1 text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-teal-400"
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setSaveMode(false); }}
                autoFocus
              />
              <button onClick={handleSave} className="text-sm px-3 py-2 rounded-xl text-white font-medium" style={{ background: PRIMARY }}>저장</button>
              <button onClick={() => setSaveMode(false)} className="text-sm px-3 py-2 rounded-xl text-slate-500 bg-slate-100">취소</button>
            </div>
          ) : (
            <button
              onClick={() => setSaveMode(true)}
              className="w-full text-sm py-2.5 rounded-xl border-2 border-dashed font-medium transition-colors"
              style={{ borderColor: PRIMARY, color: PRIMARY }}
            >
              ⭐ 현재 구성 즐겨찾기로 저장
            </button>
          )}

          {/* Favorites list */}
          {sectionFavorites.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <p className="text-2xl mb-2">⭐</p>
              <p>저장된 즐겨찾기가 없습니다</p>
              <p className="text-xs mt-1">자주 쓰는 섹션 구성을 저장해두세요</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">저장된 즐겨찾기</p>
              {sectionFavorites.map((fav) => (
                <div key={fav.id} className="rounded-xl border border-slate-200 p-3 space-y-2">
                  {renamingId === fav.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={renameVal}
                        onChange={(e) => setRenameVal(e.target.value)}
                        className="flex-1 text-sm px-2 py-1 border border-slate-200 rounded-lg outline-none focus:border-teal-400"
                        onKeyDown={(e) => { if (e.key === "Enter") handleRenameConfirm(); if (e.key === "Escape") setRenamingId(null); }}
                        autoFocus
                      />
                      <button onClick={handleRenameConfirm} className="text-xs px-2 py-1 rounded-lg text-white" style={{ background: PRIMARY }}>확인</button>
                      <button onClick={() => setRenamingId(null)} className="text-xs px-2 py-1 rounded-lg text-slate-500 bg-slate-100">취소</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700 flex-1">⭐ {fav.name}</span>
                      <button onClick={() => handleRenameStart(fav.id, fav.name)} className="text-xs text-slate-400 hover:text-teal-500 px-1">✏</button>
                      <button onClick={() => deleteFavorite(fav.id)} className="text-xs text-slate-300 hover:text-red-400 px-1">🗑</button>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>
                      {PLAN_CATEGORY_LABELS[fav.planCategory]}
                    </span>
                    {fav.selectedEquipments.map((eq) => (
                      <span key={eq} className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                        {CONSTRUCTION_EQUIPMENT_TYPES[eq].icon} {CONSTRUCTION_EQUIPMENT_TYPES[eq].num}번
                      </span>
                    ))}
                    <span className="text-xs text-slate-400">
                      섹션 {fav.sections.filter((s) => s.enabled).length}개 활성
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{new Date(fav.createdAt).toLocaleDateString("ko-KR")}</span>
                    <button
                      onClick={() => handleLoad(fav.id)}
                      className="text-xs px-3 py-1.5 rounded-lg text-white font-medium"
                      style={{ background: PRIMARY }}
                    >
                      불러오기
                    </button>
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
