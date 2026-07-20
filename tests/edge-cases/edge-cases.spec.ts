import { test, expect } from '@playwright/test';
import { config } from '../shared/config';

test.describe('Edge Cases & Error Handling', () => {
  test('TC27: Non-existent page returns 404 or custom error page', async ({ page }) => {
    const response = await page.goto(`${config.baseUrl}/non-existent-page-xyz`);
    expect(response?.status() === 404 || page.url().includes('404')).toBeTruthy();
  });

  test('TC28: External links open in new tab', async ({ page }) => {
    await page.goto(config.baseUrl);
    const signInLink = page.getByRole('button', { name: 'Sign In' });
    // The Sign In button is wrapped in an <a> with target="_blank"
    const signInAnchor = page.locator('a[href*="login"]');
    await expect(signInAnchor).toHaveAttribute('target', '_blank');
    const getStartedLink = page.getByRole('link', { name: 'Get Started' }).first();
    await expect(getStartedLink).toHaveAttribute('target', '_blank');
  });
});