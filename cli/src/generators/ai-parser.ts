import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { webSearch } from './research.js';

const ParsedProjectSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  objectives: z.array(z.string()).optional(),
  targetUsers: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  suggestedStack: z.string().optional()
});

export type ParsedProject = z.infer<typeof ParsedProjectSchema>;

export async function parseIdeaWithAI(idea: string, provider: string = 'openai'): Promise<ParsedProject> {
  try {
    const prompt = `
Analyze this project idea and extract structured information. Return only valid JSON.

Project Idea:
${idea}

Extract the following information if available:
- name: Project name
- description: Clear one-sentence description
- objectives: Array of main goals/objectives
- targetUsers: Array of user types or personas
- features: Array of key features mentioned
- constraints: Array of limitations or constraints
- suggestedStack: Recommended technology stack based on requirements

Return JSON only, no other text.`;

    let response: string;

    if (provider === 'anthropic') {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY!
      });

      const result = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = result.content[0];
      response = content && content.type === 'text' ? content.text : '';
    } else {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY!
      });

      const model = process.env.DOCFLOW_DEFAULT_MODEL || 'gpt-4o';
      const isO1Model = model.startsWith('o1-');

      const result = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        ...(isO1Model ? {} : { temperature: 0.3 })
      });

      response = result.choices[0]?.message?.content || '';
    }

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return ParsedProjectSchema.parse(parsed);

  } catch (error) {
    console.warn('AI parsing failed, using fallback parser');
    return parseIdeaHeuristic(idea);
  }
}

function parseIdeaHeuristic(idea: string): ParsedProject {
  const lines = idea.split('\n').map(line => line.trim()).filter(Boolean);
  
  const result: ParsedProject = {};

  // Try to extract project name from first line
  if (lines.length > 0 && lines[0]) {
    result.name = lines[0].replace(/^#+\s*/, '').trim();
  }

  // Look for features (lines with bullets or numbered lists)
  const features = lines.filter(line => 
    line.match(/^[-*•]\s+/) || line.match(/^\d+\.\s+/)
  ).map(line => 
    line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim()
  );

  if (features.length > 0) {
    result.features = features;
  }

  // Extract description from first paragraph
  const paragraphs = idea.split('\n\n').map(p => p.trim()).filter(Boolean);
  if (paragraphs.length > 1 && paragraphs[1]) {
    result.description = paragraphs[1].replace(/\n/g, ' ').trim();
  }

  return result;
}

export async function enrichWithResearch(
  projectData: ParsedProject, 
  stackName: string,
  researchQueries: string[]
): Promise<ParsedProject> {
  try {
    console.log('🔍 Researching current best practices...');
    
    const researchResults = await Promise.all(
      researchQueries.map(query => webSearch(query))
    );

    // TODO: Use research results to enhance project data
    // This would integrate with MCP and web search to get current best practices
    
    return projectData;
  } catch (error) {
    console.warn('Research failed, proceeding with existing data');
    return projectData;
  }
}