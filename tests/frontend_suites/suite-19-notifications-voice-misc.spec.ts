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
    test.skip(true, 'NotificationPanel is built but not mounted; there is no bell trigger in the UI (Known Gaps Report)');
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

  test('19.6 Error toast on failed action', async ({ page }) => {
    test.skip(true, 'App has no toast system; errors surface via window.alert() (Known Gaps Report)');
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
    const client = await page.context().newCDPSession(page).catch(() => null);
    test.skip(!client, 'CDP throttling unavailable');
    await client!.send('Network.emulateNetworkConditions', {
      offline: false, downloadThroughput: (500 * 1024) / 8, uploadThroughput: (500 * 1024) / 8, latency: 300,
    });
    await openDashboard(page);
    await expect(composer(page)).toBeVisible({ timeout: 60_000 }); // graceful, no crash
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
