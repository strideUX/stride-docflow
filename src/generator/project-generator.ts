import fs from 'fs-extra';
import path from 'path';

import { ProjectContext } from '../types/conversation.js';

export class ProjectGenerator {
  async generate(context: ProjectContext, projectPath: string, templateRoot: string): Promise<void> {
    await this.createDirectories(projectPath);
    await this.copyTemplates(projectPath, templateRoot);
    await this.initializeTrackingFiles(context, projectPath);
  }

  private async createDirectories(projectPath: string): Promise<void> {
    await fs.ensureDir(projectPath);
  }

  private async copyTemplates(projectPath: string, templateRoot: string): Promise<void> {
    await fs.copy(templateRoot, projectPath, { overwrite: true, recursive: true });
  }

  private async initializeTrackingFiles(context: ProjectContext, projectPath: string): Promise<void> {
    const activePath = path.join(projectPath, 'docflow', 'ACTIVE.md');
    const indexPath = path.join(projectPath, 'docflow', 'INDEX.md');
    const now = new Date().toISOString().split('T')[0];

    const active = `# Currently Active\n\n## Primary Focus\n- Initialization via CLI\n\n## Status\nProject created by DocFlow CLI on ${now}.\n`;
    const index = `# Feature Index\n\n## Active\n- Initialization: Project scaffolding complete (${now})\n\n## Backlog Priority\n- [Add your first feature spec]\n\n## Completed\n- [None yet]\n`;

    await fs.outputFile(activePath, active);
    await fs.outputFile(indexPath, index);
  }
}


