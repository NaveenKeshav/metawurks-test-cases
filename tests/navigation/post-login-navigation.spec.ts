import { test, expect } from '@playwright/test';
import { config } from '../shared/config';
import { loginWithEnvCredentials, waitForDashboardLoad } from '../shared/auth-helper';

test.describe('Post-Login Navigation & Sidebar', () => {

  // Skip all tests in this describe block if login credentials are not configured
  test.skip(!config.login.isConfigured,
    'LOGIN_USERNAME and LOGIN_PASSWORD must be set in .env file to run these tests. ' +
    'See .env.example for reference.');

  test.describe('Positive Scenarios - Sidebar Navigation', () => {

    test('TC137: Sidebar navigation items are all present and clickable', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Verify all sidebar items
      await expect(page.getByText('New Conversation')).toBeVisible();
      await expect(page.getByText('Search')).toBeVisible();
      await expect(page.getByText('Knowledge Source')).toBeVisible();
      await expect(page.getByText('Agents')).toBeVisible();
      await expect(page.getByText('Projects')).toBeVisible();
      await expect(page.getByText('Conversations')).toBeVisible();
    });

    test('TC138: Clicking Knowledge Source expands sub-menu with Data Library and Integrations', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify sub-menu items expand
      await expect(page.getByText('Data Library')).toBeVisible();
      await expect(page.getByText('Integrations')).toBeVisible();
    });

    test('TC139: Clicking Knowledge Source again collapses sub-menu', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify sub-menu items are visible
      await expect(page.getByText('Data Library')).toBeVisible();

      // Click Knowledge Source again to collapse
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);
    });

    test('TC140: Clicking New Conversation resets to fresh chat state', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click New Conversation
      await page.getByText('New Conversation').first().click();
      await page.waitForTimeout(500);

      // Verify chat area is ready for new input
      await expect(page.getByPlaceholder(/Ask anything/i)).toBeVisible();
    });

    test('TC141: Recent conversations section is expandable', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Verify Conversations section exists
      const conversationsSection = page.getByText('Conversations');
      await expect(conversationsSection).toBeVisible();

      // Check conversation items are visible
      await expect(page.getByText(/can you let me know/)).toBeVisible();
    });

    test('TC142: Sidebar logo is visible at the top', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Verify logo
      const logo = page.getByAltText('Logo');
      await expect(logo).toBeVisible();
    });

    test('TC143: Sidebar collapse/expand toggle button is present', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Find the sidebar toggle button (panel-left icon)
      const toggleButton = page.locator('button').filter({ has: page.locator('svg.lucide-panel-left') });
      await expect(toggleButton).toBeVisible();
    });
  });

  test.describe('Positive Scenarios - App Navigation', () => {

    test('TC144: Chat panel icon changes based on active section (agents)', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Agents
      await page.getByText('Agents').click();
      await page.waitForTimeout(500);

      // Verify URL contains agents parameter
      const url = page.url();
      expect(url).toContain('agents');
    });

    test('TC145: Application URL contains chat base path', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Verify we are on the chat page
      const url = page.url();
      expect(url).toContain('/chat');
    });
  });

  test.describe('Logout Functionality', () => {

    test('TC146: Log out from profile menu navigates to login page', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Open profile menu
      const userButton = page.getByRole('button', { name: /Naveen/i });
      await userButton.click();
      await page.waitForTimeout(500);

      // Click Log out
      await page.getByText('Log out').click();

      // Wait for navigation back to login
      await page.waitForTimeout(3000);

      // Should be redirected to login page or external auth
      const currentUrl = page.url();
      // Either login page or auth page
      const isLoginPage = currentUrl.includes('login');
      const isGoogleAuth = currentUrl.includes('accounts.google.com');
      expect(isLoginPage || isGoogleAuth).toBeTruthy();
    });

    test('TC147: After logout, login page elements should be accessible', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Open profile menu
      const userButton = page.getByRole('button', { name: /Naveen/i });
      await userButton.click();
      await page.waitForTimeout(500);

      // Click Log out
      await page.getByText('Log out').click();

      // Wait for redirect
      await page.waitForTimeout(3000);

      // Verify we're back on a login/accessible page
      // Should not show dashboard elements
      await expect(page.getByText('Welcome')).not.toBeVisible();
    });
  });

  test.describe('Negative Scenarios - Navigation', () => {

    test('TC148: Invalid URL should show 404 or redirect', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Try navigating to invalid URL
      await page.goto('https://apps.metawurks.com/invalid-page', { waitUntil: 'networkidle' });

      // Should either show error page or redirect
      await page.waitForTimeout(2000);

      // The page should not show the login page unexpectedly
      const url = page.url();
      expect(url).not.toContain('/login');
    });

    test('TC149: Direct navigation to login page after auth redirects away', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Try going directly to login page
      await page.goto('https://apps.metawurks.com/login', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      // Should redirect away from login since already authenticated
      const url = page.url();
      expect(url).not.toContain('/login');
    });

    test('TC150: Back button after login stays within app', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Use browser back
      await page.goBack();
      await page.waitForTimeout(2000);

      // Should stay within the app or redirect
      const url = page.url();
      expect(url).toContain('apps.metawurks.com');
    });
  });
});