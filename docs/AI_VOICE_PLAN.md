# AI & Voice — Multi-Agent Development Plan

**Owner:** Ali (Member 3 — AI & Voice)  
**Status:** Canonical reference for Cursor agents working on this slice  
**Last updated:** 2026-07-04

> Agents: read this entire document before writing any AI/Voice code.  
> Do not edit files outside the ownership list below.

---

## Goal

Build `POST /api/chat` that:

1. Accepts natural language (`ChatRequest`)
2. Extracts intent via **OpenRouter → Grok**
3. Calls Siddharth's backend via **HTTP** (`POST /api/spatial/query`)
4. Returns `{ message, intent, mapState }` for Frontend + Maps teams

Voice is client-only (Web Speech API) on top of the same endpoint.

---

## Architecture (current repo)

```
User (text/voice)
  → hooks/useChat.ts / features/voice/*
  → POST /api/chat                    (Next.js — YOU)
  → services/ai/chat-orchestrator.ts
  → services/ai/intent-extractor.ts   → OpenRouter/Grok
  → services/ai/api-client.ts         → HTTP POST {API_URL}/api/spatial/query
  → Cloudflare Worker :8787           (Siddharth — DO NOT EDIT)
  → { message, intent, mapState }
```

**Local dev requires two terminals:**

```bash
npm run dev:api    # Worker on http://localhost:8787
npm run dev        # Next.js on http://localhost:3000 (proxies /api/* except /api/chat)
```

**Env:** copy `.env.example` → `.env.local`, set `OPENROUTER_API_KEY`.

---

## File ownership (Ali only)

### You MAY create/edit

```
services/ai/*
app/api/chat/*
features/voice/*
hooks/useChat.ts
lib/chat-types.ts
scripts/test-intent.mjs
scripts/test-chat.mjs
docs/AI_VOICE_PLAN.md
.env.example                        (OPENROUTER lines only)
```

### DO NOT touch

```
workers/
services/data/
services/experience/
services/routing/
features/chat/
features/map/
app/page.tsx
lib/intent-schema.ts               (read only — Siddharth owns)
lib/types.ts                       (read only — Sam/Siddharth own)
```

### Backend rule

- Call `POST ${API_URL}/api/spatial/query` via `fetch`
- **Never** import `runSpatialQuery`, `createSpatialEngine`, or anything from `services/data/*`

---

## Shared contracts

| Contract | Location | Rule |
|----------|----------|------|
| Intent JSON | `lib/intent-schema.ts` | Grok output must pass `intentSchema` |
| Chat request/response | `lib/chat-types.ts` | You define; Frontend/Maps consume |
| Spatial API | Worker `POST /api/spatial/query` | HTTP only |
| mapState (future) | `lib/types.ts` MapState | Use Sam's shape when `/api/experience` merges |

### ChatResponse shape

```typescript
{
  message: string;      // chat bubble
  intent: IntentInput;  // from intent-schema
  mapState: ...;        // interim from spatial; later from Experience Engine
}
```

---

## Multi-agent sequence

Run **sequentially**. Merge each branch before starting the next.

| Agent | Branch | Scope | Gate |
|-------|--------|-------|------|
| **1 — Contracts** | `cursor/ai-voice-1-contracts` | `lib/chat-types.ts`, `.env.example` | `tsc --noEmit` |
| **2 — Intent** | `cursor/ai-voice-2-intent` | `services/ai/openrouter`, `prompts`, `intent-extractor`, `test-intent.mjs` | 5 demo phrases validate |
| **3 — Chat API** | `cursor/ai-voice-3-chat-api` | `api-client`, `orchestrator`, `response-generator`, `app/api/chat`, `test-chat.mjs` | curl `/api/chat` works |
| **4 — Voice/client** | `cursor/ai-voice-4-voice-client` | `hooks/useChat`, `features/voice/*` | browser smoke test |
| **3b — Experience** (optional) | `cursor/ai-voice-3b-experience` | orchestrator only | when `/api/experience` exists on worker |

**Before each agent:** `git pull origin master`, create `backup/ai-before-agent-N`.

**After each agent:** `git diff master --name-only` — only your paths allowed.

---

## Agent 1 — Contracts

**Create:**

- `lib/chat-types.ts` — `ChatRequest`, `ChatResponse`
- `.env.example` — add `OPENROUTER_API_KEY=`, `OPENROUTER_MODEL=x-ai/grok-2-1212`

**Exit checks:**

- [ ] `npx tsc --noEmit`
- [ ] `ChatResponse` has `message`, `intent`, `mapState`
- [ ] No real secrets in `.env.example`

---

## Agent 2 — Intent extraction

**Create:**

- `services/ai/openrouter.ts` — OpenRouter HTTP client
- `services/ai/prompts.ts` — system prompt aligned with `intentSchema`
- `services/ai/intent-extractor.ts` — `extractIntent()` → Zod-validated JSON
- `scripts/test-intent.mjs` — CLI smoke test

**Exit checks:**

- [ ] No imports from `services/data/*`
- [ ] 5 demo phrases produce valid intent (see below)
- [ ] Missing `OPENROUTER_API_KEY` → clear error

**Demo phrases:**

1. "Plan a romantic evening under €60" → `mood: romantic`, `budget: 60`
2. "It's raining now" → `mood: rainy`, `indoor: true`
3. "I'm traveling with kids" → `mood: family`
4. "Wheelchair accessible cafés nearby" → `accessibility: true`
5. "Show me hidden photography spots" → `mood: photography` or `hidden`

---

## Agent 3 — Chat API + orchestrator

**Create:**

- `services/ai/api-client.ts` — `postSpatialQuery(intent)` via HTTP
- `services/ai/response-generator.ts` — template-based message (demo reliable)
- `services/ai/chat-orchestrator.ts` — full pipeline
- `app/api/chat/route.ts` — POST + GET docs
- `scripts/test-chat.mjs` — end-to-end smoke test

**Interim mapState** (until Experience Engine merges):

- `center` from `spatial.meta.center`
- layers from `spatial.layers`
- `highlights` from `spatial.geojson`
- `theme` from mood

**Exit checks:**

- [ ] `npm run dev:api` + `npm run test:api` pass
- [ ] `curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d "{\"message\":\"Plan a romantic evening under 60 euros\"}"`
- [ ] Response has `message`, `intent`, `mapState`
- [ ] Invalid body → 400
- [ ] Worker down → 502/503 with hint
- [ ] `npm run lint` on touched files

---

## Agent 4 — Voice + client hooks

**Create:**

- `hooks/useChat.ts` — `sendMessage`, `loading`, `error`, `lastResponse`
- `features/voice/useSpeechRecognition.ts`
- `features/voice/useSpeechSynthesis.ts`
- `features/voice/index.ts`

**Exit checks:**

- [ ] No OpenRouter imports in `hooks/` or `features/voice/`
- [ ] `useChat` calls `/api/chat` only
- [ ] Voice fails gracefully without Speech API
- [ ] Re-run Agent 2 + Agent 3 checks

---

## Team handoff

| Teammate | Consumes from you |
|----------|-------------------|
| Arya & Samt | `useChat()`, `response.message` |
| Rushendra | `response.mapState` (center, layers, highlights, route, theme) |
| Siddharth | Nothing — you call his HTTP API |
| Sam (Experience) | Your `intent`; later replace interim mapState with `/api/experience` |

---

## Revert guide

**Your files only:**

```bash
git restore services/ai app/api/chat features/voice hooks/useChat.ts lib/chat-types.ts scripts/test-*.mjs
```

**Nuclear (your branch only):**

```bash
git checkout master && git pull
git branch -D cursor/ai-voice-*
git checkout -b cursor/ai-voice-1-contracts
```

**Never:** `git reset --hard` on `master`, or edit `workers/`.

---

## Final integration checklist (coordinator)

- [ ] `npm run test:api`
- [ ] 5 demo phrases via `/api/chat`
- [ ] No secrets in git (`git grep sk-or`)
- [ ] Sample `ChatResponse` JSON shared with Rushendra + Arya
- [ ] PR description states: no changes to `workers/` or `services/data/`

---

## PR size estimate

~12–16 new files, ~800–1,400 lines added, mostly new code (low conflict risk).
