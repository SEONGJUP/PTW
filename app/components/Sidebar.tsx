"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const mainNav = [
  {
    group: "작업 관리",
    items: [
      { href: "/safety-board", label: "안전카드 게시판", icon: "🛡" },
      { href: "/approval", label: "작업계획·허가서 승인", icon: "✅" },
      { href: "/work-plan/equipment", label: "장비·기계 관리", icon: "🚜" },
      { href: "/work-plan/settings", label: "작업계획서 상세설정", icon: "⚙" },
      { href: "/work-plan/permit-settings", label: "작업허가서 상세설정", icon: "🔑" },
    ],
  },
  {
    group: "참고",
    items: [
      { href: "/developer", label: "개발자 참고사항", icon: "💻" },
    ],
  },
];

const etcNav = [
  { href: "/", label: "구 대시보드", icon: "⊞" },
  { href: "/permit", label: "PTW 개요", icon: "📋" },
  { href: "/permit/flow", label: "허가 프로세스", icon: "→" },
  { href: "/permit/roles", label: "역할 & 권한", icon: "👤" },
  { href: "/permit/forms", label: "허가서 양식", icon: "📝" },
  { href: "/plan", label: "Plan 개요", icon: "📅" },
  { href: "/plan/flow", label: "계획 프로세스", icon: "→" },
  { href: "/plan/schedule", label: "작업 스케줄", icon: "🗓" },
  { href: "/screens", label: "화면 목록", icon: "🖥" },
  { href: "/screens/dashboard", label: "대시보드 화면", icon: "▤" },
  { href: "/screens/permit-list", label: "허가서 목록", icon: "▤" },
  { href: "/screens/permit-detail", label: "허가서 상세", icon: "▤" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [etcOpen, setEtcOpen] = useState(false);

  return (
    <aside className="w-60 h-screen bg-slate-900 flex flex-col overflow-y-auto flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold"
            style={{ background: "#00B7AF" }}
          >
            P
          </div>
          <div>
            <div className="text-white text-sm font-semibold">PTW System</div>
            <div className="text-slate-400 text-xs">SafeBuddy</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5">
        {/* Main nav */}
        {mainNav.map((section) => (
          <div key={section.group}>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
              {section.group}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${isActive ? "active" : ""}`}
                  >
                    <span className="w-5 text-center text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* 기타 (collapsible) */}
        <div>
          <button
            onClick={() => setEtcOpen((v) => !v)}
            className="w-full flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2 hover:text-slate-300 transition-colors"
          >
            <span>기타</span>
            <span
              className="transition-transform"
              style={{ transform: etcOpen ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block" }}
            >
              ▾
            </span>
          </button>

          {etcOpen && (
            <div className="space-y-0.5">
              {etcNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${isActive ? "active" : ""}`}
                  >
                    <span className="w-5 text-center text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-slate-700">
        <div className="text-slate-500 text-xs">v0.1 · SafeBuddy PTW</div>
      </div>
    </aside>
  );
}
