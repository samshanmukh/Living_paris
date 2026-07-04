# AGENTS.md

## Cursor Cloud specific instructions

### Current repository state (important)

This repository is **not yet scaffolded** as an application. It currently contains only:

- `README.md` — a tech-stack table describing the intended "Living Paris" app (Next.js, React, Tailwind, Mapbox GL JS, Deck.gl, Turf.js, AI, etc.).
- `living_paris_ui_flow.html` — a **static** HTML architecture/UI-flow diagram (a design mockup, not a running app).

There is **no `package.json`, no source code, and no dependency lockfile**. The Next.js application described in the README has not been created yet. Do not assume a Node/Next.js toolchain is installed via dependencies — nothing is installed because there is nothing to install.

### Previewing the only runnable artifact

`living_paris_ui_flow.html` is the only viewable artifact. Serve it as a static file and open it in a browser:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/living_paris_ui_flow.html
```

Note: the file relies on CSS custom properties (e.g. `--text-primary`, `--font-sans`) and a Tabler icon font that are injected by a host app. When served standalone it renders as **plain, unstyled black text with missing icons** — this is expected and not a bug.

### When the app is eventually scaffolded

Once a `package.json` is added (Next.js per the README), the standard workflow will be:

- Install: `npm install`
- Dev server: `npm run dev`
- Lint: `npm run lint`
- Build: `npm run build`

Mapbox and AI provider features will require API keys (e.g. `NEXT_PUBLIC_MAPBOX_TOKEN`, an AI provider key) supplied as environment variables/secrets. There are no tests or lint configs to run today.
