import Anthropic from "@anthropic-ai/sdk";
import type { PTWTask, TaskPriority, TaskCategory } from "./notion";

// ─── 실행 결과 타입 ────────────────────────────────────────────────
export interface ExecutionResult {
  success: boolean;
  summary: string;
  detail: string;
  action: "complete" | "hold" | "needs_human";
  improvements: ImprovementItem[];  // 완료 후 도출된 개선사항
}

export interface ImprovementItem {
  title: string;
  description: string;
  priority: TaskPriority;
  categories: TaskCategory[];
}

// ─── Claude API (선택적) ──────────────────────────────────────────
function getAnthropic(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

// ─── 규칙 기반 실행 (API 키 없을 때 폴백) ─────────────────────────
const RULE_BASED_HANDLERS: Array<{
  match: (task: PTWTask) => boolean;
  execute: (task: PTWTask) => ExecutionResult;
}> = [
  {
    // 모바일 반응형 레이아웃
    match: (t) => t.title.includes("모바일") || t.description.includes("모바일"),
    execute: (t) => ({
      success: true,
      summary: "모바일 반응형 구현 계획 수립 완료",
      detail: [
        "분석 결과: 현재 좌우 분할 레이아웃(lg:flex-row)은 모바일에서 사용 불가.",
        "",
        "구현 계획:",
        "1. WorkPlanEditor.tsx: md:flex-row → 기본 flex-col, 모바일 햄버거 메뉴로 SectionPanel 토글",
        "2. SectionPanel: 모바일에서 bottom-sheet 형태로 전환 (absolute positioning)",
        "3. SignatureCanvas: 터치 이벤트 최적화 (touchstart/touchmove 처리)",
        "4. 폼 컬럼: grid-cols-1 (mobile) → grid-cols-2 (md)",
        "",
        "→ 사람이 직접 코드 수정 필요 (UI 컴포넌트 대규모 변경)",
      ].join("\n"),
      action: "needs_human",
      improvements: [
        {
          title: "모바일 SectionPanel 하단 시트 컴포넌트 구현",
          description: "모바일에서 섹션 패널을 하단에서 올라오는 Sheet 형태로 구현. framer-motion 또는 순수 CSS transition 활용.",
          priority: "보통",
          categories: ["개발", "디자인"],
        },
        {
          title: "서명 캔버스 터치 이벤트 최적화",
          description: "react-signature-canvas의 터치 반응성 개선. iOS/Android 기기에서 서명 입력 시 스크롤과 충돌 방지.",
          priority: "보통",
          categories: ["개발"],
        },
      ],
    }),
  },
  {
    // 버전 이력 관리
    match: (t) => t.title.includes("버전") || t.description.includes("버전 이력"),
    execute: (t) => ({
      success: true,
      summary: "버전 이력 관리 구현 계획 수립",
      detail: [
        "분석 결과: localStorage 기반 간단 구현이 우선 필요.",
        "",
        "구현 계획:",
        "1. workPlanStore.ts에 versions: Version[] 배열 추가",
        "2. saveVersion() 액션: 현재 formData + 타임스탬프 스냅샷 저장",
        "3. VersionHistory.tsx 컴포넌트: 버전 목록 + diff 비교 뷰",
        "4. 승인 완료 시 자동 버전 저장 트리거",
        "",
        "→ 사람이 직접 코드 수정 필요",
      ].join("\n"),
      action: "needs_human",
      improvements: [
        {
          title: "작업계획서 버전 스냅샷 저장 기능",
          description: "서명 완료 또는 수동 저장 시 formData 전체를 타임스탬프와 함께 localStorage에 저장. 최대 10개 버전 유지.",
          priority: "낮음",
          categories: ["개발"],
        },
      ],
    }),
  },
];

// ─── Claude API 기반 실행 ────────────────────────────────────────
const SYSTEM_PROMPT = `당신은 PTW(Permit to Work) 프로젝트의 태스크 실행 에이전트입니다.
태스크를 분석하여 실행 결과와 후속 개선사항을 도출합니다.

응답 형식 (반드시 JSON):
{
  "success": true/false,
  "summary": "한 줄 요약 (Discord 표시)",
  "detail": "상세 실행 내용 또는 구현 계획",
  "action": "complete | hold | needs_human",
  "improvements": [
    {
      "title": "개선사항 제목",
      "description": "상세 설명",
      "priority": "높음 | 보통 | 낮음",
      "categories": ["개발", "기획", "디자인", "운영", "영업", "기타"]
    }
  ]
}

rules:
- action=complete: 코드 변경 없이 분석/기획만으로 완료 가능한 태스크
- action=needs_human: 실제 코드 수정이 필요한 태스크 (구현 계획 제시)
- action=hold: 정보 부족 또는 외부 의존성이 있는 태스크
- improvements: 태스크 완료 후 도출된 2~3개의 후속 개선사항 (필수)
- 한국어로 응답`;

async function executeWithClaude(task: PTWTask): Promise<ExecutionResult> {
  const anthropic = getAnthropic()!;

  const prompt = `태스크 정보:
- 제목: ${task.title}
- 카테고리: ${task.categories.join(", ")}
- 우선순위: ${task.priority}
- 설명: ${task.description || "(설명 없음)"}

이 태스크를 분석하고, 실행 결과와 후속 개선사항 2~3개를 JSON으로 응답해주세요.`;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
    system: SYSTEM_PROMPT,
  });

  const raw = msg.content[0]?.type === "text" ? msg.content[0].text : "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]) as ExecutionResult;
    parsed.improvements = parsed.improvements ?? [];
    return parsed;
  }

  return {
    success: true,
    summary: raw.slice(0, 100),
    detail: raw,
    action: "needs_human",
    improvements: [],
  };
}

// ─── 아이디어 풀 (API 키 없을 때 폴백) ──────────────────────────
const PTW_IDEA_POOL: ImprovementItem[] = [
  { title: "작업허가서(Permit to Work) 발급·승인 워크플로 기획", description: "작업자 신청 → 안전관리자 검토 → 현장책임자 최종 승인의 3단계 디지털 워크플로를 기획하고 UI 흐름도를 작성한다.", priority: "높음", categories: ["기획"] },
  { title: "QR코드 기반 작업허가서 현장 확인 기능", description: "발급된 작업허가서에 QR코드를 생성하여, 현장에서 모바일로 스캔 시 허가 여부·유효기간·작업 범위를 즉시 확인할 수 있는 기능을 구현한다.", priority: "높음", categories: ["개발"] },
  { title: "위험성평가 체크리스트 연동", description: "작업 유형별 위험성평가 항목을 사전 등록하고, 작업계획서 작성 시 자동으로 연관 위험 항목을 불러와 체크하도록 연동한다.", priority: "높음", categories: ["개발", "기획"] },
  { title: "작업계획서 다국어(영어/베트남어) 지원", description: "외국인 근로자를 위한 영어·베트남어 번역 버전의 작업계획서 출력 기능을 추가한다. i18n 라이브러리 도입 또는 정적 번역 JSON 파일 방식 검토.", priority: "보통", categories: ["개발", "기획"] },
  { title: "작업계획서 승인 이력 타임라인 UI", description: "작업계획서의 작성·검토·승인·반려 이력을 시간순 타임라인으로 시각화하여, 감사(Audit) 및 이력 추적이 가능하도록 구현한다.", priority: "보통", categories: ["개발", "디자인"] },
  { title: "SafeBuddy 대시보드 — 현장별 PTW 현황 집계", description: "현재 진행 중인 작업허가 건수, 장비별 작업 현황, 금일 완료 건수를 한눈에 보는 메인 대시보드를 기획·구현한다.", priority: "높음", categories: ["기획", "개발", "디자인"] },
  { title: "작업계획서 공유 링크 생성 기능", description: "작성된 작업계획서를 읽기 전용 공유 링크로 생성하여, 협력업체·발주처 담당자가 별도 로그인 없이 열람할 수 있도록 한다.", priority: "보통", categories: ["개발"] },
  { title: "알림 시스템 — 마감일 임박·미승인 작업 Push 알림", description: "마감일 D-1, D-3에 자동 리마인더 알림, 24시간 이상 미승인 상태인 작업계획서 담당자에게 알림을 발송하는 기능을 구현한다.", priority: "보통", categories: ["개발", "운영"] },
  { title: "PTW 통계 리포트 자동 생성 (주간/월간)", description: "주간·월간 작업 완료 건수, 장비별 가동률, 위험 항목 발생 빈도 등 통계를 자동 집계하여 PDF 리포트로 내보내는 기능을 구현한다.", priority: "낮음", categories: ["개발", "운영"] },
  { title: "작업계획서 템플릿 관리 시스템", description: "자주 쓰는 작업 유형별 템플릿을 저장·불러오기·공유할 수 있는 템플릿 라이브러리를 구현한다. 조직 공용 템플릿과 개인 템플릿을 구분 관리한다.", priority: "보통", categories: ["개발", "기획"] },
  { title: "장비 등록 및 이력 관리 기능", description: "현장에서 사용하는 건설기계를 장비 DB에 등록하고, 점검 이력·사용 이력·다음 점검 예정일을 관리하는 기능을 구현한다.", priority: "보통", categories: ["개발", "운영"] },
  { title: "작업자 서명 본인인증 강화 (OTP/휴대폰 인증)", description: "전자서명 시 단순 캔버스 서명 외에 휴대폰 인증 또는 OTP 인증을 추가하여 법적 효력을 강화하는 방안을 기획한다.", priority: "낮음", categories: ["기획", "개발"] },
];

let ideaPoolIndex = 0; // 순환 인덱스

async function generateIdeasWithClaude(completedTitles: string[]): Promise<ImprovementItem[]> {
  const anthropic = getAnthropic()!;
  const prompt = `PTW(Permit to Work / Plan to Work) 건설현장 안전관리 시스템 프로젝트입니다.
지금까지 완료된 태스크:
${completedTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

현재 진행 중인 작업이 없습니다. 프로젝트 발전을 위해 지금 착수 가능한 새로운 태스크 3건을 도출해 주세요.
아직 구현되지 않은 실용적인 기능 또는 개선 항목이어야 합니다.

응답 형식 (반드시 JSON 배열):
[
  {
    "title": "태스크 제목",
    "description": "상세 설명 (구현 방법 포함)",
    "priority": "높음 | 보통 | 낮음",
    "categories": ["개발", "기획", "디자인", "운영", "영업", "기타"]
  }
]
한국어로 응답.`;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = msg.content[0]?.type === "text" ? msg.content[0].text : "";
  const arrMatch = raw.match(/\[[\s\S]*\]/);
  if (arrMatch) return JSON.parse(arrMatch[0]) as ImprovementItem[];
  return [];
}

/** 진행 가능한 태스크가 없을 때 새 아이디어 자동 도출 */
export async function generateProjectIdeas(completedTasks: PTWTask[]): Promise<ImprovementItem[]> {
  if (getAnthropic()) {
    try {
      const titles = completedTasks.map((t) => t.title);
      const ideas = await generateIdeasWithClaude(titles);
      if (ideas.length > 0) return ideas;
    } catch (e) {
      console.warn("[ideas] Claude API 오류, 풀 기반 폴백:", e);
    }
  }

  // 풀에서 3건 순환 선택
  const result: ImprovementItem[] = [];
  for (let i = 0; i < 3; i++) {
    result.push(PTW_IDEA_POOL[ideaPoolIndex % PTW_IDEA_POOL.length]);
    ideaPoolIndex++;
  }
  return result;
}

// ─── 메인 실행 함수 ───────────────────────────────────────────────
export async function executeTask(task: PTWTask): Promise<ExecutionResult> {
  // 1) Claude API 사용 가능하면 우선 사용
  if (getAnthropic()) {
    try {
      return await executeWithClaude(task);
    } catch (e) {
      console.warn("[executor] Claude API 오류, 규칙 기반으로 폴백:", e);
    }
  }

  // 2) 규칙 기반 핸들러 매칭
  for (const handler of RULE_BASED_HANDLERS) {
    if (handler.match(task)) {
      console.log(`[executor] 규칙 기반 실행: ${task.title}`);
      return handler.execute(task);
    }
  }

  // 3) 매칭 없음 → 기본 분석 결과 반환 (improvements 없음 — 재실행 루프 방지)
  return {
    success: true,
    summary: `분석 완료: ${task.title.slice(0, 50)}`,
    detail: [
      `태스크 "${task.title}" 분석 결과:`,
      `- 카테고리: ${task.categories.join(", ") || "미분류"}`,
      `- 우선순위: ${task.priority}`,
      "",
      task.description
        ? `설명 검토:\n${task.description}`
        : "설명이 없어 상세 분석 불가. 담당자 직접 확인 필요.",
    ].join("\n"),
    action: "needs_human",
    improvements: [],
  };
}
