const flows = [
  {
    phase: "신청 단계",
    color: "border-blue-400",
    headerBg: "bg-blue-50",
    headerText: "text-blue-700",
    steps: [
      { actor: "작업자", action: "PTW 신청서 작성", detail: "작업 위치, 일시, 내용, 위험요소 입력" },
      { actor: "작업자", action: "위험성 평가(RA) 첨부", detail: "사전 RA 문서 업로드 또는 시스템 내 작성" },
      { actor: "작업자", action: "신청 제출", detail: "담당 안전관리자에게 자동 알림 발송" },
    ],
  },
  {
    phase: "검토/승인 단계",
    color: "border-violet-400",
    headerBg: "bg-violet-50",
    headerText: "text-violet-700",
    steps: [
      { actor: "안전관리자", action: "신청 내용 검토", detail: "RA 적정성, 작업 조건, 필요 안전 조치 확인" },
      { actor: "안전관리자", action: "현장 사전 점검 (선택)", detail: "필요 시 현장 방문 후 조건 추가" },
      { actor: "승인권자", action: "최종 승인 / 반려", detail: "승인 시 허가 번호 발급, 반려 시 사유 기재" },
    ],
  },
  {
    phase: "실행 단계",
    color: "border-amber-400",
    headerBg: "bg-amber-50",
    headerText: "text-amber-700",
    steps: [
      { actor: "작업자", action: "작업 시작 등록", detail: "허가증 확인 후 작업 시작 시각 기록" },
      { actor: "감독자", action: "실시간 모니터링", detail: "작업 현황, 이상 징후 확인" },
      { actor: "작업자", action: "이상 발생 시 즉시 보고", detail: "긴급 상황 발생 시 에스컬레이션 프로세스 가동" },
    ],
  },
  {
    phase: "종료 단계",
    color: "border-emerald-400",
    headerBg: "bg-emerald-50",
    headerText: "text-emerald-700",
    steps: [
      { actor: "작업자", action: "작업 완료 등록", detail: "완료 시각, 결과 사항 기록" },
      { actor: "감독자", action: "현장 확인 서명", detail: "현장 정리 및 안전 복구 상태 확인" },
      { actor: "안전관리자", action: "PTW 공식 종료", detail: "최종 기록 저장, 필요 시 개선 사항 등록" },
    ],
  },
];

export default function PermitFlowPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-2">
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">PTW · 프로세스</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">허가 프로세스 상세 흐름</h1>
      <p className="text-slate-500 mb-8">단계별 액터, 액션, 세부 내용</p>

      <div className="space-y-6">
        {flows.map((phase) => (
          <div key={phase.phase} className={`bg-white rounded-2xl border-l-4 ${phase.color} border border-slate-200 overflow-hidden shadow-sm`}>
            <div className={`px-6 py-3 ${phase.headerBg}`}>
              <span className={`font-semibold text-sm ${phase.headerText}`}>{phase.phase}</span>
            </div>
            <div className="divide-y divide-slate-50">
              {phase.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-4 px-6 py-4">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium">{step.actor}</span>
                      <span className="text-sm font-semibold text-slate-800">{step.action}</span>
                    </div>
                    <p className="text-sm text-slate-500">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
