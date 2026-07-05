# Deploy Living Paris to Vercel

The Next.js app (UI + `/api/chat`, `/api/voice/speech`, `/api/experience`) deploys to **Vercel**.  
The spatial GeoJSON API stays on **Cloudflare Workers** (already live).

## Architecture

| Component | Platform | URL |
|-----------|----------|-----|
| Next.js frontend + chat/voice | Vercel | `https://<your-project>.vercel.app` |
| Spatial API (datasets, routes) | Cloudflare Workers | `https://living-paris-api.living-paris.workers.dev` |

`next.config.ts` proxies only the Worker endpoints (`/api/datasets`, `/api/layers/*`, `/api/places`, `/api/spatial/query`, `/api/routes`). Chat and voice routes run on Vercel.

## One-time setup

### 1. Import the repo in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `samshanmukh/Living_paris`
3. Framework preset: **Next.js** (auto-detected)
4. Root directory: `.` (repo root)
5. Build command: `npm run build` (default)
6. Install command: `npm ci` (default)

`vercel.json` pins the **Paris region (`cdg1`)** for lower latency to Mapbox tiles and OpenRouter.

### 2. Environment variables

In **Project → Settings → Environment Variables**, add these for **Production** (and Preview if you want chat on preview deploys):

| Variable | Required | Notes |
|----------|----------|-------|
| `OPENROUTER_API_KEY` | Yes | From [openrouter.ai/keys](https://openrouter.ai/keys) — powers `/api/chat` and TTS |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Yes | Mapbox **public** `pk.*` token — client map basemap |
| `MAPBOX_ACCESS_TOKEN` | Recommended | Mapbox **secret** token — turn-by-turn routes in chat; falls back to Turf estimate without it |
| `OPENROUTER_MODEL` | Optional | Default `x-ai/grok-4.3` |
| `OPENROUTER_TTS_MODEL` | Optional | Default `x-ai/grok-voice-tts-1.0` |
| `OPENROUTER_TTS_VOICE` | Optional | Default `Ara` |
| `NEXT_PUBLIC_APP_URL` | Optional | Vercel sets `VERCEL_URL` automatically; override for custom domain |
| `NEXT_PUBLIC_UI_DEV_CACHE` | Optional | Set `false` in production (default in `.env.production`) |

Non-secret defaults are committed in `.env.production`:

```env
API_URL=https://living-paris-api.living-paris.workers.dev
NEXT_PUBLIC_API_URL=https://living-paris-api.living-paris.workers.dev
NEXT_PUBLIC_UI_DEV_CACHE=false
```

### 3. Deploy

Push to `master` (or click **Deploy** in the Vercel dashboard). Vercel builds and hosts the app; Cloudflare Worker deploys separately via `.github/workflows/deploy-api.yml`.

## CLI deploy (optional)

```bash
npm i -g vercel
vercel login
vercel link          # link to your Vercel project
vercel env pull .env.local   # pull env vars for local testing
vercel --prod        # production deploy
```

## Verify after deploy

1. Open the Vercel URL — Mapbox map should render (needs `NEXT_PUBLIC_MAPBOX_TOKEN`)
2. Tap a preset chip or send a chat message — needs `OPENROUTER_API_KEY`
3. Check Worker health: `curl https://living-paris-api.living-paris.workers.dev/api/datasets`

## Serverless limits

`/api/chat` and `/api/voice/speech` set `maxDuration = 60` seconds. On Vercel **Hobby**, function timeout is capped at **10s** — slow LLM responses may fail until you upgrade to **Pro** or optimize the pipeline.

## Custom domain

Add your domain under **Project → Settings → Domains**, then set:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Blank map | Set `NEXT_PUBLIC_MAPBOX_TOKEN` in Vercel env |
| Chat returns 502 / OpenRouter error | Set `OPENROUTER_API_KEY` |
| Straight-line routes instead of streets | Set `MAPBOX_ACCESS_TOKEN` on Vercel |
| 504 timeout on chat | Upgrade Vercel plan or reduce LLM latency |
| Spatial API 503 | Worker data issue — run `npm run fetch-data` and redeploy Worker |
