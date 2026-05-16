# tightknit.dev

Landing page for [tightknit](https://tightknit.ai)'s open source repos. Static Astro site that auto-syncs the repo grid from `github.com/tightknitai` at build time.

## Stack

- **Astro 5** (static output, no SSR adapter)
- **Tailwind v4** via `@tailwindcss/vite`
- **TypeScript** (strict, via `astro/tsconfigs/strict`)
- **Cloudflare Workers** for hosting (Workers Static Assets, no adapter)

## Commands

```bash
npm run dev          # astro dev — http://localhost:4321
npm run build        # astro check + astro build → ./dist
npm run preview      # preview the static build
npm run deploy       # build + wrangler deploy
npm run wrangler:dev # wrangler local dev
npm run typecheck    # astro check only
npm run format       # prettier --write .
npm run format:check # prettier --check .
```

## Conventions

- **Format on commit** via lefthook + prettier (see `lefthook.yml`). Pre-push runs `astro check`.
- **Prettier** config in `.prettierrc` — single quotes, semi, trailing commas, 100-col, with `prettier-plugin-astro` + `prettier-plugin-tailwindcss`.
- **Node** pinned to 22 LTS via `.nvmrc`.
- **Featured repos** are hand-picked in `src/components/RepoGrid.astro` via the `FEATURED_NAMES` array; everything else from `tightknitai` renders sorted by stars.
- **GitHub fetch** at build time — set `GITHUB_TOKEN` to avoid the 60/hr unauthenticated limit. Fallback list lives in `src/lib/github.ts` so the build never breaks.

## Design system

Brutalist / neo-brutalist. Tokens in `src/styles/global.css` under `@theme`:

- Cream `#f3ede0` ground, ink `#0a0a0a` foreground
- Accents: electric yellow `#ffe600`, hot pink `#ff2d7b`, cyan `#00e0ff`
- Sharp corners (zero radius), 3px ink borders, hard 8px offset shadows
- Type: Space Grotesk (display + body), JetBrains Mono (labels, code)

## Structure

```
src/
├── pages/        # index.astro, 404.astro
├── layouts/      # Layout.astro (html shell, fonts, meta)
├── components/   # Nav, Hero, RepoGrid, RepoCard, Manifesto, Footer, Heart
├── lib/
│   └── github.ts # build-time GitHub fetcher + hardcoded fallback
└── styles/
    └── global.css
```
