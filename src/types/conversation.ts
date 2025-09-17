export type ConversationPhase =
  | 'introduction'
  | 'exploration'
  | 'refinement'
  | 'confirmation'
  | 'generation';

export interface ProjectOverview {
  name?: string;
  purpose: string;
  features: string[];
  users: string;
  success: string;
}

export interface ProjectStack {
  frontend?: string[];
  backend?: string[];
  database?: string[];
  infrastructure?: string[];
}

export interface ProjectSpecItem {
  type: 'feature' | 'bug' | 'idea';
  name: string;
  description: string;
  acceptance: string[];
  priority: number;
}

export interface ProjectContext {
  overview: ProjectOverview;
  stack: ProjectStack;
  specs: ProjectSpecItem[];
  projectName?: string;
  projectPath?: string;
}

export interface ConversationState {
  phase: ConversationPhase;
  context: ProjectContext;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
}


