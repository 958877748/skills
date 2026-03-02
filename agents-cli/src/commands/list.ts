import * as p from '@clack/prompts';
import pc from 'picocolors';
import { listInstalledAgents } from '../core/installer.js';
import type { AgentPlatform } from '../types/index.js';
import { S_BAR, S_BRANCH, S_BRANCH_END, S_BULLET } from '../utils/ui.js';

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

  console.log();
  
  let hasAnyAgents = false;
  
  for (const platform of platforms) {
    const projectAgents = listInstalledAgents(platform, false);
    const globalAgents = listInstalledAgents(platform, true);
    
    if (projectAgents.length === 0 && globalAgents.length === 0) {
      continue;
    }
    
    hasAnyAgents = true;
    
    console.log(pc.bold(pc.cyan(`◆ ${platform} agents`)));
    console.log();
    
    // 项目级别
    if (projectAgents.length > 0) {
      console.log(`  ${globalAgents.length > 0 ? S_BRANCH : S_BRANCH_END} ${pc.dim('Project')} ${pc.dim('(./.opencode/agents/)')}`);
      
      projectAgents.forEach((agent, index) => {
        const isLast = index === projectAgents.length - 1;
        const prefix = isLast ? S_BRANCH_END : S_BRANCH;
        
        const name = agent.agent.name || agent.path.split(/[/\\]/).pop()?.replace('.md', '') || 'unknown';
        const mode = agent.agent.mode || 'subagent';
        
        console.log(`  ${globalAgents.length > 0 ? S_BAR : '  '} ${prefix} ${S_BULLET} ${pc.bold(name)} ${pc.dim(`[${mode}]`)}`);
        
        if (agent.agent.description) {
          console.log(`  ${globalAgents.length > 0 ? S_BAR : '  '} ${isLast ? '  ' : `${S_BAR} `}   ${pc.dim(agent.agent.description)}`);
        }
      });
      
      console.log();
    }
    
    // 全局级别
    if (globalAgents.length > 0) {
      console.log(`  ${S_BRANCH_END} ${pc.dim('Global')} ${pc.dim('(~/.config/opencode/agents/)')}`);
      
      globalAgents.forEach((agent, index) => {
        const isLast = index === globalAgents.length - 1;
        const prefix = isLast ? S_BRANCH_END : S_BRANCH;
        
        const name = agent.agent.name || agent.path.split(/[/\\]/).pop()?.replace('.md', '') || 'unknown';
        const mode = agent.agent.mode || 'subagent';
        
        console.log(`    ${prefix} ${S_BULLET} ${pc.bold(name)} ${pc.dim(`[${mode}]`)}`);
        
        if (agent.agent.description) {
          console.log(`    ${isLast ? '  ' : `${S_BAR} `}   ${pc.dim(agent.agent.description)}`);
        }
      });
      
      console.log();
    }
  }
  
  if (!hasAnyAgents) {
    p.log.info(pc.dim('No agents installed'));
    console.log();
    console.log(pc.dim('  To install an agent:'));
    console.log(pc.dim(`    npx opencode-agents add <repo>`));
    console.log();
  }
}
