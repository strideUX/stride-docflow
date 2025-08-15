import * as p from '@clack/prompts';
import chalk from 'chalk';
import { z } from 'zod';
import { parseIdeaWithAI } from '../generators/ai-parser.js';
import { getAvailableStacks } from '../templates/stack-registry.js';
import { clipboardImageManager, PastedImage } from '../ui/clipboard-images.js';
import { theme } from '../ui/theme.js';

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
    inspirations: z.string().optional(),
    images: z.array(z.object({
      id: z.string(),
      filename: z.string(),
      path: z.string(),
      type: z.string(),
      placeholder: z.string()
    })).optional()
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
      try {
        const parsedIdea = await parseIdeaWithAI(options.idea, options.aiProvider);
        s.stop('✨ Idea analyzed successfully');
        
        
        // Merge parsed idea data, filtering out undefined values
        // Special handling: if AI put description in "name" field, use it as description
        if (parsedIdea.name && parsedIdea.name.length > 20 && !parsedIdea.description) {
          data.description = parsedIdea.name;
          // Try to extract a proper name from the description
          data.name = parsedIdea.name.split(' ').slice(0, 4).join(' ');
        } else {
          if (parsedIdea.name) data.name = parsedIdea.name;
          if (parsedIdea.description) data.description = parsedIdea.description;
        }
        
        if (parsedIdea.objectives) data.objectives = parsedIdea.objectives;
        if (parsedIdea.targetUsers) data.targetUsers = parsedIdea.targetUsers;
        if (parsedIdea.features) data.features = parsedIdea.features;
        if (parsedIdea.constraints) data.constraints = parsedIdea.constraints;
        if (parsedIdea.suggestedStack) data.stack = parsedIdea.suggestedStack;
      } catch (error) {
        s.stop('⚠️  AI parsing failed, using fallback parser');
        console.log('DEBUG - Parsing error:', error);
        // Use the raw idea as description for now
        data.description = options.idea;
      }
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
      description: () => {
        if (data.description && data.description.length >= 10) {
          console.log(`🤖 ${theme.fuchsia('AI Analysis')}: Using parsed description`);
          console.log(`   ${theme.cyan(data.description)}\n`);
          return Promise.resolve(data.description);
        }
        return p.text({
          message: 'Describe your app idea:',
          placeholder: 'A fitness tracking app that helps users set goals and track workouts...',
          validate: (value) => {
            if (!value || value.length < 10) return 'Description should be at least 10 characters';
            return undefined;
          }
        });
      },

      name: async () => {
        const aiSuggestedName = data.name && data.name.length > 0 ? data.name : 'Fitness Tracker Pro';
        const hasAiSuggestion = data.name && data.name.length > 0;
        
        if (hasAiSuggestion) {
          console.log(`🤖 ${theme.fuchsia('AI Suggestion')}: "${theme.cyan(aiSuggestedName)}" (press Enter to accept, or type your own)`);
        }
        
        const userInput = await p.text({
          message: 'What should we call your app?',
          placeholder: aiSuggestedName,
          validate: (value) => {
            // Allow empty input if we have an AI suggestion (user presses Enter)
            if ((!value || value.length === 0) && !hasAiSuggestion) {
              return 'App name is required';
            }
            return undefined;
          }
        });
        
        // If user pressed Enter (empty input) and we have AI suggestion, use it
        return (!userInput || (typeof userInput === 'string' && userInput.length === 0)) && hasAiSuggestion ? aiSuggestedName : userInput;
      },

      stack: () => (data.stack || options.stack) ? Promise.resolve(data.stack || options.stack) : p.select({
        message: 'Choose your technology stack:',
        options: stackOptions,
      }),

      objectives: () => {
        if (data.objectives?.length) {
          console.log(`🎯 ${theme.fuchsia('AI Analysis')}: Using parsed objectives: ${theme.cyan(data.objectives.join(', '))}`);
          return Promise.resolve(data.objectives);
        }
        return p.text({
          message: 'What are your main objectives? (comma-separated)',
          placeholder: 'Increase user engagement, Reduce manual work, Improve efficiency',
        }).then(text => typeof text === 'string' ? text.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
      },

      targetUsers: () => {
        if (data.targetUsers?.length) {
          p.note(`Using AI-parsed target users: ${chalk.gray(data.targetUsers.join(', '))}`, '👥 AI Analysis');
          return Promise.resolve(data.targetUsers);
        }
        return p.text({
          message: 'Who are your target users? (comma-separated)',
          placeholder: 'Small business owners, Project managers, Remote teams',
        }).then(text => typeof text === 'string' ? text.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
      },

      features: () => {
        if (data.features?.length) {
          p.note(`Using AI-parsed features: ${chalk.gray(data.features.join(', '))}`, '⚡ AI Analysis');
          return Promise.resolve(data.features);
        }
        return p.text({
          message: 'What are the key features? (comma-separated)',
          placeholder: 'User authentication, Real-time collaboration, Dashboard',
        }).then(text => typeof text === 'string' ? text.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
      },

      constraints: () => data.constraints?.length ? Promise.resolve(data.constraints) : p.text({
        message: 'Any constraints or limitations? (optional)',
        placeholder: 'Mobile-first design, GDPR compliance, Budget under $50k',
      }).then(text => text && typeof text === 'string' ? text.split(',').map((s: string) => s.trim()).filter(Boolean) : []),

      // Collect all images upfront before design questions
      images: async () => {
        const result = await clipboardImageManager.promptWithImageSupport({
          message: 'Let\'s start by collecting any images you have for this project',
          placeholder: 'Not applicable - images are collected via prompts above'
        });
        return result.images;
      },

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

    // Images are now collected via the dedicated prompt
    const allPastedImages = answers.images || [];

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
        inspirations: answers.inspirations || undefined,
        images: allPastedImages?.length ? allPastedImages : undefined
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
    // Create a cleaner summary display without boxes
    console.log(`\n📋 ${theme.fuchsia('Project Summary')}`);
    console.log(`   Name: ${theme.cyan(data.name)}`);
    console.log(`   Description: ${theme.text(data.description)}`);
    console.log(`   Stack: ${chalk.yellow(data.stack)}`);
    console.log(`   Objectives: ${theme.text(data.objectives.join(', '))}`);
    console.log(`   Target Users: ${theme.text(data.targetUsers.join(', '))}`);
    console.log(`   Features: ${theme.text(data.features.join(', '))}`);

    // Add design info if provided
    if (data.designInput) {
      const design = data.designInput;
      if (design.vibe) console.log(`   Design Vibe: ${theme.violet(design.vibe)}`);
      if (design.lookAndFeel) console.log(`   Look & Feel: ${theme.violet(design.lookAndFeel)}`);
      if (design.screens?.length) console.log(`   Key Screens: ${theme.text(design.screens.join(', '))}`);
      if (design.userFlows?.length) console.log(`   User Flows: ${theme.text(design.userFlows.join(', '))}`);
      if (design.inspirations) console.log(`   Inspirations: ${theme.text(design.inspirations)}`);
      if (design.images?.length) {
        console.log(`   Pasted Images: ${design.images.map(img => img.placeholder).join(', ')}`);
      }
    }
    console.log(); // Add spacing

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