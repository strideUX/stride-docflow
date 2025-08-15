# Active Feature Focus

## F001: AI Project Discovery Engine
**Status:** in_review  
**Started:** 2025-08-15  
**Priority:** P0 (Critical)  
**From:** docs/releases/current/features.md

### Description
Interactive conversation engine that understands project context through dynamic Q&A flow instead of static forms.

### Current Todos
- [ ] Review Cursor's conversation engine scaffolding implementation
- [ ] Test the `--conversational` flag functionality  
- [ ] Design actual discovery question flows (not just noop)
- [ ] Implement real conversation logic with AI provider
- [ ] Add file-based context persistence (replace InMemoryContextStore)

### Completed This Session
- ✅ Added conversational scaffolding with NoopConversationEngine
- ✅ Wired `--conversational` flag to generate command
- ✅ Created basic unit test for conversation engine  
- ✅ Added context store with InMemoryContextStore
- ✅ Created `/src/conversation/engine.ts` and `/src/context/store.ts`

### What Cursor Implemented ✅
**Files Created:**
- `/src/conversation/engine.ts` - Complete conversation interfaces and NoopConversationEngine stub
- `/src/context/store.ts` - Context management interfaces with InMemoryContextStore  
- `/src/test/conversation-engine.test.ts` - Unit tests for conversation engine
- `/src/test/context-store.test.ts` - Unit tests for context store

**Files Modified:**
- `/src/commands/generate.ts` - Added `--conversational` flag integration (lines 19, 28-40)
- `package.json` - Added `test:run` script for CI-friendly testing

**Technical Implementation:**
- **Conversation Engine**: Full TypeScript interfaces for conversation phases, turns, state, and I/O
- **Flag Integration**: `--conversational` routes through NoopConversationEngine then falls back to existing prompts  
- **Context Store**: Generic context persistence interface with in-memory implementation
- **Testing**: Basic unit tests verify the scaffolding structure works correctly
- **Non-Breaking**: All changes are additive - existing functionality untouched

### Next Actions
1. **Test Current State**: Run `docflow generate --conversational` to see what works
2. **Review Code**: Understand the scaffolding Cursor built
3. **Design Questions**: Create actual conversation flows for project discovery
4. **Implement Logic**: Replace noop with real AI conversation

### Questions for Review
- Does the `--conversational` flag work end-to-end?
- What does the conversation engine interface look like?
- How should we design the discovery question flow?
- Should we implement file-based context persistence next?

---

**Status Guide:**
- `in_progress`: Actively working on todos
- `in_review`: Ready for testing/feedback, may iterate  
- `completed`: Feature done, ready to archive and move to next