# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies
npm install

# Start development server (hot-reload)
npm run dev

# Production build
npm run build

# Development build (with dev flags)
npm run build:dev

# Preview production build locally
npm run preview

# Lint code (ESLint + TypeScript)
npm run lint
```

## Environment Setup

Create `.env` file from `.env.example`:

```env
# Required: Password protection (default: test123)
VITE_APP_PASSWORD=YourSecurePassword123!
VITE_ENABLE_PASSWORD_PROTECTION=true

# At least one AI provider API key required
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
VITE_TOGETHER_API_KEY=your_together_api_key_here
VITE_POE_API_KEY=your_poe_api_key_here

# Optional
VITE_DEBUG_MODE=false
VITE_SITE_URL=http://localhost:5173
VITE_SITE_NAME=HadesChat
```

**Important**: Restart dev server after changing `.env` file.

## Architecture Overview

### Multi-Provider AI Chat System

This is a browser-based AI chat application supporting **4 AI providers** (Groq, OpenRouter, Together AI, Poe) with **RAG (Retrieval-Augmented Generation)** document analysis capabilities. All data storage happens client-side using IndexedDB—there is no backend server.

**Key architectural patterns:**

1. **Unified AI API** (`src/lib/aiApi.ts`): Single interface abstracting 4 different AI provider APIs
2. **Provider-specific modules**: Each provider has dedicated implementation (`groqApi.ts`, `openrouterApi.ts`, `togetherApi.ts`, `poeApi.ts`)
3. **IndexedDB storage** (`src/lib/db.ts`): Manages sessions, messages, agent sessions, and agent responses
4. **RAG system** (`src/hooks/useRAG.ts` + `src/lib/documentProcessor.ts`): Client-side document processing and context injection
5. **Password protection** (`src/components/PasswordProtection.tsx`): Enterprise-grade security with SHA-256 hashing, rate limiting, session timeout

### Data Flow

```
User Message → RAG Context (optional) → Provider API → Streaming Response → IndexedDB → UI Update
                     ↓
              Document Upload → Text Extraction → Chunking → Storage in React state
```

### Core Modules

**AI Provider Integration** (`src/lib/`):
- `aiApi.ts`: Unified interface, model definitions for all providers
- `groqApi.ts`, `openrouterApi.ts`, `togetherApi.ts`, `poeApi.ts`: Provider-specific streaming APIs
- Each provider API handles streaming responses and returns metadata (tokens, duration, speed)

**Storage Layer** (`src/lib/db.ts`):
- 4 IndexedDB stores: `sessions`, `messages`, `agentSessions`, `agentResponses`
- Sessions track: `id`, `title`, `timestamp`, `modelName`, `provider`, `modelId`, `lastMessage`, `isAgentMode`
- Messages track: `id`, `sessionId`, `role`, `content`, `timestamp`, `modelName`, `metadata`
- Agent sessions support multi-model concurrent execution

**RAG System**:
- `src/hooks/useRAG.ts`: Manages document state, builds context strings for AI prompts
- `src/lib/documentProcessor.ts`: Extracts text from PDF, Word, TXT, MD, CSV, JSON, HTML, RTF
- Documents chunked into 1000-char segments for better retrieval
- RAG context prepended to user messages with document metadata

**Special Modes**:
- **Agent Mode** (`src/components/AgentMode.tsx`): Run multiple AI models concurrently on same prompt
- **Debate Mode** (`src/components/ASSDebateMode.tsx`, `src/lib/assDebate.ts`): Multi-agent debates with personality types

### Component Architecture

**Main Pages** (`src/pages/`):
- `Index.tsx`: Root page with password gate, session management, mode switching (chat/agent/debate)

**Core Components** (`src/components/`):
- `ChatArea.tsx`: Main chat interface with message display, input, RAG integration
- `ChatSidebar.tsx`: Session list, model selector, new session creation
- `SettingsSidebar.tsx`: Provider API key management, RAG toggle, general settings
- `DocumentUpload.tsx`: Drag-drop file upload, document management UI
- `PasswordProtection.tsx`: Login screen with brute-force protection (5 attempts, 15min lockout)
- `AgentMode.tsx`: Parallel model execution interface
- `ASSDebateMode.tsx`: Debate session management with team configurations

**Specialized Components**:
- `MarkdownRenderer.tsx`: Renders AI responses with syntax highlighting (uses `react-markdown`, `react-syntax-highlighter`)
- `RAGIndicator.tsx`: Shows RAG enabled/disabled status
- `ChatMessage.tsx`: Individual message display with metadata badges

### Debug System

Debug logging controlled via `VITE_DEBUG_MODE` environment variable:

```typescript
import { debugLog, debugWarn, debugError, alwaysLog } from "@/lib/debug";

// Only logs when VITE_DEBUG_MODE=true
debugLog("Message sent:", message);
debugWarn("Slow response detected");
debugError("API call failed");

// Always logs (for critical info)
alwaysLog("Session started");
```

Use debug helpers throughout codebase instead of raw `console.log`.

## Code Conventions

**Import Path Alias**: Use `@/` for imports from `src/`:
```typescript
import { ChatSidebar } from "@/components/ChatSidebar";
import { groqApi } from "@/lib/groqApi";
```

**Component Style**:
- Function components with TypeScript (`.tsx`)
- Named exports for reusable components
- PascalCase filenames (`ChatArea.tsx`)
- Two-space indentation
- Tailwind utility classes for styling

**Hooks**:
- camelCase filenames (`useRAG.ts`, `useGroqModels.ts`)
- Co-locate by feature when possible

**Type Definitions**:
- Define interfaces inline or in same file
- Export shared types from respective modules
- Provider type: `"poe" | "together" | "groq" | "openrouter"`

**State Management**:
- React useState/useCallback for component state
- IndexedDB via `src/lib/db.ts` for persistence
- localStorage for settings (API keys stored as env vars)

## Common Patterns

### Adding New AI Provider

1. Create `src/lib/{provider}Api.ts` with streaming chat function
2. Add provider type to `Provider` union in `aiApi.ts`
3. Add model definitions to `ALL_MODELS` constant
4. Import and integrate in `aiApi.ts` `streamChat()` function
5. Add model manager component if needed (see `GroqModelManager.tsx`)

### RAG Context Injection

RAG context automatically prepended to messages when:
- Documents uploaded in current session
- RAG toggle enabled (checked via `isRAGEnabled()` in `useRAG` hook)

Format:
```
[Document Context - Use this information to answer the user's question]

Document 1: filename.pdf
{document content}
---

Please use the above document content to provide accurate information in your response.
```

### Security Notes

**Password Protection Layers**:
- SHA-256 hashing of passwords (never plain text comparison)
- Rate limiting: max 5 login attempts, then 15-minute lockout
- Session timeout: 60 minutes of inactivity
- Encrypted session storage with random tokens
- Anti-bypass protection detecting console manipulation
- Storage manipulation detection triggers reload

**Data Privacy**:
- All data stored locally in browser IndexedDB
- Document processing happens client-side
- API keys in `.env` (never committed)
- Document content IS sent to AI providers during generation

## Testing Strategy

No automated test suite currently exists. When adding tests:
- Co-locate specs with components using `.test.tsx` suffix
- Use Vitest + React Testing Library
- Focus on stateful hooks and complex UI flows
- Store fixtures in `src/lib/test-data/`

## Commit Guidelines

Follow existing patterns from git log:
- Concise, capitalised imperative subjects
- Example: "Replace console logs with debug helpers"
- Reference issue IDs when applicable
- Squash fixup commits locally before pushing
