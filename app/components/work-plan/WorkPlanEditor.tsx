"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useWorkPlanStore,
  DocumentProfile,
  WorkClassification,
  FormRevision,
} from "@/store/workPlanStore";
import { useWorkPermitStore } from "@/store/workPermitStore";
import SectionPanel from "./SectionPanel";
import SectionForm from "./SectionForm";
import PreviewPanel from "./PreviewPanel";
import FavoritesModal from "./FavoritesModal";
import SignatureModal from "./SignatureModal";
import WorkTypeSelector from "./WorkTypeSelector";
import dynamic from "next/dynamic";
import {
  getCategoryById,
  getSubcategoryById,
  EQUIPMENT_MAP,
  WORK_ATTRIBUTES,
  RISK_ATTRIBUTES,
} from "@/store/workPlanTaxonomy";
const useStore = useWorkPlanStore;

// ─── 분류 선택 버튼 (현재 분류 요약 표시) ────────────────────────
function ClassificationButton({
  classification,
  onClick,
}: {
  classification: WorkClassification;
  onClick: () => void;
}) {
  const sub = getSubcategoryById(classification.subcategoryId);
  const cat = getCategoryById(classification.categoryId);
  const eqCount = classification.equipmentIds.length;
  const waCount = classification.workAttributeIds.length;
  const raCount = classification.riskAttributeIds.length;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border font-medium transition-colors hover:border-teal-400 hover:bg-teal-50 group"
      style={{ borderColor: `${PRIMARY}55`, background: "#f8ffff" }}
      title="작업 분류 변경"
    >
      {/* Category icon */}
      {cat && <span className="text-base leading-none">{cat.icon}</span>}

      <div className="text-left">
        {sub ? (
          <>
            <div className="text-xs font-bold leading-tight" style={{ color: PRIMARY }}>
              {sub.num} {sub.isCustom ? (classification.customSubLabel || sub.label) : sub.label}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {eqCount > 0 && (
                <span className="text-xs text-slate-500">🔧 {eqCount}종</span>
              )}
              {(waCount + raCount) > 0 && (
                <span className="text-xs text-slate-400">· 속성 {waCount + raCount}개</span>
              )}
            </div>
          </>
        ) : (
          <span className="text-xs text-slate-500">작업 분류 선택</span>
        )}
      </div>

      <span className="text-slate-400 text-xs group-hover:text-teal-500">▼</span>
    </button>
  );
}

// ─── 하단 분류 요약 ───────────────────────────────────────────────
function BottomClassificationSummary({
  classification,
  documentProfile,
}: {
  classification: WorkClassification;
  documentProfile: string;
}) {
  const sub = getSubcategoryById(classification.subcategoryId);
  const cat = getCategoryById(classification.categoryId);
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {cat && <span className="text-xs text-slate-400">{cat.icon} {cat.label}</span>}
      {sub && (
        <span className="text-xs font-semibold" style={{ color: PRIMARY }}>
          {sub.num} {sub.label}
        </span>
      )}
      {classification.equipmentIds.map((id) => (
        <span key={id} className="text-xs px-1.5 py-0.5 rounded-full font-medium"
          style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>
          {EQUIPMENT_MAP[id]?.label ?? id}
        </span>
      ))}
      {classification.riskAttributeIds.map((id) => {
        const ra = RISK_ATTRIBUTES.find((a) => a.id === id);
        return (
          <span key={id} className="text-xs px-1.5 py-0.5 rounded-full font-medium text-white" style={{ background: ra?.color ?? "#dc2626" }}>
            ⚠ {ra?.label}
          </span>
        );
      })}
      <span className="text-xs text-slate-400">
        · {documentProfile === "lite" ? "약식" : documentProfile === "custom" ? "사용자 정의" : "정식"}
      </span>
    </div>
  );
}

const PdfExport = dynamic(() => import("./PdfExport"), { ssr: false });

const PRIMARY = "#00B7AF";

// ─── 제38조 법령 팝오버 ──────────────────────────────────────────
const ARTICLE_38_TEXT = `산업안전보건기준에 관한 규칙 제38조 (사전조사 및 작업계획서의 작성 등)

① 사업주는 다음 각 호의 작업을 하는 경우 근로자의 위험을 방지하기 위하여 별표 4에 따라 해당 작업·작업장의 지형·지반 및 지층 상태 등에 대한 사전조사를 하고 그 결과를 기록·보존해야 하며, 조사결과를 고려하여 별표 4의 구분에 따른 사항을 포함한 작업계획서를 작성하고 그 계획에 따라 작업을 하도록 해야 한다.

  1. 타워크레인을 설치·조립·해체하는 작업
  2. 차량계 하역운반기계등을 사용하는 작업
  3. 차량계 건설기계를 사용하는 작업
  4. 화학설비와 그 부속설비를 사용하는 작업
  5. 제318조에 따른 전기작업 (50V 초과 또는 250VA 초과)
  6. 굴착면의 높이가 2미터 이상이 되는 지반의 굴착작업
  7. 터널굴착작업
  8. 교량의 설치·해체 또는 변경 작업
  9. 채석작업
  10. 구축물·건축물 등의 해체작업
  11. 중량물의 취급작업
  12. 궤도나 그 밖의 관련 설비의 보수·점검작업
  13. 열차의 교환·연결 또는 분리 작업 (입환작업)

② 사업주는 제1항에 따라 작성한 작업계획서의 내용을 해당 근로자에게 알려야 한다.

③ 사업주는 항타기나 항발기를 조립·해체·변경 또는 이동하는 작업을 하는 경우 그 작업방법과 절차를 정하여 근로자에게 주지시켜야 한다.

④ 사업주는 제1항제12호의 작업에 궤도작업차량을 사용하는 경우 미리 그 구간을 운행하는 열차의 운행관계자와 협의하여야 한다.`;

function LegalInfoButton() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center border flex-shrink-0 transition-colors"
        style={{ borderColor: `${PRIMARY}66`, color: PRIMARY, background: PRIMARY_LIGHT }}
        title="산업안전보건기준에 관한 규칙 제38조"
      >
        ?
      </button>
      {open && (
        <div
          className="absolute left-0 top-7 z-50 rounded-xl shadow-xl border overflow-hidden anim-slide-down"
          style={{ width: 520, background: "white", borderColor: "#e2e8f0" }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="px-4 py-2.5 border-b text-xs font-bold" style={{ background: PRIMARY_LIGHT, color: PRIMARY, borderColor: "#b2ece9" }}>
            📋 산업안전보건기준에 관한 규칙 제38조
          </div>
          <pre
            className="px-4 py-3 text-xs text-slate-600 leading-relaxed overflow-y-auto whitespace-pre-wrap"
            style={{ maxHeight: 400, fontFamily: "inherit" }}
          >
            {ARTICLE_38_TEXT}
          </pre>
        </div>
      )}
    </div>
  );
}
const PRIMARY_DARK = "#00A099";
const PRIMARY_LIGHT = "#E6FAF9";


function SignatureStatusBadge() {
  const { signatures } = useStore();
  const doneCount = signatures.filter((s) => s.status === "done").length;
  const total = signatures.length;
  const allDone = doneCount === total;
  return (
    <span
      className="text-xs px-1.5 py-0.5 rounded-full font-medium ml-1"
      style={{
        background: allDone ? PRIMARY_LIGHT : "#fffbeb",
        color: allDone ? PRIMARY : "#b45309",
      }}
    >
      {doneCount}/{total}
    </span>
  );
}

// ─── 서명·결재 패널 (7단계, 검토의견, 이력관리) ─────────────────
function SignaturePanel({ onClose }: { onClose: () => void }) {
  const {
    signatures, addSignature, resetSignature,
    setSignatureComment, requestRevision,
    removeSignatureStep,
  } = useStore();
  const [signingRole, setSigningRole] = useState<string | null>(null);
  const [expandedRevisions, setExpandedRevisions] = useState<Set<string>>(new Set());
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [requestingRole, setRequestingRole] = useState<string | null>(null);

  const statusMeta = (status: string) => {
    if (status === "done")              return { bg: PRIMARY_LIGHT,  border: PRIMARY,   text: PRIMARY,   label: "서명완료" };
    if (status === "signing")           return { bg: "#fffbeb",      border: "#f59e0b", text: "#b45309", label: "서명중" };
    if (status === "revision_requested") return { bg: "#fff1f2",     border: "#f43f5e", text: "#be123c", label: "수정요청" };
    return                                     { bg: "#f8fafc",      border: "#e2e8f0", text: "#94a3b8", label: "대기중" };
  };

  const toggleRevisions = (role: string) => {
    setExpandedRevisions((prev) => {
      const next = new Set(prev);
      next.has(role) ? next.delete(role) : next.add(role);
      return next;
    });
  };

  const handleRequestRevision = (role: string) => {
    const comment = commentDraft[role] ?? "";
    requestRevision(role, comment);
    setRequestingRole(null);
  };

  const doneCount = signatures.filter((s) => s.status === "done").length;
  const reviewerCount = signatures.length - 2; // excluding 작성자 and 승인자

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col overflow-hidden" style={{ maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ background: PRIMARY_LIGHT, borderColor: "#b2ece9" }}>
          <div>
            <h2 className="text-sm font-bold" style={{ color: PRIMARY }}>✍ 서명 및 결재</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {signatures.length}단계 결재 · {doneCount}/{signatures.length} 완료
              {reviewerCount > 0 && ` · 검토자 ${reviewerCount}명`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
          </div>
        </div>

        {/* Steps list */}
        <div className="overflow-y-auto flex-1 p-5 space-y-0">
          {signatures.map((sig, idx) => {
            const meta = statusMeta(sig.status);
            const isFirst = idx === 0;
            const isLast = idx === signatures.length - 1;
            const isRemovable = !isFirst && !isLast && signatures.length > 2;
            const canSign = sig.status === "signing" || sig.status === "done";
            const canReview = !isFirst && !isLast && (sig.status === "signing" || sig.status === "revision_requested");
            const hasRevisions = sig.revisions.length > 0;
            const revExpanded = expandedRevisions.has(sig.role);

            return (
              <div key={sig.role}>
                {/* Connector line */}
                {idx > 0 && (
                  <div className="flex justify-center py-1">
                    <div className="w-px h-4 bg-slate-200" />
                  </div>
                )}

                {/* Step card */}
                <div className="rounded-xl border-2 overflow-hidden transition-all" style={{ borderColor: meta.border, background: meta.bg }}>
                  {/* Card header */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Step badge */}
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                      style={{ background: meta.border }}
                    >
                      {idx + 1}
                    </div>

                    {/* Role + status */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-700">{sig.role}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${meta.border}25`, color: meta.text }}>
                          {meta.label}
                        </span>
                        {isFirst && <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">작성자</span>}
                        {isLast && <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">최종 승인</span>}
                      </div>
                      {sig.name && <p className="text-xs text-slate-500 mt-0.5">{sig.name}{sig.signedAt && ` · ${new Date(sig.signedAt).toLocaleDateString("ko-KR")}`}</p>}
                    </div>

                    {/* Signature thumbnail */}
                    <div className="h-12 w-20 rounded-lg flex items-center justify-center border flex-shrink-0" style={{ borderColor: meta.border, background: "white" }}>
                      {sig.dataUrl ? (
                        <img src={sig.dataUrl} alt="서명" className="max-h-full max-w-full object-contain p-1" />
                      ) : (
                        <span className="text-xl opacity-15">✍️</span>
                      )}
                    </div>

                    {/* Remove button */}
                    {isRemovable && (
                      <button
                        onClick={() => removeSignatureStep(sig.role)}
                        className="text-slate-300 hover:text-red-400 text-sm flex-shrink-0 transition-colors"
                        title="단계 삭제"
                      >✕</button>
                    )}
                  </div>

                  {/* Review comment (검토의견) */}
                  {!isFirst && (
                    <div className="px-4 pb-3 border-t border-slate-100">
                      <label className="ptw-label mt-2 block">검토의견</label>
                      {sig.status === "signing" || sig.status === "revision_requested" ? (
                        <textarea
                          value={commentDraft[sig.role] ?? sig.comment}
                          onChange={(e) => setCommentDraft((prev) => ({ ...prev, [sig.role]: e.target.value }))}
                          rows={2}
                          placeholder="검토 의견을 입력하세요..."
                          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg resize-none outline-none focus:border-teal-400"
                        />
                      ) : sig.comment ? (
                        <p className="text-xs px-3 py-2 rounded-lg text-slate-600" style={{ background: `${meta.border}12` }}>
                          {sig.comment}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-300 italic">검토의견 없음</p>
                      )}
                    </div>
                  )}

                  {/* Revision history */}
                  {hasRevisions && (
                    <div className="px-4 pb-2 border-t border-slate-100">
                      <button
                        onClick={() => toggleRevisions(sig.role)}
                        className="flex items-center gap-1 text-xs font-semibold mt-2 mb-1 transition-colors"
                        style={{ color: "#f59e0b" }}
                      >
                        🔄 수정 이력 {sig.revisions.length}건 {revExpanded ? "▲" : "▼"}
                      </button>
                      {revExpanded && (
                        <div className="space-y-1.5 mb-2">
                          {sig.revisions.map((rev) => (
                            <div key={rev.revisionNo} className="rounded-lg px-3 py-2 text-xs" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-bold text-amber-700">v{rev.revisionNo}</span>
                                <span className="text-slate-400">{new Date(rev.savedAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                                <span className="text-amber-600 text-xs px-1.5 py-0.5 rounded-full bg-amber-100">수정 요청</span>
                              </div>
                              {rev.note && <p className="text-slate-600">{rev.note}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 px-4 pb-3">
                    {canSign && (
                      <button
                        onClick={() => setSigningRole(sig.role)}
                        className="text-xs px-3 py-1.5 rounded-lg text-white font-medium transition-all hover:opacity-90"
                        style={{ background: sig.status === "done" ? `${PRIMARY}99` : PRIMARY }}
                      >
                        {sig.status === "done" ? "재서명" : "서명하기"}
                      </button>
                    )}
                    {canReview && (
                      <>
                        {sig.status === "signing" && (
                          <button
                            onClick={() => {
                              const comment = commentDraft[sig.role] ?? sig.comment;
                              setSignatureComment(sig.role, comment);
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                            style={{ background: `${PRIMARY}15`, color: PRIMARY }}
                          >
                            의견 저장
                          </button>
                        )}
                        <button
                          onClick={() => setRequestingRole(sig.role)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                          style={{ background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3" }}
                        >
                          수정 요청 (이력 저장)
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Max steps notice */}
        {signatures.length >= 7 && (
          <div className="px-5 py-2 text-center border-t border-slate-100">
            <p className="text-xs text-slate-400">최대 7단계까지 설정 가능합니다</p>
          </div>
        )}
      </div>

      {/* Confirm revision request dialog */}
      {requestingRole && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setRequestingRole(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-700 mb-1">수정 요청 확인</h3>
            <p className="text-xs text-slate-500 mb-3">현재 입력 상태를 스냅샷으로 저장하고 수정 요청을 기록합니다.</p>
            <textarea
              value={commentDraft[requestingRole] ?? ""}
              onChange={(e) => setCommentDraft((prev) => ({ ...prev, [requestingRole]: e.target.value }))}
              placeholder="수정 요청 내용을 입력하세요..."
              rows={3}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl resize-none outline-none focus:border-rose-400 mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleRequestRevision(requestingRole)}
                className="flex-1 py-2 rounded-xl text-white text-sm font-medium"
                style={{ background: "#f43f5e" }}
              >
                수정 요청 및 저장
              </button>
              <button onClick={() => setRequestingRole(null)} className="flex-1 py-2 rounded-xl text-sm text-slate-500 bg-slate-100">
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {signingRole && <SignatureModal role={signingRole} onClose={() => setSigningRole(null)} />}
    </div>
  );
}

export default function WorkPlanEditor({ onBack }: { onBack?: () => void } = {}) {
  const router = useRouter();
  const {
    documentProfile,
    setDocumentProfile,
    formData,
    sections,
    signatures,
    attachments,
    classification,
    setClassification,
    saveCard,
    savedCards,
  } = useWorkPlanStore();
  const { createPermit, permits } = useWorkPermitStore();
  const [showPreview, setShowPreview] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [autoSaveMsg, setAutoSaveMsg] = useState(false);

  React.useEffect(() => {
    setAutoSaveMsg(true);
    const t = setTimeout(() => setAutoSaveMsg(false), 3000);
    return () => clearTimeout(t);
  }, [formData]);

  const overview = (formData["overview"] as Record<string, string>) ?? {};

  const handleTempSave = () => {
    setSaveStatus("saving");
    setTimeout(() => {
      saveCard();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 800);
  };

  const handleExport = () => {
    const { planType, planCategory: cat, selectedEquipments: sel } = useWorkPlanStore.getState();
    const content = JSON.stringify({ planType, planCategory: cat, selectedEquipments: sel, formData }, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `작업계획서_${overview.title ?? "미입력"}_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doneSignatures = signatures.filter((s) => s.status === "done").length;

  // ── 작업허가서 생성 (현재 계획서에 연동) ────────────────────────
  const handleCreateLinkedPermit = () => {
    const ov = (formData["overview"] as Record<string, string>) ?? {};
    const newId = createPermit("general", {
      workPlanId: "current",
      workPlanTitle: ov.title ?? "",
      title: ov.title ?? "",
      siteName: ov.siteName ?? "",
      location: ov.location ?? "",
      contractor: ov.contractor ?? "",
      startDate: ov.workStartDate ?? ov.startDate ?? "",
      endDate: ov.workEndDate ?? ov.endDate ?? "",
      requestedBy: ov.author ?? "",
      description: ov.description ?? "",
    });
    router.push(`/work-plan/permits?permit=${newId}`);
  };

  // 현재 계획서에 연동된 허가서 수 (저장된 카드 기준 + "current" 연동)
  const currentPlanTitle = ((formData["overview"] as Record<string, string>) ?? {}).title ?? "";
  const linkedPermitCount = permits.filter(
    (p) => p.workPlanId === "current" || savedCards.some((c) => c.id === p.workPlanId && (c.title === currentPlanTitle || c.formData?.["overview"]?.toString().includes(currentPlanTitle)))
  ).length;

  return (
    <div className="flex flex-col h-full" style={{ background: "#f4f6f8" }}>
      {/* Top bar */}
      <div
        className="flex flex-col gap-0 px-4 py-3 border-b flex-shrink-0"
        style={{ background: "white", borderColor: "#e8edf2", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* 뒤로가기 */}
          {onBack && (
            <>
              <button
                onClick={onBack}
                className="text-xs px-2 py-1 rounded-lg border font-medium transition-all hover:opacity-80 flex-shrink-0"
                style={{ borderColor: "#e2e8f0", color: "#64748b" }}
                title="작업 종류 선택으로 돌아가기"
              >
                ← 뒤로
              </button>
              <div className="w-px h-4 bg-slate-200 flex-shrink-0" />
            </>
          )}
          {/* 타이틀 */}
          <span className="text-sm font-bold flex-shrink-0" style={{ color: PRIMARY }}>작업계획서 작성</span>
          <div className="w-px h-4 bg-slate-200 flex-shrink-0" />

          {/* 법령 물음표 - 프로필 선택 왼쪽 */}
          <LegalInfoButton />

          {/* Document profile selector */}
          <div className="flex items-center gap-0.5 rounded-lg border p-0.5" style={{ borderColor: "#e2e8f0", background: "#f8fafc" }}>
            {(["full", "lite", "custom"] as DocumentProfile[]).map((p) => (
              <button
                key={p}
                onClick={() => setDocumentProfile(p)}
                className="text-xs px-2.5 py-1 rounded-md font-medium transition-all"
                style={{
                  background: documentProfile === p ? PRIMARY : "transparent",
                  color: documentProfile === p ? "white" : "#94a3b8",
                  boxShadow: documentProfile === p ? "0 1px 3px rgba(0,183,175,0.3)" : "none",
                }}
              >
                {p === "full" ? "정식" : p === "lite" ? "약식" : "사용자정의"}
              </button>
            ))}
          </div>

          {/* Favorites button */}
          <button
            onClick={() => setShowFavorites(true)}
            className="text-xs px-2.5 py-1 rounded-lg border font-medium transition-all hover:opacity-80"
            style={{
              borderColor: documentProfile === "custom" ? `${PRIMARY}55` : "#e2e8f0",
              color: documentProfile === "custom" ? PRIMARY : "#94a3b8",
              background: documentProfile === "custom" ? PRIMARY_LIGHT : "transparent",
            }}
            title="즐겨찾기 섹션 구성 저장/불러오기"
          >
            ⭐ 즐겨찾기
          </button>

          {/* Title preview */}
          {overview.title && (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs text-slate-300">|</span>
              <span className="text-xs font-medium text-slate-600 max-w-48 truncate">
                {overview.title}
              </span>
            </div>
          )}

          <div className="flex-1" />

          {/* Signature button */}
          <button
            onClick={() => setShowSignature(true)}
            className="text-xs px-2.5 py-1 rounded-lg border font-medium transition-all hover:opacity-80"
            style={{
              borderColor: doneSignatures === signatures.length ? `${PRIMARY}55` : "#e2e8f0",
              color: doneSignatures === signatures.length ? PRIMARY : "#94a3b8",
              background: doneSignatures === signatures.length ? PRIMARY_LIGHT : "transparent",
            }}
          >
            ✍ 서명·결재
            <SignatureStatusBadge />
          </button>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleTempSave}
              className="text-xs px-2.5 py-1 rounded-lg border font-medium transition-all hover:opacity-80"
              style={{
                borderColor: saveStatus === "saved" ? `${PRIMARY}55` : "#e2e8f0",
                color: saveStatus === "saved" ? PRIMARY : "#94a3b8",
                background: saveStatus === "saved" ? PRIMARY_LIGHT : "transparent",
              }}
            >
              {saveStatus === "saving" ? "⏳ 저장중..." : saveStatus === "saved" ? "✓ 저장됨" : "💾 임시저장"}
            </button>
            <PdfExport
              state={{ documentProfile, planCategory: useWorkPlanStore.getState().planCategory, sections, formData, signatures, attachments }}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <div
          className="flex-shrink-0 border-r flex flex-col overflow-hidden"
          style={{ width: 240, background: "white", borderColor: "#e2e8f0" }}
        >
          <SectionPanel />
        </div>
        <div className="flex-1 overflow-y-auto">
          <SectionForm />
        </div>
      </div>

      {/* Bottom action bar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-t flex-shrink-0"
        style={{ background: "white", borderColor: "#e8edf2", boxShadow: "0 -1px 3px rgba(0,0,0,0.03)" }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-4">
          <BottomClassificationSummary classification={classification} documentProfile={documentProfile} />
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Link
            href="/work-plan/equipment"
            className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-all text-slate-500 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50"
            style={{ borderColor: "#e2e8f0" }}
          >
            🚜 장비 관리대장
          </Link>
          <Link
            href="/work-plan/permits"
            className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-all text-slate-500 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50"
            style={{ borderColor: "#e2e8f0" }}
          >
            🔑 작업허가서{linkedPermitCount > 0 && <span className="ml-1 px-1 py-0 rounded-full text-white font-bold" style={{ background: PRIMARY, fontSize: 9 }}>{linkedPermitCount}</span>}
          </Link>
          <button
            onClick={handleCreateLinkedPermit}
            className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-all"
            style={{ borderColor: PRIMARY, color: PRIMARY, background: PRIMARY_LIGHT }}
            title="현재 계획서에 연동된 작업허가서 생성"
          >
            🔑 허가서 생성
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-all text-slate-500 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50"
            style={{ borderColor: "#e2e8f0" }}
          >
            👁 미리보기
          </button>
          <button
            onClick={() => window.print()}
            className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-all text-slate-500 hover:bg-slate-50"
            style={{ borderColor: "#e2e8f0" }}
          >
            🖨 인쇄
          </button>
          <button
            onClick={handleExport}
            className="text-xs px-3 py-1.5 rounded-lg text-white font-medium transition-all active:scale-95"
            style={{ background: PRIMARY, boxShadow: "0 1px 4px rgba(0,183,175,0.3)" }}
            onMouseOver={(e) => (e.currentTarget.style.background = PRIMARY_DARK)}
            onMouseOut={(e) => (e.currentTarget.style.background = PRIMARY)}
          >
            📤 내보내기
          </button>
        </div>
      </div>

      {/* Modals */}
      {showPreview && <PreviewPanel onClose={() => setShowPreview(false)} />}
      {showFavorites && <FavoritesModal onClose={() => setShowFavorites(false)} />}
      {showSignature && <SignaturePanel onClose={() => setShowSignature(false)} />}
    </div>
  );
}
