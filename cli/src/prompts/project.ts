import * as p from '@clack/prompts';
import chalk from 'chalk';
import { z } from 'zod';
import { parseIdeaWithAI } from '../generators/ai-parser.js';
import { getAvailableStacks } from '../templates/stack-registry.js';

// Convert user-friendly name to URL-safe project slug
function toProjectSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')     // Remove leading/trailing hyphens
    .replace(/-+/g, '-');        // Collapse multiple hyphens
}

const ProjectDataSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  projectSlug: z.string().min(1, 'Project slug is required'), // URL-safe version for directories
  description: z.string().min(10, 'Description should be at least 10 characters'),
  stack: z.string(),
  objectives: z.array(z.string()),
  targetUsers: z.array(z.string()),
  features: z.array(z.string()),
  constraints: z.array(z.string()).optional(),
  timeline: z.string().optional(),
  designInput: z.object({
    vibe: z.string().optional(),
    lookAndFeel: z.string().optional(), 
    userFlows: z.array(z.string()).optional(),
    screens: z.array(z.string()).optional(),
    wireframes: z.string().optional(),
    inspirations: z.string().optional()
  }).optional(),
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
      description: () => data.description ? Promise.resolve(data.description) : p.text({
        message: 'Describe your app idea:',
        placeholder: 'A fitness tracking app that helps users set goals and track workouts...',
        validate: (value) => {
          if (!value || value.length < 10) return 'Description should be at least 10 characters';
          return undefined;
        }
      }),

      name: () => data.name ? Promise.resolve(data.name) : p.text({
        message: 'What should we call your app?',
        placeholder: 'Fitness Tracker Pro',
        validate: (value) => {
          if (!value || value.length === 0) return 'App name is required';
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

      designVibe: () => p.text({
        message: 'What vibe or style are you going for? (optional)',
        placeholder: 'Modern minimalist, Playful and colorful, Professional corporate, Retro gaming...',
      }),

      lookAndFeel: () => p.text({
        message: 'Describe the look and feel you want: (optional)',
        placeholder: 'Clean white backgrounds, bold typography, soft rounded corners...',
      }),

      userFlows: () => p.text({
        message: 'Key user flows or journeys? (optional, comma-separated)',
        placeholder: 'Onboarding flow, Purchase flow, Social sharing flow...',
      }).then(text => text && typeof text === 'string' ? text.split(',').map((s: string) => s.trim()).filter(Boolean) : []),

      screens: () => p.text({
        message: 'Main screens or pages? (optional, comma-separated)', 
        placeholder: 'Home, Profile, Settings, Dashboard, Chat, Search...',
      }).then(text => text && typeof text === 'string' ? text.split(',').map((s: string) => s.trim()).filter(Boolean) : []),

      wireframes: () => p.text({
        message: 'Any wireframes, mockups, or design files? (optional)',
        placeholder: 'Path to files, URLs, or detailed descriptions...',
      }),

      inspirations: () => p.text({
        message: 'Apps or sites that inspire you? (optional)',
        placeholder: 'Linear for clean design, Stripe for payments, Discord for community...',
      }),

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

    // Generate project slug from name
    const projectSlug = toProjectSlug(answers.name || data.name || '');
    
    // Show the user what directory will be created
    p.note(`Directory name: ${chalk.cyan(projectSlug)}`, '📁 Project folder');

    // Merge with existing data and options
    const mergedData = {
      ...data,
      ...answers,
      projectSlug,
      // Structure design input properly
      designInput: {
        vibe: answers.designVibe || undefined,
        lookAndFeel: answers.lookAndFeel || undefined,
        userFlows: answers.userFlows?.length ? answers.userFlows : undefined,
        screens: answers.screens?.length ? answers.screens : undefined,
        wireframes: answers.wireframes || undefined,
        inspirations: answers.inspirations || undefined
      },
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
    let summary = `Name: ${chalk.cyan(data.name)}
Description: ${chalk.gray(data.description)}
Stack: ${chalk.yellow(data.stack)}
Objectives: ${chalk.gray(data.objectives.join(', '))}
Target Users: ${chalk.gray(data.targetUsers.join(', '))}
Features: ${chalk.gray(data.features.join(', '))}`;

    // Add design info if provided
    if (data.designInput) {
      const design = data.designInput;
      if (design.vibe) summary += `\nDesign Vibe: ${chalk.magenta(design.vibe)}`;
      if (design.lookAndFeel) summary += `\nLook & Feel: ${chalk.magenta(design.lookAndFeel)}`;
      if (design.screens?.length) summary += `\nKey Screens: ${chalk.gray(design.screens.join(', '))}`;
      if (design.userFlows?.length) summary += `\nUser Flows: ${chalk.gray(design.userFlows.join(', '))}`;
      if (design.inspirations) summary += `\nInspirations: ${chalk.gray(design.inspirations)}`;
    }

    p.note(summary, '📋 Project Summary');

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