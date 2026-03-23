import Link from "next/link";

const screens = [
  {
    href: "/screens/dashboard",
    title: "메인 대시보드",
    desc: "전체 PTW/PtW 현황, KPI, 최근 활동",
    status: "완료",
    tags: ["PTW", "PtW", "공통"],
  },
  {
    href: "/screens/permit-list",
    title: "허가서 목록",
    desc: "필터/검색, 상태별 분류, 목록 테이블",
    status: "진행중",
    tags: ["PTW"],
  },
  {
    href: "/screens/permit-detail",
    title: "허가서 상세",
    desc: "신청/승인/실행/종료 상세 화면, 타임라인",
    status: "진행중",
    tags: ["PTW"],
  },
  {
    href: "/plan/schedule",
    title: "작업 스케줄 (간트)",
    desc: "간트 차트 기반 작업 일정 화면",
    status: "초안",
    tags: ["PtW"],
  },
];

const statusColor: Record<string, string> = {
  완료: "bg-emerald-100 text-emerald-600",
  진행중: "bg-blue-100 text-blue-600",
  초안: "bg-amber-100 text-amber-600",
  예정: "bg-slate-100 text-slate-500",
};

export default function ScreensPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-2">
        <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded font-medium">화면 설계</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">화면 목록</h1>
      <p className="text-slate-500 mb-8">PTW/PtW 시스템 UI 화면 설계 목록</p>

      <div className="grid grid-cols-2 gap-4">
        {screens.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-violet-200 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-slate-800">{s.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[s.status]}`}>{s.status}</span>
            </div>
            <p className="text-slate-500 text-sm mb-4">{s.desc}</p>
            <div className="flex gap-1.5">
              {s.tags.map((t) => (
                <span key={t} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{t}</span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
