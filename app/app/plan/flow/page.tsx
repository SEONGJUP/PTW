const flows = [
  {
    phase: "계획 수립",
    color: "border-emerald-400",
    headerBg: "bg-emerald-50",
    headerText: "text-emerald-700",
    steps: [
      { actor: "계획담당자", action: "작업 계획서 작성", detail: "작업 목적, 범위, 산출물, 일정 기간 정의" },
      { actor: "계획담당자", action: "WBS 작성", detail: "작업 분류체계(Work Breakdown Structure) 상세 구성" },
      { actor: "팀장", action: "계획 초안 검토", detail: "우선순위, 실현 가능성, 리소스 타당성 확인" },
    ],
  },
  {
    phase: "자원 배정",
    color: "border-teal-400",
    headerBg: "bg-teal-50",
    headerText: "text-teal-700",
    steps: [
      { actor: "관리자", action: "인력 배정", detail: "담당자 지정, 가용 인력 확인, 역할 할당" },
      { actor: "관리자", action: "장비/자재 확보", detail: "필요 장비 예약, 자재 발주 또는 출고 요청" },
      { actor: "계획담당자", action: "일정 확정", detail: "자원 확보 결과 반영하여 최종 일정 확정" },
    ],
  },
  {
    phase: "실행 및 추적",
    color: "border-sky-400",
    headerBg: "bg-sky-50",
    headerText: "text-sky-700",
    steps: [
      { actor: "작업팀", action: "작업 시작 등록", detail: "계획 대비 실제 시작 시각 기록" },
      { actor: "작업팀", action: "진척률 업데이트", detail: "일일 또는 실시간 작업 진척 입력" },
      { actor: "팀장", action: "지연/이슈 관리", detail: "계획 대비 지연 발생 시 조치 및 일정 재조정" },
    ],
  },
  {
    phase: "완료 및 보고",
    color: "border-indigo-400",
    headerBg: "bg-indigo-50",
    headerText: "text-indigo-700",
    steps: [
      { actor: "작업팀", action: "작업 완료 등록", detail: "최종 완료 시각, 실적 수량 기록" },
      { actor: "계획담당자", action: "결과 보고서 작성", detail: "계획 대비 실적, 이슈, 교훈 정리" },
      { actor: "관리자", action: "결과 검토 및 승인", detail: "최종 확인 후 완료 처리 및 데이터 아카이브" },
    ],
  },
];

export default function PlanFlowPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-2">
        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-medium">PtW · 프로세스</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">작업 계획 프로세스 흐름</h1>
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
