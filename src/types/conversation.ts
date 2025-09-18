export type ConversationPhase =
  | 'introduction'
  | 'exploration'
  | 'refinement'
  | 'confirmation'
  | 'generation';

// Updated structure for better context building during conversation
export interface ProjectContext {
  // Core project info
  name: string;
  problem: string;
  users: string[];
  coreFeatures: string[];
  
  // Technical preferences
  techPreferences: {
    frontend?: string;
    backend?: string;
    mustHave: string[];
    avoid: string[];
  };
  
  // Constraints
  constraints: {
    platform?: string[]; // web, mobile, desktop
    complexity?: 'simple' | 'moderate' | 'complex';
  };
  
  // Generated specs
  specs: ProjectSpecItem[];
  
  // Metadata
  projectPath?: string;
  createdAt: Date;
}

export interface ProjectSpecItem {
  type: 'feature' | 'bug' | 'idea';
  name: string;
  description: string;
  userStory?: string;
  acceptanceCriteria: string[];
  priority: number;
  mvp: boolean;
  dependencies: string[];
}

export interface ConversationState {
  phase: ConversationPhase;
  context: ProjectContext;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  currentQuestion?: string;
  validationErrors?: string[];
}

// Generated file structures
export interface GeneratedFiles {
  overview: OverviewContent;
  stack: StackContent;
  standards: StandardsContent;
  specs: SpecContent[];
}

export interface OverviewContent {
  name: string;
  purpose: string;
  features: string[];
  users: string;
  success: string;
}

export interface StackContent {
  frontend: string[];
  backend: string[];
  infrastructure: string[];
  development: string[];
}

export interface StandardsContent {
  initialization: string;
  structure: string;
  conventions: string;
  workflow: string;
}

export interface SpecContent {
  type: 'feature' | 'bug' | 'idea';
  name: string;
  priority: number;
  description: string;
  userStory: string;
  acceptanceCriteria: string[];
  dependencies: string[];
  mvp: boolean;
}

// Legacy types for backward compatibility (can be removed once refactored)
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

export interface GeneratedBundle {
  overview: ProjectOverview;
  stack: ProjectStack;
  standards: string;
  specs: ProjectSpecItem[];
}
