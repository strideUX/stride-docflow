#!/usr/bin/env node
import { program } from 'commander';
import 'dotenv/config';
import * as clack from '@clack/prompts';
import { loadConfig } from './config/config.js';
import { startConversation } from './conversation/start-conversation.js';
import { showHelp, showMainMenu } from './menu/main-menu.js';

async function runNew(): Promise<void> {
  const config = await loadConfig();
  await startConversation(config);
}

program
  .name('docflow')
  .description('AI-powered project scaffolding with DocFlow')
  .version('0.1.0');

program
  .command('new')
  .description('Start a new project conversation')
  .action(async () => {
    await runNew();
  });

// If no command is provided, show clack menu
const args = process.argv.slice(2);
if (args.length === 0) {
  (async () => {
    try {
      const choice = await showMainMenu();
      if (choice === 'new') {
        await runNew();
      } else if (choice === 'help') {
        await showHelp();
      }
      // exit otherwise
    } catch (error) {
      clack.outro('An error occurred.');
      process.exitCode = 1;
    }
  })();
} else {
  program.parseAsync(process.argv).catch(() => {
    process.exitCode = 1;
  });
}


