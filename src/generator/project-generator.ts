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
    const docflowSrc = path.join(templateRoot, 'docflow');
    const cursorSrc = path.join(templateRoot, '.cursor');
    const docflowDest = path.join(projectPath, 'docflow');
    const cursorDest = path.join(projectPath, '.cursor');

    // Only copy the intended directories
    if (await fs.pathExists(docflowSrc)) {
      await fs.copy(docflowSrc, docflowDest, { overwrite: true, recursive: true });
    }
    if (await fs.pathExists(cursorSrc)) {
      await fs.copy(cursorSrc, cursorDest, { overwrite: true, recursive: true });
    }

    // Cleanup: remove any accidentally copied root-level folders from older templates
    const strayContext = path.join(projectPath, 'context');
    const straySpecs = path.join(projectPath, 'specs');
    if (await fs.pathExists(strayContext)) {
      await fs.remove(strayContext);
    }
    if (await fs.pathExists(straySpecs)) {
      await fs.remove(straySpecs);
    }
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

    const toStringArray = (value: unknown): string[] => {
      if (Array.isArray(value)) return value.map((v) => String(v)).filter((s) => s.trim().length > 0);
      if (typeof value === 'string') return [value];
      return [];
    };

    const overviewMd = [
      '# Project Overview',
      '',
      `## Name`,
      (bundle.overview && bundle.overview.name) || '',
      '',
      '## Purpose',
      (bundle.overview && bundle.overview.purpose) || '',
      '',
      '## Features',
      ...toStringArray(bundle.overview && bundle.overview.features).map((f) => `- ${f}`),
      '',
      '## Users',
      (bundle.overview && bundle.overview.users) || '',
      '',
      '## Success',
      (bundle.overview && bundle.overview.success) || '',
      '',
    ].join('\n');

    const stackMd = [
      '# Technology Stack',
      '',
      '## Frontend',
      ...toStringArray(bundle.stack && bundle.stack.frontend).map((s) => `- ${s}`),
      '',
      '## Backend',
      ...toStringArray(bundle.stack && bundle.stack.backend).map((s) => `- ${s}`),
      '',
      '## Database',
      ...toStringArray(bundle.stack && bundle.stack.database).map((s) => `- ${s}`),
      '',
      '## Infrastructure',
      ...toStringArray(bundle.stack && bundle.stack.infrastructure).map((s) => `- ${s}`),
      '',
    ].join('\n');

    const standardsMd = typeof bundle.standards === 'string' ? bundle.standards : String(bundle.standards ?? '');

    const specsDir = path.join(projectPath, 'docflow', 'specs', 'backlog');
    await fs.ensureDir(specsDir);
    const specs = Array.isArray(bundle.specs) ? bundle.specs : [];
    for (const spec of specs) {
      const safeName = String(spec.name || 'unnamed').toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const filename = `${spec.type}-${spec.name}.md`;
      const specMd = [
        `# ${spec.type === 'feature' ? 'Feature' : spec.type === 'bug' ? 'Bug' : 'Idea'}: ${spec.name}`,
        '',
        '## Description',
        spec.description,
        '',
        '## Acceptance Criteria',
        ...toStringArray(spec.acceptance).map((a) => `- [ ] ${a}`),
        '',
        '## Priority',
        String(spec.priority ?? ''),
        '',
      ].join('\n');
      await fs.outputFile(path.join(specsDir, `${spec.type}-${safeName}.md`), specMd);
    }

    await fs.outputFile(path.join(ctxDir, 'overview.md'), overviewMd);
    await fs.outputFile(path.join(ctxDir, 'stack.md'), stackMd);
    await fs.outputFile(path.join(ctxDir, 'standards.md'), standardsMd);
  }
}


