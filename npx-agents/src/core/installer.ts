import { join, basename } from 'path';
import { existsSync, readdirSync, readFileSync, mkdirSync, copyFileSync, symlinkSync, rmSync } from 'fs';
import { tmpdir, homedir } from 'os';
import { mkdtempSync, rmSync as rmSyncFs } from 'fs';
import { parseAgentFile } from './parser.js';
import { discoverFromDirectory } from './discover.js';
import { ensureDir, getPlatformPaths, isDirectory, findFiles } from '../utils/filesystem.js';
import { logger } from '../utils/logger.js';
import type { AgentPlatform, AgentFile, InstallOptions } from '../types/index.js';

export async function installAgent(options: InstallOptions): Promise<void> {
  const { source, global, platforms, agentName, copy } = options;
  
  logger.info(`Installing agent from: ${source}`);

  const tempDir = await fetchSource(source);
  
  try {
    const agents = await discoverFromDirectory(tempDir);
    
    if (agents.length === 0) {
      throw new Error('No agents found in the source');
    }

    for (const platform of platforms) {
      const targetPaths = getPlatformPaths(platform, global);
      
      for (const targetPath of targetPaths) {
        ensureDir(targetPath);
        
        for (const agentFile of agents) {
          const name = agentName || agentFile.agent.name || basename(agentFile.path, '.md');
          const finalPath = join(targetPath, `${name}.md`);
          
          if (existsSync(finalPath) && !options.yes) {
            logger.warn(`Agent "${name}" already exists at ${finalPath}`);
            continue;
          }

          if (copy) {
            const sourcePath = agentFile.path;
            if (isDirectory(sourcePath)) {
              copyDirectory(sourcePath, join(targetPath, name));
            } else {
              copyFileSync(sourcePath, finalPath);
            }
            logger.success(`Copied agent "${name}" to ${finalPath}`);
          } else {
            const sourceDir = tempDir;
            try {
              symlinkSync(sourceDir, finalPath, 'dir');
              logger.success(`Symlinked agent "${name}" to ${finalPath}`);
            } catch (err) {
              logger.warn(`Failed to create symlink, copying instead: ${err}`);
              copyDirectory(sourceDir, join(targetPath, name));
              logger.success(`Copied agent "${name}" to ${targetPath}`);
            }
          }
        }
      }
    }
  } finally {
    if (existsSync(tempDir) && tempDir.startsWith(tmpdir())) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

async function fetchSource(source: string): Promise<string> {
  if (source.startsWith('.') || source.startsWith('/') || /^[a-zA-Z]:\\/.test(source)) {
    return source;
  }

  const degit = await import('degit');
  const tempDir = mkdtempSync(join(tmpdir(), 'npx-agents-'));
  
  const parts = source.split('/');
  let owner = parts[0];
  let repo = parts[1]?.replace(/#.+$/, '') || '';
  let ref = '';
  
  if (source.includes('#')) {
    const [repoPart, refPart] = source.split('#');
    repo = repoPart.split('/')[1];
    ref = refPart;
  }

  try {
    const target = ref ? `${owner}/${repo}#${ref}` : `${owner}/${repo}`;
    await degit.default(target).clone(tempDir);
    return tempDir;
  } catch (err) {
    rmSync(tempDir, { recursive: true, force: true });
    throw new Error(`Failed to fetch from ${source}: ${err}`);
  }
}

function copyDirectory(source: string, target: string): void {
  ensureDir(target);
  const files = readdirSync(source);
  for (const file of files) {
    const srcPath = join(source, file);
    const destPath = join(target, file);
    if (isDirectory(srcPath)) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export function listInstalledAgents(platform: AgentPlatform, global: boolean): AgentFile[] {
  const agents: AgentFile[] = [];
  const paths = getPlatformPaths(platform, global);
  
  for (const path of paths) {
    if (!existsSync(path)) continue;
    
    const mdFiles = findFiles(path, /\.md$/);
    for (const file of mdFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        const agentFile = parseAgentFile(content, file);
        agents.push(agentFile);
      } catch (err) {
        continue;
      }
    }
  }
  
  return agents;
}

export function removeAgent(name: string, platform: AgentPlatform, global: boolean): boolean {
  const paths = getPlatformPaths(platform, global);
  
  for (const path of paths) {
    const agentPath = join(path, `${name}.md`);
    if (existsSync(agentPath)) {
      rmSync(agentPath, { recursive: true, force: true });
      logger.success(`Removed agent "${name}" from ${path}`);
      return true;
    }
    
    if (existsSync(path)) {
      const entries = readdirSync(path);
      for (const entry of entries) {
        const entryPath = join(path, entry);
        const linkTarget = existsSync(entryPath) ? entryPath : null;
        if (linkTarget && readlinkCheck(entryPath, name)) {
          rmSync(entryPath, { recursive: true, force: true });
          logger.success(`Removed agent "${name}" from ${path}`);
          return true;
        }
      }
    }
  }
  
  return false;
}

function readlinkCheck(path: string, name: string): boolean {
  try {
    const stat = require('fs').lstatSync(path);
    return stat.isSymbolicLink() && path.includes(name);
  } catch {
    return false;
  }
}
