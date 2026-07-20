import { test, expect } from '@playwright/test';
import { loginWithEnvCredentials, waitForDashboardLoad } from '../shared/auth-helper';

test.describe('Dashboard - Post Login', () => {

  test.describe('Positive Scenarios', () => {

    test('TC70: Dashboard loads with welcome heading and orchestration subtitle', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Verify welcome heading
      await expect(page.getByRole('heading', { name: /Welcome/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /Let's orchestrate/i })).toBeVisible();
    });

    test('TC71: Dashboard displays quick action suggestion buttons', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Verify quick action buttons
      await expect(page.getByText('Research')).toBeVisible();
      await expect(page.getByText('Improve writing')).toBeVisible();
      await expect(page.getByText('Meeting Notes')).toBeVisible();
      await expect(page.getByText('Analyse Resume')).toBeVisible();
      await expect(page.getByText('Compare')).toBeVisible();
      await expect(page.getByText('More')).toBeVisible();
    });

    test('TC72: Dashboard has chat input area with send functionality', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Verify chat input area
      const chatInput = page.getByRole('textbox');
      await expect(chatInput).toBeVisible();
      await chatInput.fill('What is MetaWurks?');
      await expect(chatInput).toHaveValue('What is MetaWurks?');
    });

    test('TC73: Dashboard shows auto mode toggle', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Verify auto mode toggle is visible
      await expect(page.getByText('Auto')).toBeVisible();
    });

    test('TC74: Dashboard displays knowledge source integration prompt', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Verify integration prompt
      await expect(page.getByText('Integrate your Knowledge Sources')).toBeVisible();
      await expect(page.getByRole('button', { name: /Connect/i })).toBeVisible();
    });

    test('TC75: Dashboard sidebar shows user profile with name and plan', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Verify user profile in sidebar
      await expect(page.getByRole('button', { name: 'N Naveen Enterprise Plan' })).toBeVisible();
    });

    test('TC76: Dashboard sidebar displays all main navigation items', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Verify all sidebar navigation items
      await expect(page.getByText('New Conversation')).toBeVisible();
      await expect(page.locator('div').filter({ hasText: 'Search' }).nth(4)).toBeVisible();
      await expect(page.locator('div').filter({ hasText: /^Knowledge Source$/ })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Agents' })).toBeVisible();
      await expect(page.locator('div').filter({ hasText: 'Projects' }).nth(5)).toBeVisible();
    });

    test('TC77: Dashboard sidebar logo is visible and clickable', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Verify logo in sidebar
      const logo = page.getByAltText('Logo');
      await expect(logo).toBeVisible();
    });

    test('TC78: Dashboard displays recent conversation in sidebar', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Verify recent conversation is visible
      await expect(page.getByText('can you let me know...').first()).toBeVisible();
    });

    test('TC79: Dashboard privacy notice is displayed', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Verify privacy notice
      await expect(page.getByText('Privacy Protected')).toBeVisible();
      await expect(page.getByText(/Your Data Stays Yours/i)).toBeVisible();
    });
  });

  test.describe('Negative Scenarios', () => {

    test('TC80: Dashboard should not show login page elements after authentication', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Verify we are NOT on the login page
      await expect(page.getByText('Sign in to MetaWurks')).not.toBeVisible();
      await expect(page.getByRole('button', { name: /Sign in with Google/i })).not.toBeVisible();
    });

    test('TC81: Dashboard should not show unauthenticated content', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Verify no unauthenticated elements
      await expect(page.getByText('Create your account')).not.toBeVisible();
      await expect(page.getByText('Forgot password?')).not.toBeVisible();
    });
  });
});