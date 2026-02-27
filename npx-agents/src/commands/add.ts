import ora from 'ora';
import { installAgent } from '../core/installer.js';
import { detectPlatforms } from '../utils/filesystem.js';
import { logger } from '../utils/logger.js';
import type { AgentPlatform, InstallOptions } from '../types/index.js';

interface AddCommandOptions {
  global: boolean;
  agent: string[] | undefined;
  agentName: string | undefined;
  yes: boolean;
  copy: boolean;
}

export async function addCommand(source: string, options: AddCommandOptions): Promise<void> {
  const spinner = ora('Installing agent...').start();

  try {
    let platforms: AgentPlatform[];
    
    if (options.agent && options.agent.length > 0) {
      platforms = options.agent as AgentPlatform[];
    } else {
      platforms = ['opencode'];
    }

    const installOptions: InstallOptions = {
      source,
      global: options.global,
      platforms,
      agentName: options.agentName,
      copy: options.copy,
      yes: options.yes,
    };

    await installAgent(installOptions);
    
    spinner.succeed(`Successfully installed agent from ${source}`);
  } catch (err) {
    spinner.fail(`Failed to install agent: ${err instanceof Error ? err.message : String(err)}`);
    logger.error(String(err));
    process.exit(1);
  }
}
