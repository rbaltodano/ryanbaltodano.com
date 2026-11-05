// Regenerate the share card: node scripts/generate_social_preview.mjs
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
const root = fileURLToPath(new URL('../', import.meta.url));
const tokens = await readFile(root + 'css/tokens.css', 'utf8');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html lang="en"><meta charset="utf-8"><style>
  ${tokens}
  *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);padding:64px 72px;font-family:var(--font-display)}
  .meta{font:20px var(--font-mono);color:var(--muted)}h1{font-weight:400;font-size:72px;letter-spacing:-2px;margin:54px 0 24px}
  p{font-size:30px;line-height:1.5;margin:0;max-width:900px}footer{border-top:1px solid var(--muted);padding-top:22px;margin-top:54px;font:20px var(--font-mono);color:var(--accent)}
  </style><div class="meta">PRODUCT DESIGN + FRONTEND ENGINEERING + APPLIED AI</div><h1>Ryan Baltodano</h1><p>Thoughtful interfaces.<br>Working software.</p><footer>Angrove &amp; inVectus &nbsp; / &nbsp; ryanbaltodano.com</footer></html>`);
  await page.screenshot({ path: root + 'assets/img/social-preview.jpg', type: 'jpeg', quality: 90 });
} finally { await browser.close(); }
