import { Command } from 'commander';
import * as p from '@clack/prompts';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import chalk from 'chalk';
import { styledPrompts, symbols } from '../ui/styled-prompts.js';
import { projectPrompts } from '../prompts/project.js';
import { ReactNativeExpoScaffold } from '../scaffold/react-native-expo.js';
import { ConvexIntegration } from '../scaffold/convex-integration.js';
import { DocInjector } from '../scaffold/injector.js';
import { generateDocs } from '../generators/docs.js';

export const createCommand = new Command('create')
  .description('Create a new project with scaffolding and documentation')
  .requiredOption('-s, --stack <name>', 'Technology stack (react-native-convex)')
  .option('-i, --idea <text>', 'Project idea to expand into docs')
  .option('-n, --name <name>', 'Project directory name')
  .option('-o, --output <path>', 'Destination directory', process.cwd())
  .option('--ai-provider <provider>', 'AI provider (openai, anthropic, local)', 'openai')
  .option('--model <model>', 'AI model to use')
  .option('--no-research', 'Disable MCP/web research')
  .action(async (options) => {
    try {
      styledPrompts.intro(`${symbols.rocket} Creating project with ${chalk.cyan(options.stack)}`);

      // Gather and confirm project settings
      const projectData = await projectPrompts.gatherProjectData({ ...options, stack: options.stack, idea: options.idea });
      const shouldProceed = await projectPrompts.confirmGeneration(projectData);
      if (!shouldProceed) {
        p.cancel('Creation cancelled');
        return;
      }

      // Scaffold project using URL-safe slug for directory
      const projectDirName = options.name || projectData.projectSlug;
      let projectPath = path.resolve(options.output, projectDirName);
      const expo = new ReactNativeExpoScaffold();
      const result = await expo.run({ projectName: projectDirName, destination: options.output });
      projectPath = result.projectPath;

      // Convex setup
      const convex = new ConvexIntegration();
      await convex.setup({ projectPath });

      // Generate docs to a temp folder
      const tempDocs = await fs.mkdtemp(path.join(os.tmpdir(), 'docflow-docs-'));
      const gen = await generateDocs(projectData, {
        output: tempDocs,
        aiProvider: options.aiProvider,
        model: options.model,
        research: options.research !== false,
        dryRun: false
      });

      // Inject docs
      const injector = new DocInjector();
      await injector.inject({ projectPath, docsPath: gen.outputPath });

      styledPrompts.outro(`${symbols.success} Project created at ${chalk.green(projectPath)}`);
      styledPrompts.note(
        `Next steps:\n- cd ${projectPath}\n- npm start\n- Open docs in ${chalk.yellow(path.join(projectPath, 'docs'))}`,
        'Ready to develop'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      styledPrompts.error(`Create failed: ${message}`);
      p.cancel('Process terminated');
      process.exit(1);
    }
  });
