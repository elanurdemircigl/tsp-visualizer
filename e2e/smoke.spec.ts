import { expect, test, type Page } from '@playwright/test';

const pointCount = (page: Page) => page.getByTestId('point-count');
const result = (page: Page, id: string) => page.getByTestId(`result-${id}`);

test('tek algoritma Worker\'da çalışır; tablo ve grafik dolar', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await expect(pointCount(page)).toHaveText('50');
  await page.getByLabel('Hız').selectOption({ label: 'Sınırsız' });
  await page.getByRole('button', { name: 'Başlat' }).click();

  await expect(result(page, '2opt')).toContainText('Bitti');
  await expect(result(page, '2opt')).toContainText(/\d+,\d{2} km/);
  await expect(result(page, '2opt')).toContainText(/\d+ ms/);
  await expect(page.locator('.recharts-line')).toHaveCount(1);
  // 2-opt sınırsız hızda tek dilimde biter; trace sayesinde eğri yine de birden çok noktadan oluşur
  expect((await page.locator('.recharts-line-curve').getAttribute('d'))!.split('L').length).toBeGreaterThan(2);
  expect(errors).toEqual([]);
});

test('haritaya tıklamak nokta ekler, noktaya tıklamak siler', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Temizle' }).click();
  await expect(pointCount(page)).toHaveText('0');

  const map = page.locator('.leaflet-container');
  await map.click({ position: { x: 300, y: 300 } });
  await map.click({ position: { x: 500, y: 250 } });
  await expect(pointCount(page)).toHaveText('2');

  await map.click({ position: { x: 300, y: 300 } }); // mevcut noktanın üstü
  await expect(pointCount(page)).toHaveText('1');
});

test('duraklat / adım / devam', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Algoritma').selectOption({ label: 'Genetik Algoritma' });
  await page.getByLabel('Hız').selectOption({ label: '5 adım/sn' });

  // Adım: duraklatılmış başlatır ve ilk adımı gösterir
  await page.getByRole('button', { name: 'Adım' }).click();
  await expect(result(page, 'ga')).toContainText('Duraklatıldı');
  const iteration = result(page, 'ga').locator('td').last();
  await expect(iteration).toHaveText('0');
  await page.getByRole('button', { name: 'Adım' }).click();
  await expect(iteration).toHaveText('1');

  await page.getByRole('button', { name: 'Devam' }).click();
  await expect(result(page, 'ga')).toContainText('Çalışıyor');
  await page.getByRole('button', { name: 'Duraklat' }).click();
  await expect(result(page, 'ga')).toContainText('Duraklatıldı');

  await page.getByRole('button', { name: 'Sıfırla' }).click();
  await expect(page.getByText('Henüz çalıştırılmadı.')).toBeVisible();
});

test('yarış modu 4 algoritmayı ayrı haritalarda bitirir', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: 'Yarış' }).click();
  await expect(page.locator('.leaflet-container')).toHaveCount(4);
  await page.getByLabel('Hız').selectOption({ label: 'Sınırsız' });
  await page.getByRole('button', { name: 'Başlat' }).click();

  for (const id of ['nn', '2opt', 'sa', 'ga']) {
    await expect(result(page, id)).toContainText('Bitti', { timeout: 15_000 });
  }
  await expect(page.getByText('en iyi', { exact: true })).toHaveCount(1);
  await expect(page.locator('.recharts-line')).toHaveCount(4);
  await page.screenshot({ path: 'e2e/screenshots/race.png' });
});
