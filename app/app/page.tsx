import Link from "next/link";

const stats = [
  { label: "허가 프로세스 단계", value: "6단계", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { label: "계획 프로세스 단계", value: "5단계", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { label: "설계 화면 수", value: "4개", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { label: "역할 유형", value: "4종", color: "bg-amber-50 text-amber-700 border-amber-200" },
];

const modules = [
  {
    title: "Permit to Work",
    abbr: "PTW",
    desc: "위험 작업에 대한 공식 허가 발급, 승인, 실행, 완료 프로세스를 관리합니다.",
    colorTop: "border-t-blue-500",
    badge: "bg-blue-100 text-blue-700",
    links: [
      { href: "/permit", label: "개요 보기" },
      { href: "/permit/flow", label: "프로세스 흐름" },
      { href: "/permit/forms", label: "양식 설계" },
    ],
  },
  {
    title: "Plan to Work",
    abbr: "PtW",
    desc: "작업 계획 수립, 자원 배정, 일정 관리, 진행 상황 공유를 지원합니다.",
    colorTop: "border-t-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
    links: [
      { href: "/plan", label: "개요 보기" },
      { href: "/plan/flow", label: "프로세스 흐름" },
      { href: "/plan/schedule", label: "스케줄 설계" },
    ],
  },
];

const recentItems = [
  { label: "허가서 신청 화면 와이어프레임", type: "화면설계", href: "/screens/permit-detail", date: "진행중" },
  { label: "역할 & 권한 매트릭스", type: "PTW", href: "/permit/roles", date: "검토중" },
  { label: "작업 스케줄 UI 설계", type: "PtW", href: "/plan/schedule", date: "예정" },
  { label: "대시보드 레이아웃", type: "화면설계", href: "/screens/dashboard", date: "완료" },
];

export default function Home() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">PTW 기획 대시보드</h1>
        <p className="text-slate-500 mt-1">Permit to Work · Plan to Work 시스템 기획 및 프로토타입</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm mt-1 opacity-75">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Modules */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {modules.map((m) => (
          <div key={m.title} className={`bg-white rounded-2xl border-4 border-t-4 ${m.colorTop} border-slate-100 p-6 shadow-sm`}>
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${m.badge}`}>{m.abbr}</span>
              <h2 className="text-lg font-semibold text-slate-800">{m.title}</h2>
            </div>
            <p className="text-slate-500 text-sm mb-5 leading-relaxed">{m.desc}</p>
            <div className="flex gap-2 flex-wrap">
              {m.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  {l.label} →
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recent */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">기획 항목 현황</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {recentItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-medium">{item.type}</span>
                <span className="text-sm text-slate-700">{item.label}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                item.date === "완료" ? "bg-emerald-100 text-emerald-600" :
                item.date === "진행중" ? "bg-blue-100 text-blue-600" :
                item.date === "검토중" ? "bg-amber-100 text-amber-600" :
                "bg-slate-100 text-slate-500"
              }`}>{item.date}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
