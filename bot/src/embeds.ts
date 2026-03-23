import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { PTWTask, TaskStatus } from "./notion";

const PRIORITY_EMOJI: Record<string, string> = { 높음: "🔴", 보통: "🟡", 낮음: "🟢" };
const STATUS_EMOJI: Record<string, string> = {
  "대기 중": "📋",
  "진행 중": "⚙️",
  완료: "✅",
  보류: "⏸️",
  취소: "❌",
};
const STATUS_COLOR: Record<string, number> = {
  "대기 중": 0x6b7280,
  "진행 중": 0xf59e0b,
  완료: 0x10b981,
  보류: 0x8b5cf6,
  취소: 0xef4444,
};

export function taskEmbed(task: PTWTask, title?: string): EmbedBuilder {
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "완료";

  return new EmbedBuilder()
    .setTitle(title ?? `${STATUS_EMOJI[task.status]} ${task.title}`)
    .setURL(task.notionUrl)
    .setColor(STATUS_COLOR[task.status] as number)
    .addFields(
      { name: "상태", value: `${STATUS_EMOJI[task.status]} ${task.status}`, inline: true },
      {
        name: "우선순위",
        value: `${PRIORITY_EMOJI[task.priority]} ${task.priority}`,
        inline: true,
      },
      {
        name: "카테고리",
        value: task.categories.length > 0 ? task.categories.join(", ") : "-",
        inline: true,
      },
      { name: "담당자", value: task.assignee, inline: true },
      {
        name: "마감일",
        value: task.dueDate
          ? `${task.dueDate}${isOverdue ? "  ⚠️ 기한 초과" : ""}`
          : "없음",
        inline: true,
      },
      ...(task.description ? [{ name: "설명", value: task.description.slice(0, 300) }] : [])
    )
    .setFooter({ text: `ID: ${task.id.slice(0, 8)}… · PTW Bot` })
    .setTimestamp(new Date(task.createdAt));
}

export function newTaskEmbed(task: PTWTask): EmbedBuilder {
  return taskEmbed(task, `📬 새 작업 등록: ${task.title}`).setDescription(
    "Notion에 새 작업이 등록되었습니다."
  );
}

export function statusChangeEmbed(
  task: PTWTask,
  prevStatus: TaskStatus
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`🔄 상태 변경: ${task.title}`)
    .setURL(task.notionUrl)
    .setColor(STATUS_COLOR[task.status] as number)
    .addFields(
      {
        name: "변경",
        value: `${STATUS_EMOJI[prevStatus]} ${prevStatus}  →  ${STATUS_EMOJI[task.status]} ${task.status}`,
      },
      { name: "담당자", value: task.assignee, inline: true },
      { name: "마감일", value: task.dueDate ?? "없음", inline: true }
    )
    .setFooter({ text: "PTW Bot" })
    .setTimestamp();
}

export function summaryEmbed(tasks: PTWTask[]): EmbedBuilder {
  const count = (s: string) => tasks.filter((t) => t.status === s).length;
  const overdue = tasks.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate) < new Date() &&
      t.status !== "완료" &&
      t.status !== "취소"
  ).length;

  return new EmbedBuilder()
    .setTitle("📊 PTW 작업 현황 요약")
    .setColor(0x6366f1)
    .addFields(
      { name: "📋 대기 중", value: String(count("대기 중")), inline: true },
      { name: "⚙️ 진행 중", value: String(count("진행 중")), inline: true },
      { name: "✅ 완료", value: String(count("완료")), inline: true },
      { name: "⏸️ 보류", value: String(count("보류")), inline: true },
      { name: "❌ 취소", value: String(count("취소")), inline: true },
      { name: "⚠️ 기한 초과", value: String(overdue), inline: true },
      { name: "전체", value: String(tasks.length), inline: true }
    )
    .setFooter({ text: "PTW Bot" })
    .setTimestamp();
}

export function taskActionRow(taskId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`start_${taskId}`)
      .setLabel("진행 중으로")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("⚙️"),
    new ButtonBuilder()
      .setCustomId(`done_${taskId}`)
      .setLabel("완료")
      .setStyle(ButtonStyle.Success)
      .setEmoji("✅"),
    new ButtonBuilder()
      .setCustomId(`hold_${taskId}`)
      .setLabel("보류")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("⏸️"),
    new ButtonBuilder()
      .setLabel("Notion 열기")
      .setStyle(ButtonStyle.Link)
      .setURL(`https://www.notion.so/${taskId.replace(/-/g, "")}`)
  );
}
