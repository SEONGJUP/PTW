"use client";
import React, { useState } from "react";
import { useWorkPlanStore } from "@/store/workPlanStore";

const PRIMARY = "#00B7AF";
const PRIMARY_LIGHT = "#E6FAF9";

interface TemplateManagerProps {
  onClose: () => void;
}

export default function TemplateManager({ onClose }: TemplateManagerProps) {
  const { templates, saveTemplate, loadTemplate, deleteTemplate } = useWorkPlanStore();
  const [saveName, setSaveName] = useState("");
  const [tab, setTab] = useState<"load" | "save">("load");

  const handleSave = () => {
    if (!saveName.trim()) return;
    saveTemplate(saveName.trim());
    setSaveName("");
    setTab("load");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">템플릿 관리</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {([["load", "불러오기"], ["save", "저장하기"]] as [string, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id as "load" | "save")}
              className="flex-1 py-3 text-sm font-medium transition-colors"
              style={{
                color: tab === id ? PRIMARY : "#94a3b8",
                borderBottom: tab === id ? `2px solid ${PRIMARY}` : "2px solid transparent",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === "load" ? (
            <div className="space-y-2">
              {templates.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  저장된 템플릿이 없습니다
                </div>
              ) : (
                templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 bg-slate-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{tpl.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {tpl.planType} · {new Date(tpl.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                    <button
                      onClick={() => { loadTemplate(tpl.id); onClose(); }}
                      className="text-xs px-3 py-1.5 rounded-lg text-white font-medium"
                      style={{ background: PRIMARY }}
                    >
                      불러오기
                    </button>
                    <button
                      onClick={() => deleteTemplate(tpl.id)}
                      className="text-xs px-2.5 py-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">템플릿 이름</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="예: 정기 유지보수 계획서"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-400"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                />
              </div>
              <p className="text-xs text-slate-400">
                현재 입력된 내용과 섹션 구성이 저장됩니다.
              </p>
              <button
                onClick={handleSave}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: saveName.trim() ? PRIMARY : "#cbd5e1" }}
                disabled={!saveName.trim()}
              >
                현재 양식 저장
              </button>
            </div>
          )}
        </div>

        {/* Preview of what will be saved */}
        {tab === "save" && (
          <div className="px-6 pb-6">
            <div
              className="rounded-xl p-3"
              style={{ background: PRIMARY_LIGHT }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: PRIMARY }}>저장될 항목 미리보기</p>
              <ul className="text-xs text-slate-500 space-y-0.5 list-disc list-inside">
                <li>섹션 구성 및 순서</li>
                <li>입력된 폼 데이터</li>
                <li>작업계획서 종류 설정</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
