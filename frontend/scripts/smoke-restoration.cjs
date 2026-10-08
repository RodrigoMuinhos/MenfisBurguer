const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROME_PATH ||
      `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1243/chrome-win64/chrome.exe`,
  });
  try {
    const base = process.env.SMOKE_BASE_URL || 'https://menfisburguer.vercel.app';
    for (const path of ['/', '/?kiosk=1']) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto(base + path, { waitUntil: 'domcontentloaded' });
      assert.equal(response.status(), 200);
      const logo = page.getByRole('button', { name: "Menfi's Burger", exact: true });
      await logo.waitFor();
      if (path.includes('kiosk')) {
        await page.getByText('Somente retirada', { exact: true }).waitFor();
        console.log('Kiosk: modo retirada confirmado');
      } else {
        await logo.click({ clickCount: 3, delay: 90 });
        await page.getByRole('dialog', { name: "QR Code Menfi's" }).waitFor();
        console.log('Delivery: atalho do QR Code confirmado');
      }
      assert.equal(await page.locator('img[src*="/event/"]').count(), 0);
      assert.deepEqual(errors, []);
      console.log(`${path}: HTTP 200, sem erros JavaScript ou imagens do evento`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
