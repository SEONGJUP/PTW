const roles = [
  {
    name: "작업자 (Worker)",
    code: "W",
    color: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
    desc: "실제 현장 작업을 수행하는 주체",
    permissions: [
      { action: "PTW 신청서 작성/제출", allowed: true },
      { action: "RA 문서 첨부", allowed: true },
      { action: "작업 시작/완료 등록", allowed: true },
      { action: "긴급 상황 보고", allowed: true },
      { action: "타인 허가서 승인", allowed: false },
      { action: "허가서 최종 종료", allowed: false },
    ],
  },
  {
    name: "안전관리자 (Safety Officer)",
    code: "SO",
    color: "bg-violet-500",
    badge: "bg-violet-100 text-violet-700",
    desc: "위험성 평가 및 허가 조건을 검토하는 전문가",
    permissions: [
      { action: "PTW 신청 검토", allowed: true },
      { action: "현장 사전 점검", allowed: true },
      { action: "허가 조건 추가/수정", allowed: true },
      { action: "PTW 공식 종료", allowed: true },
      { action: "최종 허가 승인", allowed: false },
      { action: "시스템 관리자 설정", allowed: false },
    ],
  },
  {
    name: "승인권자 (Approver)",
    code: "AP",
    color: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700",
    desc: "최종 허가 승인 권한을 가진 관리자",
    permissions: [
      { action: "PTW 최종 승인/반려", allowed: true },
      { action: "검토 내용 확인", allowed: true },
      { action: "조건부 승인 설정", allowed: true },
      { action: "전체 허가 현황 조회", allowed: true },
      { action: "신청서 직접 작성", allowed: false },
      { action: "시스템 관리자 설정", allowed: false },
    ],
  },
  {
    name: "감독자 (Supervisor)",
    code: "SV",
    color: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
    desc: "작업 현장의 실시간 감독 및 완료 확인",
    permissions: [
      { action: "작업 현황 모니터링", allowed: true },
      { action: "현장 완료 확인 서명", allowed: true },
      { action: "이상 사항 보고", allowed: true },
      { action: "담당 작업 조회", allowed: true },
      { action: "허가서 승인", allowed: false },
      { action: "RA 검토", allowed: false },
    ],
  },
];

export default function RolesPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-2">
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">PTW · 역할설계</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">역할 & 권한 설계</h1>
      <p className="text-slate-500 mb-8">PTW 시스템 참여자의 역할 및 권한 매트릭스</p>

      <div className="grid grid-cols-2 gap-6">
        {roles.map((role) => (
          <div key={role.code} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
              <div className={`w-9 h-9 rounded-xl ${role.color} text-white flex items-center justify-center text-xs font-bold`}>
                {role.code}
              </div>
              <div>
                <div className="font-semibold text-slate-800 text-sm">{role.name}</div>
                <div className="text-xs text-slate-400">{role.desc}</div>
              </div>
            </div>
            <div className="px-5 py-3 space-y-2">
              {role.permissions.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{p.action}</span>
                  <span className={p.allowed ? "text-emerald-500 font-medium" : "text-slate-300"}>
                    {p.allowed ? "✓" : "✗"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
