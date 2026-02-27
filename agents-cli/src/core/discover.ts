import { join, basename } from 'path';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { parseAgentFile } from './parser.js';
import { findFiles, isDirectory } from '../utils/filesystem.js';
import type { AgentFile, Agent } from '../types/index.js';

const SEARCH_DIRECTORIES = [
  '',
  'agents',
  '.agents',
  '.opencode/agents',
  'src/agents',
];

const PRIORITY_FILES = [
  'AGENTS.md',
  'SKILL.md',
  'AGENT.md',
];

export async function discoverFromDirectory(dir: string): Promise<AgentFile[]> {
  const agents: AgentFile[] = [];

  for (const subDir of SEARCH_DIRECTORIES) {
    const searchDir = subDir ? join(dir, subDir) : dir;
    if (!existsSync(searchDir)) continue;

    const mdFiles = findFiles(searchDir, /\.md$/);
    
    for (const file of mdFiles) {
      const fileName = basename(file);
      if (fileName.startsWith('.')) continue;
      if (fileName === 'README.md') continue;

      try {
        const content = readFileSync(file, 'utf-8');
        const agentFile = parseAgentFile(content, file);
        agents.push(agentFile);
      } catch (err) {
        continue;
      }
    }
  }

  for (const fileName of PRIORITY_FILES) {
    const priorityFile = join(dir, fileName);
    if (existsSync(priorityFile)) {
      try {
        const content = readFileSync(priorityFile, 'utf-8');
        const agentFile = parseAgentFile(content, priorityFile);
        const exists = agents.some(a => a.path === agentFile.path);
        if (!exists) {
          agents.unshift(agentFile);
        }
      } catch (err) {
        continue;
      }
    }
  }

  return agents;
}

export async function discoverFromRepo(owner: string, repo: string, ref?: string): Promise<AgentFile[]> {
  const degit = await import('degit');
  const tempDir = await createTempDir();
  
  try {
    const source = ref ? `${owner}/${repo}#${ref}` : `${owner}/${repo}`;
    await degit.default(source).clone(tempDir);
    
    return discoverFromDirectory(tempDir);
  } finally {
    // Cleanup temp directory would happen here in production
  }
}

async function createTempDir(): Promise<string> {
  const { mkdtempSync } = await import('fs');
  const { tmpdir } = await import('os');
  return mkdtempSync(join(tmpdir(), 'npx-agents-'));
}

export function discoverLocal(dir: string): AgentFile[] {
  const agents: AgentFile[] = [];
  
  if (!existsSync(dir)) {
    return agents;
  }

  const mdFiles = findFiles(dir, /\.md$/);
  
  for (const file of mdFiles) {
    const fileName = basename(file);
    if (fileName.startsWith('.') || fileName === 'README.md') continue;

    try {
      const content = readFileSync(file, 'utf-8');
      const agentFile = parseAgentFile(content, file);
      agents.push(agentFile);
    } catch (err) {
      continue;
    }
  }

  return agents;
}

export function parseSource(source: string): { type: 'github' | 'local'; owner?: string; repo?: string; path: string } {
  if (source.startsWith('.') || source.startsWith('/') || /^[a-zA-Z]:\\/.test(source)) {
    return { type: 'local', path: source };
  }

  if (source.includes('/') && !source.startsWith('http')) {
    const parts = source.split('/');
    if (parts.length >= 2) {
      return { type: 'github', owner: parts[0], repo: parts[1].replace(/#.+$/, '') };
    }
  }

  if (source.startsWith('http://') || source.startsWith('https://')) {
    const urlMatch = source.match(/github\.com[/:]([^/]+)\/([^/]+)/);
    if (urlMatch) {
      return { type: 'github', owner: urlMatch[1], repo: urlMatch[2].replace(/#.+$/, '') };
    }
  }

  return { type: 'local', path: source };
}
