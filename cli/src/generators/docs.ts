import path from 'path';
import fs from 'fs-extra';
import Handlebars from 'handlebars';
import glob from 'fast-glob';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { ProjectData } from '../prompts/project.js';
import { getStackByName } from '../templates/stack-registry.js';
import { researchEngine } from './research.js';
import { generateWithAI, generateFileWithAI } from './ai-generator.js';
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
	warnings?: { file: string; message: string }[];
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

		// Generate files with parallel processing for better performance
		const filesGenerated: string[] = [];
		const warnings: { file: string; message: string }[] = [];
		const errors: { file: string; message: string }[] = [];
		let successCount = 0;
		let warningCount = 0;
		let errorCount = 0;

		console.log(`\n📝 ${chalk.cyan('Generating Documentation')} (${templateFiles.length} files)`);

		// Create batches for parallel processing
		const batchSize = 3;
		const fileBatches: TemplateFile[][] = [];
		for (let i = 0; i < templateFiles.length; i += batchSize) {
			fileBatches.push(templateFiles.slice(i, i + batchSize));
		}

		for (let batchIndex = 0; batchIndex < fileBatches.length; batchIndex++) {
			const batch = fileBatches[batchIndex]!;
			console.log(`\n📦 Processing batch ${batchIndex + 1}/${fileBatches.length} (${batch?.length || 0} files)`);

			const batchPromises = batch.map(async (templateFile) => {
				if (!templateFile) return null as any;
				const fileName = path.basename(templateFile.outputPath);
				const relativePath = templateFile.outputPath;
				try {
					const generatedFile = await processTemplate(templateFile, context, options);
					return { success: true, file: generatedFile, fileName, relativePath } as const;
				} catch (error) {
					return { success: false, error: error instanceof Error ? error.message : 'Unknown error', fileName, relativePath } as const;
				}
			});

			const batchResults = await Promise.all(batchPromises);

			for (const result of batchResults) {
				if (!result) continue;
				if (result.success) {
					filesGenerated.push(result.file);
					successCount++;
					// Soft warning detection
					try {
						if (options.aiProvider !== 'local') {
							const content = await fs.readFile(result.file, 'utf-8');
							if (content.includes('<!-- Generated locally:')) {
								warningCount++;
								warnings.push({ file: result.relativePath || result.fileName, message: 'AI generation failed, used fallback' });
								// Track in global map for debugging across runs
								if (!(global as any).docflowErrorsByFile) {
									(global as any).docflowErrorsByFile = new Map<string, Set<string>>();
								}
								const map = (global as any).docflowErrorsByFile as Map<string, Set<string>>;
								const key = 'AI generation failed, used fallback';
								const set = map.get(key) || new Set<string>();
								set.add(result.relativePath || result.fileName);
								map.set(key, set);
							}
						}
					} catch {}
					console.log(`   ✅ ${result.fileName}`);
				} else {
					errorCount++;
					errors.push({ file: result.relativePath || result.fileName, message: result.error });
					console.log(`   ❌ ${result.fileName}: ${result.error}`);
					// Track in global map as well
					if (!(global as any).docflowErrorsByFile) {
						(global as any).docflowErrorsByFile = new Map<string, Set<string>>();
					}
					const map = (global as any).docflowErrorsByFile as Map<string, Set<string>>;
					const key = result.error || 'Unknown error';
					const set = map.get(key) || new Set<string>();
					set.add(result.relativePath || result.fileName);
					map.set(key, set);
				}
			}
		}
		console.log(`\n✨ ${chalk.green('Documentation Complete!')}`);
		console.log(`📊 ${chalk.green(successCount)} files generated successfully`);
		if (warningCount > 0) {
			console.log(`⚠️  ${chalk.yellow(warningCount)} files had warnings`);
			// Group warnings by message and list affected files
			console.log(`\n🔍 ${chalk.yellow('Warning Details:')}`);
			const warningsByMessage = new Map<string, string[]>();
			for (const w of warnings) {
				const files = warningsByMessage.get(w.message) || [];
				files.push(w.file);
				warningsByMessage.set(w.message, files);
			}
			for (const [message, files] of warningsByMessage) {
				console.log(`• ${message} (${files.length} files):`);
				files.forEach(f => console.log(`  - ${f}`));
			}
		}
		if (errorCount > 0) {
			console.log(`❌ ${chalk.red(errorCount)} files failed`);
			// Group errors by message and list affected files
			console.log(`\n🛠️  ${chalk.red('Error Details:')}`);
			const errorsByMessage = new Map<string, string[]>();
			for (const e of errors) {
				const files = errorsByMessage.get(e.message) || [];
				files.push(e.file);
				errorsByMessage.set(e.message, files);
			}
			for (const [message, files] of errorsByMessage) {
				const truncated = message.length > 150 ? message.slice(0, 150) + '...' : message;
				console.log(`• ${chalk.gray(truncated)} (${files.length} files):`);
				files.forEach(f => console.log(`  - ${f}`));
			}
		}

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

	// Map template relative path to output path with structural fixes
	const mapOutputPath = (file: string, isStackTemplate: boolean): string => {
		let out = file.replace('.template', '');
		// 1) Cursor rules: cursor-rules/ → .cursor/rules/
		out = out.replace(/^cursor-rules\//, '.cursor/rules/');
		// 2) Docs root: docs/ → docflow/
		out = out.replace(/^docs\//, 'docflow/');
		// 3) Stack-level loose files: ensure they live under docflow/project/
		if (isStackTemplate) {
			if (out === 'stack.md') out = 'docflow/project/stack.md';
			if (out === 'architecture.md') out = 'docflow/project/architecture.md';
		}
		return out;
	};

	// Process base templates
	for (const file of baseFiles) {
		// Skip if stack has override for this file (compare by mapped output path)
		const hasOverride = stackFiles.some(sf => 
			mapOutputPath(sf, true) === mapOutputPath(file, false)
		);
		if (hasOverride) continue;

		templateFiles.push({
			templatePath: path.join(baseTemplatesPath, file),
			outputPath: mapOutputPath(file, false),
			isTemplate: file.endsWith('.template')
		});
	}

	// Process stack-specific templates
	for (const file of stackFiles) {
		templateFiles.push({
			templatePath: path.join(stackTemplatesPath, file),
			outputPath: mapOutputPath(file, true),
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

	// Process DYNAMIC sections with AI if they exist (file-level batching)
	if (totalDynamic > 0) {
		p.log.info(`🤖 Processing ${totalDynamic} AI section(s) in ${templateFile.outputPath}`);
		content = await generateFileWithAI(content, context, templateFile.outputPath, options);
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