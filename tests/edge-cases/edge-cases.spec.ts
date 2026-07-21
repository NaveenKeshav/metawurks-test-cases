import { test, expect } from '@playwright/test';
import { config } from '../shared/config';

test.describe('Edge Cases & Error Handling', () => {
  test('TC25: Root path redirects to the login page', async ({ page }) => {
    // app/page.tsx is a bare redirect('/login') — there is no marketing home
    await page.goto(config.baseUrl);
    await page.waitForURL(/\/login/, { timeout: 15000 });
    await expect(page.getByText('Sign in to MetaWurks')).toBeVisible();
  });

  test('TC26: Signed-out user visiting /chat is not shown the dashboard', async ({ page }) => {
    await page.goto(`${config.appUrl}/chat`);
    await page.waitForLoadState('networkidle');
    // Without a session the app must not render the personal dashboard
    await expect(page.getByRole('heading', { name: /Let's orchestrate/i })).not.toBeVisible();
  });

  test('TC27: Non-existent page returns 404 or custom error page', async ({ page }) => {
    const response = await page.goto(`${config.baseUrl}/non-existent-page-xyz`);
    expect(response?.status() === 404 || page.url().includes('404')).toBeTruthy();
  });

  test('TC28: Legal links on login page open in a new tab', async ({ page }) => {
    await page.goto(`${config.appUrl}/login`);
    const privacyLink = page.getByRole('link', { name: 'Privacy Policy' }).first();
    await expect(privacyLink).toHaveAttribute('target', '_blank');
    await expect(privacyLink).toHaveAttribute('href', /policies\.google\.com/);
    const termsLink = page.getByRole('link', { name: 'Terms of Service' }).first();
    await expect(termsLink).toHaveAttribute('target', '_blank');
  });
});
