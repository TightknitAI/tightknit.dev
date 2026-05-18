export interface Repo {
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  homepage: string | null;
  stars: number;
  forks: number;
  language: string | null;
  license: string | null;
  topics: string[];
  pushedAt: string;
  archived: boolean;
  fork: boolean;
}

interface GitHubRepoApi {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  license: { spdx_id: string | null; name: string | null } | null;
  topics: string[];
  pushed_at: string;
  archived: boolean;
  fork: boolean;
  private: boolean;
  visibility: string;
}

const GITHUB_API = 'https://api.github.com';

const TOPIC_PRIORITY: readonly string[] = [
  'slack',
  'slack-block-kit',
  'block-kit',
  'slack-framework',
  'template',
  'storybook-addon',
  'validator',
  'validation',
  'block-kit-builder',
  'wysiwyg',
  'visual-builder',
  'landing-page',
  'drag-and-drop',
  'react',
  'hono',
  'storybook',
  'astro',
  'tailwindcss',
  'json-schema',
  'vite',
  'mdx',
  'ajv',
  'cloudflare-workers',
  'nodejs',
  'slack-edge',
  'typescript',
];

function sortTopics(topics: readonly string[]): string[] {
  return [...topics].sort((a, b) => {
    const aIdx = TOPIC_PRIORITY.indexOf(a);
    const bIdx = TOPIC_PRIORITY.indexOf(b);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.localeCompare(b);
  });
}

export async function getOrgRepos(org: string): Promise<Repo[]> {
  const token = import.meta.env.GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'tightknit.dev-build',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const all: GitHubRepoApi[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `${GITHUB_API}/orgs/${org}/repos?per_page=100&type=public&sort=updated&page=${page}`,
      { headers },
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GitHub API ${res.status}: ${body.slice(0, 200)}`);
    }
    const batch = (await res.json()) as GitHubRepoApi[];
    all.push(...batch);
    if (batch.length < 100) break;
    page += 1;
    if (page > 10) break;
  }

  return all
    .filter((r) => !r.fork && !r.archived && r.visibility === 'public')
    .map(
      (r): Repo => ({
        name: r.name,
        fullName: r.full_name,
        description: r.description ? r.description.replace(/\s*—\s*/g, ', ') : null,
        url: r.html_url,
        homepage: r.homepage,
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language,
        license:
          r.license?.spdx_id && r.license.spdx_id !== 'NOASSERTION' ? r.license.spdx_id : null,
        topics: sortTopics(r.topics ?? []),
        pushedAt: r.pushed_at,
        archived: r.archived,
        fork: r.fork,
      }),
    )
    .sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name));
}

const FALLBACK_REPOS: Repo[] = [
  {
    name: 'block-kitchen',
    fullName: 'tightknitai/block-kitchen',
    description: 'Compose Slack Block Kit messages with a React-style API.',
    url: 'https://github.com/tightknitai/block-kitchen',
    homepage: null,
    stars: 0,
    forks: 0,
    language: 'TypeScript',
    license: 'MIT',
    topics: ['slack', 'block-kit'],
    pushedAt: new Date().toISOString(),
    archived: false,
    fork: false,
  },
  {
    name: 'slack-block-kit-validator',
    fullName: 'tightknitai/slack-block-kit-validator',
    description: 'Validate Slack Block Kit payloads before you send them.',
    url: 'https://github.com/tightknitai/slack-block-kit-validator',
    homepage: null,
    stars: 0,
    forks: 0,
    language: 'TypeScript',
    license: 'MIT',
    topics: ['slack', 'block-kit', 'validation'],
    pushedAt: new Date().toISOString(),
    archived: false,
    fork: false,
  },
  {
    name: 'slack-hono',
    fullName: 'tightknitai/slack-hono',
    description: 'Build Slack apps on Hono. Works on Workers, Bun, Node.',
    url: 'https://github.com/tightknitai/slack-hono',
    homepage: null,
    stars: 0,
    forks: 0,
    language: 'TypeScript',
    license: 'MIT',
    topics: ['slack', 'hono', 'cloudflare-workers'],
    pushedAt: new Date().toISOString(),
    archived: false,
    fork: false,
  },
];

const EXCLUDED_REPOS = new Set(['tightknit-tdx-demo', 'homebrew-tap']);

// Repos to surface even when the GitHub org doesn't expose them (yet).
// If the live API later returns one of these, the live entry wins.
// IMPORTANT: only list PUBLIC repos here — private repos render cards that 404 for visitors.
const MANUAL_REPOS: Repo[] = [
  {
    name: 'slack-hono-template',
    fullName: 'tightknitai/slack-hono-template',
    description: 'Starter template for shipping a Slack app with slack-hono on Cloudflare Workers.',
    url: 'https://github.com/tightknitai/slack-hono-template',
    homepage: null,
    stars: 0,
    forks: 0,
    language: 'TypeScript',
    license: 'MIT',
    topics: ['slack', 'hono', 'cloudflare-workers', 'template'],
    pushedAt: new Date().toISOString(),
    archived: false,
    fork: false,
  },
];

function mergeManual(live: Repo[]): Repo[] {
  const liveNames = new Set(live.map((r) => r.name));
  const additions = MANUAL_REPOS.filter((r) => !liveNames.has(r.name));
  return [...live, ...additions]
    .map((r) => ({ ...r, topics: sortTopics(r.topics) }))
    .sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name));
}

export async function loadRepos(org: string): Promise<{ repos: Repo[]; usedFallback: boolean }> {
  try {
    const live = (await getOrgRepos(org)).filter((r) => !EXCLUDED_REPOS.has(r.name));
    if (live.length === 0) return { repos: mergeManual(FALLBACK_REPOS), usedFallback: true };
    return { repos: mergeManual(live), usedFallback: false };
  } catch (err) {
    console.warn(`[github] failed to fetch ${org} repos, using fallback:`, err);
    return { repos: mergeManual(FALLBACK_REPOS), usedFallback: true };
  }
}

// Locale-aware, calendar-correct relative time. `narrow` keeps output compact ("5d ago", "5mo ago").
const RELATIVE_TIME = new Intl.RelativeTimeFormat('en', {
  style: 'narrow',
  numeric: 'auto',
});

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  if (diffMs < 0) return 'just now';

  const days = Math.floor(diffMs / 86_400_000);
  if (days < 1) return 'today';
  if (days < 30) return RELATIVE_TIME.format(-days, 'day');

  // Calendar-aware month diff — avoids the floor-by-30 drift the old impl had.
  const months =
    (now.getFullYear() - then.getFullYear()) * 12 +
    (now.getMonth() - then.getMonth()) -
    (now.getDate() < then.getDate() ? 1 : 0);
  if (months < 12) return RELATIVE_TIME.format(-months, 'month');

  const years = Math.floor(months / 12);
  return RELATIVE_TIME.format(-years, 'year');
}
