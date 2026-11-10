import { test, expect } from '@playwright/test';

test('health probes receive a fresh response and support HEAD without a body', async ({ request }) => {
  const first = await request.get('/api/health');
  expect(first.status()).toBe(200);
  expect(first.headers()['cache-control']).toBe('no-store');
  const firstBody = await first.json();
  expect(firstBody.status).toBe('ok');
  expect(Number.isNaN(Date.parse(firstBody.timestamp))).toBe(false);

  await expect.poll(async () => {
    const response = await request.get('/api/health');
    return (await response.json()).timestamp;
  }).not.toBe(firstBody.timestamp);

  const head = await request.head('/api/health');
  expect(head.status()).toBe(200);
  expect(head.headers()['cache-control']).toBe('no-store');
  expect(await head.text()).toBe('');
  expect((await request.post('/api/health')).status()).toBe(405);
});
