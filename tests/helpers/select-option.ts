import type { Page } from '@playwright/test';

export async function selectOption(page: Page, label: string, option: string | number) {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  const options = page.getByRole('option');
  await (typeof option === 'number' ? options.nth(option) : options.filter({ hasText: option })).click();
}
