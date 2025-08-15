import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import * as p from '@clack/prompts';
import path from 'path';
import ora from 'ora';
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

		let failureCount = 0;
		let successCount = 0;
		const detailedErrors: string[] = [];

		for (let i = 0; i < dynamicSections.length; i++) {
			const section = dynamicSections[i]!;
			
			// Check if process is exiting (Ctrl+C pressed)
			if ((global as any).exitingInProgress) {
				process.stdout.write('\r\x1b[K');
				console.log('\n⚠️  Generation interrupted by user');
				break;
			}
			
			const percentage = Math.round(((i + 1) / dynamicSections.length) * 100);
			const truncated = section.instruction.slice(0, 50) + (section.instruction.length > 50 ? '...' : '');
			const spinner = ora({
				text: `AI Generation: ${percentage}% (${i + 1}/${dynamicSections.length}) | ${truncated}`,
				spinner: 'dots',
				color: 'cyan',
			}).start();

			try {
				const aiContent = await generateSectionWithAI(
					section.instruction,
					context,
					filePath,
					options,
					options.reasoningEffort,
					options.verbosity
				);
				processedContent = processedContent.replace(section.fullMatch, aiContent);
				successCount++;
				spinner.succeed(`AI Generation: ${percentage}% (${i + 1}/${dynamicSections.length}) | ✅ Generated`);
			} catch (e: any) {
				failureCount++;
				const errorMessage = e?.message || String(e);
				detailedErrors.push(errorMessage);
				processedContent = processedContent.replace(
					section.fullMatch,
					formatLocalContent(section.instruction, context, filePath)
				);
				spinner.warn(`AI Generation: ${percentage}% (${i + 1}/${dynamicSections.length}) | ⚠️ Using fallback`);
			}
		}

		// Consolidated summary if any failures, and collect errors globally for final summary
		if (failureCount > 0) {
			const fileName = path.basename(filePath);
			console.log(`⚠️  ${fileName}: ${successCount}/${dynamicSections.length} AI sections succeeded (${failureCount} used fallback)`);
			// Collect detailed errors globally
			if (!(global as any).docflowErrors) {
				(global as any).docflowErrors = new Set<string>();
			}
			detailedErrors.forEach(err => (global as any).docflowErrors.add(err));
		}

		return processedContent;

	} catch (error: any) {
		// Collect top-level errors for summary
		if (!(global as any).docflowErrors) {
			(global as any).docflowErrors = new Set<string>();
		}
		(global as any).docflowErrors.add(error?.message || String(error));
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
			// Last-resort
			// Final safety: leave placeholders as-is
			return content;
		}
	}
}

export async function generateFileWithAI(
    content: string,
    context: any,
    filePath: string,
    options: GenerationOptions & { reasoningEffort?: string; verbosity?: string }
): Promise<string> {
    try {
        const dynamicSections = extractDynamicSections(content);
        if (dynamicSections.length === 0) {
            return content;
        }

        const fileName = path.basename(filePath);
        const spinner = ora({
            text: `Generating ${fileName} (${dynamicSections.length} AI sections)`,
            spinner: 'dots',
            color: 'cyan',
        }).start();

        // If local provider, synthesize content locally without external API
        if (options.aiProvider === 'local') {
            let localContent = content;
            for (const section of dynamicSections) {
                localContent = localContent.replace(
                    section.fullMatch,
                    formatLocalContent(section.instruction, context, filePath)
                );
            }
            spinner.succeed(`✅ Generated ${fileName} locally (${dynamicSections.length} sections)`);
            return localContent;
        }

        try {
            const { systemPrompt, userPrompt } = createFileGenerationPrompt(
                content,
                dynamicSections,
                context,
                filePath
            );

            const aiContent = await generateWithProvider(
                systemPrompt,
                userPrompt,
                options
            );

            const processedContent = applyFileAIResponse(
                content,
                aiContent,
                dynamicSections,
                context,
                filePath
            );

            spinner.succeed(`✅ Generated ${fileName} (${dynamicSections.length} sections)`);
            return processedContent;

        } catch (e: any) {
            spinner.warn(`⚠️  ${fileName} - Using fallback generation`);

            // Fallback to local generation for entire file
            let fallbackContent = content;
            for (const section of dynamicSections) {
                fallbackContent = fallbackContent.replace(
                    section.fullMatch,
                    formatLocalContent(section.instruction, context, filePath)
                );
            }

            // Collect error for summary
            if (!(global as any).docflowErrors) {
                (global as any).docflowErrors = new Set<string>();
            }
            (global as any).docflowErrors.add(e?.message || String(e));

            return fallbackContent;
        }

    } catch (_error: any) {
        // Final fallback - return original content
        return content;
    }
}

function createFileGenerationPrompt(
    content: string,
    sections: DynamicSection[],
    context: any,
    filePath: string
) {
    const fileName = path.basename(filePath);
    const projectInfo = `Project: ${context.projectName} | Stack: ${context.stack} | Description: ${context.description}`;

    const systemPrompt = `You are a technical documentation expert. Generate detailed, accurate, and current content for project documentation.

Context: ${projectInfo}

You will receive a documentation file template with ${sections.length} sections marked for AI generation. Each section has specific instructions about what content to generate.

Instructions:
1. Generate professional, comprehensive content for each marked section
2. Ensure consistency across all sections within this file
3. Use the project context to make content specific and relevant
4. Follow markdown formatting and documentation best practices
5. Make content actionable and detailed, not generic`;

    const designBlock = context.design ? `
DESIGN CONTEXT:
- Vibe: ${context.design.vibe}
- Look & Feel: ${context.design.lookAndFeel}
- User Flows: ${context.design.userFlows}
- Screens: ${context.design.screens}` : '';

    const userPrompt = `Generate content for all AI sections in this ${fileName} file:

TEMPLATE CONTENT:
${content}

SECTIONS TO GENERATE (${sections.length} sections):
${sections.map((s, i) => `${i + 1}. "${s.instruction}"`).join('\n')}

PROJECT CONTEXT:
- Name: ${context.projectName}
- Description: ${context.description}
- Stack: ${context.stackDescription}
- Technologies: ${context.technologies}
- Features: ${context.features}
${designBlock}

Please provide the complete file content with all AI sections filled in. Maintain the exact structure and formatting of the template, only replacing the AI section markers with generated content.`;

    return { systemPrompt, userPrompt };
}

async function generateWithProvider(
    systemPrompt: string,
    userPrompt: string,
    options: GenerationOptions & { reasoningEffort?: string; verbosity?: string }
) {
    if (options.aiProvider === 'anthropic') {
        return await generateWithAnthropic(systemPrompt, userPrompt, options.model);
    }
    return await generateWithOpenAI(
        systemPrompt,
        userPrompt,
        options.model,
        options.reasoningEffort,
        options.verbosity
    );
}

function applyFileAIResponse(
    originalContent: string,
    aiResponse: string,
    sections: DynamicSection[],
    context: any,
    filePath: string
): string {
    let processedContent = originalContent;

    // Heuristic: if the response looks like a full file, use it
    if (aiResponse && aiResponse.length > originalContent.length * 0.8 && /\n#\s+/.test(aiResponse)) {
        return aiResponse;
    }

    // Fallback: split response into parts and apply in order
    const responseParts = (aiResponse || '')
        .split(/\n\n+/)
        .map(part => part.trim())
        .filter(part => part.length > 50);

    sections.forEach((section, index) => {
        if (index < responseParts.length) {
            const part = responseParts[index] as string;
            processedContent = processedContent.replace(section.fullMatch, part);
        } else {
            processedContent = processedContent.replace(
                section.fullMatch,
                formatLocalContent(section.instruction, context, filePath)
            );
        }
    });

    return processedContent;
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

	const getModelType = (modelName: string): 'o1' | 'gpt5' | 'standard' => {
		if (modelName.includes('o1')) return 'o1';
		if (modelName.includes('gpt-5') || modelName.includes('gpt5')) return 'gpt5';
		return 'standard';
	};

	const getOptimalParams = (modelName: string) => {
		if (modelName.includes('gpt-5') || modelName.includes('gpt5')) {
			return { max_completion_tokens: 3000 } as const;
		}
		if (modelName.includes('gpt-4o')) {
			return { max_completion_tokens: 2000, temperature: 0.3 } as const;
		}
		return { max_completion_tokens: 2000, temperature: 0.3 } as const;
	};

	const selectedModel = (model || process.env.DOCFLOW_DEFAULT_MODEL || 'gpt-5-mini').trim();
	const modelType = getModelType(selectedModel);
	const baseParams = getOptimalParams(selectedModel);

	const requestParams: any = {
		model: selectedModel,
		messages: modelType === 'o1'
			? [{ role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }]
			: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userPrompt }
			],
		max_completion_tokens: baseParams.max_completion_tokens,
	};

	// Only add temperature for models that support it (not o1 or gpt-5)
	if (modelType === 'standard' && (baseParams as any).temperature !== undefined) {
		requestParams.temperature = (baseParams as any).temperature;
	}

	// Add GPT-5 specific parameters
	if (modelType === 'gpt5') {
		const eff = reasoningEffort || process.env.DOCFLOW_REASONING_EFFORT;
		const verb = verbosity || process.env.DOCFLOW_VERBOSITY;
		if (eff) requestParams.reasoning_effort = eff;
		// Don't add verbosity for now - API seems to have issues with it
		// if (verb) {
		//   requestParams.response_format = {
		//     type: 'text',
		//     text: {
		//       verbosity: verb
		//     }
		//   };
		// }
	}

	try {
		const response = await openai.chat.completions.create(requestParams);
		return response.choices[0]?.message?.content || '[Content generation failed]';
	} catch (error: any) {
		// Collect API errors for summary instead of logging immediately
		if (!(global as any).docflowErrors) {
			(global as any).docflowErrors = new Set<string>();
		}
		const errorMessage = error?.message || String(error);
		(global as any).docflowErrors.add(errorMessage);
		throw error;
	}
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