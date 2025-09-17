import fs from 'fs-extra';
import path from 'path';

import { ProjectContext, GeneratedBundle } from '../types/conversation.js';

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

  async writeGeneratedFiles(bundle: GeneratedBundle, projectPath: string): Promise<void> {
    const ctxDir = path.join(projectPath, 'docflow', 'context');
    await fs.ensureDir(ctxDir);

    const overviewMd = [
      '# Project Overview',
      '',
      `## Name`,
      bundle.overview.name || '',
      '',
      '## Purpose',
      bundle.overview.purpose,
      '',
      '## Features',
      ...(bundle.overview.features || []).map((f) => `- ${f}`),
      '',
      '## Users',
      bundle.overview.users,
      '',
      '## Success',
      bundle.overview.success,
      '',
    ].join('\n');

    const stackMd = [
      '# Technology Stack',
      '',
      '## Frontend',
      ...(bundle.stack.frontend || []).map((s) => `- ${s}`),
      '',
      '## Backend',
      ...(bundle.stack.backend || []).map((s) => `- ${s}`),
      '',
      '## Database',
      ...(bundle.stack.database || []).map((s) => `- ${s}`),
      '',
      '## Infrastructure',
      ...(bundle.stack.infrastructure || []).map((s) => `- ${s}`),
      '',
    ].join('\n');

    const standardsMd = bundle.standards;

    const specsDir = path.join(projectPath, 'docflow', 'specs', 'backlog');
    await fs.ensureDir(specsDir);
    for (const spec of bundle.specs) {
      const filename = `${spec.type}-${spec.name}.md`;
      const specMd = [
        `# ${spec.type === 'feature' ? 'Feature' : spec.type === 'bug' ? 'Bug' : 'Idea'}: ${spec.name}`,
        '',
        '## Description',
        spec.description,
        '',
        '## Acceptance Criteria',
        ...spec.acceptance.map((a) => `- [ ] ${a}`),
        '',
        '## Priority',
        String(spec.priority),
        '',
      ].join('\n');
      await fs.outputFile(path.join(specsDir, filename), specMd);
    }

    await fs.outputFile(path.join(ctxDir, 'overview.md'), overviewMd);
    await fs.outputFile(path.join(ctxDir, 'stack.md'), stackMd);
    await fs.outputFile(path.join(ctxDir, 'standards.md'), standardsMd);
  }
}


