# npx-agents 项目计划

## 1. 项目概述

### 背景

在 AI 编码助手生态系统中，`npx skills` (by Vercel) 已经成为 AI agent 技能包的事实标准。然而，**agents** (自定义子代理) 的管理和分发仍然缺乏统一的工具。OpenCode 提供了强大的 agent 自定义能力，但缺乏类似 `skills` 的 CLI 工具来分发和安装预定义的 agent。

本项目旨在创建一个与 `npx skills` 类似的 CLI 工具 **npx-agents**，用于安装、管理和分发 AI coding agents 的自定义配置。

### 核心价值

- **简化 agent 分发**: 开发者可以像安装 npm 包一样安装预定义的 agent
- **跨项目共享**: 团队可以共享标准化的 agent 配置
- **生态系统整合**: 与现有 `skills` 工具互补，专注于 agent 而非 skill

> **注意**: `skills` 和 `agents` 是两个不同的概念：
> - **Skills**: 技能包，定义 agent 的能力扩展，通过 `SKILL.md` 定义，安装到 `.opencode/skills/`
> - **Agents**: 自定义子代理，有独立的 system prompt 和权限配置，通过 Markdown 文件定义，安装到 `.opencode/agents/`

---

## 2. 竞品分析

### npx skills (Vercel)

| 特性 | 说明 |
|------|------|
| 定位 | AI agent 技能包管理器 |
| 核心概念 | SKILL.md (技能定义) |
| 支持 agents | 37+ (2026年2月) |
| 周下载量 | 202K+ (截至 2026年2月) |
| GitHub Stars | 7K+ |

**核心功能**:
```bash
npx skills add vercel-labs/agent-skills    # 安装技能
npx skills list                            # 列出已安装
npx skills find                           # 搜索技能
npx skills remove                         # 移除技能
npx skills init                           # 创建技能模板
```

### OpenCode Agents

| 特性 | 说明 |
|------|------|
| 定位 | 内置 agent 配置系统 |
| 核心概念 | AGENTS.md (代理定义) + YAML frontmatter |
| Agent 目录 | `.opencode/agents/` (项目级) / `~/.config/opencode/agents/` (全局) |

**定义格式**:
```yaml
---
description: Agent 描述
mode: subagent | primary | all
model: provider/model
temperature: 0.7
tools:
  read: true
  write: true
  edit: true
  bash: false
permission:
  bash:
    "git *": allow
    "rm *": deny
    "*": ask
  skill:
    "*": allow
    "internal-*": deny
hidden: false
---
# System prompt 内容
```

---

## 3. 项目架构

### 3.1 技术栈

| 层级 | 技术选型 | 理由 |
|------|----------|------|
| CLI 框架 | Commander.js (v13.x) | Node.js 标准 CLI 框架，生态成熟，轻量 |
| 包管理 | pnpm | 与 npx skills 保持一致，减少依赖体积 |
| 构建工具 | esbuild | 快速编译，与 npx skills 一致 |
| Git 操作 | degit / simple-git | 克隆仓库，支持 GitHub/GitLab (注：degit 在 Windows 上可能有兼容性问题) |
| YAML 解析 | gray-matter | 解析 frontmatter，支持 YAML 元数据 |
| 日志/UI | ora + chalk | 美化 CLI 输出 |
| HTTP 客户端 | octokit | GitHub API 交互 |
| 测试 | vitest | 现代快速测试框架 |

### 3.2 package.json 核心配置

```json
{
  "name": "npx-agents",
  "version": "1.0.0",
  "description": "CLI for managing AI coding agents",
  "type": "module",
  "bin": {
    "agents": "./bin/agents.js"
  },
  "scripts": {
    "build": "esbuild src/index.ts --bundle --platform=node --format=esm --outdir=dist --external:./node_modules/*",
    "dev": "node --watch src/index.ts",
    "test": "vitest"
  },
  "dependencies": {
    "commander": "^12.1.0",
    "degit": "^2.8.4",
    "gray-matter": "^4.0.3",
    "ora": "^5.4.1",
    "chalk": "^5.3.0",
    "octokit": "^3.2.0",
    "yaml": "^2.3.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "esbuild": "^0.24.0",
    "vitest": "^1.0.0"
  }
}
```

### 3.2 目录结构

```
npx-agents/
├── bin/
│   └── agents.js          # CLI 入口 (需要 #!/usr/bin/env node)
├── src/
│   ├── commands/          # 命令实现
│   │   ├── add.ts
│   │   ├── list.ts
│   │   ├── find.ts
│   │   ├── remove.ts
│   │   └── init.ts
│   ├── core/              # 核心逻辑
│   │   ├── installer.ts
│   │   ├── discover.ts
│   │   ├── config.ts
│   │   └── agent-detector.ts
│   ├── types/             # 类型定义
│   │   └── index.ts
│   └── utils/             # 工具函数
│       ├── logger.ts
│       └── filesystem.ts
├── templates/             # Agent 模板
│   └── default-agent.md
├── package.json
├── tsconfig.json
└── README.md
```

### 3.3 核心模块设计

#### 类型定义 (src/types/index.ts)

```typescript
export interface Agent {
  description: string;  // 必填，OpenCode 使用 description 而非 name 作为标识
  mode?: 'primary' | 'subagent' | 'all';
  model?: string;
  temperature?: number;
  maxSteps?: number;
  color?: string;
  trigger?: string;
  hidden?: boolean;
  tools?: {
    read?: boolean;
    write?: boolean;
    edit?: boolean;
    bash?: boolean | string;
    glob?: boolean | string;
    grep?: boolean | string;
    task?: boolean;
    skill?: boolean;
    [key: string]: boolean | string | undefined;
  };
  permission?: {
    bash?: Record<string, 'allow' | 'deny' | 'ask'>;
    edit?: 'allow' | 'deny' | 'ask';
    write?: 'allow' | 'deny' | 'ask';
    skill?: Record<string, 'allow' | 'deny'>;
    task?: Record<string, 'allow' | 'deny'>;
    [key: string]: unknown;
  };
  mcp?: {
    servers?: Array<{
      name: string;
      command: string;
      args?: string[];
    }>;
  };
  version?: string;
  source?: string;
}

export interface AgentManifest {
  agents: Agent[];
  source: string;
  ref?: string;
}

export interface Config {
  global: boolean;
  agents: Record<string, string[]>;
  updates: {
    check: 'daily' | 'weekly' | 'manual';
  };
}
```

#### 核心流程图

```
npx agents add owner/repo
         │
         ▼
┌────────────────────────┐
│  1. 解析 source         │
│  (owner/repo, URL, 本地) │
└───────────┬────────────┘
            ▼
┌────────────────────────┐
│  2. 克隆/获取源码       │
│  (degit / git clone)   │
└───────────┬────────────┘
            ▼
┌────────────────────────┐
│  3. 发现 agents        │
│  (递归搜索 *.md)        │
└───────────┬────────────┘
            ▼
┌────────────────────────┐
│  4. 解析 YAML          │
│  (gray-matter)         │
└───────────┬────────────┘
            ▼
┌────────────────────────┐
│  5. 验证必填字段        │
│  (name, description)   │
└───────────┬────────────┘
            ▼
┌────────────────────────┐
│  6. 安装到目标平台      │
│  (symlink / copy)       │
└───────────┬────────────┘
            ▼
┌────────────────────────┐
│  7. 写入配置            │
│  (agents.json)          │
└────────────────────────┘
```

```yaml
---
description: Agent 用途描述
mode: subagent | primary | all
model: provider/model
temperature: 0.7
maxSteps: 100
color: "#FFD580"
tools:
  read: true
  write: true
  edit: true
  bash: "ask"
permission:
  bash:
    "git *": allow
    "rm *": deny
    "*": ask
  skill:
    "*": allow
    "internal-*": deny
hidden: false
---

# System Prompt
你是一个专业的 [角色描述]。你的职责是...

## 工作流程
1. 首先...
2. 然后...
3. 最后...
```

#### 支持的安装位置

| Agent | `--agent` 参数 | Project Path | Global Path |
|-------|----------------|--------------|-------------|
| OpenCode | `opencode` | `.opencode/agents/` | `~/.config/opencode/agents/` |
| Claude Code | `claude-code` | `.claude/agents/` | `~/.claude/agents/` |
| Cursor | `cursor` | `.cursor/agents/` | `~/.cursor/agents/` |
| Windsurf | `windsurf` | `.windsurf/agents/` | `~/.codeium/windsurf/agents/` |
| Cline | `cline` | `.cline/agents/` | `~/.cline/agents/` |
| Roo Code | `roo` | `.roo/agents/` | `~/.roo/agents/` |
| Codex | `codex` | `.codex/agents/` | `~/.codex/agents/` |
| Continue | `continue` | `.continue/agents/` | `~/.continue/agents/` |

#### OpenCode Agent 完整配置 (agents/*.md)

```yaml
---
description: Agent 用途描述（当用户应该调用此 agent 时使用）
mode: subagent | primary | all
model: provider/model
temperature: 0.7
tools:
  read: true
  write: true
  edit: true
  bash: false
permission:
  bash:
    "git *": allow
    "rm *": deny
    "*": ask
  skill:
    "*": allow
    "internal-*": deny
hidden: false
---

# System Prompt
你是一个专业的 [角色描述]。你的职责是...

## 何时使用
描述在什么场景下应该调用此 agent

## 工作流程
1. 首先...
2. 然后...
3. 最后...
```

#### npx skills SKILL.md 格式 (兼容，但安装路径不同)

```yaml
---
name: my-skill
description: What this skill does and when to use it
metadata:
  internal: true  # 隐藏内部 skill
---

# My Skill
Instructions for the agent to follow when this skill is activated.

## When to Use
描述使用场景

## Steps
1. First, do this
2. Then, do that
```

> **重要区别**: npx skills 安装到 `.opencode/skills/`，而 npx-agents 安装到 `.opencode/agents/`

---

## 4. 功能规格

### 4.1 核心命令

#### `npx agents add <source>`

安装一个或多个 agent 到指定目录。

**参数**:
- `<source>`: GitHub shorthand (`owner/repo`), GitHub URL, GitLab URL, 或本地路径

**选项**:
| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-g, --global` | 安装到全局目录 | false |
| `-a, --agent <agents...>` | 目标 agent 平台 | 自动检测 |
| `--agent-name <name>` | 安装后的文件名 | 仓库名 |
| `-y, --yes` | 跳过确认 | false |
| `--copy` | 复制而非 symlink | false |

**示例**:
```bash
# 从 GitHub 安装
npx agents add my-org/code-reviewer-agent

# 安装到全局
npx agents add my-org/debugger-agent -g

# 指定目标平台
npx agents add my-org/test-agent -a opencode -a claude-code

# 本地安装
npx agents add ./my-local-agent
```

#### `npx agents list`

列出已安装的 agents。

**选项**:
| 选项 | 说明 |
|------|------|
| `-g, --global` | 仅列出全局 |
| `-a, --agent <agent>` | 按平台过滤 |

**示例**:
```bash
npx agents list                    # 列出所有
npx agents list -g                 # 仅全局
npx agents list -a opencode         # 仅 OpenCode
```

#### `npx agents find [query]`

搜索可用的 agents（通过 skills.sh API 或本地索引）。

**示例**:
```bash
npx agents find                    # 交互式搜索
npx agents find code-review        # 关键词搜索
```

#### `npx agents remove <name>`

移除已安装的 agent。

**选项**:
| 选项 | 说明 |
|------|------|
| `-g, --global` | 从全局移除 |
| `-a, --agent <agent>` | 从指定平台移除 |

**示例**:
```bash
npx agents remove code-reviewer-agent
npx agents remove test-agent -a opencode
```

#### `npx agents init [name]`

创建新的 agent 定义模板。

**示例**:
```bash
npx agents init                     # 当前目录创建
npx agents init my-new-agent        # 创建到子目录
```

#### `npx agents check`

检查已安装 agents 是否有更新。

#### `npx agents update`

更新所有已安装的 agents 到最新版本。

---

## 5. Agent 发现机制

### 5.1 远程发现

```typescript
// 从 GitHub 仓库发现 agents
async function discoverFromRepo(owner: string, repo: string, ref?: string): Promise<Agent[]> {
  // 1. 使用 degit 或 git clone 拉取仓库
  // 2. 按优先级搜索以下目录:
  //    - 根目录 (AGENTS.md)
  //    - agents/
  //    - .agents/
  //    - .opencode/agents/    ← 注意是复数 agents
  //    - src/agents/
  // 3. 解析 YAML frontmatter
  // 4. 验证必填字段 (description)
  // 5. 返回 agent 列表
}
```

### 5.2 本地发现

```typescript
// 在指定目录发现 agents
function discoverLocal(dir: string): Agent[] {
  // 1. 递归扫描目录下的 *.md 文件
  // 2. 解析 YAML frontmatter
  // 3. 过滤无效定义 (缺少 name/description)
  // 4. 返回 agent 列表
}
```

### 5.3 npx skills 搜索路径参考

CLI 会按以下优先级搜索 skills/agents：

```
- Root: AGENTS.md, SKILL.md
- agents/
- .agents/
- .opencode/agents/    ← 注意是复数
- .opencode/skills/   ← skills (npx skills 安装位置)
- src/agents/
- skills/
- skills/.curated/
- skills/.experimental/
- skills/.system/
```

---

## 6. 安装机制

### 6.1 安装流程

```
用户执行: npx agents add owner/repo -a opencode -g

1. 检测目标平台
   ├── 自动检测: 扫描 ~/.config/opencode/ 是否存在
   └── 指定检测: -a 参数

2. 获取源码
   ├── GitHub shorthand: owner/repo → degit
   ├── Full URL: https://github.com/... → degit
   ├── 本地路径: ./path → fs.copy

3. 发现 agents
   ├── 解析 AGENTS.md / SKILL.md
   ├── 提取 YAML frontmatter
   └── 过滤无效定义 (无 description 字段)

4. 安装
   ├── Symlink (默认): ln -s source target
   └── Copy (--copy): cp -r source target

5. 注册
   └── 更新 agents.json
```

### 6.2 Symlink 模式 (默认)

```
~/.claude/agents/
  └── my-agent -> /path/to/source/my-agent/
```

### 6.3 安装位置优先级

```typescript
function getAgentPaths(platform: string, global: boolean): string[] {
  const paths = {
    opencode: {
      project: ['.opencode/agents/'],
      global: [os.homedir() + '/.config/opencode/agents/']
    },
    'claude-code': {
      project: ['.claude/agents/'],
      global: [os.homedir() + '/.claude/agents/']
    },
    // ... 其他平台
  };
  
  return global ? paths[platform].global : paths[platform].project;
}
```

### 6.5 Copy 模式

```
~/.claude/agents/
  └── my-agent/
      └── my-agent.md
```

### 6.6 配置文件

每个 agent 可以包含:
- `*.md`: 主定义文件 (如 `my-agent.md`)
- `prompts/`: 额外 prompt 文件
- `scripts/`: 辅助脚本
- `config.json`: 额外配置

---

## 7. 扩展能力

### 7.1 MCP 集成

```yaml
---
name: web-developer
description: Web 开发专家
mcp:
  servers:
    - name: playwright
      command: npx
      args: ["-y", "@modelcontextprotocol/server-playwright"]
---
```

### 7.2 Hooks 支持

```yaml
---
name: code-reviewer
description: 代码审查专家
hooks:
  pre-task:
    - script: ./scripts/pre-check.sh
  post-task:
    - script: ./scripts/summary.sh
---
```

### 7.3 版本管理

```yaml
---
name: react-expert
description: React 专家
version: 1.2.0
updates:
  check: daily | weekly | manual
  source: github
---
```

---

## 8. 实施路线图

### Phase 1: MVP (Week 1-2)

- [ ] CLI 脚手架搭建 (Commander.js + esbuild)
- [ ] `add` 命令实现 (GitHub + 本地)
- [ ] `list` 命令实现
- [ ] `init` 命令实现
- [ ] 基础 agent 解析器 (gray-matter)
- [ ] 单元测试覆盖核心解析逻辑

### Phase 2: 核心功能 (Week 3-4)

- [ ] Agent 检测 (自动发现已安装的平台)
- [ ] `remove` 命令实现
- [ ] `find` 命令实现 (可选: 接入 skills.sh API)
- [ ] Symlink/Copy 安装逻辑
- [ ] 全局/项目作用域支持
- [ ] 配置文件读写 (agents.json)

### Phase 3: 增强功能 (Week 5-6)

- [ ] `check` / `update` 命令
- [ ] MCP 配置支持
- [ ] Hooks 支持
- [ ] 遥测数据收集
- [ ] E2E 测试覆盖

### Phase 4: 生态整合 (Week 7-8)

- [ ] 与 npx skills 集成（注意：skills 安装到 `.opencode/skills/`，agents 安装到 `.opencode/agents/`）
- [ ] 文档网站 (VitePress)
- [ ] CI/CD 测试 (GitHub Actions)
- [ ] 发布到 npm
- [ ] 创建示例 agents 仓库

---

## 9. 配置文件

### agents.json (项目级)

```json
{
  "$schema": "./agents.schema.json",
  "agents": {
    "require": ["code-reviewer", "test-generator"]
  },
  "updates": {
    "check": "weekly"
  }
}
```

### agents.json (全局级)

```json
{
  "defaultAgent": "opencode",
  "globalAgents": [
    "debugger",
    "security-auditor"
  ]
}
```

---

## 10. 命名建议

| 选项 | 描述 |
|------|------|
| `npx-agents` | 推荐 (与 skills 对仗) |
| `agent-pkg` | 备选 |
| `agents-cli` | 备选 |
| `@agent-tools/cli` | npm 官方包名 |

---

## 11. 许可证

MIT License

---

## 12. 参考资源

- [npx skills GitHub](https://github.com/vercel-labs/skills)
- [npx skills NPM](https://www.npmjs.com/package/skills) (当前版本: 1.4.x, 2026年2月)
- [OpenCode Agents Docs](https://opencode.ai/docs/agents/)
- [OpenCode Config Docs](https://opencode.ai/docs/config/)
- [Agent Skills Specification](https://agentskills.io)
- [skills.sh 目录](https://skills.sh)

---

## 13. 错误处理策略

### 常见错误与解决方案

> **注意**: OpenCode agent 文件使用 **description** 字段作为必填项（而非 name）。文件命名格式为 `*.md`，可放在 `agents/` 目录或其他支持的位置。

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `No agents found` | 仓库无有效 agents 文件 | 检查 YAML frontmatter 格式，确保有 description 字段 |
| `Permission denied` | 无写入权限 | 检查目录权限或使用 sudo |
| `Agent not loading` | 路径错误 | 确认 agent 路径符合平台规范 |
| `Git clone failed` | 网络/仓库不存在 | 检查网络或仓库地址 |

### 验证命令

```bash
# 验证 agent 安装
npx agents list

# 检查更新
npx agents check

# 调试模式
DEBUG=npx-agents npx agents add owner/repo
```

---

## 14. 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `NPX_AGENTS_DIR` | 自定义全局安装目录 | `~/.config/npx-agents/` |
| `DISABLE_TELEMETRY` | 禁用匿名使用统计 | false |
| `DO_NOT_TRACK` | 禁用遥测（CI 自动启用） | false |
| `INSTALL_INTERNAL_AGENTS` | 显示/安装 internal agents | false |

```bash
# 安装内部 agents
INSTALL_INTERNAL_AGENTS=1 npx agents add owner/repo

# 禁用遥测
DISABLE_TELEMETRY=1 npx agents list
```

---

## 15. CI/CD 集成

### GitHub Actions 示例

```yaml
name: Install Agents
on: [push]
jobs:
  install:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install agents
        run: |
          npx agents add my-org/agents --global -y
```

### 验证安装脚本

```bash
#!/bin/bash
set -e
npx agents add owner/repo --global -y
npx agents list --global
```

---

## 16. 测试策略

### 单元测试 (vitest)

```typescript
// tests/parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseAgentFile } from '../src/core/parser';

describe('parseAgentFile', () => {
  it('should parse valid AGENT.md', () => {
    const content = `---
name: test-agent
description: Test agent
---
# Test`;
    const agent = parseAgentFile(content);
    expect(agent.name).toBe('test-agent');
  });

  it('should reject missing name', () => {
    const content = `---
description: No name
---`;
    expect(() => parseAgentFile(content)).toThrow();
  });
});
```

### E2E 测试

```bash
# tests/e2e.sh
#!/bin/bash
set -e

# 创建临时目录
tmp=$(mktemp -d)
cd "$tmp"

# 初始化 git
git init

# 测试安装
npx agents add owner/test-agent -y

# 验证
npx agents list | grep test-agent

# 清理
cd -
rm -rf "$tmp"
```

---

## 17. 发布流程

### 版本号规范 (SemVer)

- `1.0.0`: 初始 release
- `1.1.0`: 新功能向后兼容
- `1.0.1`: Bug 修复
- `2.0.0`: 破坏性变更

### 发布步骤

```bash
# 1. 更新版本
npm version patch  # 或 minor, major

# 2. 构建
npm run build

# 3. 发布到 npm
npm publish --access public

# 4. 创建 GitHub Release
gh release create v1.0.0 --generate-notes
```

### npm 关键词

```json
{
  "keywords": ["opencode", "claude", "agent", "cli", "npx", "skills"]
}
```
