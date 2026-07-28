import { test, expect, Page, Locator } from '@playwright/test';
import { openDashboard } from '../shared/auth-helper';
import { openIntegrations } from '../shared/app-helpers';

/**
 * Suite 31 — Integrations & MCP deep  (PDF TC 31.1–31.12)
 *
 * Authenticated suite. Sources: IntegrationsPage.tsx, FilterTabs.tsx,
 * IntegrationCard.tsx, CustomMcpCard.tsx, CustomMcpModal.tsx.
 *
 * Automatable: the integrations list, and the Custom MCP modal's client-side
 * validation ("Both name and URL are required", "Please enter a valid URL").
 * Guarded (need a live MCP server / OAuth, or no UI exists): actual connect,
 * token refresh/expiry, health check, namespaced tools list, permission consent.
 */

async function openIntegrationsPage(page: Page) {
  // The Integrations nav is a <div> gated behind the "Knowledge Source" toggle
  // (not a top-level button) — use the shared helper that expands it and waits
  // for the integrations list ("Gmail") to render. The old local click on a
  // getByRole('button', {name:'Integrations'}) never matched, so these tests
  // errored at navigation instead of running.
  await openIntegrations(page);
}

async function openCustomMcpModal(page: Page): Promise<Locator> {
  await openIntegrationsPage(page);
  await page.getByRole('button', { name: 'Add Custom MCP' }).first().click();
  // Scope to the modal overlay — the integrations page behind it has ~13 card
  // "Connect" buttons, so an unscoped getByRole('button',{name:'Connect'}) is
  // ambiguous (strict-mode). The modal is a .fixed.inset-0 overlay titled
  // "Connect your MCP Server".
  const modal = page.locator('.fixed.inset-0').filter({ hasText: 'Connect your MCP Server' }).first();
  await expect(modal.getByPlaceholder('e.g. My Notion MCP')).toBeVisible({ timeout: 10_000 });
  return modal;
}

test.describe('Suite 31 — Integrations & MCP deep', () => {

  test.beforeEach(async ({ page }) => {
    await openDashboard(page);
  });

  test('31.1 Connect a built-in integration', async ({ page }) => {
    // Full connect needs a live provider; assert a Connect action is present
    // and actionable on a built-in integration card.
    await openIntegrationsPage(page);
    const connect = page.getByRole('button', { name: /^Connect$/i }).filter({ visible: true });
    test.skip(!(await connect.count()), 'No connectable built-in integration available');
    await expect(connect.first()).toBeEnabled();
  });

  test('31.2 Disconnect an integration', async ({ page }) => {
    await openIntegrationsPage(page);
    const disconnect = page.getByRole('button', { name: /Disconnect/i }).filter({ visible: true });
    test.skip(!(await disconnect.count()), 'No connected integration to disconnect');
    await disconnect.first().click();
    await page.waitForTimeout(1500);
    await expect(page.getByText('Integrations').first()).toBeVisible();
  });

  test('31.3 Add custom MCP server via OAuth', async ({ page }) => {
    test.skip(true, 'Requires a live OAuth-based MCP server to complete the popup flow (Automation: No)');
  });

  test('31.4 Add MCP with invalid config', async ({ page }) => {
    const modal = await openCustomMcpModal(page);
    // Name + a malformed URL enable Connect; submitting raises client-side validation.
    await modal.getByPlaceholder('e.g. My Notion MCP').fill('Bad Config');
    await modal.getByPlaceholder('https://your-mcp-server.com/mcp').fill('not-a-valid-url');
    await modal.getByRole('button', { name: /^Connect$/ }).click();
    await expect(modal.getByText(/Please enter a valid URL|valid URL|Both name and URL are required/i)).toBeVisible({ timeout: 10_000 });
  });

  test('31.5 MCP token expiry handling', async ({ page }) => {
    test.skip(true, 'Requires a live connected MCP with an expired token to observe refresh/reconnect (Automation: No)');
  });

  test('31.6 MCP token refresh success', async ({ page }) => {
    test.skip(true, 'Requires a live MCP connection with a refreshable token (Automation: No)');
  });

  test('31.7 Multiple MCP connections coexist', async ({ page }) => {
    test.skip(true, 'Requires multiple live MCP servers to connect and namespace (Automation: No)');
  });

  test('31.8 MCP health check', async ({ page }) => {
    test.skip(true, 'No "test connection"/health-status control exists in the UI (Known Gaps Report)');
  });

  test('31.9 MCP tool listing renders', async ({ page }) => {
    test.skip(true, 'The UI does not render a connected-server tools/capabilities list (Known Gaps Report)');
  });

  test('31.10 MCP server unreachable error state', async ({ page }) => {
    test.skip(
      true,
      'PRODUCT BUG IS CONFIRMED — skipped because the test is SELF-BLOCKING, not because the app is ' +
        'correct. Evidence captured live on dev2: the connections list for the test account still holds ' +
        'a row named "Unreachable MCP 1785173519619" with status:"active", created by an earlier run of ' +
        'this very case — i.e. a well-formed but unreachable MCP URL WAS accepted as a working ' +
        'connection. Root cause: app/api/mcp/custom/route.ts writes status:\'active\' and then fetches ' +
        'tools inside a try/catch that swallows the failure, so the reachability error never surfaces. ' +
        'PDF 31.10 expects an error state + retry. ' +
        'WHY IT CANNOT RUN: mcpconnections has a unique index on (user_id, serverType, accountIndex), ' +
        'so only ONE custom-MCP connection can exist per user. The first run stores the bad row and ' +
        'every later POST returns a 500 duplicate-key error — an earlier revision asserted only ' +
        '`body.success !== true`, which that 500 satisfies, so the case silently went GREEN on the ' +
        'collision and stopped testing reachability at all. The test literally disabled itself by ' +
        'finding the bug. TO RE-ENABLE: delete the leftover custom-MCP connection for the test account ' +
        '(Integrations → remove), then un-skip; it will then fail on the real defect above.'
    );

    // Implementation retained below (unreachable while the skip above is active) so
    // re-enabling is a one-line change once the leftover connection is deleted.
    const modal = await openCustomMcpModal(page);
    await modal.getByPlaceholder('e.g. My Notion MCP').fill('Unreachable MCP ' + Date.now());
    await modal.getByPlaceholder('https://your-mcp-server.com/mcp').fill('https://unreachable-mcp-e2e.invalid/mcp');
    const [resp] = await Promise.all([
      page.waitForResponse((r) => /\/api\/mcp\/custom/.test(r.url()) && r.request().method() === 'POST', { timeout: 45_000 }).catch(() => null),
      modal.getByRole('button', { name: /^Connect$/ }).click(),
    ]);
    expect(resp, 'the app issued the connect request').toBeTruthy();
    const body = await resp!.json().catch(() => ({} as any));
    const raw = JSON.stringify(body).slice(0, 300);

    // INSTRUMENT GUARD — do not remove. `mcpconnections` has a unique index on
    // (user_id, serverType, accountIndex), so once ANY custom-MCP row exists this
    // POST returns a 500 duplicate-key error. A previous revision asserted only
    // `body.success !== true`, which a duplicate-key 500 satisfies — so after the
    // first run had stored an unreachable server, every later run went GREEN on the
    // collision without ever testing reachability. Fail loudly instead of passing.
    if (/E11000|duplicate key/i.test(raw)) {
      throw new Error(
        `INSTRUMENT FAULT (not a pass): the connect POST hit the unique-index duplicate-key error, so reachability was never exercised — ${raw}. ` +
          'Delete the existing custom-MCP connection for the test account (Integrations → remove), then re-run.'
      );
    }

    // The real requirement (PDF 31.10): an unreachable server must NOT be recorded
    // as a working connection. Check what was actually persisted, not just the
    // response shape — a false success is only harmful because it leaves an
    // `active` row behind.
    const listRes = await page.request.get('/api/mcp/connections', { failOnStatusCode: false });
    const listBody = listRes.ok() ? await listRes.json().catch(() => ({})) : {};
    const rows: any[] = Array.isArray(listBody) ? listBody : listBody.connections || [];
    const strandedActive = rows.filter(
      (c) => /unreachable/i.test(String(c.name ?? c.serverName ?? '')) && c.status === 'active'
    );

    expect(
      body.success !== true && strandedActive.length === 0,
      `PRODUCT BUG: an unreachable MCP server is accepted as a working connection — response ${raw}; ` +
        `stored rows still marked active: ${JSON.stringify(strandedActive.map((c) => c.name ?? c.serverName)).slice(0, 200)}. ` +
        'PDF 31.10 expects an error state + retry, not success/active. Root cause: app/api/mcp/custom/route.ts writes ' +
        "status:'active' and then fetches tools inside a try/catch that swallows the failure."
    ).toBeTruthy();
  });

  test('31.11 MCP tool permission consent', async ({ page }) => {
    test.skip(true, 'Requires a live MCP tool that requests elevated scope to trigger the consent prompt (Automation: No)');
  });

  test('31.12 Reconnect integration after failure', async ({ page }) => {
    await openIntegrationsPage(page);
    // Reconnect requires a connected/errored integration to reconnect. With none on
    // this account, skip honestly rather than passing on the always-present
    // "Add Custom MCP" button (which proves nothing about reconnect behaviour).
    const reconnect = page.getByRole('button', { name: /Reconnect|Connect Another Account/i }).filter({ visible: true });
    test.skip(!(await reconnect.count()), 'No connected/errored integration on this account to reconnect (needs a live connection that failed)');
    await expect(reconnect.first()).toBeEnabled();
  });
});
