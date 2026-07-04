# 🗼 Living Paris

> **Have a conversation with Paris, not a map.**

Living Paris is an AI-powered city companion that transforms the way people explore Paris. Instead of searching for places with filters and keywords, users simply describe what they want, and the city responds by dynamically reshaping the map with personalized recommendations, routes, and experiences.

---

## ✨ Inspiration

Traditional map applications require users to know exactly what they're looking for.

Examples:
- Find restaurants
- Search museums
- Look for parks

Living Paris flips this interaction.

Instead of searching for places, users describe **experiences**.

Examples:
- ❤️ "Plan a romantic evening under €60."
- 🌧 "It's raining now."
- 👨‍👩‍👧 "I'm traveling with kids."
- 📸 "Show me hidden photography spots."
- ♿ "Find quiet cafés within a 10-minute walk that are wheelchair accessible."

The AI understands the user's intent and transforms the city in real time.

---

# 🎯 Problem

Current map applications are transactional.

```
Search
↓

Results
```

They don't understand context, mood, or changing preferences.

Living Paris creates a more natural experience where the city adapts as the conversation evolves.

---

# 💡 Solution

Living Paris combines:

- 🤖 AI
- 🗺 Interactive Maps
- 📊 Paris Open Data
- 🎙 Voice Interaction
- ✨ Beautiful Animations

to create a living, interactive city experience.

Instead of simply showing locations, the application builds personalized experiences.

---

# 🚀 Features

### 💬 AI Conversation

Talk naturally with the city.

Example:

> "Plan a romantic evening."

---

### 🗺 Dynamic Interactive Map

Instead of static pins:

- Camera flies across Paris
- Routes animate
- Markers glow
- Layers change dynamically
- Recommendations update live

---

### 🎯 Personalized Experiences

Examples include:

- ❤️ Date Night
- 🍽 Food Tour
- 🌳 Relaxing Walk
- 📸 Photography Tour
- 🎭 Museums & Art
- 👨‍👩‍👧 Family Day
- 🌧 Rainy Day
- 💎 Hidden Gems
- 🌙 Nightlife
- 🚶 Local Explorer

---

### 📍 Smart Route Planning

Generate routes based on:

- Walking distance
- Accessibility
- Quiet streets
- Parks
- Scenic paths
- User preferences

---

### 📊 Paris Open Data Integration

Uses public datasets including:

- Café terraces
- Trees
- Parks
- Metro stations
- Air quality
- Noise levels
- Accessibility
- Museums
- Bike stations

---

### 🎙 Voice Interaction

Users can speak naturally instead of typing.

---

### ✨ Cinematic Map Experience

The application feels alive through:

- Animated routes
- Camera fly-to transitions
- Dynamic overlays
- Heatmaps
- Glowing markers
- Smooth UI animations

---

# 🏗 System Architecture

```
User
        │
        ▼
Voice / Chat Interface
        │
        ▼
Next.js Frontend
        │
        ▼
AI Intent Engine
        │
        ▼
Experience Engine
        │
        ▼
Spatial Query Engine
        │
        ▼
Paris Open Data
        │
        ▼
Mapbox + Deck.gl Visualization
        │
        ▼
Interactive Map Experience
```

---

# ⚙ Tech Stack

## Frontend

- Next.js
- React
- Tailwind CSS

## UI Animations

- Framer Motion

## Maps

- Mapbox GL JS
- react-map-gl

## Visualization

- Deck.gl

## Spatial Processing

- Turf.js

## AI

- Gemini / OpenAI / Claude

## Voice

- Web Speech API

## Backend

- Next.js API Routes

## Data

- Paris Open Data (GeoJSON)

## Deployment

- Vercel

---

# 📂 Project Structure

```
living-paris/

├── app/
├── components/
├── features/
│   ├── chat/
│   ├── map/
│   ├── voice/
│   └── recommendations/
├── services/
│   ├── ai/
│   ├── maps/
│   ├── routing/
│   └── data/
├── public/
│   └── data/
├── lib/
├── hooks/
├── styles/
└── README.md
```

---

# 🔄 User Flow

```
User opens Living Paris

↓

Types or speaks

↓

AI understands intent

↓

Experience Engine scores locations

↓

Paris Open Data is queried

↓

Routes generated

↓

Map updates with animations

↓

AI explains recommendations

↓

User continues conversation

↓

Map evolves in real time
```

---

# 🧠 AI Pipeline

```
Natural Language

↓

Intent Extraction

↓

Structured JSON

↓

Experience Selection

↓

Spatial Filtering

↓

Location Ranking

↓

Route Generation

↓

Map Animation

↓

Recommendation Response
```

---

# 👥 Team Responsibilities

### 👤 Member 1 — Frontend & UI

- Build the user interface
- Create chat experience
- Implement animations
- Polish the demo

---

### 🗺 Member 2 — Maps & Visualization

- Mapbox integration
- Deck.gl layers
- Route animations
- Camera transitions

---

### 🤖 Member 3 — AI & Voice

- LLM integration
- Intent extraction
- Voice input
- AI recommendations

---

### 📊 Member 4 — Data & Backend

- Prepare Paris Open Data
- Build APIs
- Spatial queries
- Data optimization

---

### 🧠 Member 5 — Experience Engine

- Recommendation engine
- Experience scoring
- Personalization
- Route ranking

---

# 🌟 Future Enhancements

- 🌦 Live weather integration
- 🚇 Real-time public transport
- 🎉 Local events integration
- 🗓 AI itinerary planner
- 👥 Collaborative trips
- 🥽 AR city exploration
- 🔔 Smart travel notifications
- 🌍 Multi-city support

---

# 🎬 Demo Scenario

**User:**

> "Plan a romantic evening under €60."

✨ The camera flies to the Seine.

☕ Romantic cafés appear.

🌅 Sunset viewpoints are highlighted.

🚶 A scenic walking route is animated.

---

**User:**

> "Now it's raining."

🌧 Outdoor cafés fade.

🏛 Museums appear.

🚇 Metro stations are highlighted.

☂ The route is updated automatically.

The city adapts naturally as the conversation continues.

---

# 🚀 Vision

Living Paris isn't another map application.

It's an AI-powered city companion where users don't search for places—they have a conversation with the city.

By combining conversational AI, public city data, and immersive map interactions, Living Paris creates a delightful, personalized experience that makes exploring Paris feel intuitive, dynamic, and memorable.



# Tech Stack
| Layer                  | Technology                         |
| ---------------------- | ---------------------------------- |
| Frontend               | Next.js, React, Tailwind CSS       |
| UI Animation           | Framer Motion                      |
| Mapping                | Mapbox GL JS + react-map-gl        |
| Advanced Visualization | Deck.gl                            |
| Spatial Processing     | Turf.js                            |
| AI                     | Gemini 2.5 / OpenAI GPT-5 / Claude |
| Voice                  | Web Speech API                     |
| Backend                | Next.js API Routes                 |
| Data                   | Paris Open Data (GeoJSON)          |
| Hosting                | Vercel                             |

---

# 📊 Data & Backend API

**Live API:** https://living-paris-api.living-paris.workers.dev

The API runs on **Cloudflare Workers** with GeoJSON bundled as static assets. The Next.js frontend proxies `/api/*` to this URL (see `.env.example`).

**All public datasets are scoped to Paris** — opendata.paris.fr + IDFM metro within Paris bounds. Re-run `npm run fetch-data` to refresh.

> **AI team:** Wrap `POST /api/spatial/query` inside your `/api/chat` endpoint.

## Quick start (frontend / other members)

```bash
npm install
cp .env.example .env.local   # points at the live Cloudflare API
npm run dev                  # Next.js on http://localhost:3000
```

No need to run the API locally — `.env.example` already has:

```env
API_URL=https://living-paris-api.living-paris.workers.dev
NEXT_PUBLIC_API_URL=https://living-paris-api.living-paris.workers.dev
```

**Vercel:** add the same two variables in Project → Settings → Environment Variables (or rely on committed `.env.production`).

## Full backend setup (Member 4 / local API dev)

```bash
npm install
cp .env.example .env.local
npm run fetch-data        # Download Paris Open Data → public/data/
npm run dev:api           # Cloudflare Worker on http://localhost:8787 (uses bundled assets)
npm run dev               # Next.js frontend (proxies /api → worker)
npm run test:api          # Integration tests (romantic + rainy queries)
```

For local API dev, override in `.env.local`:

```env
API_URL=http://localhost:8787
NEXT_PUBLIC_API_URL=http://localhost:8787
```

Optional — test with local R2 preview bucket instead of bundled assets:

```bash
npm run upload-data       # Upload GeoJSON to local R2 preview bucket
npm run dev:api -- --env production
```

## Deploy API to Cloudflare

**Quick deploy** (bundles GeoJSON with the worker — no R2 setup):

```bash
npm run fetch-data
npm run deploy:api
```

**Production with R2** (optional, for live data updates without redeploying):

```bash
# One-time: create R2 bucket (wrangler r2 bucket create living-paris-geojson)
npm run fetch-data
npm run upload-data:remote
npx wrangler secret put MAPBOX_ACCESS_TOKEN   # optional
npm run deploy:api:production
```

Production API URL (already configured in `.env.example` and `.env.production`):

```
https://living-paris-api.living-paris.workers.dev
```

For CI deploy, add GitHub repo secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` — pushes to `master` that touch API files will run `.github/workflows/deploy-api.yml`.

## GeoJSON Layers (R2 / `public/data/`)

Run `npm run fetch-data` then check `public/data/manifest.json` for live counts. Current layers:

| Layer | Source | Features |
|-------|--------|----------|
| `cafes` | opendata.paris.fr — terrasses-autorisations | 800 |
| `bikes` | velib-emplacement-des-stations | 1,517 |
| `trees` | les-arbres | 1,200 |
| `parks` | lieux-municipaux + jardins-relais | 235 |
| `accessibility` | accessible hébergements + POIs | 370 |
| `museums` | lieux-municipaux + national supplement | 92 |
| `metro` | IDFM arrets (Paris bounds) | 265 |
| `noise` | bruit-evolution | 15 |
| `air-quality` | respirons-mieux | 7 |

Café features include **`dietary` tags** (`vegetarian`, `vegan`, etc.) inferred from venue names for the Experience Engine (Member 5). Outdoor terraces omit `accessible: false` so the romantic + accessibility demo is not over-filtered.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/datasets` | List all available layers with metadata |
| `GET` | `/api/layers/:layerName` | Full GeoJSON for a layer |
| `GET` | `/api/places?layer=cafes&radius=800&lat=48.86&lon=2.35` | Filtered places query |
| `POST` | `/api/spatial/query` | **Main endpoint** — AI intent JSON → GeoJSON for map |
| `GET` | `/api/spatial/query` | Schema documentation |
| `POST` | `/api/routes` | Walking route + camera path between waypoints |
| `GET` | `/api/routes` | Route API documentation |

## Spatial Query (for AI + Maps teams)

```bash
curl -X POST https://living-paris-api.living-paris.workers.dev/api/spatial/query \
  -H "Content-Type: application/json" \
  -d '{
    "mood": "romantic",
    "budget": 60,
    "walk": 15,
    "accessibility": true,
    "lat": 48.8566,
    "lon": 2.3522,
    "limit": 20
  }'
```

Returns GeoJSON `FeatureCollection` with scored, radius-filtered features ready for Deck.gl / Mapbox layers.

## Intent JSON Schema

Defined in `lib/intent-schema.ts` (Zod-validated):

- `mood` — romantic, family, rainy, photography, nightlife, relaxing, hidden, food, culture, general
- `budget` — max euros
- `walk` — max walking minutes (converted to ~80 m/min radius)
- `accessibility` — filter to accessible POIs
- `indoor` / `rainy` — prefer indoor locations
- `lat` / `lon` / `radius` — spatial center and search radius
- `layers` — override auto layer selection
- `limit` — max features returned (default 50)
- `timeBudget` — total minutes available for the experience ("we only have an hour")
- `dietary` — dietary preferences, e.g. `["vegetarian"]`

---

# 🧠 Experience Engine

The Experience Engine decides **what appears on the map**. It turns accumulated
conversation intent into a ranked experience with an itinerary and a
render-ready `mapState`.

```
intent (merged across conversation turns)
  → experience mode (Date Night, Rainy Day, ...)
  → weighted layers within walking radius
  → scored + ranked features (with human-readable reasons)
  → itinerary (ordered stops, time-budget aware)
  → mapState (camera, theme, layers, markers, route waypoints)
```

## Main endpoint

```bash
curl -X POST http://localhost:3000/api/experience \
  -H "Content-Type: application/json" \
  -d '{
    "mood": "romantic",
    "budget": 60,
    "walk": 20,
    "rainy": false,
    "timeBudget": 60,
    "dietary": ["vegetarian"],
    "lat": 48.8566,
    "lon": 2.3522
  }'
```

`GET /api/experience` lists all experience modes and documents the schema.

## Experience modes

| Mode | Trigger mood | Layers | Theme |
|------|--------------|--------|-------|
| ❤️ Date Night | `romantic` | cafes, parks, museums | `romantic` |
| 👨‍👩‍👧 Family Day | `family` | parks, museums, metro, cafes | `family` |
| 💎 Hidden Gems | `hidden` | parks, cafes, trees | `day` |
| 🌧️ Rainy Day | `rainy` or `rainy: true` | museums, metro, cafes | `rain` |
| 🍽️ Food Tour | `food` | cafes, metro | `day` |
| 📸 Photography Tour | `photography` | parks, museums, trees | `day` |
| 🎭 Museums & Art | `culture` | museums, metro | `day` |
| 🌳 Relaxing Walk | `relaxing` | parks, trees, cafes | `day` |
| 🌙 Nightlife | `nightlife` | cafes, metro | `night` |
| 🚶 Local Explorer | `general` / fallback | cafes, parks, museums, metro | `day` |

`rainy: true` overrides the mode (the "now it's raining" pivot) while the
scoring still honors the lingering mood — a rainy date night prefers
romantic indoor places.

## Response shape

```jsonc
{
  "experience": { "id": "date-night", "name": "Date Night", "emoji": "❤️" },
  "mapState": {
    "flyTo": { "center": [2.35, 48.85], "zoom": 14.5, "pitch": 55 },
    "theme": "romantic",              // drives map style + UI palette
    "visibleLayers": ["cafes", "parks", "museums"],
    "markers": [ { "id", "name", "coords", "layer", "score", "highlighted", "reasons" } ],
    "routeWaypoints": [ { "lon", "lat", "name" } ]  // feed to POST /api/routes
  },
  "itinerary": {
    "stops": [ { "order", "name", "layer", "coords", "reasons", "walkFromPreviousMinutes" } ],
    "totalWalkMinutes": 14.2,
    "totalDurationMinutes": 94,
    "fitsTimeBudget": true
  },
  "recommendations": [ /* top places with reasons, for cards */ ]
}
```

## Team integration

- **AI team (Member 3)** — merge conversation turns into one intent object and
  POST it here. `reasons` on stops/recommendations are ready to narrate.
- **Maps team (Member 2)** — render `mapState` directly: fly the camera, apply
  `theme`, draw `markers` (glow the `highlighted` ones), then POST
  `routeWaypoints` to `/api/routes` for the animated path.
- **Frontend (Member 1)** — `itinerary.stops` and `recommendations` power the
  experience cards; each carries human-readable `reasons`.
- **Tuning** — all knobs live in `services/experience/modes.ts`
  (layer weights, scoring weights, themes, camera, stop counts).

---

# 🎨 Frontend & UX (Member 1)

Mobile-first conversational UI — a chat sheet over a living map, in the warm
miniature-Paris palette (cream / terracotta / forest / gold).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

The map uses a free CARTO vector basemap (no token needed). Try the demo:
type **"First date tonight, under €60"**, then **"It's raining"**, then
**"We only have an hour"**, then **"She's vegetarian"** — the city recomposes
on every turn.

## Structure

| Piece | File | Notes |
|-------|------|-------|
| App shell | `app/page.tsx` | Mobile-first; theme tints, status pill, bottom stack |
| Design tokens | `app/globals.css` | Palette, marker styles, popup skin |
| Map | `features/map/MapCanvas.tsx` | MapLibre; markers animate in, glowing numbered stops, route line, fitBounds camera. **Member 2 swaps the basemap/style here.** |
| Chat | `features/chat/ChatSheet.tsx` | Messages, suggestion chips, mic (Web Speech API where supported) |
| Cards | `features/experience/ExperienceCard.tsx` | Collapsible itinerary with numbered stops + walk times |
| Chat API | `app/api/chat/route.ts` | Heuristic parse → merge intent → Experience Engine → reply. **Member 3 replaces parsing/reply with OpenRouter; contract stays.** |
| NL parser | `lib/parse-intent.ts` | Regex mood/budget/time/dietary extraction (AI placeholder) |

## Conversation contract (`POST /api/chat`)

```jsonc
// request — client sends back the accumulated intent each turn
{ "message": "it's raining", "intent": { "mood": "romantic", "budget": 60 } }

// response
{
  "reply": "Rain in Paris — noted. I moved everything under a roof: ...",
  "intent": { "mood": "romantic", "budget": 60, "rainy": true },  // send this on next turn
  "understood": { "rainy": true },       // what this turn changed
  "result": { /* ExperienceResult — mapState, itinerary, recommendations */ },
  "route": { /* walking route geometry + cameraPath, or null */ }
}
```

