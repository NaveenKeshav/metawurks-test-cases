import { test, expect } from '@playwright/test';
import { loginWithEnvCredentials, waitForDashboardLoad } from '../shared/auth-helper';

test.describe('Settings / User Profile - Post Login', () => {

  test.describe('Positive Scenarios', () => {

    test('TC126: User profile menu opens with all options', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click on user profile in sidebar
      const userButton = page.getByRole('button', { name: /Naveen/i });
      await userButton.click();
      await page.waitForTimeout(500);

      // Verify profile menu options
      await expect(page.getByText('Upgrade Plan')).toBeVisible();
      await expect(page.getByText('Settings')).toBeVisible();
      await expect(page.getByText('Preferences')).toBeVisible();
      await expect(page.getByText('Usage & Billing')).toBeVisible();
      await expect(page.getByText('Help')).toBeVisible();
      await expect(page.getByText('Log out')).toBeVisible();
    });

    test('TC127: User profile shows avatar with initials', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Verify avatar with initial 'N' is displayed
      const avatar = page.getByText('N').first();
      await expect(avatar).toBeVisible();
    });

    test('TC128: User profile displays plan information', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Verify plan info
      await expect(page.getByText('Enterprise Plan')).toBeVisible();
    });

    test('TC129: Settings option in profile menu is clickable', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Open profile menu
      const userButton = page.getByRole('button', { name: /Naveen/i });
      await userButton.click();
      await page.waitForTimeout(500);

      // Verify Settings option
      const settingsOption = page.getByText('Settings');
      await expect(settingsOption).toBeVisible();
      await expect(settingsOption).toBeEnabled();
    });

    test('TC130: Preferences option in profile menu is clickable', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Open profile menu
      const userButton = page.getByRole('button', { name: /Naveen/i });
      await userButton.click();
      await page.waitForTimeout(500);

      // Verify Preferences option
      const preferencesOption = page.getByText('Preferences');
      await expect(preferencesOption).toBeVisible();
      await expect(preferencesOption).toBeEnabled();
    });

    test('TC131: Usage & Billing option in profile menu is clickable', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Open profile menu
      const userButton = page.getByRole('button', { name: /Naveen/i });
      await userButton.click();
      await page.waitForTimeout(500);

      // Verify Usage & Billing option
      const billingOption = page.getByText('Usage & Billing');
      await expect(billingOption).toBeVisible();
      await expect(billingOption).toBeEnabled();
    });

    test('TC132: Help option in profile menu is clickable', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Open profile menu
      const userButton = page.getByRole('button', { name: /Naveen/i });
      await userButton.click();
      await page.waitForTimeout(500);

      // Verify Help option
      const helpOption = page.getByText('Help');
      await expect(helpOption).toBeVisible();
      await expect(helpOption).toBeEnabled();
    });

    test('TC133: Upgrade Plan option in profile menu is clickable', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Open profile menu
      const userButton = page.getByRole('button', { name: /Naveen/i });
      await userButton.click();
      await page.waitForTimeout(500);

      // Verify Upgrade Plan option
      const upgradeOption = page.getByText('Upgrade Plan');
      await expect(upgradeOption).toBeVisible();
      await expect(upgradeOption).toBeEnabled();
    });

    test('TC134: Log out option is visible in profile menu', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Open profile menu
      const userButton = page.getByRole('button', { name: /Naveen/i });
      await userButton.click();
      await page.waitForTimeout(500);

      // Verify Log out option
      const logoutOption = page.getByText('Log out');
      await expect(logoutOption).toBeVisible();
      await expect(logoutOption).toBeEnabled();
    });
  });

  test.describe('Negative Scenarios', () => {

    test('TC135: Profile menu should not show login page elements', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Open profile menu
      const userButton = page.getByRole('button', { name: /Naveen/i });
      await userButton.click();
      await page.waitForTimeout(500);

      // Verify no login-related text
      await expect(page.getByText('Sign in to MetaWurks')).not.toBeVisible();
    });

    test('TC136: Profile menu should close when clicking outside', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Open profile menu
      const userButton = page.getByRole('button', { name: /Naveen/i });
      await userButton.click();
      await page.waitForTimeout(500);

      // Verify menu is open
      await expect(page.getByText('Log out')).toBeVisible();

      // Click outside to close (click on the main content area)
      await page.getByRole('heading', { name: /Let's orchestrate/i }).click();
      await page.waitForTimeout(500);

      // Menu should close
      await expect(page.getByText('Log out')).not.toBeVisible();
    });
  });
});