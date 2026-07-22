import { test, expect, Page } from '@playwright/test';
import { openDashboard } from '../shared/auth-helper';

/**
 * Suite 14 — Integrations & MCP  (PDF TC 14.1–14.12)
 *
 * Authenticated suite. Sources: IntegrationsPage.tsx, FilterTabs.tsx,
 * IntegrationCard.tsx, CustomMcpCard.tsx, CustomMcpModal.tsx.
 *
 * Automatable: the integrations list and the Custom MCP modal's client-side
 * validation ("Both name and URL are required", "Please enter a valid URL").
 * Guarded (need a live MCP server / OAuth or don't exist in UI): actual
 * connect, disconnect-of-a-connection, test-connection (no UI), tools list
 * (no UI), token/permission cases.
 */

async function openIntegrationsPage(page: Page) {
  await page.getByRole('button', { name: 'Integrations' }).click();
  await expect(page.getByText('Integrations').first()).toBeVisible({ timeout: 10_000 });
}

async function openCustomMcpModal(page: Page) {
  await openIntegrationsPage(page);
  await page.getByRole('button', { name: 'Add Custom MCP' }).first().click();
  await expect(page.getByPlaceholder('e.g. My Notion MCP')).toBeVisible({ timeout: 10_000 });
}

test.describe('Suite 14 — Integrations & MCP', () => {

  test.beforeEach(async ({ page }) => {
    await openDashboard(page);
  });

  test('14.1 List available integrations with status', async ({ page }) => {
    await openIntegrationsPage(page);
    await expect(page.getByRole('button', { name: 'Connected' })).toBeVisible();
    await expect(page.getByText('Gmail').filter({ visible: true }).first()).toBeVisible();
    // Cards expose a Connect action (status)
    expect(await page.getByRole('button', { name: /Connect/i }).filter({ visible: true }).count()).toBeGreaterThanOrEqual(1);
  });

  test('14.2 Connect an MCP server (valid config enables Connect)', async ({ page }) => {
    // Full connect needs a live MCP server; assert the modal accepts a valid
    // config and enables the Connect action.
    await openCustomMcpModal(page);
    await page.getByPlaceholder('e.g. My Notion MCP').fill('My Test MCP');
    await page.getByPlaceholder('https://your-mcp-server.com/mcp').fill('https://example.com/mcp');
    await expect(page.getByRole('button', { name: 'Connect' })).toBeEnabled();
  });

  test('14.3 Custom MCP OAuth connection', async ({ page }) => {
    test.skip(true, 'Requires a live OAuth-based MCP server to complete the popup flow (Automation: No)');
  });

  test('14.4 Disconnect an integration', async ({ page }) => {
    await openIntegrationsPage(page);
    const disconnect = page.getByRole('button', { name: /Disconnect/i }).filter({ visible: true });
    test.skip(!(await disconnect.count()), 'No connected integration to disconnect');
    await disconnect.first().click();
    await page.waitForTimeout(1500);
    await expect(page.getByText('Integrations').first()).toBeVisible();
  });

  test('14.5 Connection test on MCP server', async ({ page }) => {
    test.skip(true, 'No "test connection"/health-status control exists in the UI (Known Gaps Report)');
  });

  test('14.6 Invalid MCP config rejected', async ({ page }) => {
    await openCustomMcpModal(page);
    // Missing fields
    await page.getByRole('button', { name: 'Connect' }).click({ force: true }).catch(() => {});
    // Invalid URL
    await page.getByPlaceholder('e.g. My Notion MCP').fill('Bad Config');
    await page.getByPlaceholder('https://your-mcp-server.com/mcp').fill('not-a-valid-url');
    await page.getByRole('button', { name: 'Connect' }).click();
    await expect(page.getByText(/Please enter a valid URL|Both name and URL are required/i)).toBeVisible({ timeout: 10_000 });
  });

  test('14.7 Token expiry handling for integration', async ({ page }) => {
    test.skip(true, 'Token refresh/reauth is a backend behaviour requiring a live expired connection (Automation: No)');
  });

  test('14.8 Token refresh on new connection', async ({ page }) => {
    test.skip(true, 'Requires a live integration reconnect to observe token refresh (Automation: No)');
  });

  test('14.9 Multiple simultaneous connections', async ({ page }) => {
    test.skip(true, 'Requires multiple live integrations/MCP servers to connect (Automation: No)');
  });

  test('14.10 Integration error handling display', async ({ page }) => {
    test.skip(true, 'Requires an unreachable live MCP server to surface the error/retry state (Automation: No)');
  });

  test('14.11 Integration permission enforcement', async ({ page }) => {
    test.skip(true, "Requires another user's integration to attempt unauthorized access");
  });

  test('14.12 View MCP server tools/capabilities', async ({ page }) => {
    test.skip(true, 'The UI does not render a connected-server tools/capabilities list (Known Gaps Report)');
  });
});
