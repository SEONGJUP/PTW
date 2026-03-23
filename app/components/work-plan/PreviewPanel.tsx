"use client";
import React from "react";
import { useWorkPlanStore } from "@/store/workPlanStore";

const PRIMARY = "#00B7AF";
const PRIMARY_LIGHT = "#E6FAF9";

interface PreviewPanelProps {
  onClose: () => void;
}

export default function PreviewPanel({ onClose }: PreviewPanelProps) {
  const { planType, sections, formData, signatures, attachments } = useWorkPlanStore();
  const activeSections = sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

  const overview = (formData["overview"] as Record<string, string>) ?? {};
  const schedule = (formData["schedule"] as { startDate?: string; endDate?: string; milestones?: Array<{ id: string; task: string; start: string; end: string; responsible: string }> }) ?? {};
  const scope = (formData["scope"] as { description?: string; deliverables?: string[] }) ?? {};
  const personnel = (formData["personnel"] as { rows?: Array<{ id: string; name: string; position: string; role: string; contact: string }> }) ?? {};
  const budget = (formData["budget"] as { rows?: Array<{ id: string; item: string; unit: string; qty: string; unitPrice: string; note: string }> }) ?? {};
  const risk = (formData["risk"] as { rows?: Array<{ id: string; risk: string; severity: string; mitigation: string }> }) ?? {};

  const today = new Date().toLocaleDateString("ko-KR");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-semibold text-slate-800">미리보기</h3>
            <p className="text-xs text-slate-400 mt-0.5">작업계획서 최종 확인</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="text-sm px-4 py-2 rounded-xl text-white font-medium"
              style={{ background: PRIMARY }}
            >
              인쇄
            </button>
            <button
              onClick={onClose}
              className="text-sm px-4 py-2 rounded-xl bg-slate-100 text-slate-600"
            >
              닫기
            </button>
          </div>
        </div>

        {/* Preview content */}
        <div className="flex-1 overflow-y-auto p-6" id="print-area">
          {/* Document header */}
          <div className="text-center mb-8 pb-6 border-b-2" style={{ borderColor: PRIMARY }}>
            <div
              className="inline-block px-4 py-1 rounded-full text-sm font-semibold mb-3"
              style={{ background: PRIMARY_LIGHT, color: PRIMARY }}
            >
              {planType}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {overview.title ?? "작업계획서"}
            </h1>
            <p className="text-slate-400 text-sm">작성일: {today}</p>
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {activeSections.map((section) => {
              if (section.id === "overview") {
                return (
                  <PreviewSection key="overview" title="프로젝트 개요">
                    <PreviewTable rows={[
                      ["작업명", overview.title ?? "-"],
                      ["작업 목적", overview.purpose ?? "-"],
                      ["작업 배경", overview.background ?? "-"],
                      ["작업 위치", overview.location ?? "-"],
                    ]} />
                  </PreviewSection>
                );
              }
              if (section.id === "schedule") {
                return (
                  <PreviewSection key="schedule" title="추진 일정">
                    <PreviewTable rows={[
                      ["시작일", schedule.startDate ?? "-"],
                      ["종료일", schedule.endDate ?? "-"],
                    ]} />
                    {(schedule.milestones ?? []).length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-slate-500 mb-2">마일스톤</p>
                        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                          <thead>
                            <tr style={{ background: PRIMARY_LIGHT }}>
                              {["작업명", "시작", "종료", "담당"].map((h) => <th key={h} className="px-3 py-2 text-xs font-semibold text-slate-600 text-left">{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {(schedule.milestones ?? []).map((m) => (
                              <tr key={m.id} className="border-t border-slate-100">
                                <td className="px-3 py-1.5 text-xs text-slate-700">{m.task || "-"}</td>
                                <td className="px-3 py-1.5 text-xs text-slate-500">{m.start || "-"}</td>
                                <td className="px-3 py-1.5 text-xs text-slate-500">{m.end || "-"}</td>
                                <td className="px-3 py-1.5 text-xs text-slate-700">{m.responsible || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </PreviewSection>
                );
              }
              if (section.id === "scope") {
                return (
                  <PreviewSection key="scope" title="업무 범위 및 산출물">
                    <PreviewTable rows={[["작업 범위", scope.description ?? "-"]]} />
                    {(scope.deliverables ?? []).length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-slate-500 mb-1">산출물</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          {(scope.deliverables ?? []).map((d, i) => (
                            <li key={i} className="text-sm text-slate-700">{d}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </PreviewSection>
                );
              }
              if (section.id === "personnel") {
                return (
                  <PreviewSection key="personnel" title="투입 인력 및 역할">
                    <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr style={{ background: PRIMARY_LIGHT }}>
                          {["이름", "직책", "역할", "연락처"].map((h) => <th key={h} className="px-3 py-2 text-xs font-semibold text-slate-600 text-left">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {(personnel.rows ?? []).map((r) => (
                          <tr key={r.id} className="border-t border-slate-100">
                            <td className="px-3 py-1.5 text-xs text-slate-700">{r.name || "-"}</td>
                            <td className="px-3 py-1.5 text-xs text-slate-500">{r.position || "-"}</td>
                            <td className="px-3 py-1.5 text-xs text-slate-700">{r.role || "-"}</td>
                            <td className="px-3 py-1.5 text-xs text-slate-500">{r.contact || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </PreviewSection>
                );
              }
              if (section.id === "budget") {
                const total = (budget.rows ?? []).reduce((sum, r) => sum + (Number(r.qty) * Number(r.unitPrice) || 0), 0);
                return (
                  <PreviewSection key="budget" title="예산 계획">
                    <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr style={{ background: PRIMARY_LIGHT }}>
                          {["항목", "단위", "수량", "단가", "금액", "비고"].map((h) => <th key={h} className="px-3 py-2 text-xs font-semibold text-slate-600 text-left">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {(budget.rows ?? []).map((r) => (
                          <tr key={r.id} className="border-t border-slate-100">
                            <td className="px-3 py-1.5 text-xs text-slate-700">{r.item || "-"}</td>
                            <td className="px-3 py-1.5 text-xs text-slate-500">{r.unit || "-"}</td>
                            <td className="px-3 py-1.5 text-xs text-slate-500">{r.qty || "0"}</td>
                            <td className="px-3 py-1.5 text-xs text-slate-500">{Number(r.unitPrice || 0).toLocaleString()}</td>
                            <td className="px-3 py-1.5 text-xs font-medium" style={{ color: PRIMARY }}>{(Number(r.qty) * Number(r.unitPrice) || 0).toLocaleString()}</td>
                            <td className="px-3 py-1.5 text-xs text-slate-400">{r.note}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-200" style={{ background: PRIMARY_LIGHT }}>
                          <td colSpan={4} className="px-3 py-2 text-xs font-bold text-right text-slate-600">합계</td>
                          <td className="px-3 py-2 text-xs font-bold" style={{ color: PRIMARY }}>{total.toLocaleString()} 원</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </PreviewSection>
                );
              }
              if (section.id === "risk") {
                return (
                  <PreviewSection key="risk" title="위험 요소 및 대응방안">
                    <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr style={{ background: PRIMARY_LIGHT }}>
                          {["위험 요소", "심각도", "대응방안"].map((h) => <th key={h} className="px-3 py-2 text-xs font-semibold text-slate-600 text-left">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {(risk.rows ?? []).map((r) => (
                          <tr key={r.id} className="border-t border-slate-100">
                            <td className="px-3 py-1.5 text-xs text-slate-700">{r.risk || "-"}</td>
                            <td className="px-3 py-1.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.severity === "상" ? "bg-red-100 text-red-600" : r.severity === "중" ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"}`}>
                                {r.severity || "중"}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-xs text-slate-700">{r.mitigation || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </PreviewSection>
                );
              }
              if (section.id === "signature") {
                return (
                  <PreviewSection key="signature" title="서명 및 결재">
                    <div className="grid grid-cols-3 gap-4">
                      {signatures.map((sig) => (
                        <div key={sig.role} className="border border-slate-200 rounded-xl p-4 text-center">
                          <p className="text-xs font-semibold text-slate-500 mb-2">{sig.role}</p>
                          <div className="h-16 border border-slate-100 rounded-lg mb-2 flex items-center justify-center bg-slate-50">
                            {sig.dataUrl ? (
                              <img src={sig.dataUrl} alt="" className="max-h-full max-w-full object-contain" />
                            ) : (
                              <span className="text-slate-300 text-sm">미서명</span>
                            )}
                          </div>
                          {sig.name && <p className="text-xs text-slate-700 font-medium">{sig.name}</p>}
                          {sig.signedAt && <p className="text-xs text-slate-400">{new Date(sig.signedAt).toLocaleDateString("ko-KR")}</p>}
                        </div>
                      ))}
                    </div>
                  </PreviewSection>
                );
              }
              // Custom section
              const customData = (formData[section.id] as { content?: string }) ?? {};
              return (
                <PreviewSection key={section.id} title={section.label}>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{customData.content ?? "-"}</p>
                </PreviewSection>
              );
            })}

            {/* Attachments */}
            {attachments.length > 0 && (
              <PreviewSection title="도면 및 첨부파일">
                <div className="grid grid-cols-2 gap-3">
                  {attachments.map((att) => (
                    <div key={att.id} className="border border-slate-200 rounded-xl overflow-hidden">
                      {att.type.startsWith("image/") ? (
                        <img src={att.markup ?? att.dataUrl} alt={att.name} className="w-full h-32 object-cover" />
                      ) : (
                        <div className="h-32 bg-slate-50 flex items-center justify-center text-4xl">📄</div>
                      )}
                      <div className="px-3 py-2">
                        <p className="text-xs text-slate-600 font-medium truncate">{att.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </PreviewSection>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 rounded-full" style={{ background: PRIMARY }} />
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function PreviewTable({ rows }: { rows: [string, string][] }) {
  return (
    <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-t border-slate-100 first:border-0">
            <td className="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 w-28">{label}</td>
            <td className="px-3 py-2 text-xs text-slate-700 whitespace-pre-wrap">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
