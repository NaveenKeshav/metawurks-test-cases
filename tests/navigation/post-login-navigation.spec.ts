import { test, expect } from '@playwright/test';
import { config } from '../shared/config';
import { openDashboard } from '../shared/auth-helper';

/**
 * Runs with the saved session (chromium project).
 */
test.describe('Post-Login Navigation & Sidebar', () => {

  test.beforeEach(async ({ page }) => {
    await openDashboard(page);
  });

  test.describe('Positive Scenarios - Sidebar Navigation', () => {

    test('TC123: Sidebar navigation items are all present', async ({ page }) => {
      // Hidden pre-rendered panels duplicate several strings — use exact
      // matches and role scoping to stay unambiguous
      await expect(page.getByText('New Conversation', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Search', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Knowledge Source', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Agents' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Projects' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Conversations' })).toBeVisible();
    });

    test('TC124: Clicking Knowledge Source expands sub-menu with Data Library and Integrations', async ({ page }) => {
      await page.getByText('Knowledge Source', { exact: true }).click();
      await expect(page.getByText('Data Library', { exact: true }).filter({ visible: true }).first()).toBeVisible();
      await expect(page.getByText('Integrations', { exact: true }).filter({ visible: true }).first()).toBeVisible();
    });

    test('TC125: Clicking New Conversation resets to fresh chat state', async ({ page }) => {
      await page.getByText('New Conversation').first().click();
      await expect(page.locator('textarea').first()).toBeVisible();
      await expect(page.getByText('Ask anything')).toBeVisible();
    });

    test('TC126: Sidebar logo is visible at the top', async ({ page }) => {
      await expect(page.getByAltText('Logo')).toBeVisible();
    });

    test('TC127: Sidebar collapse/expand toggle button is present', async ({ page }) => {
      const toggleButton = page.locator('button').filter({ has: page.locator('svg.lucide-panel-left') }).first();
      await expect(toggleButton).toBeVisible();
    });
  });

  test.describe('Positive Scenarios - App Navigation', () => {

    test('TC128: Clicking Agents opens the skills panel', async ({ page }) => {
      await page.getByRole('button', { name: 'Agents' }).click();
      await expect(
        page.getByText(/Build and run multi-step skills/i).filter({ visible: true }).first()
      ).toBeVisible({ timeout: 15_000 });
    });

    test('TC129: Application URL contains chat base path', async ({ page }) => {
      expect(page.url()).toContain('/chat');
    });

    test('TC130: Browser back returns to /chat after visiting /pricing', async ({ page }) => {
      await page.goto('/pricing');
      await page.waitForLoadState('domcontentloaded');
      await page.goBack();
      await page.waitForURL(/\/chat/, { timeout: 15_000 });
      expect(page.url()).toContain('/chat');
    });
  });

  test.describe('Logout Functionality', () => {

    test('TC131: Log out shows a confirm dialog, then returns to the login page', async ({ page }) => {
      // Open the profile menu from the sidebar user card
      await page.getByRole('button', { name: /Kishu/i }).click();
      await page.getByText('Log out').click();

      // The sidebar shows a "Confirm Logout" dialog with Yes/No
      await expect(page.getByText('Confirm Logout')).toBeVisible();
      await expect(page.getByText('Are you sure you want to logout?')).toBeVisible();
      await page.getByRole('button', { name: 'Yes' }).click();

      // NextAuth signs out and lands back on the login page
      await page.waitForURL(/\/login/, { timeout: 20_000 });
      await expect(page.getByText('Sign in to MetaWurks')).toBeVisible();
    });

    test('TC132: Logout confirm dialog can be cancelled', async ({ page }) => {
      await page.getByRole('button', { name: /Kishu/i }).click();
      await page.getByText('Log out').click();
      await expect(page.getByText('Confirm Logout')).toBeVisible();

      await page.getByRole('button', { name: 'No' }).click();
      await expect(page.getByText('Confirm Logout')).not.toBeVisible();

      // Still signed in on /chat
      expect(page.url()).toContain('/chat');
    });
  });

  test.describe('Negative Scenarios - Navigation', () => {

    test('TC133: Invalid URL shows 404 while authenticated', async ({ page }) => {
      const response = await page.goto(`${config.appUrl}/invalid-page-xyz`);
      expect(response?.status() === 404 || page.url().includes('404')).toBeTruthy();
    });

    test('TC134: Visiting /login while authenticated still renders the login page', async ({ page }) => {
      // The app has no middleware redirect for authenticated users on /login —
      // the form renders; login state is unaffected
      await page.goto('/login');
      await expect(page.getByText('Sign in to MetaWurks')).toBeVisible();

      // Session survives: /chat still shows the dashboard
      await page.goto('/chat');
      await expect(page.getByRole('heading', { name: /Let's orchestrate/i })).toBeVisible({ timeout: 20_000 });
    });
  });
});
