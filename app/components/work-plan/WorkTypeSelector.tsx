"use client";
import React, { useState } from "react";
import {
  WORK_CATEGORIES,
  WORK_SUBCATEGORIES,
  WORK_ATTRIBUTES,
  RISK_ATTRIBUTES,
  EQUIPMENT_GROUPS_DISPLAY,
  getSubcategoriesByCategoryId,
  WPSubcategory,
} from "@/store/workPlanTaxonomy";
import {
  WorkClassification,
  useWorkPlanStore,
  PLAN_CATEGORY_LABELS,
} from "@/store/workPlanStore";
import { useTaxonomyOverrideStore, getEffectiveRecommended } from "@/store/taxonomyOverrideStore";

const PRIMARY = "#00B7AF";
const PRIMARY_LIGHT = "#E6FAF9";

// ─── Typography tokens ───────────────────────────────────────────
// T1  Modal title        15px / 700
// T2  Col header         11px / 600  uppercase tracking-wide
// T3  Item label (main)  13px / 600
// T4  Item label (sub)   11px / 400
// T5  Badge / chip       11px / 500
// T6  Button text        12px / 500
// T7  Body copy          12px / 400
// ────────────────────────────────────────────────────────────────

interface Props {
  value: WorkClassification;
  onConfirm: (next: WorkClassification) => void;
  onClose: () => void;
  onLoadFavorite?: (favId: string) => void;
  inline?: boolean;
  hideEquipment?: boolean;
}

export default function WorkTypeSelector({ value, onConfirm, onClose, onLoadFavorite, inline = false, hideEquipment = false }: Props) {
  const { sectionFavorites } = useWorkPlanStore();
  const hasFavorites = sectionFavorites.length > 0;

  const [catId, setCatId] = useState(value.categoryId || "cat_1");
  const [subId, setSubId] = useState(value.subcategoryId || "");
  const [customSubLabel, setCustomSubLabel] = useState(value.customSubLabel || "");
  const [waIds, setWaIds] = useState<string[]>(value.workAttributeIds || []);
  const [raIds, setRaIds] = useState<string[]>(value.riskAttributeIds || []);
  const [eqIds, setEqIds] = useState<string[]>(value.equipmentIds || []);
  const [customEqLabels, setCustomEqLabels] = useState<string[]>(value.customEquipmentLabels || []);
  const [customEqInput, setCustomEqInput] = useState("");
  const [search, setSearch] = useState("");
  const [showFavPanel, setShowFavPanel] = useState(false);
  const [selectedFavId, setSelectedFavId] = useState<string | null>(null);
  const [hoveredFavId, setHoveredFavId] = useState<string | null>(null);

  const subcategories = getSubcategoriesByCategoryId(catId);
  const { overrides } = useTaxonomyOverrideStore();

  const handleCategoryClick = (id: string) => { setCatId(id); setSubId(""); };

  const handleSubcategoryClick = (sub: WPSubcategory) => {
    setSubId(sub.id);
    if (!sub.isCustom) setCustomSubLabel("");
    const eff = getEffectiveRecommended(sub, overrides, sub.id);
    setWaIds(eff.recommendedWorkAttrIds);
    setRaIds(eff.recommendedRiskAttrIds);
    setEqIds(eff.recommendedEquipmentIds);
    setCustomEqLabels(eff.customEquipmentLabels ?? []);
  };

  const toggleEqId = (id: string) =>
    setEqIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const addCustomEq = () => {
    const label = customEqInput.trim();
    if (!label) return;
    setCustomEqLabels((prev) => [...prev, label]);
    setCustomEqInput("");
  };
  const removeCustomEq = (i: number) =>
    setCustomEqLabels((prev) => prev.filter((_, idx) => idx !== i));

  const toggle = <T extends string>(setter: React.Dispatch<React.SetStateAction<T[]>>) =>
    (id: T) => setter((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleWa = toggle(setWaIds);
  const toggleRa = toggle(setRaIds);

  const selectedSub = WORK_SUBCATEGORIES.find((s) => s.id === subId);
  const isCustomSub = selectedSub?.isCustom ?? false;
  const confirmDisabled = !subId || (isCustomSub && !customSubLabel.trim());
  const cat = WORK_CATEGORIES.find((c) => c.id === catId);

  const handleConfirm = () => {
    if (confirmDisabled) return;
    onConfirm({
      categoryId: catId,
      subcategoryId: subId,
      customSubLabel: isCustomSub ? customSubLabel.trim() : undefined,
      equipmentIds: eqIds,
      customEquipmentLabels: customEqLabels.length > 0 ? customEqLabels : undefined,
      workAttributeIds: waIds,
      riskAttributeIds: raIds,
    });
    // onClose is handled by the parent's onConfirm callback (setShowSelector/setClassified)
  };

  // ── Shared style helpers ────────────────────────────────────────
  const colHeader = "px-3 py-2 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold";
  const colHeaderStyle: React.CSSProperties = { fontSize: 11 };

  const chip = (
    active: boolean,
    color = PRIMARY,
    opts?: { bg?: string; textColor?: string }
  ): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    fontSize: 11,
    fontWeight: 500,
    padding: "2px 8px",
    borderRadius: 999,
    background: active ? (opts?.bg ?? color) : `${color}15`,
    color: active ? (opts?.textColor ?? "white") : color,
  });

  // ── Inner markup ────────────────────────────────────────────────
  const inner = (
    <div
      className={inline ? "flex flex-col h-full bg-white" : "bg-white rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col"}
      style={inline ? undefined : { maxWidth: 1120, margin: "0 1rem" }}
      onClick={(e) => e.stopPropagation()}
    >

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 py-3.5 border-b flex-shrink-0"
        style={{ background: PRIMARY_LIGHT, borderColor: "#b2ece9" }}
      >
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: PRIMARY, lineHeight: 1.3 }}>작업 분류 선택</h2>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
            대분류 → 상세분류 → 작업속성 · 위험속성 순서로 선택하세요
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasFavorites && (
            <button
              onClick={() => setShowFavPanel((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border font-semibold transition-all"
              style={{
                fontSize: 12,
                padding: "5px 12px",
                background: showFavPanel ? PRIMARY : "white",
                borderColor: showFavPanel ? PRIMARY : "#cbd5e1",
                color: showFavPanel ? "white" : "#475569",
              }}
            >
              ⭐ 즐겨찾기
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 999,
                  background: showFavPanel ? "rgba(255,255,255,0.25)" : `${PRIMARY}15`,
                  color: showFavPanel ? "white" : PRIMARY,
                  fontWeight: 600,
                }}
              >
                {sectionFavorites.length}
              </span>
              <span style={{ fontSize: 10 }}>{showFavPanel ? "▲" : "▼"}</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-teal-100 transition-colors"
            style={{ fontSize: 16, color: "#64748b" }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="px-4 py-2 border-b border-slate-100 flex-shrink-0">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="작업 검색 (예: 굴착, 해체, 스카이, 도장...)"
          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-teal-400"
          style={{ fontSize: 13 }}
        />
      </div>

      {/* ── 즐겨찾기 패널 ── */}
      {showFavPanel && (() => {

        return (
          <div className="flex-shrink-0 border-b border-slate-200" style={{ background: "#f8fafc" }}>
            {/* 타이틀 */}
            <div className="px-4 pt-2.5 pb-1 flex items-center gap-2">
              <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.04em" }}>⭐ 즐겨찾기 목록</span>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>{sectionFavorites.length}개</span>
            </div>
            {/* 카드 목록 */}
            <div className="px-3 pb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "thin" }}>
              {sectionFavorites.map((fav) => {
                const cl = fav.classification;
                const favCat = cl ? WORK_CATEGORIES.find((c) => c.id === cl.categoryId) : null;
                const favSub = cl ? WORK_SUBCATEGORIES.find((s) => s.id === cl.subcategoryId) : null;
                const isSel = selectedFavId === fav.id;

                const handleCardClick = () => {
                  setSelectedFavId(fav.id);
                  if (cl?.categoryId) setCatId(cl.categoryId);
                  if (cl?.subcategoryId) setSubId(cl.subcategoryId);
                  if (cl?.workAttributeIds) setWaIds(cl.workAttributeIds);
                  if (cl?.riskAttributeIds) setRaIds(cl.riskAttributeIds);
                };

                return (
                  <div
                    key={fav.id}
                    className="flex-shrink-0 rounded-xl border cursor-pointer transition-all flex flex-col"
                    style={{
                      width: 220,
                      background: isSel ? PRIMARY_LIGHT : "white",
                      borderColor: isSel ? PRIMARY : "#e2e8f0",
                      boxShadow: isSel ? `0 0 0 2px ${PRIMARY}40` : "0 1px 3px rgba(0,0,0,0.06)",
                    }}
                    onClick={handleCardClick}
                  >
                    {/* 카드 헤더 */}
                    <div className="px-3 pt-2.5 pb-2 border-b" style={{ borderColor: isSel ? `${PRIMARY}25` : "#f1f5f9" }}>
                      <div className="flex items-center justify-between gap-1">
                        <p style={{ fontSize: 12, fontWeight: 700, color: isSel ? PRIMARY : "#1e293b" }} className="truncate">
                          {isSel ? "✓ " : "⭐ "}{fav.name}
                        </p>
                        <span style={{ fontSize: 10, color: "#94a3b8", flexShrink: 0 }}>
                          {new Date(fav.createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      {/* 분류 경로 */}
                      {favCat && favSub ? (
                        <div className="mt-2 space-y-0.5">
                          <div style={{ fontSize: 11, color: isSel ? PRIMARY : "#374151", fontWeight: 600 }}>
                            {favCat.icon} {favCat.num}. {favCat.label}
                          </div>
                          <div className="flex items-center gap-1" style={{ paddingLeft: 4 }}>
                            <span style={{ fontSize: 10, color: "#94a3b8" }}>›</span>
                            <span style={{ fontSize: 11, color: isSel ? PRIMARY : "#0f766e", fontWeight: 600 }}>
                              {favSub.num} {favSub.label}
                            </span>
                          </div>
                        </div>
                      ) : favCat ? (
                        <div className="mt-2" style={{ fontSize: 11, color: isSel ? PRIMARY : "#374151", fontWeight: 600 }}>
                          {favCat.icon} {favCat.num}. {favCat.label}
                        </div>
                      ) : (
                        <div className="mt-1.5" style={{ fontSize: 10, color: "#94a3b8" }}>
                          {PLAN_CATEGORY_LABELS[fav.planCategory] ?? fav.planCategory}
                          <span style={{ display: "block", fontSize: 9, marginTop: 2, color: "#cbd5e1" }}>분류 정보를 다시 저장하면 표시됩니다</span>
                        </div>
                      )}
                    </div>
                    {/* 선택 표시 */}
                    {isSel && (
                      <div className="px-3 py-1.5 flex items-center justify-center gap-1" style={{ background: PRIMARY, borderRadius: "0 0 10px 10px" }}>
                        <span style={{ fontSize: 10, color: "white", fontWeight: 600 }}>✓ 선택됨</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        );
      })()}

      {/* ── Search results ── */}
      {search && (
        <div
          className={inline ? "flex-1 overflow-y-auto" : "overflow-y-auto"}
          style={inline ? undefined : { minHeight: 440, maxHeight: "66vh" }}
        >
          {(() => {
            const q = search.toLowerCase();
            const results = WORK_SUBCATEGORIES.filter(
              (s) =>
                s.label.toLowerCase().includes(q) ||
                (WORK_CATEGORIES.find((c) => c.id === s.categoryId)?.label ?? "").toLowerCase().includes(q) ||
                (s.aliases ?? []).some((a) => a.toLowerCase().includes(q))
            );
            if (!results.length)
              return <p className="py-16 text-center text-slate-400" style={{ fontSize: 13 }}>검색 결과 없음</p>;
            return (
              <div className="p-3 space-y-1">
                {results.map((sub) => {
                  const c = WORK_CATEGORIES.find((c) => c.id === sub.categoryId);
                  const active = sub.id === subId;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => { handleSubcategoryClick(sub); setSearch(""); setCatId(sub.categoryId); }}
                      className="w-full text-left rounded-xl px-3 py-2.5 transition-all flex items-center gap-2"
                      style={{
                        background: active ? PRIMARY : "#f8fafc",
                        border: `1.5px solid ${active ? PRIMARY : "#e2e8f0"}`,
                        fontSize: 13,
                      }}
                    >
                      {c && (
                        <span style={{ fontSize: 11, color: active ? "rgba(255,255,255,0.7)" : "#94a3b8", flexShrink: 0 }}>
                          {c.icon} {c.label} ·
                        </span>
                      )}
                      <span style={chip(active)}>{sub.num}</span>
                      <span style={{ fontWeight: 600, color: active ? "white" : "#1e293b", flex: 1 }}>{sub.label}</span>
                      {sub.articleRef && (
                        <span style={{ fontSize: 11, color: active ? "rgba(255,255,255,0.7)" : "#f59e0b", flexShrink: 0 }}>
                          ⚖️ {sub.articleRef}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── 3-column body ── */}
      {!search && (
        <div
          className={inline ? "flex flex-1 overflow-hidden" : "flex overflow-hidden"}
          style={inline ? undefined : { minHeight: 440, maxHeight: "66vh" }}
        >

          {/* ── Col 1: 대분류 ── */}
          <div className="flex-shrink-0 overflow-y-auto border-r border-slate-100" style={{ width: 320 }}>
            <div className={colHeader} style={colHeaderStyle}>대분류</div>
            {WORK_CATEGORIES.map((c) => {
              const active = c.id === catId;
              return (
                <button
                  key={c.id}
                  onClick={() => handleCategoryClick(c.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left border-b border-slate-50 transition-colors"
                  style={{
                    background: active ? PRIMARY_LIGHT : "white",
                    borderLeft: `3px solid ${active ? PRIMARY : "transparent"}`,
                  }}
                >
                  <span style={{ fontSize: 15, width: 22, textAlign: "center", flexShrink: 0 }}>{c.icon}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: active ? PRIMARY : "#374151" }}>
                      {c.num}. {c.label}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>
                    {getSubcategoriesByCategoryId(c.id).length}종
                  </span>
                  {active && <span style={{ fontSize: 10, color: PRIMARY, flexShrink: 0 }}>▶</span>}
                </button>
              );
            })}
          </div>

          {/* ── Col 2: 상세분류 ── */}
          <div className="flex-shrink-0 overflow-y-auto border-r border-slate-100" style={{ width: 380 }}>
            <div className={`${colHeader} flex items-center gap-2`} style={colHeaderStyle}>
              <span>상세분류</span>
              {cat && (
                <span style={{ fontSize: 11, fontWeight: 600, color: PRIMARY, textTransform: "none", letterSpacing: 0 }}>
                  {cat.icon} {cat.label}
                </span>
              )}
            </div>
            <div className="p-2 space-y-1">
              {subcategories.map((sub) => {
                const active = sub.id === subId;
                const previewWa = WORK_ATTRIBUTES.filter((a) => sub.recommendedWorkAttrIds.includes(a.id)).slice(0, 3);
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleSubcategoryClick(sub)}
                    className="w-full text-left rounded-xl px-3 py-2.5 transition-all"
                    style={{
                      background: active ? PRIMARY : "#f8fafc",
                      border: `1.5px solid ${active ? PRIMARY : "#e2e8f0"}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span style={chip(active)}>{sub.num}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, flex: 1, color: active ? "white" : "#1e293b" }}>
                        {sub.label}
                      </span>
                    </div>
                    {sub.articleRef && (
                      <div style={{ fontSize: 11, marginTop: 4, color: active ? "rgba(255,255,255,0.75)" : "#f59e0b" }}>
                        ⚖️ {sub.articleRef}
                      </div>
                    )}
                    {previewWa.length > 0 && (
                      <div className="flex flex-wrap gap-1" style={{ marginTop: 6 }}>
                        {previewWa.map((a) => (
                          <span
                            key={a.id}
                            style={{
                              fontSize: 11,
                              padding: "2px 6px",
                              borderRadius: 999,
                              background: active ? "rgba(255,255,255,0.2)" : "#e2e8f0",
                              color: active ? "rgba(255,255,255,0.9)" : "#64748b",
                            }}
                          >
                            {a.label}
                          </span>
                        ))}
                      </div>
                    )}
                    {sub.isCustom && active && (
                      <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={customSubLabel}
                          onChange={(e) => setCustomSubLabel(e.target.value)}
                          placeholder="작업 내용을 직접 입력하세요"
                          autoFocus
                          className="w-full px-2 py-1.5 rounded-lg outline-none border"
                          style={{
                            fontSize: 12,
                            borderColor: "rgba(255,255,255,0.5)",
                            background: "rgba(255,255,255,0.15)",
                            color: "white",
                          }}
                        />
                        {!customSubLabel.trim() && (
                          <p style={{ fontSize: 11, marginTop: 4, color: "rgba(255,255,255,0.6)" }}>
                            * 작업 내용을 입력해야 선택 완료할 수 있습니다
                          </p>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
              {subcategories.length === 0 && (
                <p className="text-center py-8 text-slate-400" style={{ fontSize: 12 }}>
                  대분류를 선택하세요
                </p>
              )}
            </div>
          </div>

          {/* ── Col 3: 속성 선택 ── */}
          <div className="flex-1 overflow-y-auto" style={{ minWidth: 0 }}>
            <div className={colHeader} style={colHeaderStyle}>속성 선택</div>

            {!subId ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
                <span style={{ fontSize: 28 }}>👈</span>
                <p style={{ fontSize: 13, textAlign: "center", lineHeight: 1.6 }}>
                  상세분류를 선택하면<br />속성을 고를 수 있습니다
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-5">

                {/* 추천 안내 */}
                {(waIds.length > 0 || raIds.length > 0) && (
                  <div
                    className="flex items-start gap-2 px-3 py-2 rounded-lg"
                    style={{ background: `${PRIMARY}10`, color: PRIMARY, fontSize: 11 }}
                  >
                    <span style={{ flexShrink: 0, marginTop: 1 }}>✨</span>
                    <span>선택한 작업 유형에 따라 속성이 자동 추천됩니다. 필요에 따라 추가하거나 해제하세요.</span>
                  </div>
                )}

                {/* ── 작업속성 ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>📋 작업속성</span>
                    {waIds.length > 0 && (
                      <span style={chip(true, PRIMARY)}>{waIds.length}개 선택</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {WORK_ATTRIBUTES.map((wa) => {
                      const sel = waIds.includes(wa.id);
                      return (
                        <button
                          key={wa.id}
                          onClick={() => toggleWa(wa.id)}
                          className="rounded-full border font-medium transition-all"
                          style={{
                            fontSize: 12,
                            padding: "5px 12px",
                            background: sel ? "#0f766e" : "white",
                            borderColor: sel ? "#0f766e" : "#cbd5e1",
                            color: sel ? "white" : "#475569",
                            boxShadow: sel ? "0 1px 4px rgba(15,118,110,0.25)" : "none",
                          }}
                        >
                          {sel && "✓ "}{wa.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* ── 위험속성 ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>⚠️ 위험속성</span>
                    {raIds.length > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 999, background: "#fee2e2", color: "#dc2626" }}>
                        {raIds.length}개 선택
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {RISK_ATTRIBUTES.map((ra) => {
                      const sel = raIds.includes(ra.id);
                      const color = ra.color ?? "#dc2626";
                      return (
                        <button
                          key={ra.id}
                          onClick={() => toggleRa(ra.id)}
                          className="rounded-full border font-medium transition-all"
                          style={{
                            fontSize: 12,
                            padding: "5px 12px",
                            background: sel ? color : "white",
                            borderColor: sel ? color : "#cbd5e1",
                            color: sel ? "white" : "#475569",
                            boxShadow: sel ? `0 1px 4px ${color}40` : "none",
                          }}
                        >
                          {sel && "✓ "}{ra.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {!hideEquipment && <div className="border-t border-slate-100" />}

                {/* ── 투입 장비 ── */}
                {!hideEquipment && <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>🔧 투입 장비</span>
                    {(eqIds.length + customEqLabels.length) > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 999, background: PRIMARY_LIGHT, color: PRIMARY }}>
                        {eqIds.length + customEqLabels.length}개 선택
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {EQUIPMENT_GROUPS_DISPLAY.map((grp) => {
                      const selCount = grp.items.filter((i) => eqIds.includes(i.id)).length;
                      return (
                        <div key={grp.id}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span style={{ fontSize: 12 }}>{grp.icon}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: selCount > 0 ? PRIMARY : "#94a3b8" }}>{grp.label}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pl-1">
                            {grp.items.map((item) => {
                              const sel = eqIds.includes(item.id);
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => toggleEqId(item.id)}
                                  className="rounded-full border font-medium transition-all"
                                  style={{
                                    fontSize: 11, padding: "4px 10px",
                                    background: sel ? PRIMARY : "white",
                                    borderColor: sel ? PRIMARY : "#cbd5e1",
                                    color: sel ? "white" : "#475569",
                                  }}
                                >
                                  {sel && "✓ "}{item.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* 기타 직접입력 */}
                    <div className="rounded-xl border border-dashed border-slate-200 p-3" style={{ background: "#f8fafc" }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>➕ 기타 장비 직접입력</p>
                      {customEqLabels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {customEqLabels.map((label, i) => (
                            <span
                              key={i}
                              className="flex items-center gap-1 rounded-full border font-medium"
                              style={{ fontSize: 11, padding: "4px 10px", background: PRIMARY, borderColor: PRIMARY, color: "white" }}
                            >
                              {label}
                              <button
                                onClick={() => removeCustomEq(i)}
                                style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", lineHeight: 1 }}
                              >✕</button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={customEqInput}
                          onChange={(e) => setCustomEqInput(e.target.value)}
                          placeholder="장비명 입력 후 Enter"
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomEq(); } }}
                          className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-teal-400"
                          style={{ fontSize: 12 }}
                        />
                        <button
                          onClick={addCustomEq}
                          className="px-3 py-1.5 rounded-lg font-semibold text-white"
                          style={{ fontSize: 12, background: customEqInput.trim() ? PRIMARY : "#cbd5e1" }}
                          disabled={!customEqInput.trim()}
                        >
                          추가
                        </button>
                      </div>
                    </div>
                  </div>
                </div>}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── Footer ── */}
      <div className="border-t border-slate-100 px-5 py-3 flex items-center gap-3 flex-shrink-0 bg-slate-50">
        <div className="flex-1 min-w-0">
          {subId ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {cat && (
                <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 999, background: "#e2e8f0", color: "#475569" }}>
                  {cat.icon} {cat.label}
                </span>
              )}
              {selectedSub && (
                <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 999, background: PRIMARY_LIGHT, color: PRIMARY }}>
                  {selectedSub.num} {selectedSub.isCustom ? (customSubLabel || selectedSub.label) : selectedSub.label}
                </span>
              )}
              {eqIds.map((id) => {
                const eq = EQUIPMENT_GROUPS_DISPLAY.flatMap((g) => g.items).find((i) => i.id === id);
                return eq ? (
                  <span key={id} style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 999, background: `${PRIMARY}15`, color: PRIMARY }}>
                    🔧 {eq.label}
                  </span>
                ) : null;
              })}
              {customEqLabels.map((label, i) => (
                <span key={`ceq_${i}`} style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 999, background: `${PRIMARY}15`, color: PRIMARY }}>
                  🔧 {label} (기타)
                </span>
              ))}
              {waIds.map((id) => (
                <span key={id} style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 999, background: "#ccfbf1", color: "#0f766e" }}>
                  {WORK_ATTRIBUTES.find((a) => a.id === id)?.label}
                </span>
              ))}
              {raIds.map((id) => {
                const ra = RISK_ATTRIBUTES.find((a) => a.id === id);
                return (
                  <span key={id} style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 999, background: ra?.color ?? "#dc2626", color: "white" }}>
                    ⚠ {ra?.label}
                  </span>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: "#94a3b8" }}>상세분류를 선택해야 완료할 수 있습니다</p>
          )}
        </div>
        {!inline && (
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white font-medium transition-colors hover:bg-slate-50"
            style={{ fontSize: 13, padding: "7px 16px", color: "#64748b" }}
          >
            취소
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={confirmDisabled}
          className="rounded-xl text-white font-semibold transition-colors"
          style={{
            fontSize: 13,
            padding: "7px 20px",
            background: confirmDisabled ? "#cbd5e1" : PRIMARY,
            cursor: confirmDisabled ? "not-allowed" : "pointer",
          }}
        >
          {inline ? "작성 시작" : "선택 완료"}
        </button>
      </div>
    </div>
  );

  if (inline) return inner;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.5)", paddingTop: "2rem", paddingBottom: "2rem" }}
      onClick={onClose}
    >
      {inner}
    </div>
  );
}
