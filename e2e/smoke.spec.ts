import { expect, test } from '@playwright/test';

test('tek algoritma Worker\'da çalışır ve sonucu gösterir', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await expect(page.getByText('50 nokta')).toBeVisible();
  await page.getByRole('button', { name: 'Çalıştır' }).click();

  // done olayı geldiğinde sonuçta süre (ms) görünür
  await expect(page.getByText(/2opt: [\d.]+ km \(\d+ ms\)/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('haritaya tıklamak nokta ekler, noktaya tıklamak siler', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Temizle' }).click();
  await expect(page.getByText('0 nokta')).toBeVisible();

  const map = page.locator('.leaflet-container');
  await map.click({ position: { x: 300, y: 300 } });
  await map.click({ position: { x: 500, y: 250 } });
  await expect(page.getByText('2 nokta')).toBeVisible();

  await map.click({ position: { x: 300, y: 300 } }); // mevcut noktanın üstü
  await expect(page.getByText('1 nokta')).toBeVisible();
});

test('yarış modu 4 algoritmayı ayrı haritalarda bitirir', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Yarış').check();
  await expect(page.locator('.leaflet-container')).toHaveCount(4);
  await page.getByRole('button', { name: 'Çalıştır' }).click();

  for (const id of ['nn', '2opt', 'sa', 'ga']) {
    await expect(page.getByText(new RegExp(`${id}: [\\d.]+ km \\(\\d+ ms\\)`))).toBeVisible({ timeout: 15_000 });
  }
  await page.screenshot({ path: 'e2e/screenshots/race.png' });
});
