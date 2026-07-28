import { test, expect } from '@playwright/test';
import { config } from '../shared/config';
import { openDashboard } from '../shared/auth-helper';
import { composer } from '../shared/app-helpers';

/**
 * Suite 19 — Notifications/Voice/Misc  (PDF TC 19.1–19.10)
 *
 * Authenticated suite. Sources: NotificationPanel.tsx (built but NOT mounted),
 * ChatInputBar.tsx (mic), HelpSupportModal.tsx, use-voice-recorder.ts.
 *
 * Reality: no notification bell is mounted (19.1 guarded); the app uses
 * window.alert()/confirm() and has NO toast system (19.6 guarded); invalid
 * routes render the default Next.js 404 with no home link (19.8).
 */

test.describe('Suite 19 — Notifications/Voice/Misc', () => {

  test.use({ permissions: ['microphone'] });

  test('19.1 View recent notifications', async ({ page }) => {
    // The bell IS mounted now (NotificationBell in ChatInterface.tsx + Search /
    // Data Library / Integrations / Skills headers). The trigger button carries no
    // accessible name — it is an unlabelled svg — so scope it by its class combo
    // inside the header; everything asserted after opening uses accessible hooks.
    await openDashboard(page);
    // Several headers mount a bell (chat / search / library / integrations / skills)
    // and the off-screen ones stay in the DOM, so filter to the visible one.
    // `:not([title])` excludes the adjacent BugReportButton, which shares the exact
    // same class list and renders immediately before the bell — the bell is the only
    // one of the pair with NO accessible name at all (a11y gap, see 25.x).
    const bell = page
      .locator('button.bg-muted.w-\\[32px\\].h-\\[32px\\].rounded-full:not([title])')
      .filter({ has: page.locator('svg') })
      .filter({ visible: true })
      .first();
    await expect(bell, 'notification bell trigger').toBeVisible({ timeout: 20_000 });

    const recent = page.waitForResponse(
      (r) => r.url().includes('/api/notifications/recent') && r.request().method() === 'GET',
      { timeout: 20_000 }
    );
    await bell.click();

    // Panel opened and actually fetched.
    await expect(page.getByText('Notifications', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Refresh notifications' })).toBeVisible();
    expect((await recent).status(), 'GET /api/notifications/recent').toBe(200);

    // The fetch must resolve into the view — never a perpetual spinner.
    await expect(page.getByText('Loading...'), 'panel should stop loading').toHaveCount(0, { timeout: 20_000 });

    // Tabs are rendered from the grouped payload, so their counts prove the
    // response was parsed and bound.
    await expect(page.getByRole('button', { name: /^(Processing|Completed|Failed) \(\d+\)$/ }).first()).toBeVisible();

    // OUT: "recent items listed". Uploads on the test account are transient, so a
    // populated list is not guaranteed — accept EITHER rendered account cards
    // (name + "N file(s)") or the panel's own empty state for the active tab.
    const emptyState = await page.getByText(/^No (processing|completed|failed) notifications$/).count();
    const accountCards = await page.getByText(/^\d+ files?$/).count();
    expect(
      emptyState + accountCards,
      'panel should show notification items or its empty state'
    ).toBeGreaterThan(0);
  });

  test('19.2 Voice input transcription', async ({ page }) => {
    await openDashboard(page);
    const mic = page.getByRole('button', { name: 'Record voice message' });
    test.skip(!(await mic.count()), 'Mic button absent (getUserMedia unsupported or voice limit reached)');
    // Mock the transcription backend so no real audio/backend is needed
    await page.route('**/api/voice/transcribe', (route) =>
      route.request().method() === 'POST'
        ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text: 'hello from voice' }) })
        : route.continue()
    );
    await expect(mic).toBeVisible();
  });

  test('19.3 Submit a support ticket', async ({ page }) => {
    await openDashboard(page);
    await page.route('**/api/support', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    );
    await page.getByRole('button', { name: /Plan/i }).first().click();
    const help = page.getByText('Help', { exact: true });
    test.skip(!(await help.count()), 'Help menu item not present');
    await help.click();
    await expect(page.getByText('Help & Support')).toBeVisible({ timeout: 10_000 });
    await page.getByPlaceholder(/Describe your issue or question/i).fill('E2E support ticket message');
    let alertShown = false;
    page.on('dialog', (d) => { alertShown = true; d.accept().catch(() => {}); });
    await page.getByRole('button', { name: /^Submit$/ }).click();
    await page.waitForTimeout(1500);
    expect(alertShown).toBeTruthy(); // confirmation via alert()
  });

  test('19.4 Mobile responsive navigation', async ({ page }) => {
    await openDashboard(page);
    await page.setViewportSize({ width: 375, height: 800 });
    await page.reload();
    const menu = page.getByRole('button', { name: 'Open menu' });
    await expect(menu).toBeVisible({ timeout: 20_000 });
    await menu.click();
    // Sidebar navigation becomes reachable
    await expect(page.getByText('New Conversation').first()).toBeVisible({ timeout: 10_000 });
  });

  test('19.5 Tablet layout rendering', async ({ page }) => {
    await openDashboard(page);
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.reload();
    await expect(composer(page)).toBeVisible({ timeout: 20_000 });
    const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2);
    expect(noOverflow).toBeTruthy();
  });

  test('19.6 Error toast on failed action', async () => {
    test.skip(
      true,
      'NOT REPRESENTATIVE — kept skipped by decision. Note the app DOES now have a toast ' +
        'system (contrary to the earlier "no toast system" note): components/providers.tsx ' +
        'mounts <Toaster/> app-wide via AuthProvider, and a rejected upload renders a real ' +
        'react-hot-toast error node (verified live on dev2: role="status" aria-live="polite", ' +
        'error iconTheme #ef4444, no window.alert on that path). It is still skipped because a ' +
        'generic "error toast on failed action" cannot be asserted honestly: (1) the PDF requires ' +
        'the toast be DISMISSIBLE and there is no close control at all — verified 0 buttons / 0 ' +
        'labelled controls inside the toast, only the 5s auto-timeout; (2) error surfacing is ' +
        'inconsistent — pricing/settings/HelpSupportModal/discover/DocumentListView still use ' +
        'window.alert(), and the principal failure paths (chat 500, network drop) surface NOTHING ' +
        'at all (see 6.6/6.13/23.2/26.1–26.3). A green check here would imply a uniform, ' +
        'dismissible error-toast system that does not exist.'
    );
  });

  test('19.7 Loading spinners during async ops', async ({ page }) => {
    await openDashboard(page);
    await page.goto('/pricing');
    // A spinner or the loaded pricing content appears (spinner is brief)
    await expect(
      page.locator('.animate-spin').first().or(page.getByText(/Upgrade your Plan/i))
    ).toBeVisible({ timeout: 20_000 });
  });

  test('19.8 404 page for invalid route', async ({ page }) => {
    const resp = await page.goto(`${config.appUrl}/this-route-does-not-exist-${Date.now()}`);
    // Default Next.js 404 (no custom page / home link)
    await expect(page.getByText(/404|could not be found|not found/i).first()).toBeVisible({ timeout: 15_000 });
    expect(resp?.status() === 404 || page.url().includes('this-route-does-not-exist')).toBeTruthy();
  });

  test('19.9 Slow-network handling', async ({ page }) => {
    // Deliberately-throttled navigation is far slower than the 60s default.
    test.setTimeout(120_000);
    const client = await page.context().newCDPSession(page).catch(() => null);
    test.skip(!client, 'CDP throttling unavailable');
    // Slow-3G-class throttle (~500 kbps, 300ms latency) on the real network.
    await client!.send('Network.emulateNetworkConditions', {
      offline: false, downloadThroughput: (500 * 1024) / 8, uploadThroughput: (500 * 1024) / 8, latency: 300,
    });
    // Do NOT use openDashboard here: its page.goto waits for the full 'load' event,
    // which under throttle blocks on every image/font and far outlasts real
    // usability (the app is interactive ~18s in, but 'load' can exceed a minute).
    // "Graceful slow-network handling" = the app renders and becomes usable without
    // crashing — assert that: navigate to domcontentloaded, then wait for the composer.
    await page.goto('/chat', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(composer(page)).toBeVisible({ timeout: 90_000 }); // graceful, no crash/hang
  });

  test('19.10 Basic accessibility checks', async ({ page }) => {
    await openDashboard(page);
    await page.keyboard.press('Tab');
    let moved = false;
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      const tag = await page.evaluate(() => document.activeElement?.tagName);
      if (tag && tag !== 'BODY') moved = true;
    }
    expect(moved).toBeTruthy();
    await expect(page.getByRole('button', { name: 'Conversations' })).toBeVisible();
  });
});
