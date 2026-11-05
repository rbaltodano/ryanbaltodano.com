// Start the static server first. Run: node scripts/check_site.mjs [http://localhost:8027]
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
const base = process.argv[2] || 'http://localhost:8027';
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
try {
  for (const width of [1440, 768, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [], failed = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) failed.push(response.url()); });
    for (const route of ['/', '/invectus.html']) {
      await page.goto(base + route, { waitUntil: 'networkidle' });
      await page.evaluate(() => Promise.all([...document.images].map(image => {
        image.loading = 'eager'; return image.decode().catch(() => {});
      })));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${route}: overflow at ${width}`);
      assert.deepEqual(await page.locator('img').evaluateAll(images => images.filter(image => !image.naturalWidth).map(image => image.src)), []);
      assert.deepEqual(await page.locator('a[href^="#"]').evaluateAll(links => links.filter(link => !document.getElementById(link.hash.slice(1))).map(link => link.hash)), []);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('link[rel="canonical"]').count(), 1);
      await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.forEach(node => JSON.parse(node.textContent)));
      const image = page.locator(route === '/' ? '#invectus .film--lead img' : '.case__figure img');
      await image.scrollIntoViewIfNeeded(); await image.focus(); await page.keyboard.press('Enter');
      await page.locator('[role="dialog"]').waitFor();
      assert.equal(await page.locator('[role="dialog"] .lightbox__close').count(), 1);
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]')), true);
      await page.keyboard.press('Escape'); await page.locator('[role="dialog"]').waitFor({ state: 'detached' });
      assert.equal(await image.evaluate(node => node === document.activeElement), true, 'Focus returns to the invoking image');
      if (route === '/') {
        const video = page.locator('video').first(); await video.scrollIntoViewIfNeeded();
        assert.equal(await video.evaluate(node => node.paused), true, 'Reduced motion leaves video paused');
        const playback = page.locator('.film__playback').first();
        await playback.focus(); await page.keyboard.press('Enter');
        await page.waitForFunction(() => !document.querySelector('video').paused);
        await page.keyboard.press('Enter');
        assert.equal(await video.evaluate(node => node.paused), true, 'Keyboard can pause the video');
      } else {
        const summary = page.locator('details summary').first(); await summary.focus(); await page.keyboard.press('Enter');
        assert.equal(await summary.evaluate(node => node.parentElement.open), true);
      }
    }
    assert.deepEqual(errors, []); assert.deepEqual(failed, []);
    console.log(`PASS ${width}px: both pages, images, anchors, metadata, dialog focus, playback, disclosures`);
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  for (const route of ['/', '/invectus.html']) {
    await page.goto(base + route);
    assert.equal(await page.locator('h1').isVisible(), true);
    if (route === '/') assert.equal(await page.locator('video').first().getAttribute('controls'), '');
    else { await page.locator('summary').first().click(); assert.equal(await page.locator('details').first().getAttribute('open'), ''); }
  }
  console.log('PASS no JavaScript: readable pages, native video controls, working disclosures');
} finally { await browser.close(); }
