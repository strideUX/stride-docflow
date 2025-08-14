import path from 'path';
import fs from 'fs-extra';
import Handlebars from 'handlebars';
import glob from 'fast-glob';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { ProjectData } from '../prompts/project.js';
import { getStackByName } from '../templates/stack-registry.js';
import { researchEngine } from './research.js';
import { generateWithAI } from './ai-generator.js';
import { fileURLToPath } from 'url';

export interface GenerationOptions {
	output: string;
	aiProvider: 'openai' | 'anthropic' | 'local';
	model?: string;
	research: boolean;
	dryRun: boolean;
	// Optional reasoning controls passed through to AI layer
	reasoningEffort?: string;
	verbosity?: string;
}

export interface GenerationResult {
	outputPath: string;
	filesGenerated: string[];
	researchResults?: any[];
	warnings?: string[];
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

		// Generate files with compact progress display
		const filesGenerated: string[] = [];
		const warnings: string[] = [];
		let successCount = 0;
		let warningCount = 0;
		let errorCount = 0;

		console.log(`\n📝 ${chalk.cyan('Generating Documentation')} (${templateFiles.length} files)`);

		const updateProgress = (current: number, total: number, fileName: string, status: string = '') => {
			const percentage = Math.round((current / total) * 100);
			const filled = Math.floor(percentage / 10);
			const progressBar = '█'.repeat(filled) + '░'.repeat(10 - filled);
			const statusText = status ? ` | ${status}` : '';
			process.stdout.write('\r\x1b[K');
			process.stdout.write(`Progress: ${chalk.cyan(progressBar)} ${percentage}% (${current}/${total}) | Current: ${chalk.yellow(fileName)}${statusText}`);
		};

		for (let i = 0; i < templateFiles.length; i++) {
			const templateFile = templateFiles[i];
			if (!templateFile) continue;

			const fileName = path.basename(templateFile.outputPath);
			updateProgress(i, templateFiles.length, fileName, 'Processing...');

			try {
				const generatedFile = await processTemplate(templateFile, context, options);
				filesGenerated.push(generatedFile);
				successCount++;

				// Soft warning: content indicates local fallback used while provider wasn't local
				try {
					if (options.aiProvider !== 'local') {
						const content = await fs.readFile(generatedFile, 'utf-8');
						if (content.includes('<!-- Generated locally:')) {
							warningCount++;
							warnings.push(generatedFile);
						}
					}
				} catch {}

				updateProgress(i + 1, templateFiles.length, fileName, '✅');
			} catch (error) {
				errorCount++;
				updateProgress(i + 1, templateFiles.length, fileName, '❌ Error');
				console.log(`\n⚠️  Failed to generate ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}

			// Small delay to make progress visible
			await new Promise(resolve => setTimeout(resolve, 60));
		}

		// Clear progress line and show summary
		process.stdout.write('\r\x1b[K');
		console.log(`\n✨ ${chalk.green('Documentation Complete!')}`);
		console.log(`📊 ${chalk.green(successCount)} files generated successfully`);
		if (warningCount > 0) console.log(`⚠️  ${chalk.yellow(warningCount)} files had warnings`);
		if (errorCount > 0) console.log(`❌ ${chalk.red(errorCount)} files failed`);

		return {
			outputPath: options.output,
			filesGenerated,
			researchResults,
			warnings,
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
	// Resolve templates relative to the CLI package directory, not the user's CWD
	const moduleDir = path.dirname(fileURLToPath(import.meta.url));
	const templatesRoot = path.resolve(moduleDir, '../../../templates');
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
		
		// Design input (if any)
		design: projectData.designInput ? {
			vibe: projectData.designInput.vibe || '',
			lookAndFeel: projectData.designInput.lookAndFeel || '',
			userFlows: projectData.designInput.userFlows?.join(', ') || '',
			screens: projectData.designInput.screens?.join(', ') || '',
			wireframes: projectData.designInput.wireframes || '',
			inspirations: projectData.designInput.inspirations || '',
			images: projectData.designInput.images?.map(img => img.placeholder).join(', ') || ''
		} : undefined,
		
		// Stack information
		stack: stack.name,
		stackDescription: stack.description,
		technologies: stack.technologies.join(', '),
		stackFeatures: stack.features,
		
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

	// Count potential AI sections (comments and bracket placeholders)
	const dynamicCommentCount = (content.match(/<!-- DYNAMIC: \[.*?\] -->/g) || []).length;
	const dynamicBracketCount = (content.match(/\[AI Content:\s*.*?\s*-\s*To be generated\]/g) || []).length;
	const totalDynamic = dynamicCommentCount + dynamicBracketCount;

	// Process DYNAMIC sections with AI if they exist
	if (totalDynamic > 0) {
		p.log.info(`🤖 Processing ${totalDynamic} AI section(s) in ${templateFile.outputPath}`);
		content = await generateWithAI(content, context, templateFile.outputPath, options);
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
			const dynamicComments = (content.match(/<!-- DYNAMIC: \[.*?\] -->/g) || []).length;
			const dynamicBrackets = (content.match(/\[AI Content:\s*.*?\s*-\s*To be generated\]/g) || []).length;
			const dynamicSections = dynamicComments + dynamicBrackets;
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