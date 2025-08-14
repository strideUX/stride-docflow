import path from 'path';
import fs from 'fs-extra';
import Handlebars from 'handlebars';
import { glob } from 'fast-glob';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { ProjectData } from '../prompts/project.js';
import { getStackByName } from '../templates/stack-registry.js';
import { researchEngine } from './research.js';
import { generateWithAI } from './ai-generator.js';

export interface GenerationOptions {
  output: string;
  aiProvider: 'openai' | 'anthropic' | 'local';
  model?: string;
  research: boolean;
  dryRun: boolean;
}

export interface GenerationResult {
  outputPath: string;
  filesGenerated: string[];
  researchResults?: any[];
}

export async function generateDocs(
  projectData: ProjectData,
  options: GenerationOptions
): Promise<GenerationResult> {
  const s = p.spinner();
  
  try {
    // Get stack-specific configuration
    s.start('🔧 Loading stack configuration...');
    const stack = await getStackByName(projectData.stack);
    if (!stack) {
      throw new Error(`Unknown stack: ${projectData.stack}`);
    }
    s.stop('✅ Stack configuration loaded');

    // Perform research if enabled
    let researchResults: any[] = [];
    if (options.research) {
      s.start('🔍 Researching current best practices...');
      researchResults = await researchEngine.research(stack.researchQueries);
      s.stop('✅ Research completed');
    }

    // Prepare template context
    s.start('📝 Preparing templates...');
    const context = await prepareContext(projectData, stack, researchResults);
    const templateFiles = await getTemplateFiles(stack.templatePath);
    s.stop('✅ Templates prepared');
    
    if (options.dryRun) {
      return performDryRun(templateFiles, context, options.output);
    }

    // Generate files with progress tracking
    const filesGenerated: string[] = [];
    
    for (let i = 0; i < templateFiles.length; i++) {
      const templateFile = templateFiles[i];
      const fileName = path.basename(templateFile.outputPath);
      
      s.start(`📄 Generating ${fileName} (${i + 1}/${templateFiles.length})`);
      
      const generatedFile = await processTemplate(templateFile, context, options);
      filesGenerated.push(generatedFile);
      
      s.stop(`✅ Generated ${fileName}`);
    }

    return {
      outputPath: options.output,
      filesGenerated,
      researchResults
    };

  } catch (error) {
    s.stop('❌ Generation failed');
    throw error;
  }
}

interface TemplateFile {
  templatePath: string;
  outputPath: string;
  isTemplate: boolean;
}

async function getTemplateFiles(stackPath: string): Promise<TemplateFile[]> {
  const templatesRoot = path.resolve(process.cwd(), 'templates');
  const baseTemplatesPath = path.join(templatesRoot, 'base');
  const stackTemplatesPath = path.join(templatesRoot, stackPath);

  // Get base templates
  const baseFiles = await glob('**/*', { 
    cwd: baseTemplatesPath, 
    onlyFiles: true,
    dot: true 
  });

  // Get stack-specific templates (these override base templates)
  const stackFiles = await glob('**/*', { 
    cwd: stackTemplatesPath, 
    onlyFiles: true,
    dot: true 
  });

  const templateFiles: TemplateFile[] = [];

  // Process base templates
  for (const file of baseFiles) {
    // Skip if stack has override for this file
    const stackOverride = stackFiles.find(sf => 
      sf.replace('.template', '') === file.replace('.template', '')
    );
    if (stackOverride) continue;

    templateFiles.push({
      templatePath: path.join(baseTemplatesPath, file),
      outputPath: file.replace('.template', ''),
      isTemplate: file.endsWith('.template')
    });
  }

  // Process stack-specific templates
  for (const file of stackFiles) {
    templateFiles.push({
      templatePath: path.join(stackTemplatesPath, file),
      outputPath: file.replace('.template', ''),
      isTemplate: file.endsWith('.template')
    });
  }

  return templateFiles;
}

async function prepareContext(
  projectData: ProjectData,
  stack: any,
  researchResults: any[]
): Promise<any> {
  const now = new Date();
  
  return {
    // Project data
    projectName: projectData.name,
    description: projectData.description,
    objectives: projectData.objectives.join(', '),
    targetUsers: projectData.targetUsers.join(', '),
    features: projectData.features.join(', '),
    constraints: projectData.constraints?.join(', ') || '',
    
    // Stack information
    stack: stack.name,
    stackDescription: stack.description,
    technologies: stack.technologies.join(', '),
    
    // Timestamps
    today: now.toISOString().split('T')[0],
    timestamp: now.toISOString(),
    
    // Research data
    research: researchResults,
    
    // Helper functions for templates
    helpers: {
      formatList: (items: string[]) => items.map(item => `- ${item}`).join('\n'),
      formatFeatures: (features: string[]) => features.map((f, i) => `${i + 1}. ${f}`).join('\n'),
    }
  };
}

async function processTemplate(
  templateFile: TemplateFile,
  context: any,
  options: GenerationOptions
): Promise<string> {
  const outputPath = path.join(options.output, templateFile.outputPath);
  await fs.ensureDir(path.dirname(outputPath));

  if (!templateFile.isTemplate) {
    // Copy non-template files as-is
    await fs.copyFile(templateFile.templatePath, outputPath);
    return outputPath;
  }

  // Read template content
  let content = await fs.readFile(templateFile.templatePath, 'utf-8');

  // Process with Handlebars for basic substitutions
  const template = Handlebars.compile(content);
  content = template(context);

  // Process DYNAMIC sections with AI if they exist
  if (content.includes('<!-- DYNAMIC:') && options.aiProvider !== 'local') {
    content = await generateWithAI(content, context, templateFile.outputPath, options);
  } else {
    // Remove DYNAMIC markers if not using AI
    content = content.replace(/<!-- DYNAMIC: \[.*?\] -->/g, '[Content to be filled]');
  }

  // Write processed content
  await fs.writeFile(outputPath, content, 'utf-8');
  return outputPath;
}

async function performDryRun(
  templateFiles: TemplateFile[],
  context: any,
  outputPath: string
): Promise<GenerationResult> {
  p.note('Dry run mode - showing what would be generated', '🔍 Dry Run');
  
  const filesGenerated: string[] = [];
  let dynamicSectionsTotal = 0;
  
  for (const templateFile of templateFiles) {
    const outputFile = path.join(outputPath, templateFile.outputPath);
    
    if (templateFile.isTemplate) {
      const content = await fs.readFile(templateFile.templatePath, 'utf-8');
      const dynamicSections = (content.match(/<!-- DYNAMIC: \[.*?\] -->/g) || []).length;
      dynamicSectionsTotal += dynamicSections;
      
      p.log.info(`📄 ${chalk.gray(outputFile)} ${dynamicSections > 0 ? chalk.yellow(`(${dynamicSections} AI sections)`) : ''}`);
    } else {
      p.log.info(`📄 ${chalk.gray(outputFile)} ${chalk.blue('(static file)')}`);
    }
    
    filesGenerated.push(outputFile);
  }
  
  p.note(
    `📊 ${templateFiles.length} files would be generated
📁 Output directory: ${outputPath}
🤖 ${dynamicSectionsTotal} AI-generated sections`,
    'Summary'
  );
  
  return {
    outputPath,
    filesGenerated,
  };
}