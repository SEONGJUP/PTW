const timeline = [
  { step: "신청 제출", actor: "김철수 (작업자)", time: "2024-03-15 08:30", status: "완료", color: "bg-blue-500" },
  { step: "안전관리자 검토", actor: "박안전 (안전관리자)", time: "2024-03-15 09:15", status: "완료", color: "bg-indigo-500" },
  { step: "최종 승인 대기", actor: "이승인 (승인권자)", time: "현재 단계", status: "진행중", color: "bg-amber-500" },
  { step: "작업 실행", actor: "김철수 (작업자)", time: "대기중", status: "대기", color: "bg-slate-300" },
  { step: "완료 확인", actor: "최감독 (감독자)", time: "대기중", status: "대기", color: "bg-slate-300" },
  { step: "허가 종료", actor: "박안전 (안전관리자)", time: "대기중", status: "대기", color: "bg-slate-300" },
];

export default function PermitDetailScreen() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-2">
        <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded font-medium">화면설계 · 허가서 상세</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">허가서 상세 화면 프로토타입</h1>
      <p className="text-slate-500 mb-8">신청 내용, 타임라인, 승인 액션 UI 설계</p>

      <div className="bg-slate-100 rounded-2xl p-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-5 py-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-blue-200 text-xs font-mono">PTW-0042</span>
                  <span className="text-xs bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full font-medium">승인 대기</span>
                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">화기 작업</span>
                </div>
                <h2 className="text-white font-bold text-xl">3호기 배관 용접 작업</h2>
                <p className="text-blue-200 text-sm mt-0.5">3공장 B동 3층 · 배관팀 · 신청자: 김철수</p>
              </div>
              <div className="text-right text-blue-200 text-sm">
                <div>2024-03-15 08:30 신청</div>
                <div>우선순위: <span className="text-red-300 font-semibold">높음</span></div>
              </div>
            </div>
          </div>

          <div className="flex gap-0 divide-x divide-slate-100">
            {/* Main */}
            <div className="flex-1 p-5 space-y-5">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "작업 위치", value: "3공장 B동 3층 배관실" },
                  { label: "작업 일시", value: "2024-03-15 13:00 ~ 17:00" },
                  { label: "작업 인원", value: "3명 (용접 1, 보조 2)" },
                  { label: "예상 소요", value: "4시간" },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-0.5">{item.label}</div>
                    <div className="text-sm font-medium text-slate-700">{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Risk */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">위험 요소 및 안전 조치</h4>
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-2">
                  <div className="text-xs font-semibold text-red-600 mb-1">예상 위험 요소</div>
                  <p className="text-sm text-red-700">화재 발생 가능성, 고온 스패터 비산, 유해 가스 흡입</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                  <div className="text-xs font-semibold text-emerald-600 mb-1">안전 조치 계획</div>
                  <p className="text-sm text-emerald-700">소화기 2대 배치, 불꽃 방지 커버 설치, 환기 팬 가동, 방진마스크 착용 의무</p>
                </div>
              </div>

              {/* PPE */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">필요 보호구</h4>
                <div className="flex gap-2 flex-wrap">
                  {["안전모", "안전화", "용접마스크", "내열장갑", "차광안경", "방염복"].map((ppe) => (
                    <span key={ppe} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-lg flex items-center gap-1">
                      ✓ {ppe}
                    </span>
                  ))}
                </div>
              </div>

              {/* Attachments */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">첨부 서류</h4>
                <div className="space-y-1.5">
                  {["위험성평가서_0042.pdf", "작업절차서_용접.pdf"].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-100">
                      📎 {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline sidebar */}
            <div className="w-64 p-5 flex-shrink-0">
              <h4 className="text-sm font-semibold text-slate-700 mb-4">진행 타임라인</h4>
              <div className="space-y-0">
                {timeline.map((t, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${t.color}`}></div>
                      {i < timeline.length - 1 && (
                        <div className={`w-0.5 flex-1 my-1 ${i < 2 ? "bg-blue-200" : "bg-slate-200"}`} style={{ minHeight: "32px" }}></div>
                      )}
                    </div>
                    <div className="pb-4">
                      <div className={`text-xs font-semibold ${t.status === "진행중" ? "text-amber-700" : t.status === "대기" ? "text-slate-400" : "text-slate-700"}`}>
                        {t.step}
                      </div>
                      <div className="text-xs text-slate-400">{t.actor}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{t.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Approval action */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <h5 className="text-xs font-semibold text-slate-600 mb-3">승인 액션</h5>
                <div className="w-full px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg text-center cursor-pointer hover:bg-emerald-700">
                  ✓ 승인
                </div>
                <div className="w-full px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg text-center cursor-pointer hover:bg-amber-100">
                  조건부 승인
                </div>
                <div className="w-full px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg text-center cursor-pointer hover:bg-red-100">
                  ✗ 반려
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
