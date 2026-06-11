#!/usr/bin/env node

const fetch = require('node-fetch');
const HttpsProxyAgent = require('https-proxy-agent');

// Discord 消息长度限制
const MAX_MESSAGE_LENGTH = 2000;

// 配置
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const USER_ID = process.env.DISCORD_USER_ID;
const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY;
const MESSAGE = process.argv[2];

// 参数校验
if (!BOT_TOKEN) {
  console.error('❌ 错误: 未设置 DISCORD_BOT_TOKEN 环境变量');
  process.exit(1);
}

if (!USER_ID) {
  console.error('❌ 错误: 未设置 DISCORD_USER_ID 环境变量');
  process.exit(1);
}

if (!MESSAGE) {
  console.error('用法: node send.js "消息内容"');
  console.error('示例: node send.js "Hello, Discord!"');
  process.exit(1);
}

/**
 * 带代理的 fetch 请求
 * 优先直连，失败后尝试代理
 */
async function fetchWithProxy(url, options = {}) {
  // 先尝试直连
  try {
    const res = await fetch(url, options);
    if (res.ok) return res;
    
    // 直连失败且有代理配置，尝试代理
    if (PROXY_URL) {
      return await fetchWithProxyVia(url, options, PROXY_URL);
    }
    
    // 没有代理，返回原响应让调用方处理错误
    return res;
  } catch (err) {
    // 网络错误，尝试代理
    if (PROXY_URL) {
      return await fetchWithProxyVia(url, options, PROXY_URL);
    }
    throw err;
  }
}

/**
 * 通过代理发送请求
 */
async function fetchWithProxyVia(url, options, proxyUrl) {
  const agent = new HttpsProxyAgent(proxyUrl);
  return fetch(url, { ...options, agent });
}

/**
 * 解析 Discord API 错误，返回友好提示
 */
function parseDiscordError(status, body) {
  const errorMessages = {
    400: '请求参数错误',
    401: 'Bot Token 无效或已过期',
    403: 'Bot 没有权限执行此操作',
    404: '用户不存在或无法找到',
    429: '请求过于频繁，请稍后重试',
    500: 'Discord 服务器内部错误',
    503: 'Discord 服务暂时不可用'
  };
  
  const friendlyMsg = errorMessages[status] || `未知错误 (HTTP ${status})`;
  
  // 尝试解析 Discord 错误详情
  try {
    const error = JSON.parse(body);
    if (error.message) {
      return `${friendlyMsg}: ${error.message}`;
    }
  } catch {}
  
  return friendlyMsg;
}

/**
 * 将长消息分割成多个片段
 * 智能分割：优先在换行符处分割，其次在空格处
 */
function splitMessage(text, maxLength = MAX_MESSAGE_LENGTH) {
  if (text.length <= maxLength) {
    return [text];
  }
  
  const chunks = [];
  let remaining = text;
  
  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }
    
    // 在限制范围内寻找最佳分割点
    let splitIndex = maxLength;
    
    // 优先在换行符处分割
    const lastNewline = remaining.lastIndexOf('\n', maxLength - 1);
    if (lastNewline > maxLength * 0.5) {
      splitIndex = lastNewline + 1;
    } else {
      // 其次在空格处分割
      const lastSpace = remaining.lastIndexOf(' ', maxLength - 1);
      if (lastSpace > maxLength * 0.5) {
        splitIndex = lastSpace + 1;
      }
    }
    
    chunks.push(remaining.slice(0, splitIndex));
    remaining = remaining.slice(splitIndex);
  }
  
  return chunks;
}

/**
 * 发送单条消息
 */
async function sendMessage(channelId, content) {
  const headers = {
    'Authorization': `Bot ${BOT_TOKEN}`,
    'Content-Type': 'application/json'
  };

  const res = await fetchWithProxy(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ content })
    }
  );

  if (!res.ok) {
    const body = await res.text();
    const errorMsg = parseDiscordError(res.status, body);
    throw new Error(`发送消息失败: ${errorMsg}`);
  }

  return res.json();
}

/**
 * 主函数：发送 DM 消息
 */
async function sendDM() {
  const headers = {
    'Authorization': `Bot ${BOT_TOKEN}`,
    'Content-Type': 'application/json'
  };

  // 1. 创建 DM 频道
  const dmRes = await fetchWithProxy(
    'https://discord.com/api/v10/users/@me/channels',
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ recipient_id: USER_ID })
    }
  );

  if (!dmRes.ok) {
    const body = await dmRes.text();
    const errorMsg = parseDiscordError(dmRes.status, body);
    throw new Error(`无法创建私聊频道: ${errorMsg}`);
  }

  const dmChannel = await dmRes.json();

  // 2. 分割消息并发送
  const chunks = splitMessage(MESSAGE);
  let sentCount = 0;

  for (const chunk of chunks) {
    await sendMessage(dmChannel.id, chunk);
    sentCount++;
  }

  // 3. 返回结果
  const result = {
    success: true,
    message: '消息发送成功',
    chunks: chunks.length,
    sent: sentCount
  };

  if (chunks.length > 1) {
    result.note = `消息已分割为 ${chunks.length} 条发送`;
  }

  console.log(JSON.stringify(result));
}

// 执行
sendDM().catch(err => {
  console.error(JSON.stringify({
    success: false,
    error: err.message
  }));
  process.exit(1);
});
