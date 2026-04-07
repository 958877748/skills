import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { ensureDir, detectPlatforms } from '../utils/filesystem.js';
import { logger } from '../utils/logger.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface InitCommandOptions {
  global?: boolean;
}

export async function initCommand(name?: string, _options?: InitCommandOptions): Promise<void> {
  try {
    if (!name) {
      logger.error('Please provide an agent name: agents init <agent-name>');
      process.exit(1);
    }
    const targetName = name;
    const targetDir = join(process.cwd(), '.opencode', 'agents');
    const targetPath = join(targetDir, `${targetName}.md`);

    if (existsSync(targetPath)) {
      logger.error(`Agent file already exists at ${targetPath}`);
      process.exit(1);
    }

    ensureDir(targetDir);

    let template: string;
    const templatePath = join(__dirname, '..', '..', 'templates', 'default-agent.md');
    
    if (existsSync(templatePath)) {
      template = readFileSync(templatePath, 'utf-8');
    } else {
      template = getDefaultTemplate(targetName);
    }

    const fs = await import('fs');
    fs.writeFileSync(targetPath, template, 'utf-8');

    logger.success(`Created agent template at ${targetPath}`);
    console.log(`\nYou can now edit ${targetPath} to customize your agent.`);
  } catch (err) {
    logger.error(`Failed to create agent: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

function getDefaultTemplate(name: string): string {
  return `---
description: ${name} - Add your agent description here
mode: primary
permissions:
  bash: deny
  file edits: allow
---

# ${name}
## 角色定位
（填写这个Agent的身份和核心能力，例如：你是专业的前端代码审查专家，专注于检查React项目的代码质量和性能问题）

## 触发场景
（填写用户说什么关键词时应该调用这个Agent，例如：
- 当用户提到"代码审查"、"检查代码"、"代码问题"时自动调用
- 当用户需要检查代码规范、潜在bug、性能优化点时调用）

## 工作流程
（填写这个Agent处理任务的步骤，例如：
1. 首先扫描项目src目录下所有.js/.ts/.jsx/.tsx文件
2. 逐文件检查ESLint规范问题、潜在的逻辑bug、可优化的性能点
3. 按照严重程度分类输出审查报告，包含文件路径、行号、问题说明和修复建议
4. 不直接修改任何文件，只提供改进建议）

## 行为准则
（填写这个Agent必须遵守的规则，例如：
- 只关注前端代码相关问题，不回答无关问题
- 报告要简洁准确，每个问题都必须附带具体的文件路径和行号
- 对于低级错误直接给出可直接复制的修复代码片段
- 遇到不确定的问题明确说明，不要编造答案）
`;
}
