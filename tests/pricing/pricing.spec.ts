import { test, expect } from '@playwright/test';

/**
 * Runs with the saved session (chromium project).
 * /pricing is the app's plan selection & billing page (app/pricing/page.tsx):
 * "Upgrade your Plan" header, plan cards (Free / paid tiers), and the
 * signed-in account's current plan marked with a disabled "Current Plan".
 */
test.describe('Pricing - Post Login', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');
  });

  test('TC135: Pricing page loads with the plan chooser', async ({ page }) => {
    expect(page.url()).toContain('/pricing');
    await expect(page.getByText('Upgrade your Plan')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Choose the best plan that fits your needs')).toBeVisible();
  });

  test('TC136: Free-tier account sees its current plan marked', async ({ page }) => {
    await expect(page.getByText('Free', { exact: true }).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: 'Current Plan' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Current Plan' }).first()).toBeDisabled();
  });
});
