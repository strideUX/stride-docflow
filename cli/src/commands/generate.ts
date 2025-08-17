import { Command } from 'commander';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { styledPrompts, symbols } from '../ui/styled-prompts.js';
import { projectPrompts } from '../prompts/project.js';
import { generateDocs } from '../generators/docs.js';
import { NoopConversationEngine, RealConversationEngine } from '../conversation/engine.js';
import { ConversationSessionManager } from '../conversation/session.js';

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
  .option('--conversational', 'Enable conversational mode (experimental)', false)
  .option('--session <id>', 'Resume a previous conversational session by ID')
  .option('--accept-defaults', 'Auto-accept suggestions and confirmation where possible', false)
  .option('--research', 'Enable research mode with MCP and web search', true)
  .option('--dry-run', 'Show what would be generated without creating files', false)
  .action(async (options) => {
    try {
      styledPrompts.intro(`${symbols.rocket} Starting project documentation generation`);

      // Gather project requirements (conversational stub or form prompts)
      let projectData = null as any;
      if (options.conversational) {
        const sessionManager = new ConversationSessionManager();
        let conv: any = null;
        if (options.session) {
          const loaded = await sessionManager.load(options.session);
          if (loaded) {
            conv = loaded;
          }
        }

        if (!conv) {
          const engine = new RealConversationEngine();
          conv = await engine.start({ idea: options.idea, aiProvider: options.aiProvider, model: options.model });
          await sessionManager.createOrUpdate(conv.state, conv.summary as any);
        }

        const seed = {
          idea: (conv.summary as any).description || options.idea,
          aiProvider: options.aiProvider,
          model: options.model,
          seed: {
            description: (conv.summary as any).description,
            objectives: (conv.summary as any).objectives,
            targetUsers: (conv.summary as any).targetUsers,
            features: (conv.summary as any).features,
            constraints: (conv.summary as any).constraints,
            stack: (conv.summary as any).stackSuggestion,
          }
        };
        projectData = await projectPrompts.gatherProjectData(seed);
      } else {
        projectData = await projectPrompts.gatherProjectData(options);
      }

      // Confirm before generation (unless auto-accept)
      const shouldGenerate = options.acceptDefaults ? true : await projectPrompts.confirmGeneration(projectData);
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
      const result = await generateDocs(projectData, {
        output: options.output,
        aiProvider: options.aiProvider,
        model: options.model,
        research: options.research,
        dryRun: options.dryRun,
        reasoningEffort: options.reasoningEffort,
        verbosity: options.verbosity,
      });

      console.log(`\n🎉 ${chalk.green('Project Generated Successfully!')}`);
      console.log(`📁 Location: ${chalk.cyan(result.outputPath)}`);
      console.log(`📋 Primary Reference: ${chalk.yellow('docs/releases/current/index.md')}`);
      console.log(`📊 ${result.filesGenerated.length} documentation files created`);
      if (result.warnings && result.warnings.length > 0) {
        console.log(`⚠️  ${result.warnings.length} warnings - check logs above`);
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      styledPrompts.error(`Generation failed: ${message}`);
      p.cancel('Process terminated');
      process.exit(1);
    }
  });