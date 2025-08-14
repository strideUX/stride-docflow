import * as p from '@clack/prompts';
import chalk from 'chalk';
import { z } from 'zod';
import { parseIdeaWithAI } from '../generators/ai-parser.js';
import { getAvailableStacks } from '../templates/stack-registry.js';

const ProjectDataSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(10, 'Description should be at least 10 characters'),
  stack: z.string(),
  objectives: z.array(z.string()),
  targetUsers: z.array(z.string()),
  features: z.array(z.string()),
  constraints: z.array(z.string()).optional(),
  timeline: z.string().optional(),
  aiProvider: z.enum(['openai', 'anthropic', 'local']),
  model: z.string().optional()
});

export type ProjectData = z.infer<typeof ProjectDataSchema>;

class ProjectPrompts {
  async gatherProjectData(options: any): Promise<ProjectData> {
    let data: Partial<ProjectData> = {};

    // If idea is provided, parse it first
    if (options.idea) {
      const s = p.spinner();
      s.start('🤖 Analyzing your project idea...');
      const parsedIdea = await parseIdeaWithAI(options.idea, options.aiProvider);
      s.stop('✨ Idea analyzed successfully');
      // Merge parsed idea data, filtering out undefined values
      if (parsedIdea.name) data.name = parsedIdea.name;
      if (parsedIdea.description) data.description = parsedIdea.description;
      if (parsedIdea.objectives) data.objectives = parsedIdea.objectives;
      if (parsedIdea.targetUsers) data.targetUsers = parsedIdea.targetUsers;
      if (parsedIdea.features) data.features = parsedIdea.features;
      if (parsedIdea.constraints) data.constraints = parsedIdea.constraints;
      if (parsedIdea.suggestedStack) data.stack = parsedIdea.suggestedStack;
    }

    // Get available stacks
    const stacks = await getAvailableStacks();
    const stackOptions = stacks.map(s => ({
      label: `${s.name} - ${s.description}`,
      value: s.name as any,
      hint: s.technologies.join(', ')
    }));

    // Use Clack's group prompt for a beautiful flow
    const answers = await p.group({
      name: () => data.name ? Promise.resolve(data.name) : p.text({
        message: 'What is your project name?',
        placeholder: 'My Awesome Project',
        validate: (value) => {
          if (!value || value.length === 0) return 'Project name is required';
          return undefined;
        }
      }),
      
      description: () => data.description ? Promise.resolve(data.description) : p.text({
        message: 'Describe your project in one sentence:',
        placeholder: 'A platform that helps users...',
        validate: (value) => {
          if (!value || value.length < 10) return 'Description should be at least 10 characters';
          return undefined;
        }
      }),

      stack: () => (data.stack || options.stack) ? Promise.resolve(data.stack || options.stack) : p.select({
        message: 'Choose your technology stack:',
        options: stackOptions,
      }),

      objectives: () => data.objectives?.length ? Promise.resolve(data.objectives) : p.text({
        message: 'What are your main objectives? (comma-separated)',
        placeholder: 'Increase user engagement, Reduce manual work, Improve efficiency',
      }).then(text => typeof text === 'string' ? text.split(',').map((s: string) => s.trim()).filter(Boolean) : []),

      targetUsers: () => data.targetUsers?.length ? Promise.resolve(data.targetUsers) : p.text({
        message: 'Who are your target users? (comma-separated)',
        placeholder: 'Small business owners, Project managers, Remote teams',
      }).then(text => typeof text === 'string' ? text.split(',').map((s: string) => s.trim()).filter(Boolean) : []),

      features: () => data.features?.length ? Promise.resolve(data.features) : p.text({
        message: 'What are the key features? (comma-separated)',
        placeholder: 'User authentication, Real-time collaboration, Dashboard',
      }).then(text => typeof text === 'string' ? text.split(',').map((s: string) => s.trim()).filter(Boolean) : []),

      constraints: () => data.constraints?.length ? Promise.resolve(data.constraints) : p.text({
        message: 'Any constraints or limitations? (optional)',
        placeholder: 'Mobile-first design, GDPR compliance, Budget under $50k',
      }).then(text => text && typeof text === 'string' ? text.split(',').map((s: string) => s.trim()).filter(Boolean) : []),

      aiProvider: () => options.aiProvider ? Promise.resolve(options.aiProvider) : p.select({
        message: 'Which AI provider would you like to use?',
        options: [
          { label: 'OpenAI (GPT-5-mini, GPT-4o)', value: 'openai' as any, hint: 'Recommended - includes latest models' },
          { label: 'Anthropic (Claude)', value: 'anthropic' as any, hint: 'Great for technical content' },
          { label: 'Local/Custom', value: 'local' as any, hint: 'Use your own AI setup' }
        ],
      }),
    }, {
      onCancel: () => {
        p.cancel('Operation cancelled.');
        process.exit(0);
      },
    });

    // Merge with existing data and options
    const mergedData = {
      ...data,
      ...answers,
      model: options.model
    };

    // Validate the final data
    try {
      return ProjectDataSchema.parse(mergedData);
    } catch (error) {
      p.log.error('Invalid project data');
      throw new Error('Failed to validate project data');
    }
  }

  async confirmGeneration(data: ProjectData): Promise<boolean> {
    p.note(
      `Name: ${chalk.cyan(data.name)}
Description: ${chalk.gray(data.description)}
Stack: ${chalk.yellow(data.stack)}
Objectives: ${chalk.gray(data.objectives.join(', '))}
Target Users: ${chalk.gray(data.targetUsers.join(', '))}
Features: ${chalk.gray(data.features.join(', '))}`,
      '📋 Project Summary'
    );

    const confirm = await p.confirm({
      message: 'Generate documentation with these settings?',
      initialValue: true,
    });

    if (p.isCancel(confirm)) {
      p.cancel('Operation cancelled.');
      return false;
    }

    return confirm;
  }
}

export const projectPrompts = new ProjectPrompts();