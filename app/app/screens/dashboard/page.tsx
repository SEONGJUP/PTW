const kpis = [
  { label: "금일 진행중 PTW", value: "12", unit: "건", change: "+2", up: true, color: "border-blue-200 bg-blue-50", text: "text-blue-700" },
  { label: "승인 대기", value: "5", unit: "건", change: "-1", up: false, color: "border-amber-200 bg-amber-50", text: "text-amber-700" },
  { label: "이번주 완료", value: "28", unit: "건", change: "+5", up: true, color: "border-emerald-200 bg-emerald-50", text: "text-emerald-700" },
  { label: "지연/이슈", value: "3", unit: "건", change: "+1", up: false, color: "border-red-200 bg-red-50", text: "text-red-700" },
];

const recentPermits = [
  { id: "PTW-0042", name: "3호기 배관 용접", type: "화기", status: "승인대기", team: "배관팀", time: "09:32" },
  { id: "PTW-0041", name: "전기실 패널 점검", type: "일반", status: "진행중", team: "전기팀", time: "08:45" },
  { id: "PTW-0040", name: "탱크 맨홀 진입 작업", type: "밀폐", status: "승인됨", team: "설비팀", time: "어제" },
  { id: "PTW-0039", name: "옥상 방수 보수", type: "고소", status: "완료", team: "건설팀", time: "어제" },
  { id: "PTW-0038", name: "냉각수 펌프 교체", type: "일반", status: "완료", team: "설비팀", time: "2일전" },
];

const statusColor: Record<string, string> = {
  승인대기: "bg-amber-100 text-amber-700",
  진행중: "bg-blue-100 text-blue-700",
  승인됨: "bg-violet-100 text-violet-700",
  완료: "bg-emerald-100 text-emerald-700",
};

const typeColor: Record<string, string> = {
  일반: "text-green-600",
  화기: "text-red-600",
  밀폐: "text-orange-600",
  고소: "text-amber-600",
};

export default function DashboardScreen() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-2">
        <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded font-medium">화면설계 · 대시보드</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">대시보드 화면 프로토타입</h1>
      <p className="text-slate-500 mb-8">운영자용 메인 대시보드 UI 설계</p>

      {/* Prototype Frame */}
      <div className="bg-slate-100 rounded-2xl p-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">P</div>
              <span className="text-white text-sm font-semibold">PTW 운영 시스템</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-xs">안전관리팀 · 홍길동</span>
              <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">H</div>
            </div>
          </div>

          <div className="p-5">
            {/* Page title */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">운영 현황 대시보드</h2>
                <p className="text-slate-400 text-sm">2024년 3월 15일 기준</p>
              </div>
              <div className="flex gap-2">
                <span className="text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg">오늘</span>
                <span className="text-xs px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg">이번주</span>
                <span className="text-xs px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg">이번달</span>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {kpis.map((kpi) => (
                <div key={kpi.label} className={`rounded-xl border p-4 ${kpi.color}`}>
                  <div className={`text-2xl font-bold ${kpi.text}`}>{kpi.value}<span className="text-base ml-1">{kpi.unit}</span></div>
                  <div className="text-xs text-slate-500 mt-1">{kpi.label}</div>
                  <div className={`text-xs mt-1 font-medium ${kpi.up ? "text-emerald-600" : "text-red-500"}`}>
                    {kpi.change} 전일 대비
                  </div>
                </div>
              ))}
            </div>

            {/* Recent */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 text-sm">최근 허가 현황</h3>
                <span className="text-xs text-blue-600 cursor-pointer">전체 보기 →</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-50">
                    {["번호", "작업명", "유형", "팀", "상태", "시간"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentPermits.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-xs font-mono text-slate-400">{p.id}</td>
                      <td className="px-4 py-2.5 text-slate-700 font-medium">{p.name}</td>
                      <td className={`px-4 py-2.5 text-xs font-medium ${typeColor[p.type]}`}>{p.type}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{p.team}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[p.status]}`}>{p.status}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-400">{p.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
