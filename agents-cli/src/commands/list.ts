import * as p from '@clack/prompts';
import pc from 'picocolors';
import { listInstalledAgents } from '../core/installer.js';
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

  let hasAnyAgents = false;
  
  for (const platform of platforms) {
    const projectAgents = listInstalledAgents(platform, false);
    const globalAgents = listInstalledAgents(platform, true);
    
    if (projectAgents.length === 0 && globalAgents.length === 0) {
      continue;
    }
    
    hasAnyAgents = true;
    
    console.log();
    console.log(pc.bold(pc.cyan(`${platform} agents`)));
    console.log();
    
    // 项目级别
    if (projectAgents.length > 0) {
      console.log(pc.dim('Project (./.opencode/agents/)'));
      
      for (const agent of projectAgents) {
        const name = agent.agent.name || agent.path.split(/[/\\]/).pop()?.replace('.md', '') || 'unknown';
        const mode = agent.agent.mode || 'subagent';
        
        console.log(`  ${pc.bold(name)} ${pc.dim(`[${mode}]`)}`);
        
        if (agent.agent.description) {
          console.log(`    ${pc.dim(agent.agent.description)}`);
        }
      }
      
      console.log();
    }
    
    // 全局级别
    if (globalAgents.length > 0) {
      console.log(pc.dim('Global (~/.config/opencode/agents/)'));
      
      for (const agent of globalAgents) {
        const name = agent.agent.name || agent.path.split(/[/\\]/).pop()?.replace('.md', '') || 'unknown';
        const mode = agent.agent.mode || 'subagent';
        
        console.log(`  ${pc.bold(name)} ${pc.dim(`[${mode}]`)}`);
        
        if (agent.agent.description) {
          console.log(`    ${pc.dim(agent.agent.description)}`);
        }
      }
      
      console.log();
    }
  }
  
  if (!hasAnyAgents) {
    p.log.info('No agents installed');
    console.log();
    console.log(pc.dim('To install an agent:'));
    console.log(pc.dim(`  npx opencode-agents add <repo>`));
    console.log();
  }
}
