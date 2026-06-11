---
name: discord-notify
description: 向 Discord 用户发送私聊消息。当用户请求发送通知、提醒、消息到 Discord 时使用此 skill。
---

# discord-notify

向指定 Discord 用户发送私聊消息。

## When to use

**当用户说以下类型的话时，使用此 Skill：**
- "给我发个 Discord 消息"
- "通知我..."
- "发个提醒到 Discord"
- "DM 我..."

## 环境检测

**首次使用时，AI 应运行检测脚本检查环境配置：**

```bash
cd discord-notify && node check.js
```

检测脚本会检查：
- ✅ 环境变量是否配置（DISCORD_BOT_TOKEN, DISCORD_USER_ID）
- ✅ 依赖是否安装（node-fetch, https-proxy-agent）
- ✅ Discord API 连接是否正常
- ✅ 测试消息是否能发送

**根据检测结果，AI 应指导用户完成配置。**

## 发送消息

```bash
node discord-notify/send.js "消息内容"
```

**支持超长消息**：超过 2000 字符会自动分割发送。

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `DISCORD_BOT_TOKEN` | ✅ | 机器人 Token |
| `DISCORD_USER_ID` | ✅ | 目标用户 ID |
| `HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY` | ❌ | 代理地址（可选） |

## User ID 获取方式

Discord 设置 → 高级 → 开启开发者模式 → 右键自己 → 复制 ID

## 配置步骤

1. **创建 Discord Bot**
   - 访问 https://discord.com/developers/applications
   - 创建 Application → Bot → 复制 Token

2. **邀请 Bot 到服务器**
   - 使用 Bot 的 OAuth2 URL 邀请到你的 Discord 服务器

3. **获取 User ID**
   - Discord 设置 → 高级 → 开启开发者模式
   - 右键点击你的头像 → 复制 ID

4. **配置环境变量**
   ```bash
   export DISCORD_BOT_TOKEN="你的Token"
   export DISCORD_USER_ID="你的ID"
   export HTTPS_PROXY="http://127.0.0.1:1080"  # 可选
   ```

## 返回值

### 成功
```json
{
  "success": true,
  "message": "消息发送成功",
  "chunks": 1,
  "sent": 1
}
```

超长消息会显示分割信息：
```json
{
  "success": true,
  "message": "消息发送成功",
  "chunks": 2,
  "sent": 2,
  "note": "消息已分割为 2 条发送"
}
```

### 失败
```json
{
  "success": false,
  "error": "无法创建私聊频道: 请求参数错误: Invalid Recipient(s)"
}
```

## 目录结构

```
discord-notify/
├── SKILL.md          # Skill 说明文档
├── check.js          # 环境检测脚本
├── send.js           # 发送 DM 消息脚本
└── package.json      # 依赖配置
```
