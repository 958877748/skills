import ora from 'ora';
import inquirer from 'inquirer';
import { tmpdir } from 'os';
import { existsSync, rmSync } from 'fs';
import { installAgent } from '../core/installer.js';
import { discoverFromDirectory } from '../core/discover.js';
import { detectPlatforms } from '../utils/filesystem.js';
import { logger } from '../utils/logger.js';
import type { AgentPlatform, InstallOptions, AgentFile } from '../types/index.js';
import { basename } from 'path';

interface AddCommandOptions {
  global: boolean | undefined;
  agent: string[] | undefined;
  agentName: string | undefined;
  yes: boolean;
  copy: boolean;
}

async function promptInstallLocation(): Promise<boolean> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'scope',
      message: 'Where would you like to install this agent?',
      choices: [
        { name: 'Current project (./.opencode/agents/)', value: false },
        { name: 'Global (~/.config/opencode/agents/)', value: true },
      ],
      default: 0,
    },
  ]);
  return answers.scope;
}

async function promptSelectAgents(agents: AgentFile[]): Promise<AgentFile[]> {
  const choices = agents.map(agent => ({
    name: agent.agent.name || basename(agent.path, '.md'),
    value: agent,
    checked: false,
  }));

  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selected',
      message: 'Select agents to install (space to select, enter to confirm):',
      choices,
    },
  ]);

  return answers.selected;
}

async function fetchSource(source: string): Promise<string> {
  const { mkdtempSync, join } = await import('path');
  const degit = await import('degit');

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
    await degit.default(target).clone(tempDir);
    return tempDir;
  } catch (err) {
    rmSync(tempDir, { recursive: true, force: true });
    throw new Error(`Failed to fetch from ${source}: ${err}`);
  }
}

export async function addCommand(source: string, options: AddCommandOptions): Promise<void> {
  let isGlobal = options.global;

  if (isGlobal === undefined) {
    isGlobal = await promptInstallLocation();
  }

  const fetchSpinner = ora('Fetching source...').start();

  let tempDir: string;
  try {
    tempDir = await fetchSource(source);
    fetchSpinner.succeed('Source fetched');
  } catch (err) {
    fetchSpinner.fail(`Failed to fetch source: ${err instanceof Error ? err.message : String(err)}`);
    logger.error(String(err));
    process.exit(1);
  }

  const discoverSpinner = ora('Discovering agents...').start();
  let agents: AgentFile[];
  try {
    agents = await discoverFromDirectory(tempDir);
    discoverSpinner.succeed(`Found ${agents.length} agent(s)`);
  } catch (err) {
    discoverSpinner.fail(`Failed to discover agents: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  if (agents.length === 0) {
    logger.error('No agents found in the source');
    process.exit(1);
  }

  let selectedAgents: AgentFile[];
  if (options.yes) {
    selectedAgents = agents;
  } else {
    selectedAgents = await promptSelectAgents(agents);
  }

  if (selectedAgents.length === 0) {
    logger.warn('No agents selected, aborting');
    process.exit(0);
  }

  const installSpinner = ora('Installing agent(s)...').start();

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

    installSpinner.succeed(`Successfully installed ${selectedAgents.length} agent(s)`);
  } catch (err) {
    installSpinner.fail(`Failed to install agent: ${err instanceof Error ? err.message : String(err)}`);
    logger.error(String(err));
    process.exit(1);
  } finally {
    if (existsSync(tempDir) && tempDir.startsWith(tmpdir())) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }
}
