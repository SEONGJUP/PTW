"use client";
import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { useWorkPlanStore } from "@/store/workPlanStore";

const PRIMARY = "#00B7AF";
const PRIMARY_LIGHT = "#E6FAF9";

interface SignatureModalProps {
  role: string;
  onClose: () => void;
}

export default function SignatureModal({ role, onClose }: SignatureModalProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [name, setName] = React.useState("");
  const { addSignature } = useWorkPlanStore();

  const handleClear = () => {
    sigRef.current?.clear();
  };

  const handleSave = () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      alert("서명을 입력해주세요.");
      return;
    }
    if (!name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
    addSignature(role, name.trim(), dataUrl);
    onClose();
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
          <div>
            <h3 className="font-semibold text-slate-800">{role} 서명</h3>
            <p className="text-xs text-slate-400 mt-0.5">아래 영역에 서명하세요</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Name input */}
        <div className="px-6 pt-4">
          <label className="text-xs font-medium text-slate-500 block mb-1">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="성명 입력"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-400"
          />
        </div>

        {/* Signature canvas */}
        <div className="px-6 pt-4">
          <label className="text-xs font-medium text-slate-500 block mb-1">서명</label>
          <div
            className="border-2 rounded-xl overflow-hidden"
            style={{ borderColor: "#b2ece9", background: PRIMARY_LIGHT }}
          >
            <SignatureCanvas
              ref={sigRef}
              penColor="#1e293b"
              canvasProps={{
                width: 400,
                height: 160,
                style: { display: "block", width: "100%", background: PRIMARY_LIGHT },
              }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">마우스 또는 터치로 서명하세요</p>
        </div>

        {/* Actions */}
        <div className="px-6 py-5 flex gap-2">
          <button
            onClick={handleClear}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            다시 쓰기
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
            style={{ background: PRIMARY }}
          >
            서명 완료
          </button>
        </div>
      </div>
    </div>
  );
}
