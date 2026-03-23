const formSections = [
  {
    title: "기본 정보",
    fields: [
      { label: "허가서 번호", type: "auto", placeholder: "PTW-2024-0001 (자동 발급)" },
      { label: "작업 유형", type: "select", options: ["일반 작업", "화기 작업", "밀폐공간", "고소 작업"] },
      { label: "작업 명칭", type: "text", placeholder: "작업 내용을 간략히 입력" },
      { label: "작업 위치", type: "text", placeholder: "건물/구역/층 등 상세 위치" },
    ],
  },
  {
    title: "작업 일정",
    fields: [
      { label: "작업 시작일시", type: "datetime", placeholder: "" },
      { label: "작업 종료일시", type: "datetime", placeholder: "" },
      { label: "작업 인원 수", type: "number", placeholder: "0명" },
    ],
  },
  {
    title: "위험 요소 및 안전 조치",
    fields: [
      { label: "예상 위험 요소", type: "textarea", placeholder: "화재, 감전, 추락, 질식 등 위험 요소 기재" },
      { label: "필요 보호구", type: "checkbox-group", options: ["안전모", "안전화", "안전벨트", "방진마스크", "보안경", "내열장갑"] },
      { label: "안전 조치 사항", type: "textarea", placeholder: "가스 차단, 환기 확보, 경계 설치 등" },
    ],
  },
  {
    title: "첨부 서류",
    fields: [
      { label: "위험성평가서(RA)", type: "file", placeholder: "PDF 또는 이미지 업로드" },
      { label: "작업 절차서", type: "file", placeholder: "PDF 또는 이미지 업로드 (선택)" },
    ],
  },
];

export default function FormsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-2">
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">PTW · 양식설계</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">허가서 양식 설계</h1>
      <p className="text-slate-500 mb-8">PTW 신청서 필드 구성 및 UI 설계 기획</p>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Form Header */}
        <div className="bg-blue-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold text-lg">작업 허가 신청서</h2>
              <p className="text-blue-200 text-sm">Permit to Work Application</p>
            </div>
            <div className="text-blue-200 text-sm font-mono">PTW-2024-XXXX</div>
          </div>
        </div>

        {/* Form Sections */}
        <div className="divide-y divide-slate-100">
          {formSections.map((section) => (
            <div key={section.title} className="px-6 py-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-blue-500 rounded-full inline-block"></span>
                {section.title}
              </h3>
              <div className="space-y-4">
                {section.fields.map((field) => (
                  <div key={field.label} className="flex gap-4">
                    <label className="text-sm text-slate-600 w-40 flex-shrink-0 pt-2">{field.label}</label>
                    <div className="flex-1">
                      {field.type === "text" || field.type === "auto" || field.type === "number" ? (
                        <div className={`w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-400 bg-slate-50 ${field.type === "auto" ? "italic" : ""}`}>
                          {field.placeholder}
                        </div>
                      ) : field.type === "select" ? (
                        <div className="flex gap-2 flex-wrap">
                          {field.options?.map((opt, i) => (
                            <span key={opt} className={`text-xs px-3 py-1.5 rounded-lg border text-sm ${i === 0 ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-slate-200 text-slate-500"}`}>
                              {opt}
                            </span>
                          ))}
                        </div>
                      ) : field.type === "textarea" ? (
                        <div className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-400 bg-slate-50 min-h-[60px]">
                          {field.placeholder}
                        </div>
                      ) : field.type === "checkbox-group" ? (
                        <div className="flex gap-2 flex-wrap">
                          {field.options?.map((opt) => (
                            <span key={opt} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 flex items-center gap-1.5 bg-white">
                              <span className="w-3.5 h-3.5 rounded border border-slate-300 inline-block"></span>
                              {opt}
                            </span>
                          ))}
                        </div>
                      ) : field.type === "file" ? (
                        <div className="w-full border-2 border-dashed border-slate-200 rounded-lg px-3 py-3 text-sm text-slate-400 text-center bg-slate-50">
                          📎 {field.placeholder}
                        </div>
                      ) : field.type === "datetime" ? (
                        <div className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-400 bg-slate-50">
                          YYYY-MM-DD HH:MM
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <div className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">신청 제출</div>
          <div className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm rounded-lg">임시 저장</div>
          <div className="px-4 py-2 bg-white border border-slate-200 text-slate-400 text-sm rounded-lg">취소</div>
        </div>
      </div>
    </div>
  );
}
