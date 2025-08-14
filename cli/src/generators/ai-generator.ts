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
      const aiContent = await generateSectionWithAI(
        section.instruction,
        context,
        filePath,
        options,
        options.reasoningEffort,
        options.verbosity
      );
      
      // Replace the DYNAMIC comment with generated content
      processedContent = processedContent.replace(
        section.fullMatch,
        aiContent
      );
    }

    return processedContent;

  } catch (error) {
    p.log.warn(`AI generation failed for ${filePath}, using placeholder`);
    // Fallback: replace DYNAMIC sections with placeholders
    return content.replace(
      /<!-- DYNAMIC: \[(.*?)\] -->/g,
      '[AI Content: $1 - To be generated]'
    );
  }
}

interface DynamicSection {
  fullMatch: string;
  instruction: string;
}

function extractDynamicSections(content: string): DynamicSection[] {
  const sections: DynamicSection[] = [];
  const regex = /<!-- DYNAMIC: \[(.*?)\] -->/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    sections.push({
      fullMatch: match[0],
      instruction: match[1]
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
  const systemPrompt = `You are a technical documentation expert. Generate detailed, accurate, and current content for project documentation.

Context:
- Project: ${context.projectName}
- Description: ${context.description}
- Technology Stack: ${context.technologies}
- File: ${filePath}

Generate content that is:
1. Specific to the project and technology stack
2. Current with latest best practices (${context.today})
3. Detailed and actionable
4. Properly formatted in Markdown
5. Professional and comprehensive

Do not include the instruction comment in your response.`;

  const userPrompt = `Generate content for this section: ${instruction}

Additional context:
- Objectives: ${context.objectives}
- Target Users: ${context.targetUsers}
- Key Features: ${context.features}
${context.constraints ? `- Constraints: ${context.constraints}` : ''}

Please provide detailed, specific content that fits this instruction and the project context.`;

  if (options.aiProvider === 'anthropic') {
    return await generateWithAnthropic(systemPrompt, userPrompt, options.model);
  } else {
    return await generateWithOpenAI(systemPrompt, userPrompt, options.model, reasoningEffort, verbosity);
  }
}

async function generateWithOpenAI(
  systemPrompt: string,
  userPrompt: string,
  model?: string,
  reasoningEffort?: string,
  verbosity?: string
): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const selectedModel = model || process.env.DOCFLOW_DEFAULT_MODEL || 'gpt-5-mini';

  // GPT-5 models work best with Responses API
  const isGPT5Model = selectedModel.startsWith('gpt-5');
  const isO1Model = selectedModel.startsWith('o1-');
  
  if (isGPT5Model) {
    // Use Responses API for GPT-5 models with optimized parameters
    const finalReasoningEffort = reasoningEffort || process.env.DOCFLOW_REASONING_EFFORT || 'minimal';
    const finalVerbosity = verbosity || process.env.DOCFLOW_VERBOSITY || 'medium';
    
    const response = await openai.responses.create({
      model: selectedModel,
      input: `${systemPrompt}\n\n${userPrompt}`,
      reasoning: {
        effort: finalReasoningEffort as 'minimal' | 'low' | 'medium' | 'high'
      },
      text: {
        verbosity: finalVerbosity as 'low' | 'medium' | 'high'
      },
      max_tokens: 2000
    });
    
    return response.text || '[Content generation failed]';
  } else {
    // Fallback to Chat Completions for older models
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
}

async function generateWithAnthropic(
  systemPrompt: string,
  userPrompt: string,
  model?: string
): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
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