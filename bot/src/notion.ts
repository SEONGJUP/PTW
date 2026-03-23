import { Client } from "@notionhq/client";

export const notion = new Client({ auth: process.env.NOTION_TOKEN });
export const DB_ID = process.env.NOTION_DB_ID ?? "";

export type TaskStatus = "대기 중" | "진행 중" | "완료" | "보류" | "취소";
export type TaskPriority = "높음" | "보통" | "낮음";
export type TaskCategory = "개발" | "기획" | "디자인" | "운영" | "영업" | "기타";

export interface PTWTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  categories: TaskCategory[];
  description: string;
  dueDate: string | null;
  assignee: string;
  createdAt: string;
  notionUrl: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pageToTask(page: any): PTWTask {
  const props = page.properties ?? {};

  let title = "(제목 없음)";
  for (const val of Object.values(props) as Record<string, unknown>[]) {
    if ((val as { type?: string })?.type === "title") {
      const arr = ((val as { title?: Array<{ plain_text: string }> }).title ?? []);
      title = arr.map((t) => t.plain_text).join("") || "(제목 없음)";
      break;
    }
  }

  const statusName = props["상태"]?.select?.name ?? "대기 중";
  const priorityName = props["우선순위"]?.select?.name ?? "보통";
  const categories: TaskCategory[] = (props["카테고리"]?.multi_select ?? []).map(
    (o: { name: string }) => o.name as TaskCategory
  );
  const description =
    props["설명"]?.rich_text?.map((t: { plain_text: string }) => t.plain_text).join("") ?? "";
  const dueDate = props["마감일"]?.date?.start ?? null;
  const people = props["담당자"]?.people ?? [];
  const assignee = people.length > 0
    ? people.map((p: { name?: string }) => p.name ?? "").join(", ")
    : "-";

  return {
    id: page.id,
    title,
    status: statusName as TaskStatus,
    priority: priorityName as TaskPriority,
    categories,
    description,
    dueDate,
    assignee,
    createdAt: page.created_time,
    notionUrl: page.url,
  };
}

export async function fetchAllTasks(): Promise<PTWTask[]> {
  const res = await notion.databases.query({
    database_id: DB_ID,
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 100,
  });
  return res.results.map(pageToTask);
}

export async function fetchTasksByStatus(status: TaskStatus): Promise<PTWTask[]> {
  const res = await notion.databases.query({
    database_id: DB_ID,
    filter: { property: "상태", select: { equals: status } },
    sorts: [{ property: "우선순위", direction: "ascending" }],
    page_size: 50,
  });
  return res.results.map(pageToTask);
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<PTWTask> {
  const page = await notion.pages.update({
    page_id: taskId,
    properties: { 상태: { select: { name: status } } },
  });
  return pageToTask(page);
}

/** 태스크 페이지 본문에 실행 로그 추가 */
export async function appendTaskLog(taskId: string, log: string): Promise<void> {
  await notion.blocks.children.append({
    block_id: taskId,
    children: [
      {
        type: "callout",
        callout: {
          rich_text: [{ type: "text", text: { content: `[${new Date().toLocaleString("ko-KR")}]\n${log}` } }],
          icon: { type: "emoji", emoji: "🤖" },
          color: "gray_background",
        },
      },
    ],
  });
}

/** 개선사항 태스크를 DB에 신규 등록 (동일 제목 존재 시 null 반환) */
export async function createImprovementTask(
  title: string,
  description: string,
  priority: TaskPriority,
  categories: TaskCategory[]
): Promise<PTWTask | null> {
  // Notion 수준 중복 체크 — 같은 제목의 태스크가 이미 있으면 스킵
  const dupCheck = await notion.databases.query({
    database_id: DB_ID,
    filter: { property: "이름", title: { equals: title } },
    page_size: 1,
  });
  if (dupCheck.results.length > 0) {
    console.log(`[notion] 중복 태스크 스킵: "${title}"`);
    return null;
  }

  const page = await notion.pages.create({
    parent: { database_id: DB_ID },
    properties: {
      이름: { title: [{ text: { content: title } }] },
      상태: { select: { name: "대기 중" } },
      우선순위: { select: { name: priority } },
      카테고리: { multi_select: categories.map((c) => ({ name: c })) },
      설명: { rich_text: [{ text: { content: description } }] },
    },
  });
  return pageToTask(page);
}
