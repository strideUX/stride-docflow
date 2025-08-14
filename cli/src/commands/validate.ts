import { Command } from 'commander';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { validateProject } from '../generators/validator.js';

export const validateCommand = new Command('validate')
  .description('Validate existing project documentation')
  .option('-p, --path <path>', 'Path to project documentation', './docs')
  .action(async (options) => {
    try {
      p.intro('🔍 Validating project documentation');
      
      const result = await validateProject(options.path);
      
      if (result.isValid) {
        p.outro(chalk.green('✅ Documentation is valid'));
      } else {
        p.note(
          result.issues.map(issue => `• ${issue}`).join('\n'),
          '⚠️ Issues Found'
        );
        
        if (result.suggestions.length > 0) {
          p.note(
            result.suggestions.map(suggestion => `• ${suggestion}`).join('\n'),
            '💡 Suggestions'
          );
        }
        
        p.outro(chalk.yellow('Documentation has issues that should be addressed'));
      }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      p.log.error(chalk.red('Validation failed: ' + message));
      p.cancel('Process terminated');
      process.exit(1);
    }
  });