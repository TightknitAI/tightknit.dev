/**
 * Captures a viewport screenshot of each live demo and writes it to
 * `src/assets/demos/<repo-name>.png`. The filename matches the repo `name`
 * field so `RepoCard.astro` can resolve the image by repo name.
 *
 * Run manually after a demo's UI changes:
 *
 *     npm run capture:demos
 *
 * Keep TARGETS in sync with DEMO_URLS in src/lib/github.ts.
 */
import { chromium, type Browser } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface Target {
  /** Matches the GitHub repo name. The screenshot is saved as `${name}.png`. */
  name: string;
  url: string;
  /**
   * Optional CSS selector to wait for before screenshotting — useful for demos
   * where the canvas mounts after a network request.
   */
  waitFor?: string;
}

const TARGETS: Target[] = [
  { name: 'block-kitchen', url: 'https://block-kitchen.tightknit.dev' },
  { name: 'slack-block-kit-validator', url: 'https://block-kit-validator.tightknit.dev' },
  { name: 'storybook-addon-slack-block-kit', url: 'https://block-kit-storybook.tightknit.dev' },
];

const VIEWPORT = { width: 1600, height: 900 } as const;
const DEVICE_SCALE_FACTOR = 2; // retina-quality output, ~3200x1800 PNG

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../src/assets/demos');

async function capture(browser: Browser, target: Target): Promise<void> {
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    colorScheme: 'light',
  });
  const page = await ctx.newPage();
  try {
    console.log(`→ ${target.name}  ${target.url}`);
    await page.goto(target.url, { waitUntil: 'networkidle', timeout: 30_000 });
    if (target.waitFor) await page.waitForSelector(target.waitFor, { timeout: 15_000 });
    // Settle fonts + late paints
    await page.waitForTimeout(1200);
    const out = resolve(OUT_DIR, `${target.name}.png`);
    await page.screenshot({ path: out, fullPage: false, type: 'png' });
    console.log(`   ✓ ${out}`);
  } finally {
    await ctx.close();
  }
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  // Optional per-host pin: pass `--host-rules="MAP host.example 1.2.3.4"` to
  // bypass the system resolver when a stale negative cache is in the way.
  const hostRulesArg = process.argv.find((a) => a.startsWith('--host-rules='));
  const launchArgs: string[] = ['--disable-features=AsyncDns,UseDnsHttpsSvcb'];
  if (hostRulesArg)
    launchArgs.push(`--host-resolver-rules=${hostRulesArg.split('=').slice(1).join('=')}`);

  const browser = await chromium.launch({ args: launchArgs });
  const results: { name: string; ok: boolean; error?: string }[] = [];
  try {
    for (const t of TARGETS) {
      try {
        await capture(browser, t);
        results.push({ name: t.name, ok: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message.split('\n')[0] : String(err);
        console.error(`   ✗ ${t.name}: ${msg}`);
        results.push({ name: t.name, ok: false, error: msg });
      }
    }
  } finally {
    await browser.close();
  }
  const ok = results.filter((r) => r.ok).length;
  console.log(`\n${ok}/${results.length} captured. Output: ${OUT_DIR}`);
  if (ok < results.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
