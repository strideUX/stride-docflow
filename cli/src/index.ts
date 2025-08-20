#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file from CLI package directory, not user's working directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { Command } from 'commander';
import { outro } from '@clack/prompts';
import chalk from 'chalk';
import { createSplash, shouldShowSplash } from './ui/theme.js';
import { generateCommand } from './commands/generate.js';
import { validateCommand } from './commands/validate.js';
import { listTemplatesCommand } from './commands/list-templates.js';
import { createCommand } from './commands/create.js';
import { configCommand } from './commands/config.js';
import { debugSessionCommand } from './commands/debug-session.js';

// Handle Ctrl+C gracefully - force immediate exit
let exitingInProgress = false;

process.on('SIGINT', () => {
  if (exitingInProgress) {
    // Second Ctrl+C - force immediate exit
    console.log('\n🚨 Force exiting...');
    process.exit(1);
  }
  
  exitingInProgress = true;
  (global as any).exitingInProgress = true; // Share flag with other modules
  console.log('\n👋 Exiting Docflow...');
  
  // Clear any active progress lines
  process.stdout.write('\r\x1b[K');
  
  // Force exit after short delay to allow cleanup
  setTimeout(() => {
    process.exit(0);
  }, 100);
});

// Handle termination signals
process.on('SIGTERM', () => {
  console.log('\n👋 Docflow terminated');
  process.stdout.write('\r\x1b[K');
  process.exit(0);
});

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
program.addCommand(createCommand);
program.addCommand(configCommand);
program.addCommand(debugSessionCommand);

// Parse arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
  if (shouldShowSplash()) {
    outro(chalk.hex('#B266FF')('Use docflow generate to get started, or --help for more options'));
  }
}