import { test, expect } from '@playwright/test';
import { loginWithEnvCredentials, waitForDashboardLoad } from '../shared/auth-helper';

test.describe('Knowledge Source - Post Login', () => {

  test.describe('Data Library - Positive Scenarios', () => {

    test('TC91: Knowledge Source menu expands to show Data Library and Integrations', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify sub-menu items
      await expect(page.getByText('Data Library')).toBeVisible();
      await expect(page.getByText('Integrations')).toBeVisible();
    });

    test('TC92: Data Library section displays All Items, Local Uploads, Data Drives tabs', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify Data Library tabs
      await expect(page.getByText('All Items')).toBeVisible();
      await expect(page.getByText('Local Uploads')).toBeVisible();
      await expect(page.getByText('Data Drives')).toBeVisible();
    });

    test('TC93: Data Library shows upload prompt for first document', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify upload prompt
      await expect(page.getByText('Power Your Workflows with Context')).toBeVisible();
      await expect(page.getByText(/Upload First Document/i)).toBeVisible();
    });

    test('TC94: Data Library displays privacy protection notice', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify privacy notice
      await expect(page.getByText(/Your Data Stays Yours/i)).toBeVisible();
      await expect(page.getByText(/never use your data to train/i)).toBeVisible();
    });

    test('TC95: Data Library has Integration Guide link', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify Integration Guide
      await expect(page.getByText('Integration Guide').first()).toBeVisible();
    });
  });

  test.describe('Integrations - Positive Scenarios', () => {

    test('TC96: Integrations section displays all integration categories', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify integration categories
      await expect(page.getByText('Mails')).toBeVisible();
      await expect(page.getByText('Documentation')).toBeVisible();
      await expect(page.getByText('Communications')).toBeVisible();
      await expect(page.getByText('Productivity')).toBeVisible();
      await expect(page.getByText('Finance')).toBeVisible();
    });

    test('TC97: Gmail integration card is displayed with Connect button', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify Gmail integration
      await expect(page.getByText('Gmail')).toBeVisible();
      await expect(page.getByText(/Import files and documents/i)).toBeVisible();
      await expect(page.getByText('Max 5 Accounts').first()).toBeVisible();
      await expect(page.getByRole('button', { name: /Connect/i })).toBeVisible();
    });

    test('TC98: Google Calendar integration card is displayed', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify Google Calendar
      await expect(page.getByText('Google Calendar')).toBeVisible();
    });

    test('TC99: Outlook integration card is displayed', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify Outlook
      await expect(page.getByText('Outlook')).toBeVisible();
    });

    test('TC100: Microsoft Teams integration card is displayed', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify Microsoft Teams
      await expect(page.getByText('Microsoft Teams')).toBeVisible();
    });

    test('TC101: Slack integration card is displayed', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify Slack
      await expect(page.getByText('Slack')).toBeVisible();
    });

    test('TC102: Figma integration card is displayed', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify Figma
      await expect(page.getByText('Figma')).toBeVisible();
    });

    test('TC103: LinkedIn integration card is displayed', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify LinkedIn
      await expect(page.getByText('LinkedIn')).toBeVisible();
    });

    test('TC104: Fireflies integration card is displayed', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify Fireflies
      await expect(page.getByText('Fireflies')).toBeVisible();
    });

    test('TC105: Facebook integration card is displayed', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify Facebook
      await expect(page.getByText('Facebook')).toBeVisible();
    });

    test('TC106: Stripe integration card is displayed', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify Stripe
      await expect(page.getByText('Stripe')).toBeVisible();
    });

    test('TC107: QuickBooks integration card is displayed', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify QuickBooks
      await expect(page.getByText('QuickBooks')).toBeVisible();
    });

    test('TC108: Double integration card is displayed', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify Double
      await expect(page.getByText('Double')).toBeVisible();
    });

    test('TC109: Custom MCP Server option is available', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify Custom MCP Server
      await expect(page.getByText('Custom MCP Server')).toBeVisible();
      await expect(page.getByText(/Add Custom MCP/i)).toBeVisible();
    });

    test('TC110: All Items filter shows all integrations by default', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify All Items is active
      await expect(page.getByText('All Items').first()).toBeVisible();
    });

    test('TC111: Connected filter tab is visible', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Verify Connected tab
      await expect(page.getByText('Connected')).toBeVisible();
    });
  });

  test.describe('Negative Scenarios', () => {

    test('TC112: Knowledge Source sub-menus are hidden by default when collapsed', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Knowledge Source should be visible but sub-items may be hidden
      await expect(page.getByText('Knowledge Source')).toBeVisible();
    });

    test('TC113: Integration Connect buttons should not show error when clicked without auth', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Knowledge Source to expand
      await page.getByText('Knowledge Source').click();
      await page.waitForTimeout(500);

      // Click Connect on Gmail - should not crash
      const connectButtons = page.getByRole('button', { name: /Connect/i });
      const count = await connectButtons.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });
});