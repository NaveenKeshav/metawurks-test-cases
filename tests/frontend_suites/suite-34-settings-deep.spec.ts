import { test, expect, Page } from '@playwright/test';

/**
 * Suite 34 — Settings deep  (PDF TC 34.1–34.13)
 *
 * Authenticated suite. Settings is a MODAL opened via /chat?settings=true. Verified
 * LIVE against dev2, the modal has FOUR tabs: Account, Preferences, Models, and
 * Usage & Billing (app/settings/page.tsx).
 *
 * Reality against dev2 (each guard/real-test is grounded in the live modal):
 *   • Account: Full Name + Email are READ-ONLY FieldRows (no edit/Save → 34.1/34.3
 *     absent); a real "Reset Password" button triggers the reset-link email (there
 *     is NO in-settings password-change form with strength rules → 34.2 absent).
 *   • Preferences: theme cards (34.4, real) + a custom-instructions textarea w/ Save.
 *   • Models (EXISTS): per-model BYOK config — model list, API-key inputs, "Save &
 *     Verify" (34.5, real). This is NOT a MetaWurks-API-key generator, so 34.7–34.9
 *     & 34.13 (generate/verify/revoke API keys) remain absent.
 *   • Usage & Billing: plan + usage (34.6, real).
 *   • No env/database selector in settings → 34.10 absent.
 */

async function openSettings(page: Page, tab?: string) {
  await page.goto(`/chat?settings=true${tab ? `&tab=${tab}` : ''}`);
  await expect(page.getByRole('button', { name: 'Account' }).first()).toBeVisible({ timeout: 15_000 });
}

test.describe('Suite 34 — Settings deep', () => {

  test('34.1 Profile update validation', async ({ page }) => {
    test.skip(true, 'Name/avatar are read-only in settings (no editable fields/Save to validate) — Known Gaps Report');
  });

  test('34.2 Password change rules enforced', async ({ page }) => {
    test.skip(true, 'Settings exposes a real "Reset Password" button (triggers the reset-link email) but NO in-settings password-CHANGE form — the PDF\'s weak/mismatch/valid rule enforcement has no field to exercise. The reset-link flow itself is covered by Suite 3.');
  });

  test('34.3 Email change flow', async ({ page }) => {
    test.skip(true, 'Email is read-only in settings; no change/verification flow — Known Gaps Report');
  });

  test('34.4 Theme toggle light/dark', async ({ page }) => {
    await openSettings(page, 'preferences');
    await expect(page.getByText(/Theme|Choose your theme|Dark/i).first()).toBeVisible({ timeout: 10_000 });
    await page.getByText('Dark', { exact: true }).first().click();
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBeTruthy();
    // Persists across a reload (theme context is localStorage-backed)
    await page.reload();
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBeTruthy();
  });

  test('34.5 Model configuration saved', async ({ page }) => {
    // The Models settings tab genuinely EXISTS on dev2 and renders per-model BYOK
    // configuration loaded from the backend model registry. Real dev2 UI, no mocks.
    await openSettings(page, 'models');
    await expect(page.getByRole('button', { name: 'Models', exact: true }).first()).toBeVisible({ timeout: 10_000 });
    // Model-config controls: a model search/add field, per-model API-key inputs, and
    // a "Save & Verify" action (disabled until a key is entered).
    await expect(page.getByPlaceholder(/Add or search model/i)).toBeVisible({ timeout: 10_000 });
    const keyInput = page.getByPlaceholder(/Enter your .* API key/i).first();
    await expect(keyInput).toBeVisible();
    const saveVerifyAll = page.getByRole('button', { name: /Save & Verify/i });
    const enabledCount = () => saveVerifyAll.evaluateAll((bs) => bs.filter((b) => !(b as HTMLButtonElement).disabled).length);
    expect(await enabledCount(), 'Save & Verify disabled until a key is entered').toBe(0);
    // Typing a key enables a Save & Verify — proves the config form is wired end-to-end.
    await keyInput.fill('sk-e2e-ui-interaction-check');
    await expect.poll(enabledCount, { timeout: 5_000 }).toBeGreaterThan(0);
    // NOTE: actually persisting requires a VALID provider key ("Save & Verify"
    // validates against the live provider), so we do NOT click it. This corrects the
    // false "no Models tab" gap and verifies the feature is real and interactive.
  });

  test('34.6 Usage tab accuracy', async ({ page }) => {
    await openSettings(page, 'usage-billing');
    // Assert REAL usage-panel content (panel-specific labels — NOT the ambiguous
    // "Usage & Billing" nav label, which would pass vacuously). These render live
    // from the backend for this account.
    await expect(page.getByText('Current Plan', { exact: false }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Token Usage', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Storage', { exact: false }).first()).toBeVisible();
    // The live Free-plan token limit renders (1,000,000 — matches mw-metering-service).
    await expect(page.getByText('1,000,000').first()).toBeVisible();
  });

  test('34.7 Generate API key', async ({ page }) => {
    test.skip(true, 'No API Keys tab/feature exists in settings — Known Gaps Report');
  });

  test('34.8 Verify API key works', async ({ page }) => {
    test.skip(true, 'No API Keys feature exists — Known Gaps Report');
  });

  test('34.9 Revoke API key', async ({ page }) => {
    test.skip(true, 'No API Keys feature exists — Known Gaps Report');
  });

  test('34.10 Environment/database switch', async ({ page }) => {
    test.skip(true, 'No env/database selector in the UI (config/.env only) — Known Gaps Report');
  });

  test('34.11 Settings Save actually persists (not a fake success)', async ({ page }) => {
    // PRODUCT BUG (confirmed in app/settings/page.tsx:255): the Preferences "Save"
    // button is onClick={() => alert('Changes saved!')} — it issues NO persistence
    // request, and the custom-instructions field is a local useState('') that is never
    // loaded from or saved to the backend. It falsely reports success every time and
    // cannot show a save error. PDF 34.11 expects a real save with error handling.
    // Assert Save issues a persistence request — this FAILS, surfacing the fake save.
    await openSettings(page, 'preferences');
    const ta = page.getByPlaceholder(/Keep brief and concise|bullet points|instructions/i).first();
    await expect(ta).toBeVisible({ timeout: 10_000 });
    await ta.fill('E2E persistence check ' + Date.now());
    let savedReq = '';
    page.on('request', (r) => {
      if (/^(POST|PUT|PATCH)$/.test(r.method()) &&
          /preference|setting|instruction|profile|account|\/api\/user/i.test(r.url())) savedReq = `${r.method()} ${r.url()}`;
    });
    page.on('dialog', (d) => d.accept().catch(() => {})); // dismiss the fake "Changes saved!" alert
    await page.getByRole('button', { name: 'Save', exact: true }).first().click();
    await page.waitForTimeout(1500);
    expect(
      savedReq,
      'PRODUCT BUG: the Preferences "Save" fires NO persistence request — it only alert("Changes saved!") and never saves (app/settings/page.tsx). PDF 34.11 expects a real save.'
    ).not.toBe('');
  });

  test('34.12 Concurrent settings edit', async ({ page }) => {
    test.skip(true, 'The one editable persisted field (Preferences → custom instructions) exists, but a concurrent-conflict test would mutate the real account across two live sessions and the UI surfaces no deterministic last-write/conflict signal to assert.');
  });

  test('34.13 API key list shows creation date and last-used timestamp', async ({ page }) => {
    test.skip(true, 'No API Keys feature/list exists in settings — Known Gaps Report');
  });
});
