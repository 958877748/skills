import ora from 'ora';
import { removeAgent } from '../core/installer.js';
import { detectPlatforms } from '../utils/filesystem.js';
import { logger } from '../utils/logger.js';
import type { AgentPlatform } from '../types/index.js';

interface RemoveCommandOptions {
  global: boolean;
  agent: string | undefined;
}

export async function removeCommand(name: string, options: RemoveCommandOptions): Promise<void> {
  const spinner = ora(`Removing agent "${name}"...`).start();

  try {
    let platforms: AgentPlatform[];
    
    if (options.agent) {
      platforms = [options.agent as AgentPlatform];
    } else {
      platforms = detectPlatforms();
    }

    let removed = false;
    
    for (const platform of platforms) {
      const result = removeAgent(name, platform, options.global);
      if (result) {
        removed = true;
      }
    }

    if (removed) {
      spinner.succeed(`Removed agent "${name}"`);
    } else {
      spinner.warn(`Agent "${name}" not found`);
    }
  } catch (err) {
    spinner.fail(`Failed to remove agent: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
