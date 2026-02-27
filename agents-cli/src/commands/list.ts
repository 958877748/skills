import chalk from 'chalk';
import { listInstalledAgents } from '../core/installer.js';
import { detectPlatforms } from '../utils/filesystem.js';
import { logger } from '../utils/logger.js';
import type { AgentPlatform } from '../types/index.js';

interface ListCommandOptions {
  global: boolean;
  agent: string | undefined;
}

export async function listCommand(options: ListCommandOptions): Promise<void> {
  let platforms: AgentPlatform[];
  
  if (options.agent) {
    platforms = [options.agent as AgentPlatform];
  } else {
    platforms = ['opencode'];
  }

  const scope = options.global ? 'global' : 'project';
  
  for (const platform of platforms) {
    const agents = listInstalledAgents(platform, options.global);
    
    if (agents.length === 0) {
      logger.info(`No agents found for ${platform} (${scope})`);
      continue;
    }

    console.log(chalk.bold(`\n${platform} agents (${scope}):\n`));
    
    for (const agent of agents) {
      const name = agent.agent.name || agent.path.split(/[/\\]/).pop()?.replace('.md', '') || 'unknown';
      const mode = agent.agent.mode || 'subagent';
      const description = agent.agent.description || 'No description';
      
      console.log(`  ${chalk.cyan(name)} ${chalk.gray(`[${mode}]`)}`);
      console.log(`    ${chalk.dim(description)}\n`);
    }
  }
}
