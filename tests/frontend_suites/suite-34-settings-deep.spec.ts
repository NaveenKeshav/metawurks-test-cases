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

  test('34.7 Generate API key', async () => {
    test.skip(
      true,
      'DIFFERENT FEATURE (matches this suite\'s header) — Settings → Models DOES ship an "API Keys" ' +
        'section (ApiKeysSection.tsx → /api/user/api-keys), so the "no API Keys feature" wording was ' +
        'wrong. It is bring-your-own-key: the user pastes an existing provider key. The app never mints ' +
        'one, so there is no "generate → shown once, listed masked afterward" flow to exercise.'
    );
  });

  test('34.8 Verify API key works', async () => {
    test.skip(
      true,
      'DIFFERENT FEATURE — "Save & Verify" is real (PUT /api/user/api-keys, verified backend-side; a bad ' +
        'key returns non-ok and is not stored), but it validates a user-supplied PROVIDER key, not a ' +
        'MetaWurks-issued key making an authorised request. The PDF case depends on 34.7\'s generated key.'
    );
  });

  test('34.9 Revoke API key', async () => {
    test.skip(
      true,
      'DIFFERENT FEATURE — "Remove" (DELETE /api/user/api-keys) deletes the user\'s stored PROVIDER key ' +
        'so the shared MetaWurks key is used again; no issued key is invalidated and no subsequent ' +
        'request starts failing. Driving Remove also requires a real provider key to be stored first.'
    );
  });

  test('34.10 Environment/database switch', async ({ page }) => {
    test.skip(true, 'No env/database selector in the UI (config/.env only) — Known Gaps Report');
  });

  test('34.11 Settings Save actually persists (not a fake success)', async ({ page, context }) => {
    // PDF 34.11 expects settings to persist. PRODUCT BUG (verified LIVE on dev2, not
    // just the source): the Preferences "Save" only pops alert('Changes saved!') and
    // persists NOTHING — it fires no POST/PUT/PATCH, writes no localStorage, and the
    // custom-instructions field is EMPTY again after a reload. This asserts the most
    // direct evidence — the value must survive Save + reload — so it FAILS, surfacing
    // the fake save, and auto-passes if Save ever genuinely persists.
    const taSel = /Keep brief and concise|bullet points|instructions/i;
    await openSettings(page, 'preferences');
    const ta = page.getByPlaceholder(taSel).first();
    await expect(ta).toBeVisible({ timeout: 10_000 });
    const value = 'E2E persistence check ' + Date.now();
    await ta.fill(value);

    let savedReq = '';
    context.on('request', (r) => {
      if (/^(POST|PUT|PATCH)$/.test(r.method()) &&
          /preference|setting|instruction|profile|account|\/api\/user/i.test(r.url())) savedReq = `${r.method()} ${r.url()}`;
    });
    page.on('dialog', (d) => d.accept().catch(() => {})); // dismiss the fake "Changes saved!" alert
    await page.getByRole('button', { name: 'Save', exact: true }).first().click();
    await page.waitForTimeout(1500);

    // The real test of persistence: reopen Preferences after a full reload.
    await page.reload();
    await openSettings(page, 'preferences');
    const persisted = await page.getByPlaceholder(taSel).first().inputValue().catch(() => '');

    expect(
      persisted,
      `PRODUCT BUG: Preferences "Save" does not persist — after Save + reload the custom-instructions field is "${persisted}" (expected "${value}"); Save fired ${savedReq || 'NO persistence request'} and only alert()s "Changes saved!" (app/settings/page.tsx). PDF 34.11 expects settings to persist.`,
    ).toBe(value);
  });

  test('34.12 Concurrent settings edit', async ({ page, context }) => {
    test.setTimeout(120_000);
    // The genuinely-persisted, editable setting is the Models tab's per-model enable
    // toggles (persist via PUT /api/user/models). Edit the SAME setting in two live
    // tabs at once and verify the backend never ends up corrupted/inconsistent.
    const openModels = async (p: Page) => {
      await p.goto('/chat?settings=true&tab=models');
      await expect(p.getByRole('button', { name: 'Account' }).first()).toBeVisible({ timeout: 15_000 });
      await expect(p.getByRole('switch').first()).toBeVisible({ timeout: 15_000 });
    };
    await openModels(page);
    const getModels = () => page.request.get('/api/user/models').then((r) => r.json()).catch(() => null);
    const initial = await getModels();
    const original: string[] | undefined = initial?.enabledModels;
    const allModels: string[] | undefined = initial?.allModels;
    test.skip(
      !Array.isArray(original) || !Array.isArray(allModels) || (allModels?.length ?? 0) < 3,
      'Per-model toggle setting unavailable / too few models to exercise concurrent edits',
    );

    const tabB = await context.newPage();
    await openModels(tabB);
    // Both tabs edit the SAME setting (the first model's toggle) simultaneously.
    await Promise.all([
      page.getByRole('switch').first().click().catch(() => {}),
      tabB.getByRole('switch').first().click().catch(() => {}),
    ]);
    await page.waitForTimeout(2500);

    // No corruption: the persisted list must stay a valid, de-duplicated set of known
    // model ids (dev2 resolves the race with last-write-wins — the PDF's key guarantee
    // is that there is no corrupted/garbled save).
    const ids = (await getModels())?.enabledModels as unknown[];
    expect(Array.isArray(ids), 'enabledModels must remain a valid array after concurrent edits').toBeTruthy();
    expect((ids as unknown[]).every((x) => typeof x === 'string'), 'all entries are valid model-id strings').toBeTruthy();
    expect(new Set(ids).size, 'no duplicate ids introduced by the concurrent writes').toBe((ids as unknown[]).length);
    expect((ids as string[]).every((x) => allModels!.includes(x)), 'every persisted id is a known model').toBeTruthy();
    // Both tabs remain functional (the concurrent edit crashed neither).
    await expect(page.getByRole('switch').first()).toBeVisible();
    await expect(tabB.getByRole('switch').first()).toBeVisible();

    // Restore the original setting (best-effort cleanup, not an assertion).
    await page.request.put('/api/user/models', { data: { enabledModels: original } }).catch(() => {});
    await tabB.close();
  });

  test('34.13 API key list shows creation date and last-used timestamp', async ({ page }) => {
    // CORRECTION: an earlier reason claimed "/api/user/api-keys 404s on dev2". That is
    // WRONG — re-verified live: an unauthenticated GET returns 401 (route deployed,
    // auth required) and /api/user/api-keys/verify returns 405 for GET. The route
    // exists and the Models-tab BYOK section uses it successfully.
    // The case is still unassertable for the reason that actually holds: there is no
    // MetaWurks API-key generator or key LIST (34.7–34.9), and the BYOK payload shape
    // is {provider,label,enabled,hasKey,masked} — no createdAt / lastUsed field is
    // stored or rendered anywhere, so there is no timestamp to assert.
    test.skip(
      true,
      'No API-key created-at/last-used metadata exists: no MetaWurks key generator/list, and the BYOK ' +
        'provider-key payload carries no timestamps (shape is {provider,label,enabled,hasKey,masked}). ' +
        'NOTE: the earlier "/api/user/api-keys 404s" claim was false — the route is deployed on dev2 ' +
        '(401 unauthenticated). TO ENABLE: the feature would need per-key createdAt/lastUsed persisted ' +
        'and surfaced in ApiKeysSection.tsx.'
    );
  });
});
