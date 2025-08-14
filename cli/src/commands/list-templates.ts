import { Command } from 'commander';
import path from 'path';
import glob from 'fast-glob';
import fs from 'fs-extra';
import chalk from 'chalk';

export const listTemplatesCommand = new Command('list-templates')
  .description('List available documentation templates and stacks')
  .action(async () => {
    const templatesRoot = path.resolve(process.cwd(), 'templates');
    const stacks = await fs.readdir(path.join(templatesRoot, 'stacks'));

    console.log('\nAvailable stacks and templates:\n');

    for (const stack of stacks) {
      const stackPath = path.join(templatesRoot, 'stacks', stack);
      const files = await glob('**/*', { cwd: stackPath, onlyFiles: true, dot: true });

      console.log(chalk.cyan(`- ${stack}`));
      for (const file of files) {
        const full = path.join(stackPath, file);
        const isTemplate = file.endsWith('.template');
        const display = file.replace('.template', '');
        let dyn = '';
        if (isTemplate) {
          const content = await fs.readFile(full, 'utf-8');
          const count = (content.match(/<!-- DYNAMIC: \[.*?\] -->/g) || []).length;
          if (count > 0) dyn = chalk.yellow(` (${count} AI sections)`);
        }
        console.log(`  · ${display}${dyn}`);
      }
      console.log();
    }
  });