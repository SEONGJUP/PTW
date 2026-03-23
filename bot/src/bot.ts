import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  TextChannel,
  Events,
  Interaction,
  EmbedBuilder,
} from "discord.js";
import {
  fetchAllTasks,
  fetchTasksByStatus,
  updateTaskStatus,
  appendTaskLog,
  createImprovementTask,
  type PTWTask,
  type TaskStatus,
} from "./notion";
import {
  newTaskEmbed,
  statusChangeEmbed,
  summaryEmbed,
  taskEmbed,
  taskActionRow,
} from "./embeds";
import { executeTask, generateProjectIdeas, type ImprovementItem } from "./executor";

const TOKEN = process.env.DISCORD_BOT_TOKEN!;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID!;
const POLL_MS = parseInt(process.env.POLL_INTERVAL_MS ?? "180000", 10);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// 이미 알림을 보낸 task ID + 마지막 상태 캐시
const seenTasks = new Map<string, TaskStatus>();
// 등록된 태스크 제목 캐시 (개선사항 중복 방지)
const seenTitles = new Set<string>();
// 자동 실행 중인 task ID (중복 방지)
const executingTasks = new Set<string>();

const AUTO_EXECUTE = process.env.AUTO_EXECUTE === "true";
const IDEA_GEN_COOLDOWN_MS = 15 * 60 * 1000; // 15분 쿨다운
let lastIdeaGenTime = 0;

// ─── 헬퍼 ────────────────────────────────────────────────────────

async function getChannel(): Promise<TextChannel | null> {
  const ch = await client.channels.fetch(CHANNEL_ID).catch(() => null);
  return ch instanceof TextChannel ? ch : null;
}

// ─── 피드백 루프: 노션 폴링 ──────────────────────────────────────

async function pollNotion() {
  const ch = await getChannel();
  if (!ch) {
    console.error("[poll] 채널을 찾을 수 없습니다:", CHANNEL_ID);
    return;
  }

  let tasks: PTWTask[];
  try {
    tasks = await fetchAllTasks();
  } catch (e) {
    console.error("[poll] Notion 조회 실패:", e);
    return;
  }

  for (const task of tasks) {
    const prev = seenTasks.get(task.id);

    if (!prev) {
      // 신규 태스크 감지
      seenTasks.set(task.id, task.status);
      seenTitles.add(task.title);

      if (task.status === "대기 중") {
        // 새 "대기 중" 작업 → 알림 + 액션 버튼
        await ch.send({
          embeds: [newTaskEmbed(task)],
          components: [taskActionRow(task.id)],
        });
        console.log(`[poll] 새 작업 알림: ${task.title}`);

        // 자동 실행 모드 ON → 즉시 처리
        if (AUTO_EXECUTE && !executingTasks.has(task.id)) {
          autoRunTask(task, ch).catch(console.error);
        }
      }
    } else if (prev !== task.status) {
      // 상태 변경 감지
      const prevStatus = prev;
      seenTasks.set(task.id, task.status);

      await ch.send({
        embeds: [statusChangeEmbed(task, prevStatus)],
      });
      console.log(`[poll] 상태 변경: ${task.title} (${prevStatus} → ${task.status})`);

      // ── 완료 감지 → 개선점 자동 도출 (autoRunTask 미거침 수동 완료 시만) ──
      if (task.status === "완료" && prevStatus !== "완료" && !executingTasks.has(task.id)) {
        generateImprovements(task, ch).catch(console.error);
      }
    }
  }

  // ── 진행 가능한 업무 없으면 신규 아이디어 자동 생성 ──
  const activeTasks = tasks.filter((t) => t.status === "대기 중" || t.status === "진행 중");
  if (AUTO_EXECUTE && activeTasks.length === 0 && executingTasks.size === 0) {
    autoGenerateIdeas(tasks, ch).catch(console.error);
  }
}

// ─── 진행 가능한 업무 없을 때 아이디어 자동 생성 ─────────────────

async function autoGenerateIdeas(allTasks: PTWTask[], ch: TextChannel) {
  const now = Date.now();
  if (now - lastIdeaGenTime < IDEA_GEN_COOLDOWN_MS) return;
  lastIdeaGenTime = now;

  console.log("[ideas] 진행 가능한 업무 없음 → 신규 아이디어 생성 중...");

  try {
    const completed = allTasks.filter((t) => t.status === "완료" || t.status === "취소");
    const ideas = await generateProjectIdeas(completed);

    if (!ideas || ideas.length === 0) {
      console.log("[ideas] 생성된 아이디어 없음");
      return;
    }

    // in-memory seenTitles 체크 — 이미 알려진 제목은 Notion API 호출 없이 스킵
    const newIdeas = ideas.filter((idea) => !seenTitles.has(idea.title));
    if (newIdeas.length === 0) {
      console.log("[ideas] 모두 기존 태스크와 중복 — 스킵");
      return;
    }

    const created = [];
    for (const idea of newIdeas) {
      const task = await createImprovementTask(idea.title, idea.description, idea.priority, idea.categories);
      if (!task) continue; // Notion 수준 중복 → 스킵
      seenTitles.add(idea.title);
      created.push(task);
      console.log(`[ideas] 신규 등록: ${idea.title}`);
    }

    await ch.send({
      embeds: [
        new EmbedBuilder()
          .setTitle(`💡 신규 업무 자동 생성 — ${created.length}건`)
          .setColor(0x6366f1)
          .setDescription("진행 가능한 업무가 없어 PTW 프로젝트 개선 아이디어를 자동 생성했습니다.")
          .addFields(
            ...created.map((t, i) => ({
              name: `${i + 1}. ${t.title}`,
              value: `우선순위: ${t.priority} | [Notion](${t.notionUrl})`,
            }))
          )
          .setFooter({ text: "PTW Bot · 자동 아이디어 생성 (쿨다운 15분)" })
          .setTimestamp(),
      ],
    });
  } catch (e) {
    console.error("[ideas] 오류:", e);
  }
}

// ─── 완료 후 개선점 등록 & Discord 보고 ─────────────────────────
// precomputed: autoRunTask에서 이미 계산된 improvements 직접 전달
// fallback: 수동 완료 시 executeTask 재호출

async function postImprovements(
  completedTask: PTWTask,
  improvements: ImprovementItem[],
  ch: TextChannel
) {
  if (!improvements || improvements.length === 0) return;

  // 기존 등록된 태스크 제목과 중복 제거
  const existingTitles = new Set(
    [...seenTasks.keys()].map((id) => id) // id 기반이라 제목 직접 추적 필요
  );
  // seenTitles: 폴링에서 수집된 실제 태스크 제목 캐시
  const deduped = improvements.filter((imp) => !seenTitles.has(imp.title));

  if (deduped.length === 0) {
    console.log(`[improve] 모두 중복 — 등록 스킵: ${completedTask.title}`);
    return;
  }

  const created = [];
  for (const imp of deduped) {
    try {
      const newTask = await createImprovementTask(imp.title, imp.description, imp.priority, imp.categories);
      if (!newTask) continue; // Notion 수준 중복 → 스킵
      created.push(newTask);
      seenTitles.add(imp.title); // 즉시 중복 방지 등록
      console.log(`[improve] 신규 등록: ${imp.title}`);
    } catch (e) {
      console.error(`[improve] 등록 실패 (${imp.title}):`, e);
    }
  }

  if (created.length === 0) return;

  const logText = deduped.map((i, n) => `${n + 1}. ${i.title}\n   ${i.description}`).join("\n\n");
  await appendTaskLog(completedTask.id, `완료 후 도출된 개선사항 ${created.length}건:\n\n${logText}`).catch(() => {});

  await ch.send({
    embeds: [
      new EmbedBuilder()
        .setTitle(`🔄 개선사항 등록: ${completedTask.title.slice(0, 40)}`)
        .setColor(0x00b7af)
        .setDescription(`**${created.length}건** Task DB에 등록됨`)
        .addFields(
          ...created.map((t, i) => ({
            name: `${i + 1}. ${t.title}`,
            value: `${t.priority} | [Notion](${t.notionUrl})`,
          }))
        )
        .setFooter({ text: "PTW Bot · 피드백 루프" })
        .setTimestamp(),
    ],
  });
}

async function generateImprovements(completedTask: PTWTask, ch: TextChannel) {
  // 수동 완료(버튼·명령어)된 태스크에만 사용 — executeTask 호출해 improvements 추출
  try {
    const { improvements } = await executeTask(completedTask);
    await postImprovements(completedTask, improvements, ch);
  } catch (e) {
    console.error(`[improve] 오류 (${completedTask.title}):`, e);
  }
}

// ─── 자동 태스크 실행 ────────────────────────────────────────────

async function autoRunTask(task: PTWTask, ch: TextChannel) {
  if (executingTasks.has(task.id)) return;
  executingTasks.add(task.id);

  try {
    // 1) "진행 중"으로 전환
    await updateTaskStatus(task.id, "진행 중");
    seenTasks.set(task.id, "진행 중");

    await ch.send({
      embeds: [
        new EmbedBuilder()
          .setTitle(`⚙️ 자동 실행 시작: ${task.title}`)
          .setColor(0xf59e0b)
          .addFields(
            { name: "우선순위", value: task.priority, inline: true },
            { name: "카테고리", value: task.categories.join(", ") || "-", inline: true },
          )
          .setFooter({ text: "PTW Bot · AI 자동실행" })
          .setTimestamp(),
      ],
    });

    // 2) Claude API로 태스크 분석·실행
    console.log(`[auto] 실행 중: ${task.title}`);
    const result = await executeTask(task);

    // 3) 결과에 따라 Notion 상태 업데이트
    // needs_human = 사람이 직접 처리 필요 → "보류" 처리 (완료 아님 — 개선사항 생성 루프 방지)
    // complete = AI가 분석/기획으로 실제 완료 가능한 태스크만 "완료"
    const newStatus: TaskStatus =
      result.action === "complete" ? "완료" : "보류";

    await updateTaskStatus(task.id, newStatus);
    seenTasks.set(task.id, newStatus);

    // 4) Discord에 결과 보고
    const isHuman = result.action === "needs_human";
    const color = result.action === "complete" ? 0x10b981 : isHuman ? 0xf59e0b : 0x8b5cf6;
    const icon = result.action === "complete" ? "✅" : isHuman ? "🔧" : "⏸️";
    const actionLabel = result.action === "complete" ? "자동 완료" : isHuman ? "분석 완료 — 보류 (코드 구현 필요)" : "외부 의존성·보류";

    await ch.send({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${icon} 실행 결과: ${task.title}`)
          .setColor(color)
          .setDescription(`\`\`\`${result.summary}\`\`\``)
          .addFields(
            { name: "처리 내용", value: result.detail.slice(0, 800) || "-" },
            { name: "처리 유형", value: actionLabel, inline: true },
            { name: "Notion 상태", value: `→ **${newStatus}**`, inline: true },
          )
          .setURL(task.notionUrl)
          .setFooter({ text: "PTW Bot · AI 자동실행" })
          .setTimestamp(),
      ],
    });

    console.log(`[auto] 완료: ${task.title} → ${newStatus} (${result.action})`);

    // 5) 완료 시 개선사항 즉시 등록 — 이미 계산된 result.improvements 재사용 (재실행 없음)
    if (newStatus === "완료" && result.improvements.length > 0) {
      postImprovements({ ...task, status: "완료" }, result.improvements, ch).catch(console.error);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[auto] 오류 (${task.title}):`, msg);
    await updateTaskStatus(task.id, "보류");
    seenTasks.set(task.id, "보류");
    await ch.send(`⚠️ **${task.title}** 자동 실행 중 오류 발생 → 보류 처리\n\`${msg.slice(0, 200)}\``);
  } finally {
    executingTasks.delete(task.id);
  }
}

// ─── 버튼 인터랙션 처리 ─────────────────────────────────────────

async function handleButton(interaction: Interaction) {
  if (!interaction.isButton()) return;

  const [action, ...idParts] = interaction.customId.split("_");
  const taskId = idParts.join("-");

  const statusMap: Record<string, TaskStatus> = {
    start: "진행 중",
    done: "완료",
    hold: "보류",
  };

  const newStatus = statusMap[action];
  if (!newStatus || !taskId) return;

  await interaction.deferReply({ ephemeral: true });

  try {
    const updated = await updateTaskStatus(taskId, newStatus);
    seenTasks.set(taskId, newStatus);

    await interaction.editReply({
      content: `✅ **${updated.title}** → \`${newStatus}\` 로 업데이트했습니다.`,
    });

    // 채널에도 상태 변경 보고
    const ch = await getChannel();
    if (ch) {
      await ch.send({ embeds: [taskEmbed(updated, `🔄 상태 업데이트: ${updated.title}`)] });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await interaction.editReply({ content: `❌ 업데이트 실패: ${msg}` });
  }
}

// ─── 메시지 명령어 ───────────────────────────────────────────────

async function handleMessage(message: { content: string; channel: TextChannel }) {
  const { content, channel } = message;
  if (!content.startsWith("!")) return;

  const [cmd, ...args] = content.slice(1).trim().split(/\s+/);

  switch (cmd.toLowerCase()) {
    case "tasks": {
      // !tasks [상태] — 작업 목록 출력
      const statusArg = args.join(" ") as TaskStatus | undefined;
      const tasks = statusArg
        ? await fetchTasksByStatus(statusArg)
        : await fetchAllTasks();

      if (tasks.length === 0) {
        await channel.send("조회된 작업이 없습니다.");
        return;
      }

      // 최대 5개까지만 상세 표시
      const display = tasks.slice(0, 5);
      for (const t of display) {
        await channel.send({ embeds: [taskEmbed(t)] });
      }
      if (tasks.length > 5) {
        await channel.send(`…외 ${tasks.length - 5}건 더 있습니다.`);
      }
      break;
    }

    case "pending": {
      // !pending — "대기 중" 작업 목록 + 버튼
      const pending = await fetchTasksByStatus("대기 중");
      if (pending.length === 0) {
        await channel.send("✅ 대기 중인 작업이 없습니다.");
        return;
      }
      for (const t of pending.slice(0, 5)) {
        await channel.send({
          embeds: [taskEmbed(t)],
          components: [taskActionRow(t.id)],
        });
      }
      break;
    }

    case "summary": {
      // !summary — 전체 현황 요약
      const all = await fetchAllTasks();
      await channel.send({ embeds: [summaryEmbed(all)] });
      break;
    }

    case "done": {
      // !done <task_id> — 완료 처리
      const taskId = args[0];
      if (!taskId) {
        await channel.send("사용법: `!done <task_id>`");
        return;
      }
      try {
        const updated = await updateTaskStatus(taskId, "완료");
        seenTasks.set(taskId, "완료");
        await channel.send({
          embeds: [taskEmbed(updated, `✅ 완료 처리: ${updated.title}`)],
        });
      } catch (e) {
        await channel.send(`❌ 실패: ${e instanceof Error ? e.message : e}`);
      }
      break;
    }

    case "start": {
      // !start <task_id> — 진행 중으로 변경
      const taskId = args[0];
      if (!taskId) {
        await channel.send("사용법: `!start <task_id>`");
        return;
      }
      try {
        const updated = await updateTaskStatus(taskId, "진행 중");
        seenTasks.set(taskId, "진행 중");
        await channel.send({
          embeds: [taskEmbed(updated, `⚙️ 작업 시작: ${updated.title}`)],
        });
      } catch (e) {
        await channel.send(`❌ 실패: ${e instanceof Error ? e.message : e}`);
      }
      break;
    }

    case "run": {
      // !run — 대기 중 태스크 전체 자동 실행
      const pending = await fetchTasksByStatus("대기 중");
      if (pending.length === 0) {
        await channel.send("✅ 대기 중인 작업이 없습니다.");
        return;
      }
      await channel.send(`🤖 **${pending.length}건** 자동 실행 시작...`);
      for (const t of pending) {
        autoRunTask(t, channel).catch(console.error);
        await new Promise((r) => setTimeout(r, 1500)); // 순차 딜레이
      }
      break;
    }

    case "run1": {
      // !run1 <task_id> — 특정 태스크 수동 실행
      const taskId = args[0];
      if (!taskId) {
        await channel.send("사용법: `!run1 <task_id>`");
        return;
      }
      const all = await fetchAllTasks();
      const task = all.find((t) => t.id.startsWith(taskId) || t.id.replace(/-/g, "").startsWith(taskId));
      if (!task) {
        await channel.send(`❌ 태스크를 찾을 수 없습니다: ${taskId}`);
        return;
      }
      autoRunTask(task, channel).catch(console.error);
      break;
    }

    case "help": {
      await channel.send(
        [
          "**PTW Bot 명령어**",
          "`!tasks [상태]` — 작업 목록 (예: `!tasks 대기 중`)",
          "`!pending` — 대기 중 작업 + 처리 버튼",
          "`!summary` — 전체 현황 요약",
          "`!start <id>` — 작업 진행 중으로 변경",
          "`!done <id>` — 작업 완료 처리",
          "`!run` — 🤖 대기 중 태스크 전체 AI 자동 실행",
          "`!run1 <id>` — 🤖 특정 태스크 AI 자동 실행",
          "",
          `🔄 자동 폴링: ${POLL_MS / 1000}초 마다 Notion 동기화`,
          `🤖 AUTO_EXECUTE: ${AUTO_EXECUTE ? "ON" : "OFF"}`,
        ].join("\n")
      );
      break;
    }
  }
}

// ─── 봇 이벤트 ───────────────────────────────────────────────────

client.once(Events.ClientReady, async (c) => {
  console.log(`✅ 봇 로그인: ${c.user.tag}`);

  const ch = await getChannel();
  if (!ch) {
    console.error("채널 접근 불가:", CHANNEL_ID);
    return;
  }

  // 시작 메시지
  await ch.send({
    embeds: [
      {
        title: "🥯 PTW Bot 시작",
        description: `Notion Task DB 연동 완료. ${POLL_MS / 1000}초 간격으로 폴링합니다.\n\`!help\` 로 명령어 확인`,
        color: 0x3b82f6,
        timestamp: new Date().toISOString(),
        footer: { text: "PTW Bot" },
      },
    ],
  });

  // 초기 현황 요약
  const tasks = await fetchAllTasks();
  for (const t of tasks) {
    seenTasks.set(t.id, t.status);
    seenTitles.add(t.title); // 기존 태스크 제목 캐시 (중복 방지)
  }
  await ch.send({ embeds: [summaryEmbed(tasks)] });

  const pendingTasks = tasks.filter((t) => t.status === "대기 중");
  const stuckTasks = tasks.filter((t) => t.status === "진행 중");
  console.log(`[ready] 기존 작업 ${tasks.length}건 캐시 완료 (대기 중: ${pendingTasks.length}건, 진행 중 stuck: ${stuckTasks.length}건)`);

  // stuck "진행 중" 태스크는 자동 재실행하지 않음 — 중복 개선사항 생성 방지
  // Discord에 수동 확인 요청 알림만 전송
  if (stuckTasks.length > 0) {
    await ch.send({
      embeds: [
        new EmbedBuilder()
          .setTitle(`⚠️ 진행 중 상태 태스크 ${stuckTasks.length}건 — 수동 확인 필요`)
          .setColor(0xf59e0b)
          .setDescription(
            stuckTasks.map((t, i) => `${i + 1}. ${t.title}`).join("\n") +
            "\n\n`!run1 <id>` 로 특정 태스크를 수동 실행하거나, `!done <id>` 로 완료 처리하세요."
          )
          .setFooter({ text: "PTW Bot · 재시작 후 stuck 태스크 감지" })
          .setTimestamp(),
      ],
    });
  }

  // 시작 시 대기 중 태스크만 자동 실행 (stuck 제외)
  if (AUTO_EXECUTE && pendingTasks.length > 0) {
    await ch.send({
      embeds: [
        new EmbedBuilder()
          .setTitle(`🤖 자동 실행 시작 — ${pendingTasks.length}건 처리`)
          .setColor(0x00b7af)
          .setDescription(`**대기 중 ${pendingTasks.length}건:**\n` + pendingTasks.map((t, i) => `${i + 1}. ${t.title}`).join("\n"))
          .setFooter({ text: "PTW Bot · AUTO_EXECUTE=true" })
          .setTimestamp(),
      ],
    });

    for (const task of pendingTasks) {
      await new Promise((r) => setTimeout(r, 2000)); // 순차 딜레이
      autoRunTask(task, ch).catch(console.error);
    }
  }

  // 폴링 시작
  setInterval(pollNotion, POLL_MS);
});

client.on(Events.InteractionCreate, handleButton);

client.on(Events.MessageCreate, (msg) => {
  if (msg.author.bot) return;
  if (!(msg.channel instanceof TextChannel)) return;
  handleMessage({ content: msg.content, channel: msg.channel }).catch(console.error);
});

client.on(Events.Error, (err) => {
  console.error("[discord error]", err);
});

// ─── 시작 ────────────────────────────────────────────────────────
client.login(TOKEN).catch((err) => {
  console.error("봇 로그인 실패:", err.message);
  process.exit(1);
});
