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
		// Extract DYNAMIC sections that need AI generation (comments and legacy placeholders)
		const dynamicSections = extractDynamicSections(content);
		if (dynamicSections.length === 0) {
			return content;
		}

		let processedContent = content;

		for (const section of dynamicSections) {
			try {
				p.log.info(`🧠 Generating AI content for: ${section.instruction.slice(0, 80)}...`);
				const aiContent = await generateSectionWithAI(
					section.instruction,
					context,
					filePath,
					options,
					options.reasoningEffort,
					options.verbosity
				);
				// Replace the DYNAMIC marker/placeholder with generated content
				processedContent = processedContent.replace(
					section.fullMatch,
					aiContent
				);
			} catch (e: any) {
				p.log.warn(`⚠️  AI section failed in ${filePath} for instruction: ${section.instruction?.slice(0, 60)}...`);
				p.log.warn(e?.message || String(e));
				processedContent = processedContent.replace(
					section.fullMatch,
					formatLocalContent(section.instruction, context, filePath)
				);
			}
		}

		return processedContent;

	} catch (error: any) {
		p.log.warn(`AI generation failed for ${filePath}, falling back to local generation`);
		try {
			const sections = extractDynamicSections(content);
			let processed = content;
			for (const s of sections) {
				processed = processed.replace(
					s.fullMatch,
					formatLocalContent(s.instruction, context, filePath)
				);
			}
			return processed;
		} catch (e: any) {
			p.log.warn(`Local fallback also failed: ${e?.message || String(e)}`);
			// Final safety: leave placeholders as-is
			return content;
		}
	}
}

interface DynamicSection {
	fullMatch: string;
	instruction: string;
}

function extractDynamicSections(content: string): DynamicSection[] {
	const sections: DynamicSection[] = [];
	// Primary pattern: HTML DYNAMIC comment
	const dynamicCommentRegex = /<!-- DYNAMIC: \[(.*?)\] -->/g;
	let match;

	while ((match = dynamicCommentRegex.exec(content)) !== null) {
		sections.push({
			fullMatch: match[0],
			instruction: match[1] || ''
		});
	}

	// Legacy/fallback pattern: bracket placeholder e.g. [AI Content: ... - To be generated]
	const bracketPlaceholderRegex = /\[AI Content:\s*(.*?)\s*-\s*To be generated\]/g;
	while ((match = bracketPlaceholderRegex.exec(content)) !== null) {
		sections.push({
			fullMatch: match[0],
			instruction: match[1] || ''
		});
	}

	return sections;
}

async function generateSectionWithAI(
	instruction: string,
	context: any,
	filePath: string,
	options: GenerationOptions,
	reasoningEffort?: string,
	verbosity?: string
): Promise<string> {
	// Local provider returns deterministic content for testing and offline use
	if (options.aiProvider === 'local') {
		return formatLocalContent(instruction, context, filePath);
	}

	// Provider preflight checks for API keys
	if (options.aiProvider === 'openai' && !process.env.OPENAI_API_KEY) {
		p.log.warn('OPENAI_API_KEY is not set. Falling back to local content.');
		return formatLocalContent(instruction, context, filePath);
	}
	if (options.aiProvider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
		p.log.warn('ANTHROPIC_API_KEY is not set. Falling back to local content.');
		return formatLocalContent(instruction, context, filePath);
	}

	const systemPrompt = `You are a technical documentation expert. Generate detailed, accurate, and current content for project documentation.

Context:
- Project: ${context.projectName}
- Description: ${context.description}
- Technology Stack: ${context.technologies}
- Stack: ${context.stack}
- Stack Description: ${context.stackDescription}
- Stack Features: ${Array.isArray(context.stackFeatures) ? context.stackFeatures.join(', ') : context.stackFeatures}
- File: ${filePath}
- Objectives: ${context.objectives}
- Target Users: ${context.targetUsers}
- Key Features: ${context.features}
${context.constraints ? `- Constraints: ${context.constraints}` : ''}
${context.design ? `- Design Vibe: ${context.design.vibe}` : ''}
${context.design ? `- Look & Feel: ${context.design.lookAndFeel}` : ''}
${context.design?.userFlows ? `- User Flows: ${context.design.userFlows}` : ''}
${context.design?.screens ? `- Screens: ${context.design.screens}` : ''}
${Array.isArray(context.research) && context.research.length > 0 ? `- Research Inputs: ${context.research.length} items` : ''}

Generate content that is:
1. Specific to the project and technology stack
2. Current with latest best practices (${context.today})
3. Detailed and actionable
4. Properly formatted in Markdown
5. Professional and comprehensive

Do not include the instruction comment in your response.`;

	const userPrompt = `Generate content for this section: ${instruction}

If instruction seems vague, infer specifics consistent with the stack and objectives. Prefer React Native + Convex examples when relevant.
`;

	if (options.aiProvider === 'anthropic') {
		return await generateWithAnthropic(systemPrompt, userPrompt, options.model);
	} else {
		return await generateWithOpenAI(systemPrompt, userPrompt, options.model, reasoningEffort, verbosity);
	}
}

function formatLocalContent(instruction: string, context: any, filePath: string): string {
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
		max_completion_tokens: 2000
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