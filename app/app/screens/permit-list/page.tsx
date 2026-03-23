const permits = [
  { id: "PTW-0042", name: "3호기 배관 용접 작업", type: "화기", status: "승인대기", team: "배관팀", applicant: "김철수", date: "2024-03-15", priority: "높음" },
  { id: "PTW-0041", name: "전기실 메인 패널 점검", type: "일반", status: "진행중", team: "전기팀", applicant: "이영희", date: "2024-03-15", priority: "보통" },
  { id: "PTW-0040", name: "저장탱크 맨홀 진입", type: "밀폐", status: "승인됨", team: "설비팀", applicant: "박민준", date: "2024-03-14", priority: "높음" },
  { id: "PTW-0039", name: "옥상 3층 방수 보수", type: "고소", status: "완료", team: "건설팀", applicant: "최지은", date: "2024-03-14", priority: "낮음" },
  { id: "PTW-0038", name: "냉각수 순환 펌프 교체", type: "일반", status: "완료", team: "설비팀", applicant: "정수민", date: "2024-03-13", priority: "보통" },
  { id: "PTW-0037", name: "가스 배관 압력 테스트", type: "화기", status: "반려됨", team: "배관팀", applicant: "강준혁", date: "2024-03-13", priority: "높음" },
];

const statusColor: Record<string, string> = {
  승인대기: "bg-amber-100 text-amber-700",
  진행중: "bg-blue-100 text-blue-700",
  승인됨: "bg-violet-100 text-violet-700",
  완료: "bg-emerald-100 text-emerald-700",
  반려됨: "bg-red-100 text-red-700",
};

const typeColor: Record<string, string> = {
  일반: "bg-green-100 text-green-700",
  화기: "bg-red-100 text-red-700",
  밀폐: "bg-orange-100 text-orange-700",
  고소: "bg-amber-100 text-amber-700",
};

const priorityColor: Record<string, string> = {
  높음: "text-red-500",
  보통: "text-amber-500",
  낮음: "text-slate-400",
};

export default function PermitListScreen() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-2">
        <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded font-medium">화면설계 · 허가서 목록</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">허가서 목록 화면 프로토타입</h1>
      <p className="text-slate-500 mb-8">필터, 검색, 목록 테이블 UI 설계</p>

      <div className="bg-slate-100 rounded-2xl p-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">작업 허가서 목록</h2>
            <button className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg">+ 새 허가서</button>
          </div>

          {/* Filters */}
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex gap-3 items-center flex-wrap">
            <div className="flex-1 min-w-[200px] border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-400 bg-white">
              🔍 작업명, 번호, 담당자 검색...
            </div>
            <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-500 bg-white">
              <option>전체 상태</option>
              <option>승인대기</option>
              <option>진행중</option>
              <option>완료</option>
            </select>
            <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-500 bg-white">
              <option>전체 유형</option>
              <option>일반</option>
              <option>화기</option>
              <option>밀폐</option>
              <option>고소</option>
            </select>
            <div className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-400 bg-white">
              📅 기간 선택
            </div>
          </div>

          {/* Status tabs */}
          <div className="flex gap-1 px-5 py-2 border-b border-slate-100">
            {[
              { label: "전체", count: 42, active: true },
              { label: "승인대기", count: 5, active: false },
              { label: "진행중", count: 12, active: false },
              { label: "완료", count: 23, active: false },
              { label: "반려됨", count: 2, active: false },
            ].map((tab) => (
              <div
                key={tab.label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                  tab.active ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${tab.active ? "bg-blue-100" : "bg-slate-100"}`}>
                  {tab.count}
                </span>
              </div>
            ))}
          </div>

          {/* Table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 w-4">
                  <div className="w-4 h-4 border border-slate-300 rounded"></div>
                </th>
                {["번호", "작업명", "유형", "우선순위", "팀", "신청자", "신청일", "상태", ""].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {permits.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="w-4 h-4 border border-slate-300 rounded"></div>
                  </td>
                  <td className="px-3 py-3 text-xs font-mono text-slate-400">{p.id}</td>
                  <td className="px-3 py-3 text-slate-700 font-medium">{p.name}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeColor[p.type]}`}>{p.type}</span>
                  </td>
                  <td className={`px-3 py-3 text-xs font-bold ${priorityColor[p.priority]}`}>{p.priority}</td>
                  <td className="px-3 py-3 text-xs text-slate-500">{p.team}</td>
                  <td className="px-3 py-3 text-xs text-slate-500">{p.applicant}</td>
                  <td className="px-3 py-3 text-xs text-slate-400">{p.date}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-blue-500 cursor-pointer">상세 →</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
            <span className="text-xs text-slate-400">총 42건 · 1-6 표시중</span>
            <div className="flex gap-1">
              {["◀", "1", "2", "3", "...", "7", "▶"].map((p, i) => (
                <span key={i} className={`w-7 h-7 flex items-center justify-center rounded text-xs cursor-pointer ${p === "1" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
