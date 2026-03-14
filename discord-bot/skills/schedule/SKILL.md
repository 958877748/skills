---
name: schedule
description: 定时任务管理工具，支持创建、查看、删除定时任务。用户可以通过自然语言描述来设置提醒和定时任务。
---

# 定时任务管理

帮助用户管理定时任务，支持 cron 表达式。

## CLI 命令

所有命令需要在项目根目录执行：

### 创建任务

```bash
node bin/cli.js schedule create "<cron表达式>" "<任务内容>" <是否重复>
```

参数：
- cron表达式：如 `0 8 * * *` 表示每天8点
- 任务内容：提醒内容
- 是否重复：`true` 或 `false`

示例：
```bash
node bin/cli.js schedule create "0 8 * * *" "提醒喝水" true
node bin/cli.js schedule create "0 9 * * 1-5" "上班打卡" true
node bin/cli.js schedule create "0 10 1 * *" "月初提醒" false
```

### 列出任务

```bash
node bin/cli.js schedule list
```

### 删除任务

```bash
node bin/cli.js schedule delete <任务ID>
```

## Cron 表达式说明

```
┌───────────── 分钟 (0-59)
│ ┌───────────── 小时 (0-23)
│ │ ┌───────────── 日 (1-31)
│ │ │ ┌───────────── 月 (1-12)
│ │ │ │ ┌───────────── 星期 (0-6, 0=周日)
│ │ │ │ │
* * * * *
```

常用示例：
- `0 8 * * *` - 每天早上8点
- `30 9 * * 1-5` - 工作日早上9:30
- `0 0 * * 0` - 每周日午夜
- `0 8,12,18 * * *` - 每天8点、12点、18点

## 使用流程

当用户说 "每天早上8点提醒我喝水"：

1. 解析时间意图 → cron表达式 `0 8 * * *`
2. 执行命令：
   ```bash
   node bin/cli.js schedule create "0 8 * * *" "提醒喝水" true
   ```
3. 返回结果给用户

当用户说 "看看我的任务"：

1. 执行命令：
   ```bash
   node bin/cli.js schedule list
   ```
2. 展示任务列表给用户

当用户说 "删除任务3"：

1. 执行命令：
   ```bash
   node bin/cli.js schedule delete 3
   ```
2. 确认删除结果