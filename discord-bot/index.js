require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Bree = require('bree');
const db = require('./db');
const { MockClient, startInteractiveInput, MOCK_CHANNEL } = require('./mock');

// 加载用户配置
const userConfigPath = path.join(os.homedir(), 'dm-bot', 'config.json');
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

// 创建Bree调度器实例
const bree = new Bree({
  root: false, // 禁用root目录检查
  logger: console,
  jobs: [], // 初始为空，后续从数据库加载
  errorHandler: (error, workerMetadata) => {
    console.error(`[Bree错误] 任务 ${workerMetadata.name} 执行失败:`, error);
  },
  workerMessageHandler: (name, message) => {
    console.log(`[Bree消息] 任务 ${name}:`, message);
  }
});

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
function startPolling(botClient = client) {
  setInterval(async () => {
    console.log(`[轮询] isProcessing: ${isProcessing}, hasProcessingMessage: ${db.hasProcessingMessage()}`);
    if (isProcessing || db.hasProcessingMessage()) return;
    
    const message = db.getPendingMessage();
    console.log(`[轮询] 取到的消息: ${message ? message.id : 'none'}`);
    if (message) await processMessage(message, botClient);
  }, config.messagePollInterval);
}

// 定时任务检查（使用Bree）
function startScheduledTaskChecker() {
  // 添加Bree事件监听
  bree.on('worker created', (name) => {
    console.log(`[Bree] Worker创建: ${name}`);
  });
  
  bree.on('worker deleted', (name) => {
    console.log(`[Bree] Worker删除: ${name}`);
  });
  
  // 首先从数据库加载任务到Bree
  loadTasksFromDatabaseToBree().then(() => {
    // 启动Bree调度器
    bree.start();
    console.log('[Bree] 调度器已启动');
  }).catch(error => {
    console.error('[Bree] 启动失败:', error);
    // 如果Bree启动失败，直接退出
    process.exit(1);
  });
  
  // 每分钟重新同步一次数据库任务到Bree，确保AI添加的任务能及时被调度
  // AI在其他线程执行CLI命令，会向数据库添加任务，需要定期同步到Bree
  setInterval(() => {
    loadTasksFromDatabaseToBree();
  }, 60 * 1000); // 每分钟同步一次，平衡及时性和数据库负载
}





// 从数据库加载任务到Bree
async function loadTasksFromDatabaseToBree() {
  try {
    console.log('[Bree] 开始从数据库加载任务...');
    
    // 获取所有启用的任务
    const tasks = db.getUserTasks('all'); // 这里需要修改db.js以支持获取所有任务
    
    // 清空现有的bree任务
    bree.config.jobs = [];
    
    // 将数据库任务转换为bree任务
    for (const task of tasks) {
      const jobConfig = {
        name: `task-${task.id}`,
        path: path.join(__dirname, 'jobs', 'discord-task.js'),
        worker: {
          workerData: {
            taskId: task.id,
            userId: task.user_id,
            channelId: task.channel_id,
            taskContent: task.task_content,
            taskType: 'schedule'
          }
        }
      };
      
      // 设置调度方式
      if (task.cron_expression) {
        // 使用cron表达式
        jobConfig.cron = task.cron_expression;
        jobConfig.timezone = config.timezone;
      } else if (task.next_run_time) {
        // 设置为特定时间执行（一次性任务）
        const nextRunDate = new Date(task.next_run_time);
        if (nextRunDate > new Date()) {
          jobConfig.date = nextRunDate;
        } else {
          // 如果时间已过，跳过此任务
          console.log(`[Bree] 任务 ${task.id} 的执行时间已过，跳过`);
          continue;
        }
      } else {
        // 默认立即执行
        jobConfig.timeout = 0;
      }
      
      // 添加到bree配置
      bree.config.jobs.push(jobConfig);
    }
    
    console.log(`[Bree] 已加载 ${bree.config.jobs.length} 个任务`);
    
    // 注意：Bree的reload方法可能不存在，但jobs配置已更新
    
  } catch (error) {
    console.error('[Bree] 从数据库加载任务失败:', error);
  }
}

// 添加延迟任务（15分钟后叫醒机器人）
async function addDelayedTask(userId, channelId, delayMinutes = 15, message = '机器人已叫醒！') {
  try {
    const jobName = `delayed-wake-${Date.now()}`;
    
    const jobConfig = {
      name: jobName,
      path: path.join(__dirname, 'jobs', 'wake-bot.js'),
      timeout: `${delayMinutes}m`, // 延迟指定分钟数
      worker: {
        workerData: {
          userId,
          channelId,
          message,
          taskType: 'delayed'
        }
      }
    };
    
    // 临时添加到bree
    await bree.add(jobConfig);
    
    // 启动这个任务
    await bree.start(jobName);
    
    console.log(`[Bree] 已创建延迟任务: ${delayMinutes}分钟后执行`);
    
    return { success: true, jobName };
  } catch (error) {
    console.error('[Bree] 创建延迟任务失败:', error);
    return { success: false, error: error.message };
  }
}

// 处理单条消息
// 处理单条消息
async function processMessage(message, botClient = client) {
  isProcessing = true;
  console.log(`[开始处理] 消息 ID: ${message.id}, 用户: ${message.user_id}`);
  
  try {
    db.markAsProcessing(message.id);
    
    const channel = await botClient.channels.fetch(message.channel_id);
    if (!channel) throw new Error('无法找到频道');

    // 获取用户 session
    const userSessionId = db.getUserSession(message.user_id);
    if (userSessionId) {
      console.log(`[使用 Session] ${userSessionId}`);
    }

    // 执行 opencode run，传入用户信息用于工具调用
    console.log(`[执行 opencode] 消息 ID: ${message.id}`);
    const result = await runOpencode(message.content, userSessionId, message.user_id, message.channel_id);
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
function runOpencode(prompt, sessionId = null, userId = null, channelId = null) {
  return new Promise((resolve, reject) => {
    let finished = false;
    
    const args = ['run', '--format', 'json', prompt];
    if (sessionId) args.push('--session', sessionId);
    
    // Windows 上需要通过 cmd 执行 npm 安装的命令
    const isWin = process.platform === 'win32';
    const spawnOptions = {
      cwd: process.cwd(),
      env: { 
        ...process.env, 
        SKILL_PATH: path.join(process.cwd(), '.opencode', 'tools'),
        // 传递用户信息给工具
        DISCORD_USER_ID: userId || '',
        DISCORD_CHANNEL_ID: channelId || ''
      },
      stdio: ['ignore', 'pipe', 'pipe']
    };
    
    let childProcess;
    console.log(`[调试] 准备执行 opencode: ${args.join(' ')}`);
    if (isWin) {
      // Windows: 使用 cmd.exe 执行 opencode
      childProcess = spawn('cmd.exe', ['/c', 'opencode', ...args], spawnOptions);
    } else {
      childProcess = spawn('opencode', args, spawnOptions);
    }

    let stdout = '';
    let stderr = '';
    let newSessionId = sessionId;

    childProcess.stdout.on('data', (data) => { 
      stdout += data.toString(); 
      console.log(`[调试 stdout] ${data.toString().substring(0, 300)}`);
    });
    childProcess.stderr.on('data', (data) => { 
      stderr += data.toString();
      console.log(`[调试 stderr] ${data.toString().substring(0, 300)}`);
    });

    childProcess.on('close', (code) => {
      if (finished) return;
      finished = true;
      
      // 打印 stderr 用于调试
      if (stderr.trim()) {
        console.log(`[调试] stderr: ${stderr}`);
      }
      
      // 打印 stdout 用于调试
      console.log(`[调试] stdout 长度: ${stdout.length}, exit code: ${code}`);
      if (stdout.trim()) {
        const stdoutPreview = stdout.substring(0, 1000);
        console.log(`[调试] stdout: ${stdoutPreview}`);
      }
      
      if (code === 0) {
        let text = '';
        const jsonLines = stdout.trim().split('\n');
        
        // 调试：打印所有 JSON 行的类型
        console.log(`[调试] 收到 ${jsonLines.length} 行 JSON 输出`);
        
        for (const line of jsonLines) {
          try {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            const json = JSON.parse(trimmedLine);
            if (!newSessionId && json.sessionID) newSessionId = json.sessionID;
            
            // 打印工具调用信息
            if (json.type === 'tool_use') {
              console.log(`[调试] 工具调用: ${json.part?.tool}`);
            }
            
            if (json.type === 'text' && json.part?.text) {
              console.log(`[调试] 文本输出: ${JSON.stringify(json.part.text).substring(0, 100)}`);
              text += json.part.text;
            }
          } catch (e) {
            // 非 JSON 行，可能是直接输出
            if (line.includes('你好') || line.includes('Hello') || line.includes('hello')) {
              console.log(`[调试] 捕获到直接输出: ${line.substring(0, 100)}`);
              text = line.trim();
            }
          }
        }
        resolve({ text: text || '处理完成', sessionId: newSessionId });
      } else {
        reject(new Error(stderr.trim() || `进程退出码: ${code}`));
      }
    });

    childProcess.on('error', (error) => {
      console.log(`[调试] opencode 进程错误: ${error.message}`);
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

// 是否为 mock 模式
let isMockMode = false;

// 启动机器人
function startBot(options = {}) {
  // 支持 options.mock 为 true/'non-interactive'
  const mockValue = options.mock;
  isMockMode = mockValue === true ? true : (mockValue === 'non-interactive' ? 'non-interactive' : false);
  
  if (isMockMode) {
    console.log('[Mock] 使用模拟模式启动...');
    return startMockBot();
  }
  
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

// 启动模拟机器人
async function startMockBot() {
  const mockClient = new MockClient();
  
  // 模拟 clientReady 事件
  console.log(`[Mock] 机器人已上线！登录身份：MockBot`);
  
  // 清空未完成的消息
  db.clearPendingMessages();
  isProcessing = false;
  
  // 启动消息队列轮询（使用模拟客户端）
  startPolling(mockClient);
  
  // 启动定时任务检查
  startScheduledTaskChecker();
  
  // 启动交互式输入（仅在交互模式下）
  startInteractiveInput(async (message) => {
    // 模拟 messageCreate 事件处理
    if (message.author.bot) return;
    if (message.guild) return;
    
    try {
      const msgId = db.addMessage(message.author.id, MOCK_CHANNEL.id, message.content);
      console.log(`[Mock] 消息已存入队列 ID: ${msgId}`);
    } catch (error) {
      console.error('[Mock] 存入消息失败:', error);
    }
  }, isMockMode !== 'non-interactive');  // 非交互模式下不启动 readline
  
  return mockClient;
}

module.exports = { startBot };

// 如果直接运行此文件，则启动机器人
if (require.main === module) {
  startBot();
}
