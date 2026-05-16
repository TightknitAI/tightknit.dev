import type { APIRoute } from 'astro';
import { formatRelativeTime, loadRepos, type Repo } from '../lib/github';

const FEATURED_NAMES = ['block-kitchen', 'slack-hono', 'slack-block-kit-validator'];

function repoLine(repo: Repo): string {
  const meta = [
    repo.language,
    repo.license,
    repo.stars >= 10 ? `★ ${repo.stars}` : null,
    `updated ${formatRelativeTime(repo.pushedAt)}`,
  ]
    .filter(Boolean)
    .join(' · ');
  const desc = repo.description ? `: ${repo.description}` : '';
  return `- [${repo.name}](${repo.url})${desc} _(${meta})_`;
}

export const GET: APIRoute = async () => {
  const { repos } = await loadRepos('tightknitai');
  const featured = FEATURED_NAMES.map((name) => repos.find((r) => r.name === name)).filter(
    (r): r is Repo => r !== undefined,
  );
  const featuredSet = new Set(featured.map((r) => r.name));
  const rest = repos.filter((r) => !featuredSet.has(r.name));

  const sections: string[] = [
    '# tightknit.dev',
    '',
    '> Tools for Slack + agents. For teams building on Slack · open source.',
    '',
    'Open source libraries, agents, and developer tools shipped by [tightknit.ai](https://tightknit.ai). Built in TypeScript. Made to be forked.',
    '',
    '## The stack',
    '',
    'Block Kit tooling, app frameworks, and validators we use to ship Slack apps faster. Open sourced on [github.com/tightknitai](https://github.com/tightknitai).',
  ];

  if (featured.length > 0) {
    sections.push('', '### Featured', '', featured.map(repoLine).join('\n'));
  }

  if (rest.length > 0) {
    sections.push('', '### The rest', '', rest.map(repoLine).join('\n'));
  }

  sections.push(
    '',
    '## Principles',
    '',
    "**01 · Made to be forked.** Every repo is MIT (or compatible). Lift it, mod it, ship it. The point is that you don't have to ask.",
    '',
    '**02 · TypeScript first.** Strict mode on, types as docs, end-to-end inference where possible. Runtimes: Node, Bun, Cloudflare Workers.',
    '',
    '**03 · From the Tightknit team.** Built by the team behind Tightknit, the #1 community platform on Slack. These are the libraries and patterns we reach for when shipping Slack apps, open sourced for yours.',
    '',
    '## Links',
    '',
    '- GitHub org: https://github.com/tightknitai',
    '- Company: https://tightknit.ai',
    "- This site's source: https://github.com/TightknitAI/tightknit.dev",
    '',
  );

  return new Response(sections.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
