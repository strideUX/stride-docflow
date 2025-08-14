import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import * as p from '@clack/prompts';
import { GenerationOptions } from './docs.js';

export async function generateWithAI(
	content: string,
	context: any,
	filePath: string,
	options: GenerationOptions & { reasoningEffort?: string; verbosity?: string }
): Promise<string> {
	try {
		// Extract DYNAMIC sections that need AI generation
		const dynamicSections = extractDynamicSections(content);
		if (dynamicSections.length === 0) {
			return content;
		}

		let processedContent = content;

		for (const section of dynamicSections) {
			try {
				const aiContent = await generateSectionWithAI(
					section.instruction,
					context,
					filePath,
					options,
					section.inline,
					options.reasoningEffort,
					options.verbosity
				);
				// Replace the DYNAMIC comment with generated content
				processedContent = processedContent.replace(
					section.fullMatch,
					aiContent
				);
			} catch (e) {
				p.log.warn(`⚠️  AI section failed in ${filePath} for instruction: ${section.instruction?.slice(0, 60)}...`);
				const fallback = formatLocalContent(section.instruction, context, filePath, section.inline);
				processedContent = processedContent.replace(section.fullMatch, fallback);
			}
		}

		return processedContent;

	} catch (error) {
		p.log.warn(`AI generation failed for ${filePath}, generating local content`);
		// Fallback: replace DYNAMIC sections with local content
		const sections = extractDynamicSections(content);
		let processed = content;
		for (const s of sections) {
			processed = processed.replace(
				s.fullMatch,
				formatLocalContent(s.instruction, context, filePath, s.inline)
			);
		}
		return processed;
	}
}

interface DynamicSection {
	fullMatch: string;
	instruction: string;
	inline: boolean;
}

function extractDynamicSections(content: string): DynamicSection[] {
	const sections: DynamicSection[] = [];
	const regex = /<!-- DYNAMIC: \[(.*?)\] -->/g;
	let match: RegExpExecArray | null;

	while ((match = regex.exec(content)) !== null) {
		const fullMatch = match[0];
		const instruction = match[1] || '';
		const matchIndex = match.index ?? 0;
		// Determine if inline (the match is not the only content on its line)
		const lineStart = content.lastIndexOf('\n', matchIndex - 1) + 1;
		const lineEndIdx = content.indexOf('\n', regex.lastIndex);
		const lineEnd = lineEndIdx === -1 ? content.length : lineEndIdx;
		const line = content.slice(lineStart, lineEnd);
		const isInline = line.trim() !== fullMatch.trim();
		sections.push({ fullMatch, instruction, inline: isInline });
	}

	return sections;
}

async function generateSectionWithAI(
	instruction: string,
	context: any,
	filePath: string,
	options: GenerationOptions,
	inline: boolean,
	reasoningEffort?: string,
	verbosity?: string
): Promise<string> {
	// Local provider returns deterministic content for testing and offline use
	if (options.aiProvider === 'local') {
		return formatLocalContent(instruction, context, filePath, inline);
	}

	// If required API keys are missing, transparently fallback to local
	if (options.aiProvider === 'openai' && !process.env.OPENAI_API_KEY) {
		p.log.warn('OPENAI_API_KEY not set, falling back to local content');
		return formatLocalContent(instruction, context, filePath, inline);
	}
	if (options.aiProvider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
		p.log.warn('ANTHROPIC_API_KEY not set, falling back to local content');
		return formatLocalContent(instruction, context, filePath, inline);
	}

	const systemPrompt = `You are a technical documentation expert. Generate detailed, accurate, and current content for project documentation.

Context:
- Project: ${context.projectName}
- Description: ${context.description}
- Technology Stack: ${context.technologies}
- File: ${filePath}
- Objectives: ${context.objectives}
- Target Users: ${context.targetUsers}
- Key Features: ${context.features}
${context.constraints ? `- Constraints: ${context.constraints}` : ''}
${context.design ? `- Design Vibe: ${context.design.vibe}` : ''}
${context.design ? `- Look & Feel: ${context.design.lookAndFeel}` : ''}
${context.design?.userFlows ? `- User Flows: ${context.design.userFlows}` : ''}
${context.design?.screens ? `- Screens: ${context.design.screens}` : ''}

Output style:
${inline ? 'Respond with a single concise phrase suitable for inline insertion (no newlines, no punctuation at the end, <= 60 characters).' : 'Respond with a well-structured Markdown section, multiple paragraphs allowed.'}

Do not include the instruction comment in your response.`;

	const userPrompt = `Generate content for this section: ${instruction}

If instruction seems vague, infer specifics consistent with the stack and objectives. Prefer React Native + Convex examples when relevant.`;

	if (options.aiProvider === 'anthropic') {
		return await generateWithAnthropic(systemPrompt, userPrompt, options.model);
	} else {
		return await generateWithOpenAI(systemPrompt, userPrompt, options.model, reasoningEffort, verbosity);
	}
}

function formatLocalContent(instruction: string, context: any, filePath: string, inline = false): string {
	if (inline) {
		// Simple heuristics for common inline instructions
		const lower = instruction.toLowerCase();
		if (lower.includes('project name')) return context.projectName;
		if (lower.includes('stack') && lower.includes('reference')) return context.stack;
		return `${context.projectName}`;
	}
	const header = `<!-- Generated locally: ${new Date().toISOString()} -->`;
	const summary = `Instruction: ${instruction}`;
	const project = `Project: ${context.projectName} | Stack: ${context.technologies}`;
	const body = `This section describes ${instruction.toLowerCase()} for the ${context.projectName} project using ${context.technologies}. It is tailored to the ${context.stack} stack and should be refined with real AI content in production.`;
	const extras = context.design?.vibe ? `Design vibe: ${context.design.vibe}` : '';
	return [header, '', `> ${summary}`, `> ${project}`, '', body, extras].filter(Boolean).join('\n');
}

async function generateWithOpenAI(
	systemPrompt: string,
	userPrompt: string,
	model?: string,
	reasoningEffort?: string,
	verbosity?: string
): Promise<string> {
	const openai = new OpenAI({
		apiKey: process.env.OPENAI_API_KEY!
	});

	const selectedModel = model || process.env.DOCFLOW_DEFAULT_MODEL || 'gpt-4o';

	// For now, use Chat Completions API for all models until GPT-5 is released
	const isO1Model = selectedModel.startsWith('o1-');
	
	const response = await openai.chat.completions.create({
		model: selectedModel,
		messages: isO1Model 
			? [{ role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }]
			: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userPrompt }
			],
		...(isO1Model ? {} : { temperature: 0.3 }),
		max_tokens: 2000
	});

	return response.choices[0]?.message?.content || '[Content generation failed]';
}

async function generateWithAnthropic(
	systemPrompt: string,
	userPrompt: string,
	model?: string
): Promise<string> {
	const anthropic = new Anthropic({
		apiKey: process.env.ANTHROPIC_API_KEY!
	});

	const response = await anthropic.messages.create({
		model: model || 'claude-3-5-sonnet-20241022',
		max_tokens: 2000,
		system: systemPrompt,
		messages: [
			{ role: 'user', content: userPrompt }
		]
	});

	const content = response.content[0];
	if (!content) return '[Content generation failed]';
	return content.type === 'text' ? content.text : '[Content generation failed]';
}

export async function enrichContentWithResearch(
	content: string,
	researchResults: any[]
): Promise<string> {
	// TODO: Implement research integration
	// This would use MCP context7 and web search results to enhance content
	
	// For now, add a research note if we have research data
	if (researchResults.length > 0) {
		const researchNote = `\n\n<!-- Research integrated from ${researchResults.length} sources -->\n`;
		return content + researchNote;
	}
	
	return content;
}