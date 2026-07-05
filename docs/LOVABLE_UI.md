# Lovable-friendly UI package

Living Paris UI is split into a **presentational layer** (`features/ui/`) and thin **domain adapters** (`features/ui/adapters/`). Design in Lovable (or any React tool), then port components back without touching map, AI, or API code.

## Quick preview

```bash
npm run dev
# open http://localhost:3000/ui-sandbox
```

The sandbox renders the full conversational shell with mock data — no Mapbox, no `/api/chat`.

## What to copy into Lovable

Copy this folder (and its CSS dependencies):

```
features/ui/
├── components/     ← edit these in Lovable
├── types.ts        ← plain prop contracts
├── tokens.ts       ← palette + drawer snap points
├── motion.ts       ← Framer Motion presets
└── demo/           ← fixtures + LivingParisUiDemo.tsx
```

Also copy styling from `app/globals.css` (`@theme`, `.lp-glass`, `.lp-glass-strong`, `.language-selector`, marker classes if needed).

### Allowed dependencies in Lovable

| Package | Used for |
|---------|----------|
| `react` | Components |
| `framer-motion` | Animations |
| `lucide-react` | Icons |
| `vaul` | Bottom drawer |
| `tailwindcss` | Styling (match tokens in `tokens.ts`) |

Do **not** import from `@/lib/living-paris-intent`, `@/features/map`, `@/hooks`, or `@/services` inside `features/ui/components/`.

## Architecture

```
┌─────────────────────────────────────────┐
│  LivingParisExperience (app shell)      │
│  map · AI hooks · API                     │
└─────────────────┬───────────────────────┘
                  │ adapters
┌─────────────────▼───────────────────────┐
│  features/intent/*  (thin wrappers)     │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  features/ui/components/*  (pure UI)    │
└─────────────────────────────────────────┘
```

## Component map

| UI component | Domain wrapper | Purpose |
|--------------|----------------|---------|
| `IntentDrawerShell` | `IntentDrawer` | Chat drawer + plan stops |
| `PresetChipRow` | `IntentPresetChips` | Scenario chips |
| `IntentHeaderCard` | `IntentHeader` | Top intent card |
| `MoodGlowOverlay` | `IntentMoodOverlay` | Map mood tint |
| `ResponseBubble` | `IntentResponseBubble` | Floating Paris reply |
| `ExperiencePlanCard` | `ExperienceCard` | Itinerary card |
| `BrandPill` | — (used in shell) | App title pill |
| `LanguagePicker` | `LanguageSelector` | Locale switch |

## Prop contracts (examples)

```tsx
// features/ui/types.ts — serializable where possible
interface UiIntentSummary {
  id: string;
  title: string;
  subtitle: string;
  icon: ReactNode;       // emoji badge or custom node
  accentColor: string;
  glowColor: string;
  distance?: string;     // "2.1 km"
  duration?: string;     // "45 min"
  moodEmoji?: string;
  sourceBadge?: string;
}

interface UiPlanStop {
  id: string;
  number: number;
  name: string;
  category: string;
  description: string;
  duration: string;
  imageBackground: string;  // CSS gradient
}
```

Use `features/ui/demo/fixtures.tsx` as sample data when prototyping.

## Lovable workflow

### 1. Bootstrap in Lovable

1. Create a new Lovable project (Vite or TanStack Start).
2. Connect GitHub (two-way sync).
3. Copy `features/ui/` into the Lovable repo (e.g. `src/features/ui/`).
4. Copy relevant `globals.css` tokens and utility classes.
5. Add dependencies: `framer-motion`, `lucide-react`, `vaul`.

### 2. Design iteration

- Point Lovable at `LivingParisUiDemo` (or a single component story).
- Pass mock props from `uiDemoFixtures`.
- Iterate on layout, typography, colors in `tokens.ts`.

### 3. Port back to Living Paris

1. Copy changed files from Lovable → this repo under `features/ui/components/`.
2. Run `npm run dev` and check `/ui-sandbox` first.
3. Verify the main app at `/` — adapters should wire domain data automatically.

If you only changed CSS tokens, update `app/globals.css` and `features/ui/tokens.ts` together.

## Adapters (do not edit in Lovable)

`features/ui/adapters/living-paris.ts` maps domain types to UI props:

- `toUiIntentSummary(intent)` — `LivingParisIntent` → drawer/header
- `toUiPlanStops(intent)` — stop cards
- `toUiPresetChips(presets)` — chip row
- `toUiChatMessages(messages)` — `"paris"` → `"assistant"`
- `toUiExperiencePlan(result, route)` — experience card

Keep adapters in this repo; Lovable only needs the UI layer + demo fixtures.

## Public API

```tsx
import {
  IntentDrawerShell,
  PresetChipRow,
  uiDemoFixtures,
  LivingParisUiDemo,
  palette,
} from "@/features/ui";
```

## Out of scope for Lovable

Leave these in the main Next.js app:

- `features/map/*` (Mapbox, Deck.gl)
- `hooks/useLivingParisIntent.ts`
- `app/api/*`
- `services/*`
- `workers/api/*`
