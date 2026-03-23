import Link from "next/link";

const steps = [
  { num: "01", title: "작업 신청", actor: "작업자", desc: "작업 내용, 위험 요소, 필요 장비를 기입하여 PTW 신청서 작성", color: "bg-blue-500" },
  { num: "02", title: "위험성 검토", actor: "안전관리자", desc: "위험성 평가(RA), 작업 방법 검토, 필요 조건 확인", color: "bg-indigo-500" },
  { num: "03", title: "허가 승인", actor: "승인권자", desc: "검토 결과를 바탕으로 작업 허가 또는 반려", color: "bg-violet-500" },
  { num: "04", title: "작업 실행", actor: "작업자", desc: "허가된 조건 내에서 작업 진행, 상태 실시간 업데이트", color: "bg-amber-500" },
  { num: "05", title: "완료 확인", actor: "감독자", desc: "작업 완료 상태 확인, 현장 정리, 안전 복구 확인", color: "bg-orange-500" },
  { num: "06", title: "허가 종료", actor: "안전관리자", desc: "PTW 공식 종료, 기록 보관, 이상 사항 리포트", color: "bg-rose-500" },
];

const permitTypes = [
  { name: "일반 작업 허가", code: "GP", desc: "일반적인 유지보수 및 시설 작업", risk: "저위험", color: "bg-green-100 text-green-700" },
  { name: "화기 작업 허가", code: "HP", desc: "용접, 절단, 연삭 등 불꽃 발생 작업", risk: "고위험", color: "bg-red-100 text-red-700" },
  { name: "밀폐공간 작업 허가", code: "CS", desc: "탱크, 맨홀, 피트 등 밀폐 구역 진입 작업", risk: "고위험", color: "bg-red-100 text-red-700" },
  { name: "고소 작업 허가", code: "WH", desc: "2m 이상 높이에서의 작업", risk: "중위험", color: "bg-amber-100 text-amber-700" },
];

export default function PermitPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-2">
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">PTW</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Permit to Work</h1>
      <p className="text-slate-500 mb-8">위험 작업에 대한 공식 허가 발급 및 관리 시스템</p>

      {/* Process Flow */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">허가 프로세스</h2>
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {steps.map((step, i) => (
              <div key={step.num} className="flex flex-col items-center min-w-[140px]">
                <div className={`w-10 h-10 rounded-full ${step.color} text-white flex items-center justify-center text-sm font-bold mb-2`}>
                  {step.num}
                </div>
                {i < steps.length - 1 && (
                  <div className="absolute" style={{ left: `${(i + 1) * (100 / steps.length)}%`, top: "18px" }}>
                    <span className="text-slate-300 text-lg">→</span>
                  </div>
                )}
                <div className="text-center bg-white rounded-xl border border-slate-200 p-3 w-full shadow-sm">
                  <div className="text-xs text-slate-400 mb-0.5">{step.actor}</div>
                  <div className="text-sm font-semibold text-slate-800 mb-1">{step.title}</div>
                  <div className="text-xs text-slate-500 leading-relaxed">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Permit Types */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">허가서 종류</h2>
        <div className="grid grid-cols-2 gap-4">
          {permitTypes.map((pt) => (
            <div key={pt.code} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center text-xs font-bold">{pt.code}</span>
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{pt.name}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pt.color}`}>{pt.risk}</span>
                </div>
              </div>
              <p className="text-slate-500 text-sm">{pt.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Links */}
      <div className="flex gap-3">
        <Link href="/permit/flow" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
          상세 프로세스 흐름 →
        </Link>
        <Link href="/permit/roles" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-lg transition-colors">
          역할 & 권한 설계 →
        </Link>
        <Link href="/permit/forms" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-lg transition-colors">
          양식 설계 →
        </Link>
      </div>
    </div>
  );
}
