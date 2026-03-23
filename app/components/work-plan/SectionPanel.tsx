"use client";
import React from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
  useWorkPlanStore, Section,
  CONSTRUCTION_EQUIPMENT_TYPES, SECTION_TO_EQUIPMENT, EQUIPMENT_SPECIFIC_SECTIONS, EquipmentType,
} from "@/store/workPlanStore";

const PRIMARY = "#00B7AF";
const PRIMARY_LIGHT = "#E6FAF9";

// ─── [법정] 섹션 가이드 텍스트 ───────────────────────────────────
const LEGAL_SECTION_GUIDES: Record<string, string> = {
  pre_survey:        "산업안전보건법 별표4 제1호\n굴착·터널·교량 작업 전 지형·지질·지층, 낙반·출수·가스폭발 위험 등을 사전조사하고 기록해야 합니다.",
  electrical_safety: "산업안전보건법 제38조 제5호\n충전전로 인근 작업 시 전기안전작업계획서를 작성해야 합니다. 이격거리, 절연 방호구 설치, 감시인 배치 등을 포함합니다.",
  heavy_load_plan:   "산업안전보건법 별표4\n중량 500kg 이상 화물 취급 시 작성합니다. 인양방법, 하중분산계획, 낙하·전도 방지대책 등을 포함해야 합니다.",
  tunnel_plan:       "산업안전보건법 제38조 제7호\n터널굴착 작업계획서로, 보링 등 사전조사 후 작성해야 합니다. 굴착방법, 지보공, 복공, 용수처리, 환기·조명 계획을 포함합니다.",
  chemical_ops:      "산업안전보건법 제38조 제4호\n화학설비 및 부속설비 사용 시 10개 항목(밸브 조작, 냉각·가열, 계측제어, 안전밸브 조정, 누출 점검 등)을 포함한 운전계획서가 필요합니다.",
  demolition_plan:   "산업안전보건법 제38조 제10호\n건축물 해체 전 구조·주변 사전조사 후 해체방법, 가설설비, 환기·살수설비, 연락방법, 해체물 처분계획 등을 포함한 계획서를 작성해야 합니다.",
};

export default function SectionPanel() {
  const { sections, toggleSection, reorderSections, addCustomSection } = useWorkPlanStore();

  const scrollToSection = (id: string) => {
    // 장비 전용 섹션: 탭 전환 이벤트 발행 후 equipment_info로 스크롤 (Bug 2-2)
    const eqType = SECTION_TO_EQUIPMENT[id];
    if (eqType) {
      const tabIndex = (EQUIPMENT_SPECIFIC_SECTIONS[eqType] ?? []).findIndex((s) => s.id === id);
      window.dispatchEvent(
        new CustomEvent("ptw:focusEquipmentSection", { detail: { eqType, tabIndex: tabIndex >= 0 ? tabIndex : 0 } })
      );
      setTimeout(() => {
        document.getElementById("equipment_info")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const [addingCustom, setAddingCustom] = React.useState(false);
  const [customLabel, setCustomLabel] = React.useState("");

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderSections(result.source.index, result.destination.index);
  };

  const handleAddCustom = () => {
    if (!customLabel.trim()) return;
    addCustomSection({
      id: `custom_${Date.now()}`,
      label: customLabel.trim(),
      required: false,
      enabled: true,
    });
    setCustomLabel("");
    setAddingCustom(false);
  };

  // signature는 필수 요소라 섹션 패널에서 노출 불필요 — 항상 렌더링됨
  const visibleSections = sections.filter((s) => s.id !== "signature");

  // Compute group boundaries for visual headers (non-Draggable dividers)
  const sectionMeta = visibleSections.map((s, i) => {
    const eqType = SECTION_TO_EQUIPMENT[s.id] as EquipmentType | undefined;
    const prevEqType = i > 0
      ? (SECTION_TO_EQUIPMENT[visibleSections[i - 1].id] as EquipmentType | undefined)
      : undefined;
    const prevHasEq = i > 0 ? !!SECTION_TO_EQUIPMENT[visibleSections[i - 1].id] : false;

    return {
      section: s,
      index: i,
      eqType,
      showCommonHeader: i === 0,
      showEqBlockHeader: !!eqType && !prevHasEq,
      showEqGroupHeader: !!eqType && eqType !== prevEqType,
      // 장비 섹션 이후 공통 섹션으로 복귀할 때 구분선
      showCommonResume: !eqType && prevHasEq,
    };
  });

  return (
    <div className="flex flex-col h-full">
      <div
        className="px-4 py-3 text-sm font-semibold border-b"
        style={{ color: PRIMARY, background: PRIMARY_LIGHT, borderColor: "#b2ece9" }}
      >
        섹션 구성
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex-1 overflow-y-auto py-2"
            >
              {sectionMeta.map(({ section, index, eqType, showCommonHeader, showEqBlockHeader, showEqGroupHeader }) => {
                const eqInfo = eqType ? CONSTRUCTION_EQUIPMENT_TYPES[eqType] : undefined;
                const commonCount = visibleSections.filter((s) => !SECTION_TO_EQUIPMENT[s.id]).length;
                const enabledCommon = visibleSections.filter((s) => !SECTION_TO_EQUIPMENT[s.id] && s.enabled).length;
                const eqSections = visibleSections.filter((s) => !!SECTION_TO_EQUIPMENT[s.id]);

                return (
                  <React.Fragment key={section.id}>
                    {/* ── 공통 섹션 그룹 헤더 ── */}
                    {showCommonHeader && (
                      <div className="flex items-center gap-2 px-3 mb-2 mt-1">
                        <span className="text-xs font-bold" style={{ color: PRIMARY }}>📋 공통 섹션</span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: `${PRIMARY}15`, color: PRIMARY }}
                        >
                          {enabledCommon}/{commonCount}
                        </span>
                        <div className="flex-1 h-px" style={{ background: `${PRIMARY}20` }} />
                      </div>
                    )}

                    {/* ── 장비별 섹션 블록 시작 헤더 ── */}
                    {showEqBlockHeader && (
                      <div className="flex items-center gap-2 px-3 mt-3 mb-2">
                        <span className="text-xs font-bold text-slate-500">🔧 장비별 전용 섹션</span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-500"
                        >
                          {eqSections.filter((s) => s.enabled).length}/{eqSections.length}
                        </span>
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>
                    )}

                    {/* ── 장비 그룹 서브헤더 ── */}
                    {showEqGroupHeader && !showEqBlockHeader && eqInfo && (
                      <div className="flex items-center gap-2 px-3 mt-2 mb-1">
                        <span className="text-xs">{eqInfo.icon}</span>
                        <span className="text-xs font-semibold text-slate-600">
                          {eqInfo.num}번 · {eqInfo.label.split(" ")[0]}
                        </span>
                        <div className="flex-1 h-px" style={{ background: `${PRIMARY}15` }} />
                      </div>
                    )}
                    {/* ── 장비 섹션 이후 공통 섹션 재개 구분선 ── */}
                    {sectionMeta[index].showCommonResume && (
                      <div className="flex items-center gap-2 px-3 mt-3 mb-2">
                        <span className="text-xs font-bold" style={{ color: PRIMARY }}>📎 공통 (마감)</span>
                        <div className="flex-1 h-px" style={{ background: `${PRIMARY}20` }} />
                      </div>
                    )}

                    {/* First eq group sub-header (same position as block header row) */}
                    {showEqBlockHeader && eqInfo && (
                      <div className="flex items-center gap-2 px-3 mb-1">
                        <span className="text-xs">{eqInfo.icon}</span>
                        <span className="text-xs font-semibold text-slate-600">
                          {eqInfo.num}번 · {eqInfo.label.split(" ")[0]}
                        </span>
                        <div className="flex-1 h-px" style={{ background: `${PRIMARY}15` }} />
                      </div>
                    )}

                    <Draggable
                      draggableId={section.id}
                      index={index}
                      isDragDisabled={section.required}
                    >
                      {(drag, snapshot) => (
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          className="flex items-center gap-2 px-3 py-1.5 mx-2 mb-0.5 rounded-lg text-sm"
                          style={{
                            background: snapshot.isDragging
                              ? `${PRIMARY}18`
                              : section.enabled
                              ? eqType ? `${PRIMARY}0d` : `${PRIMARY}0d`
                              : "transparent",
                            border: section.enabled
                              ? `1px solid ${PRIMARY}20`
                              : "1px solid transparent",
                            opacity: section.enabled ? 1 : 0.45,
                            transition: "background 150ms, border-color 150ms, opacity 150ms, transform 100ms",
                            transform: snapshot.isDragging ? "scale(1.02)" : "scale(1)",
                            boxShadow: snapshot.isDragging ? "0 4px 12px rgba(0,183,175,0.15)" : "none",
                          }}
                        >
                          <span
                            {...drag.dragHandleProps}
                            className="text-slate-300 cursor-grab active:cursor-grabbing select-none text-xs transition-colors hover:text-slate-400"
                            style={{ visibility: section.required ? "hidden" : "visible" }}
                          >
                            ⠿
                          </span>
                          <button
                            onClick={() => toggleSection(section.id)}
                            className="flex-shrink-0"
                            disabled={section.required}
                          >
                            <div
                              className="w-3.5 h-3.5 rounded border-2 flex items-center justify-center text-white"
                              style={{
                                background: section.enabled ? PRIMARY : "white",
                                borderColor: section.enabled ? PRIMARY : "#cbd5e1",
                                fontSize: "0.55rem",
                                transition: "background 120ms, border-color 120ms",
                              }}
                            >
                              {section.enabled && "✓"}
                            </div>
                          </button>
                          <span
                            className="flex-1 text-xs font-medium truncate cursor-pointer hover:underline flex items-center gap-1 min-w-0"
                            style={{ color: section.enabled ? "#334155" : "#94a3b8" }}
                            onClick={() => section.enabled && scrollToSection(section.id)}
                            title={section.enabled ? "클릭하여 해당 섹션으로 이동" : undefined}
                          >
                            <span className="truncate">{section.label}</span>
                            {LEGAL_SECTION_GUIDES[section.id] && (
                              <span
                                className="flex-shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white cursor-help"
                                style={{ background: "#f59e0b", fontSize: "0.55rem", fontWeight: 700 }}
                                title={LEGAL_SECTION_GUIDES[section.id]}
                                onClick={(e) => e.stopPropagation()}
                              >
                                ?
                              </span>
                            )}
                          </span>
                          {section.required && (
                            <span
                              className="text-xs px-1 py-0.5 rounded-full font-medium flex-shrink-0"
                              style={{ background: `${PRIMARY}18`, color: PRIMARY, fontSize: "0.6rem" }}
                            >
                              필수
                            </span>
                          )}
                        </div>
                      )}
                    </Draggable>
                  </React.Fragment>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add custom section */}
      <div className="px-3 py-3 border-t border-slate-100">
        {addingCustom ? (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="섹션 이름 입력"
              className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-teal-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCustom();
                if (e.key === "Escape") setAddingCustom(false);
              }}
              autoFocus
            />
            <div className="flex gap-1">
              <button
                onClick={handleAddCustom}
                className="flex-1 text-xs py-1 rounded-lg text-white font-medium"
                style={{ background: PRIMARY }}
              >
                추가
              </button>
              <button
                onClick={() => { setAddingCustom(false); setCustomLabel(""); }}
                className="flex-1 text-xs py-1 rounded-lg text-slate-500 bg-slate-100"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingCustom(true)}
            className="w-full text-xs py-2 rounded-lg border border-dashed text-slate-400 hover:text-teal-500 hover:border-teal-300 transition-colors"
            style={{ borderColor: "#cbd5e1" }}
          >
            + 섹션 추가
          </button>
        )}
      </div>
    </div>
  );
}
