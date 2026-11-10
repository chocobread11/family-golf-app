import { test, expect, type Locator } from '@playwright/test';
import { selectOption } from './helpers/select-option';

async function contrast(locator: Locator) {
  return locator.evaluate(element => {
    function rgb(value: string) { return (value.match(/[\d.]+/g) ?? []).map(Number); }
    function luminance(color: number[]) {
      return color.slice(0, 3).map(value => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      }).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
    }
    let parent: Element | null = element;
    let background = [255, 255, 255];
    while (parent) {
      const color = rgb(getComputedStyle(parent).backgroundColor);
      if (color.length === 3 || color[3] === 1) { background = color; break; }
      parent = parent.parentElement;
    }
    const foreground = luminance(rgb(getComputedStyle(element).color));
    const backdrop = luminance(background);
    return (Math.max(foreground, backdrop) + 0.05) / (Math.min(foreground, backdrop) + 0.05);
  });
}

test('dashboard actions and supporting text are readable and touch targets are large enough', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Guten Morgen' })).toBeVisible();
  const start = page.getByRole('link', { name: 'Start a match', exact: true });
  expect(await contrast(start)).toBeGreaterThanOrEqual(4.5);
  const today = page.getByText('Today', { exact: true });
  expect(await contrast(today)).toBeGreaterThanOrEqual(4.5);
  const edit = page.getByRole('button', { name: /^Edit match at/ }).first();
  await expect(edit).toBeVisible();
  const target = await edit.boundingBox();
  expect(target!.width).toBeGreaterThanOrEqual(44);
  expect(target!.height).toBeGreaterThanOrEqual(44);
});

test('setup controls have names, selection states, and visible keyboard focus', async ({ page }) => {
  await page.goto('/setup');
  const round = page.getByRole('group', { name: 'Round Configuration', exact: true });
  await expect(round.getByRole('radio', { name: '9 Holes', exact: true })).toHaveAttribute('aria-checked', 'true');
  await expect(round.getByRole('radio', { name: '18 Holes', exact: true })).toHaveAttribute('aria-checked', 'false');
  await page.keyboard.press('Tab');
  const course = page.getByLabel('Course Template', { exact: true });
  await expect(course).toBeEnabled();
  await expect(course).toHaveAttribute('data-slot', 'select-trigger');
  expect(await page.getByRole('main').evaluate(node => getComputedStyle(node).paddingInline)).toBe('8px');
  await course.focus();
  expect(await course.evaluate(node => {
    const style = getComputedStyle(node);
    return style.outlineStyle !== 'none' || style.boxShadow !== 'none';
  })).toBe(true);
  await expect(course.locator('svg')).toHaveCount(0);
  await page.keyboard.press('Tab');
  const add = page.getByRole('button', { name: 'Add course', exact: true });
  await expect(add).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Add course' }).getByLabel('Course name', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(add).toBeFocused();
});

test('the editor and score keypad work on a small phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page.getByRole('button', { name: /^Edit match at/ }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Edit match' });
  for (const label of ['Date and time', 'Course', 'Round length', 'Starting nine']) {
    await expect(dialog.getByLabel(label, { exact: true })).toBeVisible();
  }
  await dialog.getByLabel('Player 1, hole 1', { exact: true }).focus();
  expect(await dialog.getByLabel('Player 1, hole 1', { exact: true }).evaluate(node => getComputedStyle(node).appearance)).toBe('textfield');
  const scores = dialog.getByRole('region', { name: 'Editable match scores', exact: true });
  await scores.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => scores.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
  await expect(dialog.getByRole('button', { name: 'Save changes', exact: true })).toBeVisible();
  expect(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await page.goto('/setup');
  await selectOption(page, 'Player Group', 1);
  await page.getByRole('button', { name: 'Start Round', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hole 1', level: 1 })).toBeVisible();
  expect(await contrast(page.getByText('Par 4', { exact: true }))).toBeGreaterThanOrEqual(4.5);
  await expect(page.getByText('Golfer 1', { exact: true })).toBeInViewport();
  await expect(page.getByText('Golfer 2', { exact: true })).toBeInViewport();
  for (let digit = 0; digit < 10; digit++) {
    const button = page.getByRole('button', { name: String(digit), exact: true });
    await expect(button).toBeInViewport({ ratio: 1 });
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
