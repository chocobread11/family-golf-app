import { test, expect, type APIRequestContext } from '@playwright/test';
import { selectOption } from './helpers/select-option';

const prefix = `Test ${Date.now()}`;
const cleanup: { entity: string; id: string }[] = [];

async function create(request: APIRequestContext, entity: string, record: object) {
  const res = await request.post('/api/sync', { data: { entity, ...record } });
  expect(res.status(), await res.text()).toBe(201);
  const item = (await res.json())[entity];
  cleanup.unshift({ entity, id: item.id });
  return item;
}

test.afterAll(async ({ request }) => {
  // Matches must be removed before their course. Only records created by this suite are deleted.
  for (const record of cleanup.sort((a, b) => Number(b.entity === 'game') - Number(a.entity === 'game'))) {
    await request.delete(`/api/sync?entity=${record.entity}&id=${record.id}`);
  }
});

test('database CRUD validates input, preserves course snapshots, and protects linked courses', async ({ request }) => {
  const course = await create(request, 'course', { name: `${prefix} course`, pars: Array(18).fill(4) });
  const group = await create(request, 'group', { name: `${prefix} group`, players: ['One', 'Two'] });
  let res = await request.patch('/api/sync', { data: { entity: 'group', id: group.id, name: `${prefix} edited group`, players: ['One', 'Three'] } });
  expect(res.status()).toBe(200);
  expect((await res.json()).group.players).toEqual(['One', 'Three']);
  const payload = { id: crypto.randomUUID(), date: new Date().toISOString(), courseId: course.id, totalHoles: 9, startingLoop: 'Back', players: ['One', 'Two'], scoresJson: { '10': [4, 5] }, coursePars: course.pars };
  const game = await create(request, 'game', payload);
  res = await request.post('/api/sync', { data: { entity: 'game', ...payload } });
  expect(res.status()).toBe(201);
  expect((await res.json()).game.id).toBe(game.id);
  res = await request.patch('/api/sync', { data: { entity: 'course', id: course.id, name: `${prefix} edited course`, pars: Array(18).fill(5) } });
  expect(res.status()).toBe(200);
  res = await request.get(`/api/sync?id=${game.id}`);
  const saved = (await res.json()).game;
  expect(saved.coursePars).toEqual(Array(18).fill(4));
  expect(saved.startingLoop).toBe('Back');
  expect(saved.course.name).toBe(`${prefix} edited course`);
  res = await request.patch('/api/sync', { data: { ...payload, entity: 'game', id: game.id, players: ['One edited', 'Two'], scoresJson: { '10': [3, 5] } } });
  expect(res.status()).toBe(200);
  expect((await res.json()).game.scoresJson['10']).toEqual([3, 5]);
  res = await request.delete(`/api/sync?entity=course&id=${course.id}`);
  expect(res.status()).toBe(409);
  for (const invalid of [
    { entity: 'course', name: 'invalid', pars: [4] },
    { entity: 'group', name: 'invalid', players: ['Same', 'Same'] },
    { ...payload, entity: 'game', scoresJson: { '1': [4, 5] } },
    { ...payload, entity: 'game', scoresJson: { '10': [-1, 5] } },
    { ...payload, entity: 'game', scoresJson: { '10': [4] } },
    { ...payload, entity: 'game', imageUrl: 'javascript:alert(1)' },
  ]) {
    res = await request.post('/api/sync', { data: invalid });
    expect(res.status(), JSON.stringify(invalid)).toBe(400);
  }
  res = await request.post('/api/sync', { data: { entity: 'course', name: `${prefix} edited course`, pars: Array(18).fill(4) } });
  expect(res.status()).toBe(409);
  res = await request.delete(`/api/sync?entity=game&id=${game.id}`);
  expect(res.status()).toBe(200);
  res = await request.patch('/api/sync', { data: { entity: 'game', ...payload } });
  expect(res.status()).toBe(404);
  res = await request.get(`/api/sync?id=${game.id}`);
  expect(res.status()).toBe(404);
  res = await request.delete(`/api/sync?entity=course&id=${course.id}`);
  expect(res.status()).toBe(200);
  res = await request.delete(`/api/sync?entity=group&id=${group.id}`);
  expect(res.status()).toBe(200);
});

test('history supports course and group editing, deletion confirmation, and mobile sizing', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Saved Matches' })).toBeVisible();
  await page.getByRole('radio', { name: 'courses', exact: true }).click();
  await page.getByRole('button', { name: 'Add course', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Course name').fill(`${prefix} UI course`);
  await expect(dialog.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  for (let i = 0; i < 3; i++) await dialog.getByRole('button', { name: 'Add par 4', exact: true }).click();
  await expect(dialog.getByText('Add 6 more holes to save a 9-hole course.')).toBeVisible();
  for (let i = 0; i < 15; i++) await dialog.getByRole('button', { name: 'Add par 4', exact: true }).click();
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(dialog).not.toBeVisible();
  let data = await (await request.get('/api/sync')).json();
  const course = data.courses.find((c: { name: string }) => c.name === `${prefix} UI course`);
  cleanup.push({ entity: 'course', id: course.id });
  await page.getByRole('button', { name: `Edit ${prefix} UI course`, exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Course name').fill(`${prefix} UI course edited`);
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(dialog).not.toBeVisible();
  const deleteCourse = page.getByRole('button', { name: `Delete ${prefix} UI course edited`, exact: true });
  await deleteCourse.click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(deleteCourse).toBeFocused();
  await deleteCourse.click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(deleteCourse).not.toBeVisible();
  await page.getByRole('radio', { name: 'groups', exact: true }).click();
  await page.getByRole('button', { name: 'Add group', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Group name').fill(`${prefix} UI group`);
  await expect(dialog.getByLabel('Player 1 name', { exact: true })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Add player', exact: true }).click();
  await dialog.getByLabel('Player 1 name', { exact: true }).fill('Player A');
  await dialog.getByRole('button', { name: 'Add player', exact: true }).click();
  await dialog.getByLabel('Player 2 name', { exact: true }).fill('Player B');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(dialog).not.toBeVisible();
  data = await (await request.get('/api/sync')).json();
  const group = data.groups.find((g: { name: string }) => g.name === `${prefix} UI group`);
  cleanup.push({ entity: 'group', id: group.id });
  await page.getByRole('button', { name: `Edit ${prefix} UI group`, exact: true }).click();
  await page.getByRole('dialog').getByLabel('Player 2 name', { exact: true }).fill('Player C');
  await page.getByRole('dialog').getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Player A, Player C', { exact: true })).toBeVisible();
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.getByRole('button', { name: `Delete ${prefix} UI group`, exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('button', { name: `Edit ${prefix} UI group`, exact: true })).not.toBeVisible();
});

test('a round survives a failed save, can be edited, reloads from the database, and is deleted', async ({ page, request }) => {
  await page.goto('/setup');
  await expect(page.getByRole('button', { name: 'Start Round', exact: true })).toBeDisabled();
  const templates = await (await request.get('/api/sync')).json();
  const flight = templates.groups.find((group: { name: string }) => group.name === 'Full Flight');
  await selectOption(page, 'Player Group', flight.name);
  await page.getByRole('button', { name: 'Start Round', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hole 1', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '4', exact: true }).click();
  await page.getByRole('button', { name: "Next player's score (space)" }).click();
  await page.getByRole('button', { name: '5', exact: true }).click();
  await page.getByRole('button', { name: 'Next hole', exact: true }).click();
  await page.getByRole('button', { name: 'Previous hole', exact: true }).click();
  await expect(page.getByText('4 5 0 0', { exact: true })).toBeVisible();
  for (let i = 0; i < 8; i++) await page.getByRole('button', { name: 'Next hole', exact: true }).click();
  await page.route('**/api/sync', async route => {
    if (route.request().method() === 'POST') await route.fulfill({ status: 503, json: { error: 'Test database unavailable. Try again.' } });
    else await route.continue();
  });
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Test database unavailable' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('family-golf-local-storage')!).state.activeGame)).not.toBeNull();
  await page.unroute('**/api/sync');
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await page.waitForURL('**/score/**');
  const id = page.url().split('/').pop()!;
  cleanup.unshift({ entity: 'game', id });
  await expect(page.getByRole('heading', { name: 'Score Table' })).toBeVisible();
  // Clear local storage to verify direct navigation reads the database.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('button', { name: 'Edit', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const dimensions = await dialog.evaluate(node => ({ width: node.clientWidth, scrollWidth: node.scrollWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
  const scoreRegion = dialog.getByRole('region', { name: 'Editable match scores' });
  expect(await scoreRegion.evaluate(node => { node.scrollLeft = node.scrollWidth; return node.scrollLeft; })).toBeGreaterThan(0);
  await dialog.getByLabel('Player 1 name', { exact: true }).fill('Edited golfer');
  await dialog.getByLabel('Player 1, hole 1', { exact: true }).fill('3');
  await dialog.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('rowheader', { name: 'Edited golfer', exact: true })).toBeVisible();
  const res = await request.get(`/api/sync?id=${id}`);
  const saved = (await res.json()).game;
  expect(saved.players[0]).toBe('Edited golfer');
  expect(saved.scoresJson['1'][0]).toBe(3);
  await page.goto('/');
  const historyRow = page.getByRole('listitem').filter({ has: page.locator(`a[href="/score/${id}"]`) });
  await historyRow.getByRole('button', { name: /^Edit match/ }).click();
  await page.getByRole('dialog').getByLabel('Player 1, hole 1', { exact: true }).fill('2');
  await page.getByRole('dialog').getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect((await (await request.get(`/api/sync?id=${id}`)).json()).game.scoresJson['1'][0]).toBe(2);
  await historyRow.getByRole('button', { name: /^Delete match/ }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('alertdialog')).not.toBeVisible();
  await expect(historyRow).not.toBeVisible();
  expect((await request.get(`/api/sync?id=${id}`)).status()).toBe(404);
});
