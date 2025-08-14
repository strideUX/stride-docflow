import fs from 'fs-extra';
import path from 'path';
import glob from 'fast-glob';
import * as p from '@clack/prompts';

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
}

export async function validateProject(projectPath: string): Promise<ValidationResult> {
  const issues: string[] = [];
  const suggestions: string[] = [];

  const s = p.spinner();
  s.start('🔍 Validating project structure...');

  try {
    // Check if project path exists
    if (!await fs.pathExists(projectPath)) {
      issues.push(`Project path does not exist: ${projectPath}`);
      s.stop('❌ Project path not found');
      return { isValid: false, issues, suggestions };
    }

    // Validate required files
    const requiredFiles = [
      'docs/releases/current/index.md',
      'docs/project/specs.md',
      'docs/project/stack.md',
      'docs/project/architecture.md',
      'docs/active/focus.md',
      'docs/active/session.md'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(projectPath, file);
      if (!await fs.pathExists(filePath)) {
        issues.push(`Missing required file: ${file}`);
      }
    }

    // Validate file contents
    await validateIndexFile(path.join(projectPath, 'docs/releases/current/index.md'), issues, suggestions);
    await validateSpecsFile(path.join(projectPath, 'docs/project/specs.md'), issues, suggestions);
    await validateCursorRules(path.join(projectPath, '.cursor/rules'), issues, suggestions);

    // Check for broken links
    await validateLinks(projectPath, issues, suggestions);

    s.stop('✅ Validation complete');

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };

  } catch (error) {
    s.stop('❌ Validation failed');
    const message = error instanceof Error ? error.message : 'Unknown error';
    issues.push(`Validation error: ${message}`);
    return { isValid: false, issues, suggestions };
  }
}

async function validateIndexFile(filePath: string, issues: string[], suggestions: string[]): Promise<void> {
  if (!await fs.pathExists(filePath)) {
    return; // Already reported as missing
  }

  const content = await fs.readFile(filePath, 'utf-8');
  
  // Check for required sections
  const requiredSections = [
    '## 🎯 Current Focus',
    '## 📊 Release Progress',
    '### Features',
    '### Enhancements',
    '### Bugs'
  ];

  for (const section of requiredSections) {
    if (!content.includes(section)) {
      issues.push(`index.md missing required section: ${section}`);
    }
  }

  // Check if progress indicators are present
  if (!content.match(/\[\s*[xX\s]\s*\]/)) {
    suggestions.push('Add progress checkboxes to track feature completion');
  }

  // Check for outdated timestamps
  const timestampMatch = content.match(/Last updated: ([\d-]+)/);
  if (timestampMatch && timestampMatch[1]) {
    const lastUpdate = new Date(timestampMatch[1]);
    const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 7) {
      suggestions.push('index.md has not been updated in over a week');
    }
  }
}

async function validateSpecsFile(filePath: string, issues: string[], suggestions: string[]): Promise<void> {
  if (!await fs.pathExists(filePath)) {
    return; // Already reported as missing
  }

  const content = await fs.readFile(filePath, 'utf-8');
  
  // Check for placeholder content
  if (content.includes('[Content to be filled]') || content.includes('<!-- DYNAMIC:')) {
    issues.push('specs.md contains unfilled template content');
  }

  // Validate required sections
  const requiredSections = [
    '## Core Requirements',
    '## Technical Context',
    '## User Context',
    '## Business Context'
  ];

  for (const section of requiredSections) {
    if (!content.includes(section)) {
      issues.push(`specs.md missing required section: ${section}`);
    }
  }
}

async function validateCursorRules(rulesPath: string, issues: string[], suggestions: string[]): Promise<void> {
  if (!await fs.pathExists(rulesPath)) {
    suggestions.push('Consider adding .cursor/rules for better AI integration');
    return;
  }

  const ruleFiles = await glob('*.mdc', { cwd: rulesPath });
  if (ruleFiles.length === 0) {
    suggestions.push('No Cursor rules found - add docflow.mdc for better AI assistance');
  }
}

async function validateLinks(projectPath: string, issues: string[], suggestions: string[]): Promise<void> {
  // Find all markdown files
  const mdFiles = await glob('**/*.md', { cwd: projectPath });
  
  for (const file of mdFiles) {
    const filePath = path.join(projectPath, file);
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Find markdown links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      const linkPath = match[2];
      if (!linkPath) continue;
      
      // Skip external links
      if (linkPath.startsWith('http')) continue;
      
      // Check if internal link exists
      const targetPath = path.resolve(path.dirname(filePath), linkPath);
      if (!await fs.pathExists(targetPath)) {
        issues.push(`Broken link in ${file}: ${linkPath}`);
      }
    }
  }
}