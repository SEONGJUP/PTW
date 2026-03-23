import Link from "next/link";

const steps = [
  { num: "01", title: "작업 계획 등록", actor: "계획담당자", desc: "작업 범위, 일정, 필요 자원 정의", color: "bg-emerald-500" },
  { num: "02", title: "자원 배정", actor: "관리자", desc: "인력, 장비, 자재 배정 및 확인", color: "bg-teal-500" },
  { num: "03", title: "계획 검토", actor: "팀장", desc: "계획 타당성 검토 및 피드백", color: "bg-cyan-500" },
  { num: "04", title: "작업 실행", actor: "작업팀", desc: "계획에 따른 작업 진행 및 진척 업데이트", color: "bg-sky-500" },
  { num: "05", title: "완료 및 결과 보고", actor: "계획담당자", desc: "실적 기록, 교훈 도출, 결과 공유", color: "bg-indigo-500" },
];

const features = [
  { icon: "📅", title: "작업 일정 관리", desc: "간트 차트 기반의 작업 일정 시각화 및 마일스톤 관리" },
  { icon: "👥", title: "인력 배치", desc: "작업별 담당자 배정, 가용 인력 현황 확인" },
  { icon: "📦", title: "자재/장비 관리", desc: "필요 자재 목록, 장비 예약, 반출입 이력 관리" },
  { icon: "📊", title: "진척 대시보드", desc: "계획 대비 실적, 지연 작업 자동 알림" },
  { icon: "🔗", title: "PTW 연동", desc: "계획 단계에서 Permit to Work 자동 연결 및 상태 동기화" },
  { icon: "📝", title: "결과 보고서", desc: "작업 완료 후 실적/교훈 문서 자동 생성" },
];

export default function PlanPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-2">
        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-medium">PtW</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Plan to Work</h1>
      <p className="text-slate-500 mb-8">작업 계획 수립, 자원 배정, 일정 관리 시스템</p>

      {/* Process */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">계획 프로세스</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {steps.map((step) => (
            <div key={step.num} className="flex flex-col items-center min-w-[150px]">
              <div className={`w-10 h-10 rounded-full ${step.color} text-white flex items-center justify-center text-sm font-bold mb-2`}>
                {step.num}
              </div>
              <div className="text-center bg-white rounded-xl border border-slate-200 p-3 w-full shadow-sm">
                <div className="text-xs text-slate-400 mb-0.5">{step.actor}</div>
                <div className="text-sm font-semibold text-slate-800 mb-1">{step.title}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">주요 기능</h2>
        <div className="grid grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-semibold text-slate-800 text-sm mb-1">{f.title}</div>
              <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Links */}
      <div className="flex gap-3">
        <Link href="/plan/flow" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors">
          상세 프로세스 흐름 →
        </Link>
        <Link href="/plan/schedule" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-lg transition-colors">
          스케줄 UI 설계 →
        </Link>
      </div>
    </div>
  );
}
