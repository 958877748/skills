import * as p from '@clack/prompts';
import pc from 'picocolors';
import { tmpdir } from 'os';
import { existsSync, rmSync } from 'fs';
import { installAgent } from '../core/installer.js';
import { discoverFromDirectory } from '../core/discover.js';
import type { AgentPlatform, InstallOptions, AgentFile } from '../types/index.js';
import { basename, join } from 'path';
import { mkdtempSync } from 'fs';
import degit from 'degit';
import { showLogo, S_BAR, S_BRANCH, S_BRANCH_END, S_BULLET, S_STEP_ACTIVE } from '../utils/ui.js';

interface AddCommandOptions {
  global: boolean | undefined;
  agent: string[] | undefined;
  agentName: string | undefined;
  yes: boolean;
  copy: boolean;
}

async function promptInstallLocation(): Promise<boolean> {
  const location = await p.select({
    message: 'Where would you like to install this agent?',
    options: [
      { value: false, label: 'Current project', hint: './.opencode/agents/' },
      { value: true, label: 'Global', hint: '~/.config/opencode/agents/' },
    ],
  });

  if (p.isCancel(location)) {
    p.cancel('Operation cancelled');
    process.exit(0);
  }

  return location;
}

async function promptSelectAgents(agents: AgentFile[]): Promise<AgentFile[]> {
  const options = agents.map(agent => ({
    value: agent,
    label: agent.agent.name || basename(agent.path, '.md'),
    hint: agent.agent.description?.slice(0, 50) + '...',
  }));

  const selected = await p.multiselect({
    message: 'Select agents to install (space to select, enter to confirm):',
    options,
    required: true,
  });

  if (p.isCancel(selected)) {
    p.cancel('Operation cancelled');
    process.exit(0);
  }

  return selected as AgentFile[];
}

async function fetchSource(source: string): Promise<string> {
  const tempDir = mkdtempSync(join(tmpdir(), 'agents-cli-'));

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
    await degit(target).clone(tempDir);
    return tempDir;
  } catch (err) {
    rmSync(tempDir, { recursive: true, force: true });
    throw new Error(`Failed to fetch from ${source}: ${err}`);
  }
}

export async function addCommand(source: string, options: AddCommandOptions): Promise<void> {
  console.clear();
  showLogo();

  let isGlobal = options.global;

  if (isGlobal === undefined) {
    isGlobal = await promptInstallLocation();
  }

  // 使用统一的树状结构
  console.log(`${S_STEP_ACTIVE} ${pc.cyan('Source:')} ${pc.dim(`https://github.com/${source}.git`)}`);
  console.log(S_BAR);
  
  const s = p.spinner();
  s.start('Cloning repository...');
  
  let tempDir: string;
  try {
    tempDir = await fetchSource(source);
    s.stop(`${pc.green('✓')} Repository cloned`);
  } catch (err) {
    s.stop(`${pc.red('✗')} Failed to clone repository`);
    p.log.error(`Failed to fetch source: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  console.log(S_BAR);
  
  // 步骤 2: 发现 agents
  s.start('Discovering agents...');
  let agents: AgentFile[];
  try {
    agents = await discoverFromDirectory(tempDir);
    s.stop(`${pc.green('✓')} Found ${agents.length} agent(s)`);
  } catch (err) {
    s.stop(`${pc.red('✗')} Failed to discover agents`);
    p.log.error(`Failed to discover agents: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  if (agents.length === 0) {
    p.log.error('No agents found in the source');
    process.exit(1);
  }

  console.log(S_BAR);
  
  // 步骤 3: 选择 agents
  let selectedAgents: AgentFile[];
  if (options.yes) {
    selectedAgents = agents;
  } else {
    selectedAgents = await promptSelectAgents(agents);
  }

  if (selectedAgents.length === 0) {
    p.cancel('No agents selected, aborting');
    process.exit(0);
  }

  // 显示选中的 agents - 作为树的分支
  console.log(`${S_BAR} ${S_BRANCH} ${pc.dim('Selected:')}`);
  selectedAgents.forEach((agent, index) => {
    const isLast = index === selectedAgents.length - 1;
    const prefix = isLast ? S_BRANCH_END : S_BRANCH;
    const name = agent.agent.name || basename(agent.path, '.md');
    console.log(`${S_BAR} ${isLast ? ' ' : S_BAR} ${prefix} ${S_BULLET} ${pc.bold(name)}`);
  });

  // 步骤 4: 安装
  console.log(S_BAR);
  s.start('Installing agents...');

  try {
    let platforms: AgentPlatform[];

    if (options.agent && options.agent.length > 0) {
      platforms = options.agent as AgentPlatform[];
    } else {
      platforms = ['opencode'];
    }

    const installOptions: InstallOptions = {
      source,
      sourcePath: tempDir,
      global: isGlobal,
      platforms,
      agentName: options.agentName,
      copy: options.copy,
      yes: options.yes,
      selectedAgents,
    };

    await installAgent(installOptions);

    s.stop(`${pc.green('✓')} Successfully installed ${selectedAgents.length} agent(s)`);
    
    console.log();
    console.log(pc.dim('  Next steps:'));
    console.log(pc.dim(`    npx opencode-agents list     View installed agents`));
    console.log();
  } catch (err) {
    s.stop(`${pc.red('✗')} Installation failed`);
    p.log.error(`Failed to install agent: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  } finally {
    if (existsSync(tempDir) && tempDir.startsWith(tmpdir())) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }
}
