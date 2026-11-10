import { test, expect } from '@playwright/test';
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { selectOption } from './helpers/select-option';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5V0AAAAASUVORK5CYII=', 'base64');
const photo = { name: 'test-round.png', mimeType: 'image/png', buffer: png };

test('play, setup, score, and history share the main page width', async ({ page, request }) => {
  const data = await (await request.get('/api/sync')).json();
  const game = data.games[0];
  expect(game).toBeTruthy();
  for (const width of [320, 390, 640, 768, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const mainWidth = await page.getByRole('main').evaluate(node => node.getBoundingClientRect().width);
    const history = page.getByRole('region', { name: 'History and saved templates' });
    await expect(history).toBeVisible();
    expect(await history.evaluate(node => node.getBoundingClientRect().width)).toBe(mainWidth - (width >= 768 ? 48 : width >= 640 ? 32 : 16));
    for (const url of ['/setup', '/play', `/score/${game.id}`]) {
      if (url === '/play') {
        await selectOption(page, 'Player Group', 1);
        await page.getByRole('button', { name: 'Start Round', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Hole 1', exact: true })).toBeVisible();
      } else { await page.goto(url); }
      await expect.poll(() => page.getByRole('main').evaluate(node => node.getBoundingClientRect().width)).toBe(mainWidth);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.evaluate(() => localStorage.clear());
  }
});

test('history adds, replaces, removes, and deletes real R2 photos without deleting shared files', async ({ page, request }) => {
  test.skip(!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY, 'R2 credentials are required for the live storage check.');
  test.setTimeout(90_000);
  const storage = new S3Client({ region: 'auto', endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! } });
  const base = new URL(process.env.R2_PUBLIC_DOMAIN || process.env.R2_PUBLIC_URL!);
  async function exists(url: string) {
    const key = decodeURIComponent(new URL(url).pathname.slice(base.pathname.replace(/\/$/, '').length + 1));
    try { await storage.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key })); return true; }
    catch (error) { if ((error as { $metadata?: { httpStatusCode: number } }).$metadata?.httpStatusCode === 404) return false; throw error; }
  }
  const data = await (await request.get('/api/sync')).json();
  const id = crypto.randomUUID();
  const sharedId = crypto.randomUUID();
  const record = { id, entity: 'game', date: new Date().toISOString(), courseId: data.courses[0].id, coursePars: data.courses[0].pars, totalHoles: 9, startingLoop: 'Front', players: ['Photo test golfer'], scoresJson: { '1': [4] } };
  expect((await request.post('/api/sync', { data: record })).status()).toBe(201);
  async function saved() { return (await (await request.get(`/api/sync?id=${id}`)).json()).game; }
  async function editor() {
    const row = page.getByRole('listitem').filter({ has: page.locator(`a[href="/score/${id}"]`) });
    await row.getByRole('button', { name: /^Edit match at/ }).click();
    return page.getByRole('dialog');
  }
  async function savePhoto() {
    await page.getByRole('dialog').getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 20_000 });
    return (await saved()).imageUrl as string;
  }
  try {
    const invalid = await request.patch('/api/sync', { multipart: { record: JSON.stringify(record), photo: { name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('invalid') } } });
    expect(invalid.status()).toBe(400);
    expect((await saved()).imageUrl).toBeNull();
    await page.goto('/');
    let dialog = await editor();
    await dialog.getByLabel('Choose round photo').setInputFiles(photo);
    await expect(dialog.getByRole('img', { name: 'Round photo preview' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    expect((await saved()).imageUrl).toBeNull();
    dialog = await editor();
    await dialog.getByLabel('Choose round photo').setInputFiles(photo);
    const first = await savePhoto();
    expect(await exists(first)).toBe(true);
    await expect.poll(() => page.locator(`a[href="/score/${id}"] img`).evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(1);
    expect((await request.post('/api/sync', { data: { ...record, id: sharedId, imageUrl: first } })).status()).toBe(201);
    dialog = await editor();
    await dialog.getByLabel('Choose round photo').setInputFiles(photo);
    const second = await savePhoto();
    expect(second).not.toBe(first);
    expect(await exists(second)).toBe(true);
    expect(await exists(first)).toBe(true);
    expect((await request.delete(`/api/sync?entity=game&id=${sharedId}`)).status()).toBe(200);
    expect(await exists(first)).toBe(false);
    dialog = await editor();
    await dialog.getByLabel('Choose round photo').setInputFiles(photo);
    const third = await savePhoto();
    expect(await exists(second)).toBe(false);
    expect(await exists(third)).toBe(true);
    dialog = await editor();
    await dialog.getByRole('button', { name: 'Remove photo', exact: true }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Remove photo', exact: true }).click();
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    expect((await saved()).imageUrl).toBe(third);
    expect(await exists(third)).toBe(true);
    dialog = await editor();
    await dialog.getByRole('button', { name: 'Remove photo', exact: true }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Remove photo', exact: true }).click();
    await savePhoto();
    expect((await saved()).imageUrl).toBeNull();
    expect(await exists(third)).toBe(false);
    dialog = await editor();
    await dialog.getByLabel('Choose round photo').setInputFiles(photo);
    const fourth = await savePhoto();
    const row = page.getByRole('listitem').filter({ has: page.locator(`a[href="/score/${id}"]`) });
    await row.getByRole('button', { name: /^Delete match/ }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByRole('alertdialog')).not.toBeVisible();
    await expect(row).not.toBeVisible();
    expect(await exists(fourth)).toBe(false);
  } finally {
    await request.delete(`/api/sync?entity=game&id=${sharedId}`);
    await request.delete(`/api/sync?entity=game&id=${id}`);
    await request.delete('/api/upload');
    storage.destroy();
  }
});
