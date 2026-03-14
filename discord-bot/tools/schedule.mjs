import { tool } from "@opencode-ai/plugin";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import os from "os";
import cronParser from "cron-parser";

// 加载用户配置
const userConfigPath = path.join(os.homedir(), ".config", "discord-bot", "config.json");
let userConfig = {};
try {
  if (fs.existsSync(userConfigPath)) {
    userConfig = JSON.parse(fs.readFileSync(userConfigPath, "utf8"));
  }
} catch (e) {
  // 使用默认配置
}

const config = {
  timezone: "Asia/Shanghai",
  ...userConfig,
};

const dbPath = path.join(process.cwd(), ".discord-bot.db");
const db = new Database(dbPath);

// 启用 WAL 模式和忙等待超时，避免并发冲突
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

// 使用 cron-parser 计算下次执行时间
function calculateNextRunTime(cron) {
  try {
    const interval = cronParser.CronExpressionParser.parse(cron, {
      tz: config.timezone,
    });
    const next = interval.next().toDate();
    return formatDateTime(next);
  } catch (error) {
    console.error("[schedule] 解析 cron 失败:", error.message);
    return null;
  }
}

// 格式化日期时间为字符串
function formatDateTime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// 从环境变量获取用户信息（由 Discord Bot 注入）
function getContext() {
  return {
    userId: process.env.DISCORD_USER_ID || null,
    channelId: process.env.DISCORD_CHANNEL_ID || null
  };
}

export const create = tool({
  description: "创建一个定时任务。系统会自动获取当前用户信息，你只需要提供任务内容和执行时间。",
  args: {
    cron_expression: tool.schema.string().describe("cron 表达式，如 '0 8 * * *' (每天8点)"),
    task_content: tool.schema.string().describe("任务内容/提醒内容，如 '提醒我喝水'"),
    is_repeat: tool.schema.boolean().describe("是否重复执行（true=每天/每周等循环，false=只执行一次）"),
  },
  async execute(args) {
    const { cron_expression, task_content, is_repeat } = args;
    const { userId, channelId } = getContext();

    if (!userId || !channelId) {
      return { success: false, message: "无法获取用户信息，请在 Discord 私聊中使用此功能" };
    }

    // 验证 cron 表达式并计算下次执行时间
    const nextRunTime = calculateNextRunTime(cron_expression);
    if (!nextRunTime) {
      return { success: false, message: `无效的 cron 表达式: ${cron_expression}` };
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO scheduled_tasks (user_id, channel_id, task_content, cron_expression, next_run_time, is_repeat)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(userId, channelId, task_content, cron_expression, nextRunTime, is_repeat ? 1 : 0);

      return {
        success: true,
        message: `定时任务已创建！\n任务ID: ${result.lastInsertRowid}\ncron: ${cron_expression}\n内容: ${task_content}\n下次执行: ${nextRunTime} (${config.timezone})`,
        task_id: result.lastInsertRowid
      };
    } catch (error) {
      return { success: false, message: `创建失败: ${error.message}` };
    }
  },
});

export const list = tool({
  description: "列出当前用户的所有定时任务",
  args: {},
  async execute(args) {
    const { userId } = getContext();

    if (!userId) {
      return { success: false, message: "无法获取用户信息，请在 Discord 私聊中使用此功能" };
    }

    try {
      const stmt = db.prepare("SELECT * FROM scheduled_tasks WHERE user_id = ? ORDER BY created_at DESC");
      const tasks = stmt.all(userId);

      if (tasks.length === 0) {
        return { success: true, message: "暂无定时任务", tasks: [] };
      }

      const taskList = tasks.map(t =>
        `${t.id}. ${t.task_content} (${t.is_repeat ? "重复" : "一次性"}) - 下次: ${t.next_run_time}`
      ).join("\n");

      return {
        success: true,
        message: `你的定时任务:\n${taskList}`,
        tasks: tasks
      };
    } catch (error) {
      return { success: false, message: `查询失败: ${error.message}` };
    }
  },
});

export const del = tool({
  description: "删除指定ID的定时任务",
  args: {
    task_id: tool.schema.string().describe("要删除的任务ID"),
  },
  async execute(args) {
    const { task_id } = args;

    try {
      const result = db.prepare("DELETE FROM scheduled_tasks WHERE id = ?").run(task_id);
      if (result.changes === 0) {
        return { success: false, message: `未找到任务 ${task_id}` };
      }
      return { success: true, message: `任务 ${task_id} 已删除` };
    } catch (error) {
      return { success: false, message: `删除失败: ${error.message}` };
    }
  },
});
