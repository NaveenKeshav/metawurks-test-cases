import { test, expect, Page } from '@playwright/test';
import { openDashboard } from '../shared/auth-helper';

/**
 * Runs with the saved session (chromium project).
 * The profile menu opens from the user card at the bottom of the sidebar
 * (components/sidebar/UserProfileCard.tsx). Menu items: Upgrade Plan,
 * Settings, Preferences, Usage & Billing, Help, Log out.
 */
async function openProfileMenu(page: Page) {
  await page.getByRole('button', { name: /Kishu/i }).click();
  await expect(page.getByText('Log out')).toBeVisible();
}

test.describe('Settings / User Profile - Post Login', () => {

  test.beforeEach(async ({ page }) => {
    await openDashboard(page);
  });

  test.describe('Positive Scenarios', () => {

    test('TC113: User profile menu opens with all options', async ({ page }) => {
      await openProfileMenu(page);
      await expect(page.getByText('Upgrade Plan')).toBeVisible();
      await expect(page.getByText('Settings')).toBeVisible();
      await expect(page.getByText('Preferences')).toBeVisible();
      await expect(page.getByText('Usage & Billing')).toBeVisible();
      await expect(page.getByText('Help')).toBeVisible();
      await expect(page.getByText('Log out')).toBeVisible();
    });

    test('TC114: User profile shows avatar with initial', async ({ page }) => {
      // Avatar shows the first letter of the email username: K
      const userCard = page.getByRole('button', { name: /Kishu/i });
      await expect(userCard).toBeVisible();
      await expect(userCard.getByText('K', { exact: true })).toBeVisible();
    });

    test('TC115: User profile displays plan information', async ({ page }) => {
      await expect(page.getByText('Free Plan').first()).toBeVisible();
    });

    test('TC116: Settings option in profile menu is clickable', async ({ page }) => {
      await openProfileMenu(page);
      await page.getByText('Settings', { exact: true }).click();
      // Settings opens as a panel/dialog driven by the ?settings=true param
      await page.waitForURL(/settings=true/, { timeout: 10_000 });
    });

    test('TC117: Preferences option routes to the preferences tab', async ({ page }) => {
      await openProfileMenu(page);
      await page.getByText('Preferences', { exact: true }).click();
      await page.waitForURL(/settings=true&tab=preferences/, { timeout: 10_000 });
    });

    test('TC118: Usage & Billing option routes to the billing tab', async ({ page }) => {
      await openProfileMenu(page);
      await page.getByText('Usage & Billing').click();
      await page.waitForURL(/tab=usage-billing/, { timeout: 10_000 });
    });

    test('TC119: Upgrade Plan option routes to pricing', async ({ page }) => {
      await openProfileMenu(page);
      await page.getByText('Upgrade Plan').click();
      await page.waitForURL(/\/pricing/, { timeout: 10_000 });
    });

    test('TC120: Log out option is visible in profile menu', async ({ page }) => {
      await openProfileMenu(page);
      await expect(page.getByText('Log out')).toBeVisible();
    });
  });

  test.describe('Negative Scenarios', () => {

    test('TC121: Profile menu should not show login page elements', async ({ page }) => {
      await openProfileMenu(page);
      await expect(page.getByText('Sign in to MetaWurks')).not.toBeVisible();
    });

    test('TC122: Profile menu closes when clicking outside', async ({ page }) => {
      await openProfileMenu(page);
      await expect(page.getByText('Log out')).toBeVisible();

      // UserProfileCard closes the menu on any outside document click
      await page.getByRole('heading', { name: /Let's orchestrate/i }).click();
      await expect(page.getByText('Log out')).not.toBeVisible();
    });
  });
});
