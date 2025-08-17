# Active Feature Focus

## F001: AI Project Discovery Engine
**Status:** in_review (Architecture Redesign Required)  
**Started:** 2025-08-15  
**Priority:** P0 (Critical)  
**From:** docs/releases/current/features.md

### Description
Conversational AI system that conducts requirements gathering like a technical consultant, using dynamic question generation and natural dialogue flow to build comprehensive project understanding.

### **CRITICAL ISSUE IDENTIFIED**
Current RealConversationEngine implementation is **structured form with better prompts, not conversational AI**. Need complete redesign for true conversational flow.

### Current Todos (Revised)
- [ ] **Design ConversationOrchestrator**: Main conversation manager using our docs structure as discovery template
- [ ] **Implement Dynamic Question Generation**: AI generates next question based on conversation history and gaps  
- [ ] **Create Discovery Gap Assessor**: Evaluates what information is still needed for complete documentation
- [ ] **Build System Prompt Integration**: Extract requirements from our own docs structure (specs.md, architecture.md, etc.)
- [ ] **Add Provider Configuration**: Runtime AI provider and model selection (OpenAI/Anthropic focus)
- [ ] **Implement Session Memory**: Context persists during session, cleanup after doc generation

### What Cursor Implemented ✅
**Files Created:**
- `/src/conversation/engine.ts` - Conversation interfaces + RealConversationEngine (needs redesign)
- `/src/context/store.ts` - Context management interfaces with InMemoryContextStore  
- `/src/conversation/session.ts` - Session management (added later)
- `/src/conversation/summarizer.ts` - AI summarization (added later)
- `/src/conversation/types.ts` - Type definitions (added later)
- Unit tests for conversation components

**Technical Foundation (Good):**
- ✅ Conversation interfaces and type definitions
- ✅ CLI integration with `--conversational` flag
- ✅ Context store pattern
- ✅ Session management scaffolding
- ✅ Non-breaking integration

**Technical Issues (Need Redesign):**
- ❌ **Linear Prompts**: Still predefined questions in sequence
- ❌ **No Dynamic Generation**: Questions aren't generated based on responses
- ❌ **No Gap Assessment**: Doesn't evaluate what information is missing
- ❌ **No Conversation Flow**: Doesn't build on previous responses intelligently

### Required Architecture (New Direction)
```typescript
interface ConversationOrchestrator {
  documentRequirements: DocumentRequirements  // From our docs structure
  conversationHistory: ConversationTurn[]
  discoveryGaps: string[]  // What info is still needed
  
  generateNextQuestion(): Promise<string>      // AI-powered
  assessCompleteness(): DiscoveryGaps         // Check if ready for docs
  manageConversation(): ConversationFlow      // 10-15 turns max
}
```

### Success Criteria
- **True Conversation**: Like talking to a technical consultant, not filling out a form
- **Document-Driven**: AI knows it needs info for specs.md, architecture.md, features.md, stack.md  
- **Flexible Providers**: OpenAI/Anthropic with runtime model override
- **Consultant Style**: Requirements gathering with lighter tone, SME-guided
- **Conversation Management**: 10-15 meaningful turns, gap assessment, completion detection

### Next Actions
1. **Design the ConversationOrchestrator architecture**
2. **Create system prompt that references our docs structure**
3. **Implement AI-powered question generation** 
4. **Replace linear prompts with dynamic conversation flow**
5. **Test with our own project as the guinea pig**

---

**Status Guide:**
- `in_progress`: Actively working on todos
- `in_review`: Ready for testing/feedback, may iterate  
- `completed`: Feature done, ready to archive and move to next