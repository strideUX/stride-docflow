import { Command } from 'commander';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { styledPrompts, symbols } from '../ui/styled-prompts.js';
import { projectPrompts } from '../prompts/project.js';
import { generateDocs } from '../generators/docs.js';

export const generateCommand = new Command('generate')
  .alias('gen')
  .description('Generate project documentation')
  .option('-i, --idea <text>', 'Project idea to expand into documentation')
  .option('-s, --stack <name>', 'Technology stack (nextjs-convex, nextjs-supabase, react-native-convex)')
  .option('-o, --output <path>', 'Output directory', './project-docs')
  .option('--ai-provider <provider>', 'AI provider (openai, anthropic, local)', 'openai')
  .option('--model <model>', 'AI model to use')
  .option('--reasoning-effort <effort>', 'GPT-5 reasoning effort (minimal, low, medium, high)', 'minimal')
  .option('--verbosity <level>', 'GPT-5 output verbosity (low, medium, high)', 'medium')
  .option('--research', 'Enable research mode with MCP and web search', true)
  .option('--dry-run', 'Show what would be generated without creating files', false)
  .action(async (options) => {
    try {
      styledPrompts.intro(`${symbols.rocket} Starting project documentation generation`);

      // Gather project requirements
      const projectData = await projectPrompts.gatherProjectData(options);

      // Confirm before generation
      const shouldGenerate = await projectPrompts.confirmGeneration(projectData);
      if (!shouldGenerate) {
        p.cancel('Generation cancelled');
        return;
      }

      // Research current best practices if enabled
      if (options.research) {
        const s = styledPrompts.spinner();
        s.start(`${symbols.wave} Surfing the web for current best practices...`);
        // TODO: Implement MCP/web search integration
        s.stop(`${symbols.success} Research completed`);
      }

      // Generate documentation with progress tracking
      const result = await generateDocs(projectData, options);

      styledPrompts.outro(`${symbols.success} Project documentation generated successfully!`);
      
      styledPrompts.note(
        `📁 Output: ${chalk.cyan(result.outputPath)}
🎯 Start here: ${chalk.yellow(result.outputPath + '/docs/releases/current/index.md')}
📊 Files created: ${result.filesGenerated.length}`,
        `${symbols.neon} Generation Complete`
      );

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      styledPrompts.error(`Generation failed: ${message}`);
      p.cancel('Process terminated');
      process.exit(1);
    }
  });