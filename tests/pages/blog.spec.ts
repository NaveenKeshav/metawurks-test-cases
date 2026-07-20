import { test, expect } from '@playwright/test';
import { config } from '../shared/config';

test.describe('Blog Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${config.baseUrl}/blog`);
    await page.waitForLoadState('networkidle');
  });

  test('TC20: Blog page loads with article cards', async ({ page }) => {
    await expect(page.getByText('Our Blog')).toBeVisible();
    await expect(page.getByText('Read More').first()).toBeVisible();
  });

  test('TC21: Blog articles have categories, dates, and read times', async ({ page }) => {
    await expect(page.getByText('Accounting').first()).toBeVisible();
    await expect(page.getByText('AI').first()).toBeVisible();
    await expect(page.getByText('Finance').first()).toBeVisible();
    await expect(page.getByText('min read').first()).toBeVisible();
  });

  test('TC22: Blog newsletter signup section is present', async ({ page }) => {
    await expect(page.getByText('Subscribe now to Our Newsletter')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible();
  });
});