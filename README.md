# tightknit.dev

Landing page for [tightknit](https://tightknit.ai)'s open source repos. Auto-syncs the repo grid from `github.com/tightknitai` at build time.

- **Stack:** Astro 5 (static) · Tailwind v4 · TypeScript
- **Hosting:** Cloudflare Workers (Static Assets)
- **Source of truth for repos:** [github.com/tightknitai](https://github.com/tightknitai)

## Develop

```bash
npm install
npm run dev          # http://localhost:4321
```

## Build

```bash
npm run build        # type-checks then builds to ./dist
npm run preview      # preview the static build locally
```

The page calls the GitHub API at build time. Without a token you'll hit the unauthenticated rate limit (60/hr) — set `GITHUB_TOKEN` in CI:

```bash
GITHUB_TOKEN=ghp_xxx npm run build
```

If the API call fails, the build falls back to a hardcoded list of the headline repos (block-kitchen, slack-block-kit-validator, slack-hono) so the site never breaks.

## Deploy (Cloudflare Workers)

The site uses Cloudflare's [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) — no Astro adapter, no SSR, just static files served from the edge.

```bash
npm run deploy       # builds + wrangler deploy
```

First-time setup:

1. `npx wrangler login`
2. `npm run deploy` — Wrangler will create the Worker
3. In the Cloudflare dashboard, add the custom domain `tightknit.dev` to the `tightknit-dev` Worker (Workers & Pages → tightknit-dev → Settings → Domains & Routes)
4. Add `GITHUB_TOKEN` as a build-time secret in your CI for live repo data

## Repo selection

The featured cards (yellow / pink / cyan) are hand-picked in [`src/components/RepoGrid.astro`](src/components/RepoGrid.astro):

```ts
const FEATURED_NAMES = ['block-kitchen', 'slack-block-kit-validator', 'slack-hono'];
```

All other public, non-archived, non-fork repos from `tightknitai` render in "// the rest", sorted by stars. To change which repos appear in the spotlight, edit that array.

## Design system

Brutalist / neo-brutalist:

- Cream `#f3ede0` ground · Ink `#0a0a0a` foreground
- Accents: electric yellow `#ffe600`, hot pink `#ff2d7b`, cyan `#00e0ff`
- Sharp corners (zero radius), 3px ink borders, hard 8px offset shadows
- Type: Space Grotesk (display + body), JetBrains Mono (labels, code)

Tokens live in [`src/styles/global.css`](src/styles/global.css) under `@theme`.

## Structure

```
src/
├── pages/
│   ├── index.astro       # the only page
│   └── 404.astro
├── layouts/
│   └── Layout.astro      # html shell, fonts, meta
├── components/
│   ├── Nav.astro
│   ├── Hero.astro        # giant headline + 3D floating blocks + marquee
│   ├── RepoGrid.astro    # featured + the rest
│   ├── RepoCard.astro
│   ├── Manifesto.astro   # ink-on-cream principles strip
│   └── Footer.astro
├── lib/
│   └── github.ts         # build-time GitHub fetcher + fallback
└── styles/
    └── global.css
```
