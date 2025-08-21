import { Command } from 'commander';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { styledPrompts, symbols } from '../ui/styled-prompts.js';
import { projectPrompts } from '../prompts/project.js';
import { generateDocs } from '../generators/docs.js';
import { NoopConversationEngine, RealConversationEngine } from '../conversation/engine.js';
import { getAvailableStacks } from '../templates/stack-registry.js';
import { buildProjectDataFromSummary } from '../conversation/project-data.js';
import { ConversationSessionManager } from '../conversation/session.js';
import { ConversationOrchestrator } from '../conversation/orchestrator.js';
import { ChatUI } from '../ui/chat.js';
import { summarizeDiscovery } from '../conversation/summarizer.js';
import { createDiscoveryAgent } from '../conversation/agent.js';

export const generateCommand = new Command('generate')
  .alias('gen')
  .description('Generate project documentation')
  .option('-i, --idea <text>', 'Project idea to expand into documentation')
  .option('-s, --stack <name>', 'Technology stack (nextjs-convex, nextjs-supabase, react-native-convex)')
  .option('-o, --output <path>', 'Output directory')
  .option('--ai-provider <provider>', 'AI provider (openai, anthropic, local)', 'openai')
  .option('--model <model>', 'AI model to use')
  .option('--reasoning-effort <effort>', 'GPT-5 reasoning effort (minimal, low, medium, high)', 'minimal')
  .option('--verbosity <level>', 'GPT-5 output verbosity (low, medium, high)', 'medium')
  .option('--conversational', 'Enable conversational mode (experimental)', false)
  .option('--session <id>', 'Resume a previous conversational session by ID')
  .option('--accept-defaults', 'Auto-accept suggestions and confirmation where possible', false)
  .option('--research', 'Enable research mode with MCP and web search', true)
  .option('--dry-run', 'Show what would be generated without creating files', false)
  .option('--debug', 'Show debug info during conversational flow', false)
  .action(async (options) => {
    try {
      styledPrompts.intro(`${symbols.rocket} Starting project documentation generation`);

      // Normalize and validate provider/model
      const normalizeProvider = (p: string | undefined): 'openai' | 'anthropic' | 'local' => {
        const v = String(p || '').toLowerCase();
        if (v === 'openai' || v === 'anthropic' || v === 'local') return v;
        styledPrompts.warning(`Unknown AI provider "${p}", defaulting to OpenAI`);
        return 'openai';
      };
      const provider = normalizeProvider(options.aiProvider);
      const defaultModel = provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o';
      const model = (options.model && String(options.model).trim().length > 0) ? options.model : defaultModel;
      const useConvex = String(process.env.DOCFLOW_USE_CONVEX_AI || '').trim() === '1';
      if (options.debug) {
        styledPrompts.info(`Debug: provider=${provider}, model=${model}, useConvexAI=${useConvex}`);
        const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || process.env.EXPO_PUBLIC_CONVEX_URL || process.env.DOCFLOW_CONVEX_ADMIN_URL;
        styledPrompts.info(`Debug: convexUrl=${convexUrl ? 'set' : 'unset'}`);
      }

      // REQUIRED: Ensure DOCFLOW_PROJECTS_DIR is set
      if (!process.env.DOCFLOW_PROJECTS_DIR) {
        styledPrompts.error('DOCFLOW_PROJECTS_DIR environment variable is required');
        p.cancel('Set DOCFLOW_PROJECTS_DIR in your .env file to specify where projects should be saved');
        process.exit(1);
      }

      // Gather project requirements (conversational stub or form prompts)
      let projectData = null as any;
      let createdSessionId: string | null = null;
      if (options.conversational) {
        const sessionManager = new ConversationSessionManager();
        let conv: any = null;
        if (options.session) {
          const loaded = await sessionManager.load(options.session);
          if (loaded) {
            // Resume conversation from last saved state
            const chat = new ChatUI({
              onAssistantChunk: async (text: string) => {
                try { await sessionManager.appendAssistantChunk(loaded.state.sessionId, text, 'discovery-default'); } catch {}
              }
            });
            const agent = createDiscoveryAgent();
            const orchestrator = new ConversationOrchestrator({ aiProvider: provider, model, agent: agent.descriptor, debug: !!options.debug });
            const managed = await orchestrator.manageConversation(
              (loaded.summary as any) || {},
              (loaded.state.turns || []),
              chat,
              loaded.state.sessionId,
              {
                onTurn: async (turn) => {
                  try { await sessionManager.appendTurn(loaded.state.sessionId, turn); } catch {}
                },
              }
            );
            chat.close();
            const summary = await summarizeDiscovery(provider, options.idea, managed.summary, model);
            const state = { sessionId: loaded.state.sessionId, phase: 'discovery', turns: managed.turns };
            await sessionManager.createOrUpdate(state as any, summary as any);
            conv = { state, summary };
            styledPrompts.note(`Resumed conversational session: ${chalk.cyan(loaded.state.sessionId)}\nTo continue later: docflow generate --conversational --session ${loaded.state.sessionId}`, 'Session');
          }
        }

        if (!conv) {
          const engine = new RealConversationEngine();
          conv = await engine.start({ idea: options.idea, aiProvider: provider, model, debug: !!options.debug });
          await sessionManager.createOrUpdate(conv.state, conv.summary as any);
          createdSessionId = conv.state.sessionId;
          styledPrompts.note(`Created conversational session: ${chalk.cyan(createdSessionId)}\nResume anytime with:\n  docflow generate --conversational --session ${createdSessionId}`, 'Session');
        }

        // Build ProjectData directly from conversational summary without form prompts
        const stacks = await getAvailableStacks();
        projectData = buildProjectDataFromSummary(
          conv.summary,
          provider,
          model,
          stacks
        );
        
        // DEBUG: Check if project name is coming through
        if (options.debug) {
          styledPrompts.debug(`summary.name=${conv.summary?.name || 'undefined'}`);
          styledPrompts.debug(`projectData.name=${projectData.name}`);
          styledPrompts.debug(`summary=${JSON.stringify(conv.summary)}`);
        }
        
        // Always use project slug in DOCFLOW_PROJECTS_DIR unless user specified explicit path
        if (!options.output) {
          options.output = `${process.env.DOCFLOW_PROJECTS_DIR}/${projectData.projectSlug}`;
        }
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
        aiProvider: provider,
        model,
        research: options.research,
        dryRun: options.dryRun,
        reasoningEffort: options.reasoningEffort,
        verbosity: options.verbosity,
      });

      console.log(`\n🎉 ${chalk.green('Project Generated Successfully!')}`);
      console.log(`📁 Location: ${chalk.cyan(result.outputPath)}`);
      console.log(`📂 Project Name: ${chalk.cyan(projectData.name)}`);
      console.log(`📂 Project Directory: ${chalk.cyan(projectData.projectSlug)}`);
      console.log(`📋 Primary Reference: ${chalk.yellow('docs/releases/current/index.md')}`);
      console.log(`📊 ${result.filesGenerated.length} documentation files created`);
      if (result.warnings && result.warnings.length > 0) {
        console.log(`⚠️  ${result.warnings.length} warnings - check logs above`);
      }

      // Keep sessions by default to support resumption/audit. Add a future flag to opt-in cleanup.

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      styledPrompts.error(`Generation failed: ${message}`);
      p.cancel('Process terminated');
      process.exit(1);
    }
  });