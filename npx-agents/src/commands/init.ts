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
    const targetName = name || 'my-agent';
    const targetDir = name ? join(process.cwd(), name) : process.cwd();
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
mode: subagent
model: anthropic/claude-3-5-sonnet-20241022
temperature: 0.7
tools:
  read: true
  write: true
  edit: true
  bash: false
  glob: true
  grep: true
  task: false
  skill: false
hidden: false
---

# ${name}

You are a custom AI agent. Describe your purpose and behavior here.

## When to Use

Describe when this agent should be invoked.

## Workflow

1. First step...
2. Second step...
3. Third step...

## Guidelines

- Add your specific guidelines here
- Be clear and concise
`;
}
