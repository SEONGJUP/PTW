"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";

const PRIMARY = "#00B7AF";

type Tool = "pen" | "arrow" | "rect" | "circle" | "text";

interface DrawingCanvasProps {
  backgroundImage?: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
  initialMarkup?: string;
}

interface DrawPoint {
  x: number;
  y: number;
}

interface DrawAction {
  tool: Tool;
  color: string;
  lineWidth: number;
  points: DrawPoint[];
  text?: string;
}

export default function DrawingCanvas({ backgroundImage, onSave, onClose, initialMarkup }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#ef4444");
  const [lineWidth, setLineWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<DrawPoint[]>([]);
  const [actions, setActions] = useState<DrawAction[]>([]);
  const [pendingText, setPendingText] = useState<{ x: number; y: number } | null>(null);
  const [textInput, setTextInput] = useState("");
  const startPointRef = useRef<DrawPoint | null>(null);

  const drawAll = useCallback((ctx: CanvasRenderingContext2D, acts: DrawAction[]) => {
    acts.forEach((action) => {
      ctx.strokeStyle = action.color;
      ctx.fillStyle = action.color;
      ctx.lineWidth = action.lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (action.tool === "pen" && action.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(action.points[0].x, action.points[0].y);
        action.points.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      } else if (action.tool === "arrow" && action.points.length >= 2) {
        const from = action.points[0];
        const to = action.points[action.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        // arrowhead
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const headLen = 14;
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 7), to.y - headLen * Math.sin(angle - Math.PI / 7));
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 7), to.y - headLen * Math.sin(angle + Math.PI / 7));
        ctx.stroke();
      } else if (action.tool === "rect" && action.points.length >= 2) {
        const p0 = action.points[0];
        const p1 = action.points[action.points.length - 1];
        ctx.strokeRect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
      } else if (action.tool === "circle" && action.points.length >= 2) {
        const p0 = action.points[0];
        const p1 = action.points[action.points.length - 1];
        const rx = Math.abs(p1.x - p0.x) / 2;
        const ry = Math.abs(p1.y - p0.y) / 2;
        const cx = p0.x + (p1.x - p0.x) / 2;
        const cy = p0.y + (p1.y - p0.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (action.tool === "text" && action.text && action.points.length > 0) {
        ctx.font = `${action.lineWidth * 6 + 10}px sans-serif`;
        ctx.fillText(action.text, action.points[0].x, action.points[0].y);
      }
    });
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    if (backgroundImage) {
      const img = new Image();
      img.src = backgroundImage;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawAll(ctx, actions);
      };
    } else if (initialMarkup) {
      const img = new Image();
      img.src = initialMarkup;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawAll(ctx, actions);
      };
    } else {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawAll(ctx, actions);
    }
  }, [backgroundImage, initialMarkup, actions, drawAll]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>): DrawPoint => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPos(e);
    if (tool === "text") {
      setPendingText(pos);
      return;
    }
    setIsDrawing(true);
    startPointRef.current = pos;
    setCurrentPoints([pos]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    if (tool === "pen") {
      setCurrentPoints((prev) => [...prev, pos]);
    } else {
      setCurrentPoints([startPointRef.current!, pos]);
    }

    // live preview
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const allActs = [...actions, { tool, color, lineWidth, points: tool === "pen" ? [...currentPoints, pos] : [startPointRef.current!, pos] }];

    if (backgroundImage) {
      const img = new Image();
      img.src = backgroundImage;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawAll(ctx, allActs);
      };
    } else {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawAll(ctx, allActs);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const pos = getPos(e);
    const pts = tool === "pen" ? [...currentPoints, pos] : [startPointRef.current!, pos];
    if (pts.length > 0) {
      setActions((prev) => [...prev, { tool, color, lineWidth, points: pts }]);
    }
    setCurrentPoints([]);
  };

  const handleUndo = () => {
    setActions((prev) => prev.slice(0, -1));
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL("image/png"));
  };

  const handleTextConfirm = () => {
    if (pendingText && textInput.trim()) {
      setActions((prev) => [
        ...prev,
        { tool: "text", color, lineWidth, points: [pendingText], text: textInput.trim() },
      ]);
    }
    setPendingText(null);
    setTextInput("");
  };

  const tools: { id: Tool; icon: string; label: string }[] = [
    { id: "pen", icon: "✏️", label: "펜" },
    { id: "arrow", icon: "→", label: "화살표" },
    { id: "rect", icon: "□", label: "사각형" },
    { id: "circle", icon: "○", label: "원" },
    { id: "text", icon: "T", label: "텍스트" },
  ];

  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#000000"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col max-w-4xl w-full mx-4 overflow-hidden" style={{ maxHeight: "90vh" }}>
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-slate-700">도면 편집</span>
          <div className="flex gap-1">
            {tools.map((t) => (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                title={t.label}
                className="w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
                style={{
                  background: tool === t.id ? PRIMARY : "#f1f5f9",
                  color: tool === t.id ? "white" : "#64748b",
                }}
              >
                {t.icon}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-slate-200" />

          {/* Colors */}
          <div className="flex gap-1">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-6 h-6 rounded-full border-2 transition-transform"
                style={{
                  background: c,
                  borderColor: color === c ? "#1e293b" : "transparent",
                  transform: color === c ? "scale(1.2)" : "scale(1)",
                }}
              />
            ))}
          </div>

          <div className="w-px h-5 bg-slate-200" />

          {/* Line width */}
          <select
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none"
          >
            <option value={1}>얇게</option>
            <option value={2}>보통</option>
            <option value={4}>굵게</option>
          </select>

          <div className="flex-1" />

          <button
            onClick={handleUndo}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            실행 취소
          </button>
          <button
            onClick={handleSave}
            className="text-xs px-3 py-1.5 rounded-lg text-white font-medium"
            style={{ background: PRIMARY }}
          >
            저장
          </button>
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600"
          >
            닫기
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-4 bg-slate-100 relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="block mx-auto rounded-lg shadow-md"
            style={{ cursor: tool === "text" ? "text" : "crosshair", maxWidth: "100%" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />

          {/* Text input overlay */}
          {pendingText && (
            <div
              className="absolute flex gap-2 items-center"
              style={{
                left: "calc(50% - 200px)",
                bottom: "1rem",
              }}
            >
              <input
                autoFocus
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleTextConfirm(); if (e.key === "Escape") setPendingText(null); }}
                placeholder="텍스트 입력 후 Enter"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none bg-white shadow-md"
                style={{ width: 260 }}
              />
              <button
                onClick={handleTextConfirm}
                className="px-3 py-2 rounded-lg text-white text-sm"
                style={{ background: PRIMARY }}
              >
                확인
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
