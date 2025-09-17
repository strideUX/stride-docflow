import * as clack from '@clack/prompts';
import path from 'path';
import fs from 'fs-extra';

import { Config } from '../config/config.js';
import { ProjectGenerator } from '../generator/project-generator.js';
import { ProjectContext } from '../types/conversation.js';
import { ConversationManager } from './conversation-manager.js';

export async function startConversation(config: Config): Promise<void> {
  clack.intro('🚀 DocFlow Project Creator');

  // Conduct brief intro via AI and get suggested name
  const manager = new ConversationManager(config);
  await manager.runIntroduction();
  const suggested = await manager.suggestProjectName();

  const name = (await clack.text({
    message: 'Project name (press enter to accept suggestion):',
    placeholder: suggested || 'my-new-project',
    initialValue: suggested || '',
    validate(value) {
      if (!value || !/^([a-z0-9]+)(-[a-z0-9]+)*$/.test(value)) {
        return 'Use kebab-case: letters, numbers, dashes';
      }
      return undefined;
    },
  })) as unknown as string;
  if (clack.isCancel(name)) throw new Error('Cancelled');

  // Prompt for project directory
  const baseDir = config.projectsDir;
  const projectPath = path.join(baseDir, String(name));

  // Confirm
  const confirmed = await clack.confirm({
    message: `Create project at: ${projectPath}?`,
  });
  if (!confirmed) {
    clack.outro('Cancelled');
    return;
  }

  const s = clack.spinner();
  s.start('Generating project...');
  try {
    await fs.ensureDir(baseDir);
    const context: ProjectContext = {
      overview: {
        name: String(name),
        purpose: '',
        features: [],
        users: '',
        success: '',
      },
      stack: {},
      specs: [],
      projectName: String(name),
      projectPath,
    };

    const generator = new ProjectGenerator();
    await generator.generate(context, projectPath, config.templateDir);

    s.stop('Project created');
    clack.outro(`✅ Created ${name} at ${projectPath}`);
  } catch (error) {
    s.stop('Failed');
    throw error;
  }
}


