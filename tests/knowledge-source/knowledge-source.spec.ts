import { test, expect, Page } from '@playwright/test';
import { openDashboard } from '../shared/auth-helper';

/**
 * Runs with the saved session (chromium project).
 *
 * Real flow: clicking "Knowledge Source" in the sidebar expands a sub-menu
 * (Data Library, Integrations); each sub-item opens its own page.
 *
 * The Data Library and Integrations panels are pre-rendered hidden in the
 * DOM, so shared strings ("Data Library", "All Items", ...) resolve to
 * multiple elements — locators filter on visibility to stay unambiguous.
 */
async function expandKnowledgeSource(page: Page) {
  await page.getByText('Knowledge Source', { exact: true }).click();
  await expect(page.getByText('Data Library', { exact: true }).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText('Integrations', { exact: true }).filter({ visible: true }).first()).toBeVisible();
}

async function openDataLibrary(page: Page) {
  await expandKnowledgeSource(page);
  await page.getByText('Data Library', { exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByText('Privacy Protected').filter({ visible: true }).first()).toBeVisible({ timeout: 15_000 });
}

async function openIntegrations(page: Page) {
  await expandKnowledgeSource(page);
  await page.getByText('Integrations', { exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByText('Gmail').filter({ visible: true }).first()).toBeVisible({ timeout: 15_000 });
}

test.describe('Knowledge Source - Post Login', () => {

  test.beforeEach(async ({ page }) => {
    await openDashboard(page);
  });

  test.describe('Sidebar Menu', () => {

    test('TC91: Knowledge Source menu expands to show Data Library and Integrations', async ({ page }) => {
      await expandKnowledgeSource(page);
    });
  });

  test.describe('Data Library', () => {

    test.beforeEach(async ({ page }) => {
      await openDataLibrary(page);
    });

    test('TC92: Data Library displays All Items, Local Uploads, Data Drives tabs', async ({ page }) => {
      await expect(page.getByText('All Items').filter({ visible: true }).first()).toBeVisible();
      await expect(page.getByText('Local Uploads').filter({ visible: true }).first()).toBeVisible();
      await expect(page.getByText('Data Drives').filter({ visible: true }).first()).toBeVisible();
    });

    test('TC93: Data Library shows content area (upload prompt or library)', async ({ page }) => {
      // Empty accounts see "Power Your Workflows with Context"; accounts
      // with uploads see the library — either is a valid loaded state
      const loaded = page.getByText('Power Your Workflows with Context')
        .or(page.getByText('All Items'))
        .filter({ visible: true });
      await expect(loaded.first()).toBeVisible();
    });

    test('TC94: Data Library displays privacy protection notice', async ({ page }) => {
      await expect(page.getByText('Privacy Protected').filter({ visible: true }).first()).toBeVisible();
      await expect(page.getByText(/Your Data Stays Yours/i).filter({ visible: true }).first()).toBeVisible();
    });
  });

  test.describe('Integrations', () => {

    test.beforeEach(async ({ page }) => {
      await openIntegrations(page);
    });

    test('TC95: Integrations page displays all filter categories', async ({ page }) => {
      for (const tab of ['All Items', 'Connected', 'Mails', 'Documentation', 'Communications', 'Productivity', 'Finance']) {
        await expect(page.getByText(tab, { exact: true }).filter({ visible: true }).first()).toBeVisible();
      }
    });

    test('TC96: Mail integrations are displayed (Gmail, Outlook)', async ({ page }) => {
      await expect(page.getByText('Gmail').filter({ visible: true }).first()).toBeVisible();
      await expect(page.getByText('Outlook').filter({ visible: true }).first()).toBeVisible();
    });

    test('TC97: Productivity integrations are displayed (Google Calendar, Double)', async ({ page }) => {
      await expect(page.getByText('Google Calendar').filter({ visible: true }).first()).toBeVisible();
      await expect(page.getByText('Double').filter({ visible: true }).first()).toBeVisible();
    });

    test('TC98: Communication integrations are displayed (Teams, Slack, LinkedIn, Facebook)', async ({ page }) => {
      await expect(page.getByText('Microsoft Teams').filter({ visible: true }).first()).toBeVisible();
      await expect(page.getByText('Slack').filter({ visible: true }).first()).toBeVisible();
      await expect(page.getByText('LinkedIn').filter({ visible: true }).first()).toBeVisible();
      await expect(page.getByText('Facebook').filter({ visible: true }).first()).toBeVisible();
    });

    test('TC99: Documentation integrations are displayed (Figma, Fireflies)', async ({ page }) => {
      await expect(page.getByText('Figma').filter({ visible: true }).first()).toBeVisible();
      await expect(page.getByText('Fireflies').filter({ visible: true }).first()).toBeVisible();
    });

    test('TC100: Finance integrations are displayed (Stripe, QuickBooks)', async ({ page }) => {
      await expect(page.getByText('Stripe').filter({ visible: true }).first()).toBeVisible();
      await expect(page.getByText('QuickBooks').filter({ visible: true }).first()).toBeVisible();
    });

    test('TC101: Custom MCP Server option is available', async ({ page }) => {
      await expect(page.getByText('Custom MCP').filter({ visible: true }).first()).toBeVisible();
    });

    test('TC102: Integration cards expose Connect actions', async ({ page }) => {
      const connectButtons = page.getByRole('button', { name: /Connect/i }).filter({ visible: true });
      expect(await connectButtons.count()).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Negative Scenarios', () => {

    test('TC103: Knowledge Source sub-menus are hidden before expanding', async ({ page }) => {
      await expect(page.getByText('Knowledge Source', { exact: true })).toBeVisible();
      await expect(page.getByText('Data Library', { exact: true }).filter({ visible: true })).toHaveCount(0);
    });
  });
});
