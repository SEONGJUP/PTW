const tasks = [
  { id: "T001", name: "보일러 정기 점검", team: "설비팀", start: 1, duration: 3, progress: 100, status: "완료", type: "일반" },
  { id: "T002", name: "배관 용접 작업", team: "배관팀", start: 2, duration: 5, progress: 60, status: "진행중", type: "화기" },
  { id: "T003", name: "전기 패널 교체", team: "전기팀", start: 4, duration: 2, progress: 0, status: "예정", type: "일반" },
  { id: "T004", name: "탱크 내부 청소", team: "설비팀", start: 6, duration: 2, progress: 0, status: "예정", type: "밀폐" },
  { id: "T005", name: "지붕 방수 공사", team: "건설팀", start: 7, duration: 4, progress: 0, status: "예정", type: "고소" },
];

const days = Array.from({ length: 10 }, (_, i) => `${i + 1}일`);

const statusColor: Record<string, string> = {
  완료: "bg-emerald-100 text-emerald-700",
  진행중: "bg-blue-100 text-blue-700",
  예정: "bg-slate-100 text-slate-500",
};

const typeColor: Record<string, string> = {
  일반: "bg-green-100 text-green-700",
  화기: "bg-red-100 text-red-700",
  밀폐: "bg-orange-100 text-orange-700",
  고소: "bg-amber-100 text-amber-700",
};

const barColor: Record<string, string> = {
  완료: "bg-emerald-400",
  진행중: "bg-blue-400",
  예정: "bg-slate-200",
};

export default function SchedulePage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-2">
        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-medium">PtW · 스케줄</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">작업 스케줄 UI 설계</h1>
      <p className="text-slate-500 mb-8">간트 차트 기반 작업 일정 화면 프로토타입</p>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">2024년 3월 - 작업 계획</span>
            <div className="flex gap-1">
              <span className="text-xs px-2 py-1 bg-white border border-slate-200 rounded text-slate-500 cursor-pointer hover:bg-slate-100">◀ 이전</span>
              <span className="text-xs px-2 py-1 bg-white border border-slate-200 rounded text-slate-500 cursor-pointer hover:bg-slate-100">다음 ▶</span>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg cursor-pointer">+ 작업 추가</span>
            <span className="text-xs px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg cursor-pointer">필터</span>
          </div>
        </div>

        {/* Gantt */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 w-14">ID</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 w-48">작업명</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 w-20">팀</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 w-16">유형</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 w-16">상태</th>
                {days.map((d) => (
                  <th key={d} className="text-center px-1 py-2.5 text-xs font-semibold text-slate-400 w-12">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{task.id}</td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{task.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{task.team}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${typeColor[task.type]}`}>{task.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusColor[task.status]}`}>{task.status}</span>
                  </td>
                  {days.map((_, i) => {
                    const day = i + 1;
                    const inRange = day >= task.start && day < task.start + task.duration;
                    const isFirst = day === task.start;
                    const isLast = day === task.start + task.duration - 1;
                    return (
                      <td key={day} className="px-0.5 py-3">
                        {inRange ? (
                          <div
                            className={`h-5 ${barColor[task.status]} opacity-80 ${isFirst ? "rounded-l-full" : ""} ${isLast ? "rounded-r-full" : ""}`}
                          />
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex gap-4">
          {Object.entries(statusColor).map(([k, v]) => (
            <span key={k} className={`text-xs px-2 py-0.5 rounded font-medium ${v}`}>{k}</span>
          ))}
          <span className="text-slate-300 mx-1">|</span>
          {Object.entries(typeColor).map(([k, v]) => (
            <span key={k} className={`text-xs px-2 py-0.5 rounded font-medium ${v}`}>{k} 작업</span>
          ))}
        </div>
      </div>
    </div>
  );
}
