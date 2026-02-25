import chalk from 'chalk';
import { logger } from '../utils/logger.js';

export async function updateCommand(): Promise<void> {
  logger.info('Updating agents...');
  
  console.log(chalk.yellow('\nNote: Auto-update functionality coming soon.\n'));
  
  console.log(chalk.dim('To update an agent, remove it and reinstall:'));
  console.log(chalk.dim('  npx agents remove <agent-name>'));
  console.log(chalk.dim('  npx agents add <source>'));
}
