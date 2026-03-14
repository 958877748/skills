# Discord 交互式机器人

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Discord.js](https://img.shields.io/badge/discord.js-v14.14.1-blue.svg)](https://discord.js.org/)

一个基于 Discord.js 的交互式机器人，集成 OpenCode 功能，支持私聊对话和消息队列管理。

## 系统架构

### 消息处理流程
```
用户发送消息 → 存入 SQLite 消息队列
                    ↓
           每 2 秒轮询取出一条
                    ↓
           调用 OpenCode 处理（单线程）
                    ↓
           处理完成后发送回复给用户
```

- 消息队列：防止并发，同一时只处理一条消息
- Session 持久化：记住对话上下文

### 定时任务流程
```
OpenCode 工具 → 添加/删除任务到 DB
                      ↓
           每分钟检查任务是否到期
                      ↓
           到期任务 → 插入消息队列
                      ↓
           2秒后轮询取出 → OpenCode 处理
                      ↓
           处理结果发送给用户
```

- 通过 OpenCode 工具让 AI 可以管理定时任务
- 任务存储在 SQLite 中，支持 cron 表达式

## 环境要求

- Node.js >= 18.0.0
- npm 或 yarn
- OpenCode CLI（用于 AI 功能）

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/958877748/skills.git
cd discord-bot
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 Discord 机器人令牌
```

### 4. 获取 Discord 机器人令牌

1. 访问 [Discord Developer Portal](https://discord.com/developers/applications)
2. 点击 "New Application" 创建新应用
3. 进入 "Bot" 标签页，点击 "Add Bot"
4. 在 "Privileged Gateway Intents" 中启用:
   - MESSAGE CONTENT INTENT
5. 复制 Bot Token 到 `.env` 文件

### 5. 邀请机器人到服务器

1. 在 Developer Portal 中，进入 "OAuth2" -> "URL Generator"
2. 在 SCOPES 中选择 `bot`
3. 在 BOT PERMISSIONS 中选择:
   - Send Messages
   - Read Message History
   - Read Messages/View Channels
4. 复制生成的 URL 并在浏览器中打开，选择要添加的服务器

### 6. 启动机器人

```bash
# 生产环境
npm start

# 开发环境（带自动重启）
npm run dev
```

或者使用脚本:

```bash
# Linux/Mac
chmod +x start.sh
./start.sh

# Windows
start.bat
```

## 使用方法

1. 向机器人发送私信
2. 机器人自动存入消息队列
3. 每 2 秒取出一条交给 OpenCode 处理
4. 处理完成后自动回复用户

## 项目结构

```
discord-bot/
├── index.js          # 主入口文件
├── db.js             # 数据库操作模块
├── .env.example      # 环境变量示例
├── .gitignore        # Git 忽略配置
├── package.json      # 项目配置
├── start.sh          # Linux/Mac 启动脚本
├── start.bat         # Windows 启动脚本
└── README.md         # 项目说明
```

## 数据库

使用 SQLite 存储数据:
- `message_queue` - 消息队列表
- `user_sessions` - 用户 Session 表（对话上下文）

数据库文件会自动创建，无需手动初始化。

## 注意事项

- 机器人只处理私聊消息，服务器中的消息将被忽略
- 确保 OpenCode CLI 已安装并可用
- 不要将 `.env` 文件提交到版本控制
- 数据库文件 (`*.db`) 不会被 Git 追踪

## 故障排除

### 机器人不响应消息
- 检查 Bot Token 是否正确
- 确认 MESSAGE CONTENT INTENT 已启用
- 查看控制台是否有错误信息

### OpenCode 执行失败
- 确保 OpenCode CLI 已安装: `opencode --version`
- 检查 opencode 是否在系统 PATH 中

## 许可证

[MIT](LICENSE)
