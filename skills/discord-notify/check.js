#!/usr/bin/env node

/**
 * discord-notify 环境检测脚本
 * 
 * 运行此脚本检查当前环境是否配置正确
 * AI 可以通过此脚本的输出了解如何配置此 skill
 */

const fetch = require('node-fetch');
const HttpsProxyAgent = require('https-proxy-agent');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const pass = (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`);
const fail = (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`);
const warn = (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`);
const info = (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`);

// 检测结果
const results = {
  ready: false,
  checks: [],
  missing: [],
  env: {}
};

/**
 * 检查环境变量
 */
function checkEnv() {
  console.log('\n📋 检查环境变量...\n');

  // BOT_TOKEN
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (botToken) {
    pass('DISCORD_BOT_TOKEN 已配置');
    results.env.DISCORD_BOT_TOKEN = '已设置';
  } else {
    fail('DISCORD_BOT_TOKEN 未配置');
    results.missing.push('DISCORD_BOT_TOKEN');
  }

  // USER_ID
  const userId = process.env.DISCORD_USER_ID;
  if (userId) {
    pass('DISCORD_USER_ID 已配置');
    results.env.DISCORD_USER_ID = '已设置';
  } else {
    fail('DISCORD_USER_ID 未配置');
    results.missing.push('DISCORD_USER_ID');
  }

  // PROXY（可选）
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY;
  if (proxy) {
    info(`代理已配置: ${proxy}`);
    results.env.PROXY = proxy;
  } else {
    warn('未配置代理（如需代理请设置 HTTPS_PROXY）');
  }
}

/**
 * 检查依赖
 */
function checkDeps() {
  console.log('\n📦 检查依赖...\n');

  try {
    require('node-fetch');
    pass('node-fetch 已安装');
  } catch {
    fail('node-fetch 未安装');
    results.missing.push('npm install');
  }

  try {
    require('https-proxy-agent');
    pass('https-proxy-agent 已安装');
  } catch {
    fail('https-proxy-agent 未安装');
    results.missing.push('npm install');
  }
}

/**
 * 测试 Discord API 连接
 */
async function testApi() {
  console.log('\n🔌 测试 Discord API 连接...\n');

  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    warn('跳过 API 测试（BOT_TOKEN 未配置）');
    return;
  }

  const headers = {
    'Authorization': `Bot ${botToken}`
  };

  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY;
  const fetchOptions = proxy ? { agent: new HttpsProxyAgent(proxy) } : {};

  try {
    const res = await fetch('https://discord.com/api/v10/users/@me', {
      headers,
      ...fetchOptions
    });

    if (res.ok) {
      const bot = await res.json();
      pass(`Bot 连接成功: ${bot.username}#${bot.discriminator || '0'}`);
      results.env.BOT_NAME = bot.username;
    } else if (res.status === 401) {
      fail('Bot Token 无效，请检查 Token 是否正确');
    } else {
      const body = await res.text();
      fail(`API 返回错误: HTTP ${res.status}`);
      results.checks.push({ name: 'API', status: 'error', message: body });
    }
  } catch (err) {
    fail(`无法连接 Discord API: ${err.message}`);
    if (proxy) {
      info('请检查代理配置是否正确');
    } else {
      info('如在中国大陆，可能需要配置代理');
    }
  }
}

/**
 * 验证 User ID 是否有效
 * 通过创建 DM 频道来验证（不会发送消息）
 */
async function testUserId() {
  console.log('\n👤 验证 User ID...\n');

  const botToken = process.env.DISCORD_BOT_TOKEN;
  const userId = process.env.DISCORD_USER_ID;

  if (!botToken || !userId) {
    warn('跳过 User ID 验证（环境变量未配置）');
    return;
  }

  const headers = {
    'Authorization': `Bot ${botToken}`,
    'Content-Type': 'application/json'
  };

  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY;
  const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;
  const fetchOptions = agent ? { agent } : {};

  try {
    const dmRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
      method: 'POST',
      headers,
      body: JSON.stringify({ recipient_id: userId }),
      ...fetchOptions
    });

    if (dmRes.ok) {
      const dm = await dmRes.json();
      pass(`User ID 有效，DM 频道 ID: ${dm.id}`);
      results.env.DM_CHANNEL_ID = dm.id;
    } else if (dmRes.status === 400) {
      fail('User ID 无效或用户不存在');
      results.missing.push('DISCORD_USER_ID (无效)');
    } else {
      const body = await dmRes.text();
      fail(`验证失败: HTTP ${dmRes.status}`);
    }
  } catch (err) {
    fail(`验证失败: ${err.message}`);
  }
}

/**
 * 输出配置指引
 */
function printGuide() {
  console.log('\n' + '='.repeat(50));
  console.log('📚 配置指引');
  console.log('='.repeat(50));

  if (results.missing.length === 0) {
    console.log('\n🎉 环境配置完整，discord-notify 可以正常使用！\n');
    console.log('使用方法:');
    console.log('  node send.js "你的消息内容"\n');
    results.ready = true;
  } else {
    console.log('\n⚠️  以下项目需要配置:\n');

    if (results.missing.includes('DISCORD_BOT_TOKEN')) {
      console.log('1️⃣  获取 Discord Bot Token:');
      console.log('   - 访问 https://discord.com/developers/applications');
      console.log('   - 创建 Application → Bot → 复制 Token\n');
    }

    if (results.missing.includes('DISCORD_USER_ID')) {
      console.log('2️⃣  获取你的 Discord User ID:');
      console.log('   - Discord 设置 → 高级 → 开启开发者模式');
      console.log('   - 右键点击你的头像 → 复制 ID\n');
    }

    if (results.missing.includes('npm install')) {
      console.log('3️⃣  安装依赖:');
      console.log('   - 运行: npm install\n');
    }

    console.log('4️⃣  配置环境变量（在 ~/.bashrc 或 ~/.zshrc 中添加）:');
    console.log('   export DISCORD_BOT_TOKEN="你的Token"');
    console.log('   export DISCORD_USER_ID="你的ID"');
    console.log('   export HTTPS_PROXY="http://127.0.0.1:1080"  # 可选，如需代理\n');
  }
}

/**
 * 输出机器可读的 JSON 结果
 */
function printJsonResult() {
  const output = {
    ready: results.ready,
    missing: results.missing,
    env: results.env,
    message: results.ready 
      ? 'discord-notify 已就绪，可以使用'
      : 'discord-notify 需要配置后才能使用'
  };

  console.log('\n📊 检测结果 (JSON):');
  console.log(JSON.stringify(output, null, 2));
}

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(50));
  console.log('🔍 discord-notify 环境检测');
  console.log('='.repeat(50));

  checkEnv();
  checkDeps();
  await testApi();
  await testUserId();
  printGuide();
  printJsonResult();
}

main().catch(err => {
  console.error('\n❌ 检测脚本执行出错:', err.message);
  process.exit(1);
});
