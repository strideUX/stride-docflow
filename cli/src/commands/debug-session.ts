import { Command } from 'commander';
import chalk from 'chalk';
import { ConvexClient } from 'convex/browser';
import { api } from '../../convex/_generated/api.js';

export const debugSessionCommand = new Command('debug:session')
  .description('Print recent turns for a conversational session')
  .requiredOption('--id <sessionId>', 'Session ID')
  .option('--limit <n>', 'Number of turns to show (default 20)', '20')
  .action(async (options) => {
    const url =
      process.env.CONVEX_URL ||
      process.env.NEXT_PUBLIC_CONVEX_URL ||
      process.env.EXPO_PUBLIC_CONVEX_URL ||
      process.env.DOCFLOW_CONVEX_ADMIN_URL;
    if (!url) {
      console.error('Convex URL not configured. Set DOCFLOW_CONVEX_ADMIN_URL');
      process.exit(1);
    }
    const client = new ConvexClient(String(url));
    const turns = (await client.query((api as any).docflow.messages.listMessages as any, { sessionId: options.id } as any)) as Array<any>;
    const limit = Math.max(1, parseInt(String(options.limit), 10) || 20);
    const recent = turns.slice(-limit);
    console.log(chalk.cyan(`\nSession ${options.id} — Showing last ${recent.length} of ${turns.length} turns\n`));
    for (const t of recent) {
      const role = t.role || 'unknown';
      const ts = t.timestamp || '';
      const chunk = t.chunk ? chalk.gray(' [chunk]') : '';
      console.log(`${chalk.yellow(ts)} ${chalk.magenta(role)}:${chunk} ${t.content}`);
    }
  });
