# Active Feature Focus

## F001: AI Project Discovery Engine
**Status:** completed (pending Convex AI SDK upgrade)  
**Started:** 2025-08-15  
**Priority:** P0 (Critical)  
**From:** docs/releases/current/features.md

### Description
Conversational AI system that conducts requirements gathering like a technical consultant, using dynamic question generation and natural dialogue flow to build comprehensive project understanding.

### Note
Core conversational flow implemented and validated. Remaining enhancements (Convex AI SDK streaming, multi-agent foundation) tracked in the enhancement section below.

### Current Todos (Revised)
- [x] **Design ConversationOrchestrator**: Main conversation manager using our docs structure as discovery template
- [x] **Implement Dynamic Question Generation**: AI generates next question based on conversation history and gaps  
- [x] **Create Discovery Gap Assessor**: Evaluates what information is still needed for complete documentation
- [x] **True chat loop & streaming UI**: Replace form prompts with natural chat, stream AI questions in terminal
- [x] **Build System Prompt Integration**: Added consultant-mode prompt with doc structure awareness
- [x] **Add Provider Configuration**: Runtime AI provider and model selection (OpenAI/Anthropic focus)
- [x] **Implement Session Memory**: Context persists during session via Convex database, cleanup after doc generation

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
- ✅ **Dynamic Flow Introduced**: Orchestrator now generates questions per gaps (interactive)
- ✅ **System Prompt Depth**: Consultant-mode system prompt added to orchestrator
- ⚠️ **Session Memory**: Persisted context exists, but not yet wired into orchestrator lifecycle

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
This feature is completed. Further work is tracked under the enhancement below.

### Progress (2025-08-18)
- Implemented streaming chat UI (`cli/src/ui/chat.ts`) and wired into `ConversationOrchestrator` to ask AI-generated questions dynamically.
- Removed `p.text()`/`p.select()` usage from conversational flow; stack confirmation moved to summarization.
- Conversational mode in `generate` now builds `ProjectData` from conversation summary without form prompts.

---

**Status Guide:**
## F001-Enhancement: Convex AI SDK Integration
**Status:** planned  
**Started:** 2025-08-19  
**Priority:** P1 (High)  
**Dependencies:** F001 core completion

### Description
Upgrade from basic Convex client to Convex AI SDK for enhanced streaming capabilities, better AI integration, and multi-agent foundation.

### Current Todos
- [ ] **Install Convex AI SDK**: Add @convex-dev/ai package and configure
- [ ] **Replace ConvexContextStore**: Upgrade to use Convex AI streaming patterns
- [ ] **Enhance conversation streaming**: Implement real-time AI response streaming
- [ ] **Multi-agent foundation**: Set up patterns for future agent specialization
- [ ] **Session resume**: Wire --session CLI flag for conversation resumption
- `in_progress`: Actively working on todos
- `in_review`: Ready for testing/feedback, may iterate  
- `completed`: Feature done, ready to archive and move to next