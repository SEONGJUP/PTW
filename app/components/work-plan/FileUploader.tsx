"use client";
import React, { useRef } from "react";
import { useWorkPlanStore, Attachment } from "@/store/workPlanStore";
import DrawingCanvas from "./DrawingCanvas";

const PRIMARY = "#00B7AF";
const PRIMARY_LIGHT = "#E6FAF9";

export default function FileUploader() {
  const { attachments, addAttachment, removeAttachment, updateAttachmentMarkup } = useWorkPlanStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [zoomId, setZoomId] = React.useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const attachment: Attachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: file.name,
          type: file.type,
          dataUrl,
        };
        addAttachment(attachment);
      };
      reader.readAsDataURL(file);
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  const editingAttachment = editingId ? attachments.find((a) => a.id === editingId) : null;
  const imageAttachments = attachments.filter((a) => a.type.startsWith("image/"));
  const fileAttachments = attachments.filter((a) => !a.type.startsWith("image/"));

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors hover:border-teal-400"
        style={{ borderColor: "#b2ece9", background: PRIMARY_LIGHT }}
        onClick={() => inputRef.current?.click()}
      >
        <div className="text-3xl mb-2">📎</div>
        <p className="text-sm text-slate-500">파일을 클릭하여 업로드하세요</p>
        <p className="text-xs text-slate-400 mt-1">이미지, PDF, 문서 파일 지원</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Image 2×2 grid */}
      {imageAttachments.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">이미지 첨부 ({imageAttachments.length})</p>
          <div className="grid grid-cols-2 gap-3">
            {imageAttachments.map((att) => (
              <div
                key={att.id}
                className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                style={{ aspectRatio: "4/3" }}
              >
                {/* Image */}
                <img
                  src={att.markup ?? att.dataUrl}
                  alt={att.name}
                  className="w-full h-full object-cover cursor-zoom-in"
                  onClick={() => setZoomId(att.id)}
                />

                {/* Markup badge */}
                {att.markup && (
                  <div className="absolute top-2 left-2">
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium text-white" style={{ background: PRIMARY }}>
                      마크업
                    </span>
                  </div>
                )}

                {/* Hover overlay with actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end justify-between p-2 opacity-0 group-hover:opacity-100">
                  <span className="text-xs text-white font-medium truncate max-w-[70%] bg-black/40 px-1.5 py-0.5 rounded">
                    {att.name}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingId(att.id)}
                      className="text-xs px-2 py-1 rounded-lg font-medium text-white shadow"
                      style={{ background: PRIMARY }}
                      title="이미지 수정"
                    >
                      ✏
                    </button>
                    <button
                      onClick={() => removeAttachment(att.id)}
                      className="text-xs px-2 py-1 rounded-lg font-medium text-white bg-red-500 shadow"
                      title="삭제"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-image file list */}
      {fileAttachments.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">파일 첨부 ({fileAttachments.length})</p>
          <div className="space-y-2">
            {fileAttachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-slate-100 shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-lg">📄</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{att.name}</p>
                </div>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="text-xs px-2.5 py-1 rounded-lg text-slate-400 bg-slate-50 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zoom lightbox */}
      {zoomId && (() => {
        const att = attachments.find((a) => a.id === zoomId);
        if (!att) return null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.85)" }}
            onClick={() => setZoomId(null)}
          >
            <div
              className="relative max-w-5xl w-full mx-4 rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={att.markup ?? att.dataUrl}
                alt={att.name}
                className="w-full object-contain"
                style={{ maxHeight: "85vh" }}
              />
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={() => { setZoomId(null); setEditingId(att.id); }}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium text-white shadow"
                  style={{ background: PRIMARY }}
                >
                  ✏ 이미지 수정
                </button>
                <button
                  onClick={() => setZoomId(null)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium text-white bg-slate-700 shadow"
                >
                  닫기
                </button>
              </div>
              <div className="absolute bottom-3 left-3">
                <span className="text-xs text-white bg-black/50 px-2 py-1 rounded-lg">{att.name}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Drawing canvas modal */}
      {editingAttachment && (
        <DrawingCanvas
          backgroundImage={editingAttachment.dataUrl}
          initialMarkup={editingAttachment.markup}
          onSave={(dataUrl) => {
            updateAttachmentMarkup(editingAttachment.id, dataUrl);
            setEditingId(null);
          }}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
