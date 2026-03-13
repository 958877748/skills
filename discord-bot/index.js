require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { spawn } = require('child_process');
const db = require('./db');

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
    } else if (command === 'help') {
      await message.reply('可用命令：\n!reset - 清空队列\n!status - 查看状态\n!help - 显示帮助\n\n直接发送消息，我会帮你处理。');
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
    const timeout = 120000;
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

    setTimeout(() => {
      if (!finished) {
        finished = true;
        childProcess.kill('SIGTERM');
        reject(new Error('处理超时'));
      }
    }, timeout);
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
