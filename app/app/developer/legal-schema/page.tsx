"use client";
import React, { useState } from "react";
import { LEGAL_CARD_TYPES, type LegalCardTypeDef, type FormField } from "@/config/safetyCard/legalCardTypeDefs";

const PRIMARY = "#00B7AF";
const PRIMARY_LIGHT = "#E6FAF9";

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "중장비": { bg: "#fef3c7", text: "#92400e" },
  "차량계": { bg: "#dbeafe", text: "#1e40af" },
  "화학":   { bg: "#fce7f3", text: "#9d174d" },
  "전기":   { bg: "#fef9c3", text: "#a16207" },
  "토공":   { bg: "#d1fae5", text: "#065f46" },
  "구조물": { bg: "#ede9fe", text: "#5b21b6" },
  "해체":   { bg: "#fee2e2", text: "#991b1b" },
  "중량물": { bg: "#ffedd5", text: "#c2410c" },
  "궤도":   { bg: "#e0f2fe", text: "#0c4a6e" },
};

function FieldTable({ fields }: { fields: FormField[] }) {
  if (fields.length === 0) {
    return <p className="text-xs text-slate-400 px-4 py-3 italic">해당 없음</p>;
  }
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="bg-slate-50">
          <th className="px-3 py-2 text-left text-slate-500 font-semibold w-8">호</th>
          <th className="px-3 py-2 text-left text-slate-500 font-semibold">항목명</th>
          <th className="px-3 py-2 text-left text-slate-500 font-semibold w-28">입력타입</th>
          <th className="px-3 py-2 text-center text-slate-500 font-semibold w-10">필수</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {fields.map((f) => (
          <tr key={f.id} className="hover:bg-slate-50/60">
            <td className="px-3 py-2.5 text-slate-400 font-mono text-[10px]">{f.no}</td>
            <td className="px-3 py-2.5">
              <div className="font-medium text-slate-700">{f.label}</div>
              {f.hint && (
                <div className="text-amber-600 text-[10px] mt-0.5 flex items-start gap-1">
                  <span className="flex-shrink-0">※</span>
                  <span>{f.hint}</span>
                </div>
              )}
              {f.placeholder && (
                <div className="text-slate-400 text-[10px] mt-0.5 line-clamp-1 max-w-sm">
                  예) {f.placeholder.substring(0, 80)}{f.placeholder.length > 80 ? "…" : ""}
                </div>
              )}
              {f.items && f.items.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {f.items.map((item, i) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">{item}</span>
                  ))}
                </div>
              )}
            </td>
            <td className="px-3 py-2.5">
              <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-medium ${
                f.type === "textarea"      ? "bg-emerald-50 text-emerald-700" :
                f.type === "checkboxItems" ? "bg-blue-50 text-blue-700" :
                f.type === "select"        ? "bg-purple-50 text-purple-700" :
                "bg-slate-100 text-slate-600"
              }`}>{f.type}</span>
            </td>
            <td className="px-3 py-2.5 text-center">
              {f.required
                ? <span className="w-4 h-4 rounded-full inline-flex items-center justify-center text-white text-[8px] font-bold" style={{ background: "#ef4444" }}>필</span>
                : <span className="text-slate-200">—</span>
              }
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatTypeAsText(t: LegalCardTypeDef): string {
  const lines: string[] = [
    "═".repeat(60),
    `${t.no}. ${t.label}`,
    "─".repeat(60),
    `ID: ${t.id}`,
    `카테고리: ${t.category}`,
    `법적 근거: ${t.legalBasis}`,
    `설명: ${t.description}`,
    "",
  ];
  if (t.preSurveyNote) {
    lines.push("[사전조사 목적]");
    lines.push(`  ${t.preSurveyNote}`);
    lines.push("");
  }
  if (t.preSurveyFields.length > 0) {
    lines.push(`[사전조사 항목] — ${t.preSurveyFields.length}개`);
    for (const f of t.preSurveyFields) {
      lines.push(`  ${f.no}. [${f.type}] ${f.label}${f.required ? "  *필수" : ""}`);
      if (f.placeholder) lines.push(`       예) ${f.placeholder.substring(0, 60)}`);
    }
  } else {
    lines.push("[사전조사 항목] 해당 없음");
  }
  lines.push("");
  lines.push(`[작업계획 항목] — ${t.planFields.length}개`);
  for (const f of t.planFields) {
    lines.push(`  ${f.no}. [${f.type}] ${f.label}${f.required ? "  *필수" : ""}`);
    if (f.placeholder) lines.push(`       예) ${f.placeholder.substring(0, 60)}`);
    if (f.hint) lines.push(`       ※ ${f.hint}`);
  }
  return lines.join("\n");
}

function formatTypeAsJSON(t: LegalCardTypeDef): string {
  return JSON.stringify(
    {
      id: t.id,
      no: t.no,
      label: t.label,
      shortLabel: t.shortLabel,
      category: t.category,
      legalBasis: t.legalBasis,
      preSurveyNote: t.preSurveyNote ?? null,
      preSurveyFields: t.preSurveyFields.map((f) => ({
        id: f.id, no: f.no, label: f.label, type: f.type,
        required: f.required ?? false,
        placeholder: f.placeholder ?? null,
        hint: f.hint ?? null,
        items: f.items ?? null,
      })),
      planFields: t.planFields.map((f) => ({
        id: f.id, no: f.no, label: f.label, type: f.type,
        required: f.required ?? false,
        placeholder: f.placeholder ?? null,
        hint: f.hint ?? null,
        items: f.items ?? null,
      })),
    },
    null,
    2
  );
}

export default function LegalSchemaPage() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const expandAll  = () => setExpanded(new Set(LEGAL_CARD_TYPES.map((t) => t.id)));
  const collapseAll = () => setExpanded(new Set());

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAll = () => {
    const text = LEGAL_CARD_TYPES.map(formatTypeAsText).join("\n\n");
    copyText(text, "all");
  };

  const copyAllJSON = () => {
    const all = LEGAL_CARD_TYPES.map((t) => JSON.parse(formatTypeAsJSON(t)));
    copyText(JSON.stringify(all, null, 2), "all-json");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "#f8fafc" }}>
      {/* Header */}
      <div className="px-5 py-3 border-b bg-white border-slate-200 flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-sm font-bold text-slate-800">🗂 법정 작업계획서 스키마</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              산업안전보건기준에 관한 규칙 제38조 — {LEGAL_CARD_TYPES.length}종 · 데이터 수집항목 아키텍쳐
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={expandAll}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
              전체 펼치기
            </button>
            <button onClick={collapseAll}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
              전체 접기
            </button>
            <button onClick={copyAll}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium text-white transition-colors"
              style={{ background: copied === "all" ? "#10b981" : PRIMARY }}>
              {copied === "all" ? "✓ 복사됨" : "📋 전체 텍스트 복사"}
            </button>
            <button onClick={copyAllJSON}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium text-white transition-colors"
              style={{ background: copied === "all-json" ? "#10b981" : "#6366f1" }}>
              {copied === "all-json" ? "✓ 복사됨" : "{ } 전체 JSON 복사"}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-4xl space-y-4">

          {/* Summary overview table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b bg-slate-50">
              <p className="text-sm font-bold text-slate-700">법정 작업계획서 목록 ({LEGAL_CARD_TYPES.length}종)</p>
              <p className="text-xs text-slate-400 mt-0.5">config/safetyCard/legalCardTypeDefs.ts — LEGAL_CARD_TYPES</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: PRIMARY_LIGHT }}>
                    {["No", "유형명", "카테고리", "법적 근거 (조항)", "사전조사", "계획항목"].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: PRIMARY }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {LEGAL_CARD_TYPES.map((t) => {
                    const cc = CATEGORY_COLORS[t.category] ?? { bg: "#f8fafc", text: "#64748b" };
                    return (
                      <tr key={t.id}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => toggle(t.id)}>
                        <td className="px-3 py-2.5 text-slate-400 font-mono text-[10px]">{t.no}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-sm mr-1.5">{t.icon}</span>
                          <span className="font-medium text-slate-700">{t.shortLabel}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                            style={{ background: cc.bg, color: cc.text }}>{t.category}</span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-400 text-[10px] max-w-[200px] truncate">
                          {t.legalBasis.replace("산업안전보건기준에 관한 규칙 ", "")}
                        </td>
                        <td className="px-3 py-2.5">
                          {t.preSurveyFields.length > 0
                            ? <span className="font-semibold text-amber-600">{t.preSurveyFields.length}항목</span>
                            : <span className="text-slate-300">없음</span>}
                        </td>
                        <td className="px-3 py-2.5 font-bold" style={{ color: PRIMARY }}>{t.planFields.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-type detail cards */}
          {LEGAL_CARD_TYPES.map((t) => {
            const isOpen = expanded.has(t.id);
            const cc = CATEGORY_COLORS[t.category] ?? { bg: "#f8fafc", text: "#64748b" };
            return (
              <div key={t.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                {/* Card header */}
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  style={{ borderBottom: isOpen ? "1px solid #e2e8f0" : "none" }}
                  onClick={() => toggle(t.id)}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-xl mt-0.5 leading-none">{t.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-slate-400">{t.no}.</span>
                        <span className="text-sm font-bold text-slate-800">{t.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                          style={{ background: cc.bg, color: cc.text }}>{t.category}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{t.legalBasis}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
                    <div className="text-[10px] text-slate-400 text-right leading-relaxed">
                      {t.preSurveyFields.length > 0 && (
                        <div className="text-amber-600">사전조사 {t.preSurveyFields.length}항목</div>
                      )}
                      <div>계획 {t.planFields.length}항목</div>
                    </div>
                    <button onClick={() => copyText(formatTypeAsText(t), `text-${t.id}`)}
                      className="text-[10px] px-2 py-1 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors w-16 text-center">
                      {copied === `text-${t.id}` ? "✓" : "📋"} 텍스트
                    </button>
                    <button onClick={() => copyText(formatTypeAsJSON(t), `json-${t.id}`)}
                      className="text-[10px] px-2 py-1 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors w-14 text-center">
                      {copied === `json-${t.id}` ? "✓" : "{ }"} JSON
                    </button>
                    <span className="text-slate-300 text-sm ml-1 select-none">{isOpen ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div className="divide-y divide-slate-100">
                    {/* Meta */}
                    <div className="px-4 py-3 bg-slate-50/50 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">ID </span>
                        <code className="font-mono text-teal-600">{t.id}</code>
                      </div>
                      <div>
                        <span className="text-slate-400">shortLabel </span>
                        <span className="text-slate-600">{t.shortLabel}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400">설명 </span>
                        <span className="text-slate-600">{t.description}</span>
                      </div>
                      {t.allowedEquipKeys && (
                        <div className="col-span-2">
                          <span className="text-slate-400">허용 장비 </span>
                          <span className="text-slate-600">{t.allowedEquipKeys.join(", ")}</span>
                        </div>
                      )}
                    </div>

                    {/* Pre-survey fields */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-xs font-bold text-slate-700">사전조사 항목</p>
                        {t.preSurveyFields.length > 0
                          ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">{t.preSurveyFields.length}개</span>
                          : <span className="text-[10px] text-slate-400">해당 없음</span>
                        }
                      </div>
                      {t.preSurveyNote && (
                        <div className="mb-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-700 leading-relaxed">
                          {t.preSurveyNote}
                        </div>
                      )}
                      <div className="rounded-lg border border-slate-100 overflow-hidden">
                        <FieldTable fields={t.preSurveyFields} />
                      </div>
                    </div>

                    {/* Plan fields */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-xs font-bold text-slate-700">작업계획 항목</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                          style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>{t.planFields.length}개</span>
                      </div>
                      <div className="rounded-lg border border-slate-100 overflow-hidden">
                        <FieldTable fields={t.planFields} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
