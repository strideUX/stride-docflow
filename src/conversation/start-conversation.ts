import * as clack from '@clack/prompts';
import path from 'path';
import fs from 'fs-extra';

import { Config } from '../config/config.js';
import { ProjectGenerator } from '../generator/project-generator.js';
import { ProjectContext } from '../types/conversation.js';

export async function startConversation(config: Config): Promise<void> {
  clack.intro('🚀 DocFlow Project Creator');

  // Prompt for project name
  const name = (await clack.text({
    message: 'Project name (kebab-case):',
    placeholder: 'my-new-project',
    validate(value) {
      if (!value || !/^([a-z0-9]+)(-[a-z0-9]+)*$/.test(value)) {
        return 'Use kebab-case: letters, numbers, dashes';
      }
      return undefined;
    },
  })) as unknown as string;

  if (clack.isCancel(name)) {
    clack.outro('Cancelled');
    return;
  }

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
    clack.outro('An error occurred during project generation.');
    throw error;
  }
}


