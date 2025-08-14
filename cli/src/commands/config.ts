import { Command } from 'commander';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { userConfig } from '../config/user-config.js';
import { theme } from '../ui/theme.js';

export const configCommand = new Command('config')
  .description('Manage Docflow configuration')
  .action(async () => {
    try {
      const config = await userConfig.loadConfig();
      
      console.log(`\n⚙️  ${theme.fuchsia('Docflow Configuration')}`);
      console.log(`   Config file: ${theme.textMuted(userConfig.getConfigPath())}`);
      console.log(`   Default project directory: ${theme.cyan(config.defaultProjectDirectory)}\n`);
      
      const action = await p.select({
        message: 'What would you like to do?',
        options: [
          { value: 'view', label: 'View current configuration' },
          { value: 'edit-dir', label: 'Change default project directory' },
          { value: 'reset', label: 'Reset to defaults' },
          { value: 'exit', label: 'Exit' }
        ]
      });

      if (p.isCancel(action)) {
        p.cancel('Configuration cancelled');
        return;
      }

      switch (action) {
        case 'view':
          console.log('\n📄 Current Configuration:');
          console.log(JSON.stringify(config, null, 2));
          break;

        case 'edit-dir':
          const newDir = await p.text({
            message: 'Enter new default project directory:',
            placeholder: config.defaultProjectDirectory,
            validate: (value) => {
              if (!value) return 'Directory path is required';
              return undefined;
            }
          });

          if (!p.isCancel(newDir)) {
            await userConfig.updateConfig({ defaultProjectDirectory: newDir });
            console.log(`✅ Default project directory updated to: ${theme.cyan(newDir)}`);
          }
          break;

        case 'reset':
          const confirm = await p.confirm({
            message: 'Reset configuration to defaults?',
            initialValue: false
          });

          if (confirm && !p.isCancel(confirm)) {
            await userConfig.updateConfig({
              defaultProjectDirectory: '~/Documents/Work/Clients/DocFlow'
            });
            console.log('✅ Configuration reset to defaults');
          }
          break;

        case 'exit':
          console.log('👋 Configuration unchanged');
          break;
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Configuration error: ${message}`);
      process.exit(1);
    }
  });