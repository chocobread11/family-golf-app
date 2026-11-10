import { test, expect } from '@playwright/test';

test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

test('tapping Edit opens a neutral dialog and waits for an explicit field tap', async ({ page }) => {
  await page.goto('/');
  const edit = page.getByRole('button', { name: /^Edit match at/ }).first();
  const writes: string[] = [];
  page.on('request', request => {
    if (request.url().includes('/api/sync') && ['POST', 'PATCH', 'DELETE'].includes(request.method())) writes.push(request.method());
  });
  await edit.tap();
  const dialog = page.getByRole('dialog', { name: 'Edit match', exact: true });
  await expect(dialog).toBeFocused();
  await expect(dialog.getByLabel('Date and time', { exact: true })).not.toBeFocused();
  expect(await dialog.evaluate(node => node.scrollTop)).toBe(0);

  const name = dialog.getByLabel('Player 1 name', { exact: true });
  await name.tap();
  await expect(name).toBeFocused();
  await name.fill('Unsaved mobile edit');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).tap();
  await expect(dialog).not.toBeVisible();
  await expect(edit).toBeFocused();
  expect(writes).toEqual([]);
  await edit.tap();
  await expect(dialog).toBeFocused();
  await expect(dialog.getByLabel('Player 1 name', { exact: true })).not.toHaveValue('Unsaved mobile edit');
});

test('course and group dialogs wait for a field tap while keyboard navigation still works', async ({ page }) => {
  await page.goto('/setup');
  for (const [action, field] of [['Add course', 'Course name'], ['Add player group', 'Group name']]) {
    const trigger = page.getByRole('button', { name: action, exact: true });
    await trigger.tap();
    const dialog = page.getByRole('dialog', { name: action, exact: true });
    await expect(dialog).toBeFocused();
    const input = dialog.getByLabel(field, { exact: true });
    await expect(input).not.toBeFocused();
    await page.keyboard.press('Tab');
    await expect(input).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
});

test('destructive confirmations retain safe initial focus on Cancel', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: /^Delete match at/ }).first();
  await trigger.tap();
  const dialog = page.getByRole('alertdialog');
  const cancel = dialog.getByRole('button', { name: 'Cancel', exact: true });
  await expect(cancel).toBeFocused();
  await cancel.tap();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
