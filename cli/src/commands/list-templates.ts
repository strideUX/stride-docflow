import { Command } from 'commander';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { getAvailableStacks } from '../templates/stack-registry.js';

export const listTemplatesCommand = new Command('list')
  .description('List available technology stacks and templates')
  .action(async () => {
    p.intro('📚 Available Technology Stacks');
    
    const stacks = await getAvailableStacks();
    
    for (const stack of stacks) {
      p.note(
        `${chalk.gray('Description:')} ${stack.description}
${chalk.gray('Technologies:')} ${chalk.cyan(stack.technologies.join(', '))}
${chalk.gray('Use case:')} ${stack.useCase}
${chalk.gray('Features:')} ${Object.entries(stack.features)
  .filter(([_, value]) => value === true || (Array.isArray(value) && value.length > 0))
  .map(([key, value]) => Array.isArray(value) ? `${key} (${value.join(', ')})` : key)
  .join(', ')}`,
        chalk.cyan.bold(stack.name)
      );
    }
    
    p.outro(chalk.yellow('💡 Use with: docflow generate --stack <name>'));
  });