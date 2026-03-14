require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { spawn } = require('child_process');
const cronParser = require('cron-parser');
const fs = require('fs');
const os = require('os');
const path = require('path');
const db = require('./db');

// 加载用户配置，如果不存在则使用默认配置
const userConfigPath = path.join(os.homedir(), '.config', 'discord-bot', 'config.json');
let userConfig = {};
try {
  if (fs.existsSync(userConfigPath)) {
    userConfig = JSON.parse(fs.readFileSync(userConfigPath, 'utf8'));
  }
} catch (e) {
  console.log('[config] 读取用户配置失败，使用默认配置');
}

// 合并默认配置和用户配置
const config = {
  timezone: 'Asia/Shanghai',
  scheduleCheckInterval: 60000,
  messagePollInterval: 2000,
  ...userConfig,
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

let isProcessing = false;

client.once('clientReady', async () => {
  console.log(`机器人已上线！登录身份：${client.user.tag}`);
  
  // 清空未完成的消息
  db.clearPendingMessages();
  isProcessing = false;
  
  // 启动消息队列轮询
  startPolling();
  
  // 启动定时任务检查
  startScheduledTaskChecker();
});

client.on('messageCreate', async message => {
  // 忽略机器人消息
  if (message.author.bot) return;

  // 只处理私聊消息
  if (message.guild) return;

  // 处理命令
  if (message.content.startsWith('!')) {
    const command = message.content.slice(1).toLowerCase();
    
    if (command === 'reset') {
      db.clearPendingMessages();
      await message.reply('队列已清空。');
    } else if (command === 'status') {
      const processing = db.hasProcessingMessage();
      await message.reply(`状态: ${isProcessing ? '处理中' : '空闲'}\n队列中有处理中消息: ${processing ? '是' : '否'}`);
    } else if (command === 'tasks') {
      const tasks = db.getUserTasks(message.author.id);
      if (tasks.length === 0) {
        await message.reply('你还没有设置任何定时任务。');
      } else {
        const taskList = tasks.map(t => 
          `${t.id}. ${t.task_content} (${t.is_repeat ? '重复' : '一次性'}) - 下次: ${t.next_run_time}`
        ).join('\n');
        await message.reply(`你的定时任务:\n${taskList}`);
      }
    } else if (command.startsWith('cancel ')) {
      const taskId = parseInt(command.split(' ')[1]);
      if (isNaN(taskId)) {
        await message.reply('请提供正确的任务ID，如: !cancel 1');
      } else {
        db.deleteTask(taskId);
        await message.reply(`任务 ${taskId} 已删除。`);
      }
    } else if (command === 'help') {
      await message.reply('可用命令：\n!reset - 清空队列\n!status - 查看状态\n!tasks - 查看定时任务\n!cancel <id> - 删除定时任务\n!help - 显示帮助\n\n直接发送消息，我会帮你处理。');
    } else {
      await message.reply('未知命令。输入 !help 查看可用命令。');
    }
    return;
  }
  
  // 将消息存入数据库队列
  try {
    const msgId = db.addMessage(message.author.id, message.channel.id, message.content);
    console.log(`消息已存入队列 ID: ${msgId}, 来自用户: ${message.author.tag}`);
  } catch (error) {
    console.error('存入消息失败:', error);
    await message.reply('抱歉，处理消息时出错，请稍后重试。');
  }
});

// 轮询处理消息队列
function startPolling() {
  setInterval(async () => {
    if (isProcessing || db.hasProcessingMessage()) return;
    
    const message = db.getPendingMessage();
    if (message) await processMessage(message);
  }, 2000);
}

// 检查定时任务
function startScheduledTaskChecker() {
  setInterval(async () => {
    const dueTasks = db.getDueTasks();
    
    for (const task of dueTasks) {
      console.log(`[定时任务] 执行任务 ${task.id}: ${task.task_content}`);
      
      // 插入消息队列
      db.addMessage(task.user_id, task.channel_id, task.task_content);
      
      // 更新下次执行时间（如果是重复任务）
      if (task.is_repeat && task.cron_expression) {
        const nextTime = calculateNextRunTime(task.cron_expression);
        db.updateNextRunTime(task.id, task.cron_expression, nextTime);
      } else {
        // 一次性任务，禁用
        db.disableTask(task.id);
      }
    }
  }, 60000); // 每分钟检查
}

// 根据 cron 表达式计算下次执行时间（使用 cron-parser，支持时区）
function calculateNextRunTime(cron) {
  try {
    const interval = cronParser.parseExpression(cron, {
      tz: config.timezone,
    });
    const next = interval.next().toDate();
    return formatDateTime(next);
  } catch (error) {
    console.error('[calculateNextRunTime] 解析 cron 失败:', error.message);
    return null;
  }
}

// 格式化日期时间为字符串
function formatDateTime(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// 处理单条消息
async function processMessage(message) {
  isProcessing = true;
  console.log(`[开始处理] 消息 ID: ${message.id}, 用户: ${message.user_id}`);
  
  try {
    db.markAsProcessing(message.id);
    
    const channel = await client.channels.fetch(message.channel_id);
    if (!channel) throw new Error('无法找到频道');

    // 获取用户 session
    const userSessionId = db.getUserSession(message.user_id);
    if (userSessionId) {
      console.log(`[使用 Session] ${userSessionId}`);
    }

    // 执行 opencode run
    console.log(`[执行 opencode] 消息 ID: ${message.id}`);
    const result = await runOpencode(message.content, userSessionId);
    console.log(`[执行完成] 结果长度: ${result.text.length}`);
    
    // 保存 session
    if (result.sessionId) {
      db.setUserSession(message.user_id, result.sessionId);
      console.log(`[保存 Session] ${result.sessionId}`);
    }
    
    await channel.send(result.text);
    db.markAsCompleted(message.id);
    console.log(`[处理完成] 消息 ID: ${message.id}`);
    
  } catch (error) {
    console.error(`[处理失败] 消息 ID: ${message.id}:`, error);
    try {
      const channel = await client.channels.fetch(message.channel_id);
      if (channel) await channel.send(`处理消息时出错: ${error.message}`);
    } catch (e) {}
    db.markAsCompleted(message.id);
  } finally {
    isProcessing = false;
  }
}

// 调用 opencode run
function runOpencode(prompt, sessionId = null) {
  return new Promise((resolve, reject) => {
    let finished = false;
    
    const args = ['run', '--format', 'json', prompt];
    if (sessionId) args.push('--session', sessionId);
    
    const childProcess = spawn('opencode', args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    let newSessionId = sessionId;

    childProcess.stdout.on('data', (data) => { stdout += data.toString(); });
    childProcess.stderr.on('data', (data) => { stderr += data.toString(); });

    childProcess.on('close', (code) => {
      if (finished) return;
      finished = true;
      
      if (code === 0) {
        let text = '';
        for (const line of stdout.trim().split('\n')) {
          try {
            const json = JSON.parse(line);
            if (!newSessionId && json.sessionID) newSessionId = json.sessionID;
            if (json.type === 'text' && json.part?.text) text += json.part.text;
          } catch (e) {}
        }
        resolve({ text: text || '处理完成', sessionId: newSessionId });
      } else {
        reject(new Error(stderr.trim() || `进程退出码: ${code}`));
      }
    });

    childProcess.on('error', (error) => {
      if (!finished) {
        finished = true;
        reject(new Error(`执行opencode失败: ${error.message}`));
      }
    });
  });
}

client.on('error', error => console.error('机器人发生错误：', error));

// 启动机器人
function startBot() {
  return client.login(process.env.DISCORD_TOKEN)
    .then(() => {
      console.log('正在登录 Discord...');
      return client;
    })
    .catch(error => {
      console.error('登录失败：', error);
      throw error;
    });
}

module.exports = { startBot };

// 如果直接运行此文件，则启动机器人
if (require.main === module) {
  startBot();
}
