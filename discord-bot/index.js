require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { spawn } = require('child_process');
const cronParser = require('cron-parser');
const fs = require('fs');
const os = require('os');
const path = require('path');
const db = require('./db');

// 加载用户配置
const userConfigPath = path.join(os.homedir(), '.config', 'discord-bot', 'config.json');
let userConfig = {};
try {
  if (fs.existsSync(userConfigPath)) {
    userConfig = JSON.parse(fs.readFileSync(userConfigPath, 'utf8'));
  }
} catch (e) {
  console.log('[config] 读取用户配置失败，使用默认配置');
}

const config = {
  timezone: 'Asia/Shanghai',
  messagePollInterval: 2000,
  scheduleCheckInterval: 60000,
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
  }, config.messagePollInterval);
}

// 定时任务检查（每分钟）
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
  }, config.scheduleCheckInterval);
}

// 根据 cron 表达式计算下次执行时间
function calculateNextRunTime(cron) {
  try {
    const interval = cronParser.CronExpressionParser.parse(cron, { tz: config.timezone });
    return formatDateTime(interval.next().toDate());
  } catch (e) {
    console.error('[calculateNextRunTime] 解析 cron 失败:', e.message);
    return null;
  }
}

// 格式化日期时间
function formatDateTime(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// 处理单条消息
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
      env: { ...process.env, SKILL_PATH: path.join(process.cwd(), '.opencode', 'tools') },
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

// 获取 token：优先配置文件，其次环境变量
const TOKEN = config.token || process.env.DISCORD_TOKEN;

// 启动机器人
function startBot() {
  return client.login(TOKEN)
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
