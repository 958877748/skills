---
name: agent
description: 派遣任务给 opencode agent 执行，自动记录处理过程到独立日志文件
---

# opencode-agent

使用 `index.js` 将任务派遣给 opencode agent 执行，每个任务自动生成独立的日志文件，避免冲突。

## When to use

- 需要让 opencode agent 执行任务
- 需要记录 AI 的完整处理过程
- 并行派遣多个 agent 任务

## How to use

```bash
node agent/index.js "<任务描述>"
```

示例：
```bash
node agent/index.js "查询今日金价"
node agent/index.js "分析项目代码结构"
node agent/index.js "创建一个 hello.txt 文件"
```

## Output

日志文件自动保存到工作目录的 `logs/` 文件夹：

```
agent/logs/
├── 2026-03-04_15-10-23.md
├── 2026-03-04_15-12-45.md
└── ...
```

文件名格式：`YYYY-MM-DD_HH-mm-ss.md`

每个任务生成独立文件，多任务并行不会冲突。

## Files

| 文件/目录 | 说明 |
|-----------|------|
| `agent/index.mjs` | 主脚本 |
| `agent/SKILL.md` | Skill 定义文件 |
| `logs/` | 日志输出目录（生成在调用目录） |

## Requirements

- Node.js 环境
- 已安装 `opencode` CLI
- 无需安装额外 npm 包
