import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, symlinkSync, copyFileSync, rmSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { homedir } from 'os';
import type { AgentPlatform } from '../types/index.js';

export function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function readDir(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir);
}

export function readFile(path: string): string {
  return readFileSync(path, 'utf-8');
}

export function writeFile(path: string, content: string): void {
  ensureDir(dirname(path));
  writeFileSync(path, content, 'utf-8');
}

export function isDirectory(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}

export function isFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile();
}

export function getPlatformPaths(platform: AgentPlatform, global: boolean): string[] {
  const home = homedir();
  
  const paths: Record<AgentPlatform, { project: string[]; global: string[] }> = {
    'opencode': {
      project: ['.opencode/agents/'],
      global: [join(home, '.config', 'opencode', 'agents')],
    },
    'claude-code': {
      project: ['.claude/agents/'],
      global: [join(home, '.claude', 'agents')],
    },
    'cursor': {
      project: ['.cursor/agents/'],
      global: [join(home, '.cursor', 'agents')],
    },
    'windsurf': {
      project: ['.windsurf/agents/'],
      global: [join(home, '.codeium', 'windsurf', 'agents')],
    },
    'cline': {
      project: ['.cline/agents/'],
      global: [join(home, '.cline', 'agents')],
    },
    'roo': {
      project: ['.roo/agents/'],
      global: [join(home, '.roo', 'agents')],
    },
    'codex': {
      project: ['.codex/agents/'],
      global: [join(home, '.codex', 'agents')],
    },
    'continue': {
      project: ['.continue/agents/'],
      global: [join(home, '.continue', 'agents')],
    },
  };

  return global ? paths[platform].global : paths[platform].project;
}

export function getGlobalAgentsDir(): string {
  return process.env.NPX_AGENTS_DIR || join(homedir(), '.config', 'npx-agents');
}

export function createSymlink(source: string, target: string): void {
  ensureDir(dirname(target));
  symlinkSync(source, target, 'dir');
}

export function copyDir(source: string, target: string): void {
  ensureDir(target);
  const files = readdirSync(source);
  for (const file of files) {
    const srcPath = join(source, file);
    const destPath = join(target, file);
    if (isDirectory(srcPath)) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export function removePath(path: string): void {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
  }
}

export function findFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];
  
  if (!existsSync(dir)) {
    return results;
  }
  
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    if (isDirectory(fullPath)) {
      results.push(...findFiles(fullPath, pattern));
    } else if (pattern.test(file)) {
      results.push(fullPath);
    }
  }
  
  return results;
}

export function detectPlatforms(): AgentPlatform[] {
  const platforms: AgentPlatform[] = [];
  const home = homedir();
  const cwd = process.cwd();
  
  const checks: Array<{ platform: AgentPlatform; check: () => boolean }> = [
    {
      platform: 'opencode',
      check: () => existsSync(join(home, '.config', 'opencode')) || existsSync(join(cwd, '.opencode')),
    },
    {
      platform: 'claude-code',
      check: () => existsSync(join(home, '.claude')) || existsSync(join(cwd, '.claude')),
    },
    {
      platform: 'cursor',
      check: () => existsSync(join(home, '.cursor')) || existsSync(join(cwd, '.cursor')),
    },
    {
      platform: 'windsurf',
      check: () => existsSync(join(home, '.codeium', 'windsurf')) || existsSync(join(cwd, '.windsurf')),
    },
    {
      platform: 'cline',
      check: () => existsSync(join(home, '.cline')) || existsSync(join(cwd, '.cline')),
    },
    {
      platform: 'roo',
      check: () => existsSync(join(home, '.roo')) || existsSync(join(cwd, '.roo')),
    },
    {
      platform: 'codex',
      check: () => existsSync(join(home, '.codex')) || existsSync(join(cwd, '.codex')),
    },
    {
      platform: 'continue',
      check: () => existsSync(join(home, '.continue')) || existsSync(join(cwd, '.continue')),
    },
  ];

  for (const check of checks) {
    if (check.check()) {
      platforms.push(check.platform);
    }
  }

  if (platforms.length === 0) {
    platforms.push('opencode');
  }

  return platforms;
}
