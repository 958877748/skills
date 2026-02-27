#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';
import { initCommand } from './commands/init.js';
import { findCommand } from './commands/find.js';
import { checkCommand } from './commands/check.js';
import { updateCommand } from './commands/update.js';

const program = new Command();

program
  .name('agents')
  .description('CLI for managing AI coding agents')
  .version('1.0.0');

program
  .command('add <source>')
  .description('Install one or more agents from a GitHub repository or local path')
  .option('-g, --global', 'Install to global directory', false)
  .option('-a, --agent <agents...>', 'Target agent platform(s)')
  .option('--agent-name <name>', 'Name for the installed agent')
  .option('-y, --yes', 'Skip confirmation', false)
  .option('--copy', 'Copy instead of symlink', false)
  .action(addCommand);

program
  .command('list')
  .description('List installed agents')
  .option('-g, --global', 'List only global agents')
  .option('-a, --agent <agent>', 'Filter by platform')
  .action(listCommand);

program
  .command('remove <name>')
  .description('Remove an installed agent')
  .option('-g, --global', 'Remove from global directory')
  .option('-a, --agent <agent>', 'Remove from specific platform')
  .action(removeCommand);

program
  .command('init [name]')
  .description('Create a new agent definition template')
  .action(initCommand);

program
  .command('find [query]')
  .description('Search for available agents')
  .action(findCommand);

program
  .command('check')
  .description('Check for updates to installed agents')
  .action(checkCommand);

program
  .command('update')
  .description('Update all installed agents to the latest version')
  .action(updateCommand);

program.parse();
