#!/usr/bin/env node

import { Command } from 'commander';
import { outro } from '@clack/prompts';
import chalk from 'chalk';
import { createSplash, shouldShowSplash } from './ui/theme.js';
import { generateCommand } from './commands/generate.js';
import { validateCommand } from './commands/validate.js';
import { listTemplatesCommand } from './commands/list-templates.js';

const program = new Command();

// Show Miami neon splash screen
if (shouldShowSplash()) {
  console.log(createSplash());
}

program
  .name('docflow')
  .description('Generate comprehensive project documentation with AI assistance')
  .version('1.0.0')
  .option('--no-splash', 'Skip the splash screen');

// Add commands
program.addCommand(generateCommand);
program.addCommand(validateCommand);
program.addCommand(listTemplatesCommand);

// Parse arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
  if (shouldShowSplash()) {
    outro(chalk.hex('#B266FF')('Use docflow generate to get started, or --help for more options'));
  }
}