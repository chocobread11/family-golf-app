import { test, expect } from '@playwright/test';

test('course par buttons give feedback, allow undo, and require 9 or 18 holes', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/setup');
  await page.getByRole('button', { name: 'Add course', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Add course' });
  const save = dialog.getByRole('button', { name: 'Save changes', exact: true });
  await expect(save).toBeDisabled();
  await dialog.getByRole('button', { name: 'Add par 3', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('Hole 1 set to par 3');
  await dialog.getByRole('button', { name: 'Add par 5', exact: true }).click();
  await expect(dialog.getByText('2/18 holes · Total par 8', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Undo last hole' }).click();
  await expect(dialog.getByRole('status')).toContainText('Hole 2 removed');
  for (let i = 0; i < 8; i++) await dialog.getByRole('button', { name: 'Add par 4', exact: true }).click();
  await expect(save).toBeEnabled();
  await expect(dialog.getByRole('status')).toContainText('9 holes ready');
  for (let i = 0; i < 9; i++) await dialog.getByRole('button', { name: 'Add par 4', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Add par 4', exact: true })).toBeDisabled();
  await expect(dialog.getByRole('status')).toContainText('All 18 holes are ready');
  await expect(save).toBeEnabled();
  await dialog.getByRole('button', { name: 'Undo last hole' }).click();
  await expect(save).toBeDisabled();
  await dialog.getByRole('button', { name: 'Reset pars' }).click();
  await expect(dialog.getByRole('button', { name: 'Undo last hole' })).toBeDisabled();
  await expect(dialog.getByRole('status')).toContainText('Start again from hole 1');
  expect(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
});

test('setup adds focused player fields below one another and updates pill progress', async ({ page }) => {
  await page.goto('/setup');
  await expect(page.getByLabel('Player 1 name', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Start Round', exact: true })).toBeDisabled();
  const add = page.getByRole('button', { name: 'Add player', exact: true });
  await add.click();
  const first = page.getByLabel('Player 1 name', { exact: true });
  await expect(first).toBeFocused();
  await first.fill('Alice');
  await add.click();
  const second = page.getByLabel('Player 2 name', { exact: true });
  await expect(second).toBeFocused();
  const secondBox = await second.boundingBox();
  const addBox = await add.boundingBox();
  expect(addBox!.y).toBeGreaterThanOrEqual(secondBox!.y + secondBox!.height);
  await second.fill('alice');
  await page.getByRole('button', { name: 'Start Round', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Each player needs a different name' })).toBeVisible();
  await expect(second).toHaveAttribute('aria-invalid', 'true');
  await second.fill('Bob');
  await page.getByRole('button', { name: 'Remove player 1', exact: true }).click();
  await expect(add).toBeFocused();
  await expect(page.getByLabel('Player 1 name', { exact: true })).toHaveValue('Bob');
  await page.getByRole('button', { name: 'Start Round', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hole 1', exact: true })).toBeVisible();
  const progress = page.getByRole('progressbar', { name: 'Round progress' });
  await expect(progress).toHaveAttribute('aria-valuenow', '1');
  await expect(progress).toHaveAttribute('aria-valuemax', '9');
  await page.getByRole('button', { name: 'Next hole', exact: true }).click();
  await expect(progress).toHaveAttribute('aria-valuenow', '2');
  await page.getByRole('button', { name: 'Previous hole', exact: true }).click();
  await expect(progress).toHaveAttribute('aria-valuenow', '1');
});

test('new player groups start empty and can add or remove up to 8 players', async ({ page }) => {
  await page.goto('/setup');
  await page.getByRole('button', { name: 'Add player group', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Add player group' });
  await expect(dialog.getByLabel('Player 1 name', { exact: true })).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Save changes', exact: true })).toBeDisabled();
  const add = dialog.getByRole('button', { name: 'Add player', exact: true });
  for (let i = 1; i <= 8; i++) {
    await add.click();
    await expect(dialog.getByLabel(`Player ${i} name`, { exact: true })).toBeFocused();
    await dialog.getByLabel(`Player ${i} name`, { exact: true }).fill(`Golfer ${i}`);
  }
  await expect(add).toBeDisabled();
  await expect(dialog.getByRole('status')).toContainText('Maximum reached');
  await dialog.getByRole('button', { name: 'Remove player 4', exact: true }).click();
  await expect(add).toBeEnabled();
  await expect(add).toBeFocused();
  await expect(dialog.getByLabel('Player 4 name', { exact: true })).toHaveValue('Golfer 5');
});
