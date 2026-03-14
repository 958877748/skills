#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { startBot } = require('../index');
const { resetDatabase } = require('../db');

// 标准配置目录: ~/.config/discord-bot/
const configDir = path.join(os.homedir(), '.config', 'discord-bot');
const configPath = path.join(configDir, 'config.json');

// 确保配置目录存在
function ensureConfigDir() {
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

// 读取配置
function readConfig() {
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  return {};
}

// 保存配置
function saveConfig(config) {
  ensureConfigDir();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// 复制 schedule 工具到 OpenCode 工具目录
function copyScheduleTool() {
  const opencodeToolsDir = path.join(process.cwd(), '.opencode', 'tools', 'schedule');
  const sourceFile = path.join(__dirname, '..', 'tools', 'schedule.js');
  const targetFile = path.join(opencodeToolsDir, 'index.js');
  const packageJsonPath = path.join(opencodeToolsDir, 'package.json');
  
  try {
    // 确保目录存在
    if (!fs.existsSync(opencodeToolsDir)) {
      fs.mkdirSync(opencodeToolsDir, { recursive: true });
    }
    
    // 复制工具文件
    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, targetFile);
      
      // 创建 package.json（如果不存在）
      if (!fs.existsSync(packageJsonPath)) {
        const packageJson = {
          name: "dm-bot-schedule-tool",
          version: "1.0.0",
          main: "index.js",
          dependencies: {
            "@opencode-ai/plugin": "^0.x",
            "better-sqlite3": "^11.x",
            "cron-parser": "^4.x"
          }
        };
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      }
      
      console.log('[schedule] 工具已同步到 OpenCode');
    }
  } catch (error) {
    console.warn('[schedule] 同步工具失败:', error.message);
  }
}

// 启动机器人的逻辑
async function doStart(options = {}) {
  // 先复制工具
  copyScheduleTool();
  
  let token = options.token;
  
  // 优先级: 1. 命令行参数 2. 环境变量 3. 配置文件
  if (!token) {
    token = process.env.DISCORD_TOKEN;
  }
  if (!token) {
    const config = readConfig();
    token = config.token;
  }
  
  if (!token) {
    ensureConfigDir();
    
    // 生成配置文件模板
    const configTemplate = {
      token: "YOUR_DISCORD_BOT_TOKEN_HERE",
      description: "请将上面的 token 替换为你的 Discord Bot Token",
      timezone: "Asia/Shanghai",
      scheduleCheckInterval: 60000,
      messagePollInterval: 2000
    };
    saveConfig(configTemplate);
    
    console.error('错误: 未设置 Discord Token');
    console.log('');
    console.log('已为你生成配置文件模板:');
    console.log(`  ${configPath}`);
    console.log('');
    console.log('请按以下步骤操作:');
    console.log('  1. 打开上述文件');
    console.log('  2. 将 YOUR_DISCORD_BOT_TOKEN_HERE 替换为你的 Discord Bot Token');
    console.log('  3. 再次运行 dm-bot');
    console.log('');
    console.log('或者你可以使用以下方式直接设置:');
    console.log('  dm-bot --token <your-token>');
    process.exit(1);
  }
  
  process.env.DISCORD_TOKEN = token;
  console.log('正在启动 Discord Bot...');
  await startBot();
}

const program = new Command();

program
  .name('dm-bot')
  .description('Discord DM Bot CLI with OpenCode integration')
  .version('1.0.0')
  .option('-t, --token <token>', 'Discord Bot Token')
  .action(async (options) => {
    // 默认执行启动
    await doStart(options);
  });

program
  .command('start')
  .description('启动 Discord 机器人（默认命令）')
  .option('-t, --token <token>', 'Discord Bot Token')
  .action(async (options) => {
    await doStart(options);
  });

program
  .command('config')
  .description('配置 Discord Bot')
  .option('-t, --token <token>', '设置 Discord Bot Token', '')
  .action((options) => {
    if (options.token) {
      const config = readConfig();
      config.token = options.token;
      saveConfig(config);
      console.log(`Token 已保存到 ${configPath}`);
    } else {
      const config = readConfig();
      if (config.token) {
        console.log('当前配置:');
        console.log(`配置文件位置: ${configPath}`);
        console.log(`Token: ${config.token.substring(0, 10)}...`);
      } else {
        console.log('未找到配置');
        console.log('使用: dm-bot config --token <your-token>');
      }
    }
  });

program
  .command('reset')
  .description('重置数据库（清空消息队列和会话）')
  .action(() => {
    console.log('正在重置数据库...');
    resetDatabase();
    console.log('数据库已重置');
  });

program.parse();
