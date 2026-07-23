import { test, expect } from '@playwright/test';
import { openDashboard } from '../shared/auth-helper';
import { composer, sendMessage, openDataLibrary } from '../shared/app-helpers';

/**
 * Suite 26 — Error handling & resilience  (PDF TC 26.1–26.13)
 *
 * Authenticated suite. Sources: stream-manager-context.tsx, ChatInputBar.tsx,
 * app/api/* proxy routes, ProjectsCreateDialog.tsx.
 *
 * These cases inject a FAULT (500/429/abort/malformed) on the REAL dev2 endpoint
 * (POST /api/chat is the real streaming-send target) and verify the real app's
 * response — resilience testing, not mocking a success. Each asserts the fault was
 * genuinely exercised (poll on `hit`/`attempted`) before checking behaviour.
 *
 * PRODUCT BUG surfaced (verified live): the CHAT error path recovers SILENTLY — on a
 * 500 / 429 / network-drop the app shows NO error message, toast, or banner (the
 * user's message just stays, composer editable). The PDF requires user-facing error
 * feedback, so 26.1/26.2/26.3 assert that feedback and FAIL by design until the app
 * adds it. Other real gaps found: NO React error boundary (26.7) and no toast dedup
 * (26.6). Cases we cannot force deterministically or that live server-side (error
 * boundary, backoff timing) are guarded with a documented, source-backed reason.
 */

test.describe('Suite 26 — Error handling & resilience', () => {

  test.beforeEach(async ({ page }) => {
    await openDashboard(page);
  });

  test('26.1 Backend 500 shows a user-friendly error message', async ({ page }) => {
    // Inject a real 500 on the chat send. SPEC (PDF 26.1): show a user-friendly error.
    // Correct behaviours (asserted, and they hold): no raw stack is leaked. BUG this
    // surfaces (verified live): the app shows NO error at all — no message/toast/banner
    // — so the final assertion FAILS, flagging the missing error-feedback defect.
    let hit = false;
    await page.route('**/api/chat', (route) => {
      hit = true;
      return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'internal' }) });
    });
    await sendMessage(page, 'Please reply to this test message.');
    await expect.poll(() => hit, { timeout: 15_000 }).toBeTruthy();
    await expect(page.getByText(/at Object\.|node_modules|Traceback|\.ts:\d+/i)).toHaveCount(0); // no stack leak (correct)
    await expect(
      page.getByText(/error|failed|went wrong|try again|unable|could not|problem|retry|something/i).filter({ visible: true }).first(),
      'PRODUCT BUG: no user-facing error is shown after a backend 500 (PDF 26.1 requires a friendly error message)'
    ).toBeVisible({ timeout: 8_000 });
  });

  test('26.2 429 rate-limit shows a clear retry-after notice', async ({ page }) => {
    // SPEC (PDF 26.2): a rate-limit notice with a retry hint. BUG (verified live): the
    // app shows nothing on a 429 — this assertion FAILS, flagging the missing notice.
    let hit = false;
    await page.route('**/api/chat', (route) => {
      hit = true;
      return route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ error: 'rate_limited' }) });
    });
    await sendMessage(page, 'Please reply to this test message.');
    await expect.poll(() => hit, { timeout: 15_000 }).toBeTruthy();
    await expect(
      page.getByText(/rate.?limit|too many|slow down|try again|wait|retry|error|failed/i).filter({ visible: true }).first(),
      'PRODUCT BUG: no rate-limit notice is shown after a 429 (PDF 26.2 requires a clear retry-after notice)'
    ).toBeVisible({ timeout: 8_000 });
  });

  test('26.3 Offline mode shows a banner and disables/queues send', async ({ page }) => {
    // SPEC (PDF 26.3): an offline banner + disabled/queued send. BUG (verified live):
    // sending while the request cannot reach the server shows no offline banner or
    // error — this assertion FAILS, flagging the missing offline handling.
    let attempted = false;
    await page.route('**/api/chat', (route) => {
      attempted = true;
      return route.abort();
    });
    await sendMessage(page, 'Please reply to this test message.');
    await expect.poll(() => attempted, { timeout: 15_000 }).toBeTruthy();
    await expect(
      page.getByText(/offline|no (internet|connection|network)|failed|error|try again|reconnect|unable/i).filter({ visible: true }).first(),
      'PRODUCT BUG: no offline banner/error when a send cannot reach the server (PDF 26.3 requires an offline banner + disabled/queued send)'
    ).toBeVisible({ timeout: 8_000 });
  });

  test('26.4 Slow network shows loading spinner, not blank UI', async ({ page }) => {
    const client = await page.context().newCDPSession(page).catch(() => null);
    test.skip(!client, 'CDP throttling unavailable on this browser');
    await client!.send('Network.emulateNetworkConditions', {
      offline: false, downloadThroughput: (500 * 1024) / 8, uploadThroughput: (500 * 1024) / 8, latency: 300,
    });
    await page.goto('/pricing');
    // A spinner or the eventual content appears — never an indefinitely blank page
    await expect(
      page.locator('.animate-spin').first().or(page.getByText(/Upgrade your Plan/i))
    ).toBeVisible({ timeout: 30_000 });
  });

  test('26.5 Request timeout triggers retry option', async ({ page }) => {
    test.skip(true, 'A timeout + "please try again" affordance exists ONLY in the skills-run card and skill Compile ("timed out — please try again"), both 403-gated for this account; the reachable chat/list UI has no generic request-timeout+Retry control to exercise.');
  });

  test('26.6 Duplicate toasts are deduplicated', async ({ page }) => {
    test.skip(true, 'react-hot-toast is mounted but the CHAT error path recovers silently (no toast to duplicate), and the app does not pass toast ids for dedup — there is no deterministic duplicate-toast condition to exercise from E2E.');
  });

  test('26.7 React error boundary catches render error and shows fallback', async ({ page }) => {
    // FINDING: the app has NO custom React error boundary — no ErrorBoundary
    // component and no app/error.tsx or app/global-error.tsx. There is no fallback
    // to assert, and a render error cannot be forced deterministically from E2E
    // without code changes. (Worth flagging as a product gap: an uncaught render
    // error can white-screen with no app-specific fallback.)
    test.skip(true, 'No React error boundary / error.tsx / global-error.tsx exists in the app (verified in source) — no fallback UI to assert, and a render error cannot be forced from E2E');
  });

  test('26.8 Stale data refreshes on window refocus/revalidation', async ({ page }) => {
    // The Data Library (KnowledgeSourcePage) DOES revalidate on focus: a
    // `visibilitychange` listener refetches GET /api/documents when the tab becomes
    // visible again. Simulate the refocus and assert the real revalidation fetch
    // fires — no mock.
    await openDataLibrary(page);
    await page.waitForTimeout(1500); // let the initial load settle
    let refetched = false;
    page.on('request', (r) => { if (/\/api\/documents/.test(r.url()) && r.method() === 'GET') refetched = true; });
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await expect.poll(() => refetched, { timeout: 10_000 }).toBeTruthy();
  });

  test('26.9 Optimistic update rolls back on failure', async ({ page }) => {
    // Project creation is optimistic; a failed POST must not leave a phantom row.
    let postAttempted = false;
    await page.route('**/api/projects', (route) => {
      if (route.request().method() === 'POST') { postAttempted = true; return route.abort(); }
      return route.continue();
    });
    const header = page.getByRole('button', { name: 'Projects' });
    await header.hover();
    const newProject = page.getByRole('button', { name: 'New project' }).first();
    test.skip(!(await newProject.count()), 'New project control not reachable');
    await newProject.click();
    const name = 'RollbackProj ' + Date.now();
    await page.locator('#project-name').fill(name);
    await page.getByRole('button', { name: 'Create Project' }).click();
    // The create was actually attempted (and made to fail)…
    await expect.poll(() => postAttempted, { timeout: 15_000 }).toBeTruthy();
    await page.waitForTimeout(1500);
    // …and no phantom project row persists after the failure.
    await expect(page.getByRole('button', { name }).first()).toHaveCount(0);
  });

  test('26.10 Malformed JSON response handled without crash', async ({ page }) => {
    // Corrupt whichever list endpoint the chat shell loads (conversations/history),
    // and prove at least one was actually served the bad body before asserting
    // the app still renders (otherwise this test would pass vacuously).
    let served = false;
    await page.route(/\/api\/(chat\/history|chats|conversations)(\?|$)/, (route) => {
      served = true;
      return route.fulfill({ status: 200, contentType: 'application/json', body: 'not-valid-json{' });
    });
    await page.reload();
    await expect(composer(page)).toBeVisible({ timeout: 20_000 });
    test.skip(!served, 'Chat shell did not request a JSON list endpoint on load — malformed-JSON path not exercised here');
    expect(served).toBeTruthy();
  });

  test('26.11 Retry uses exponential backoff, not a tight loop', async ({ page }) => {
    test.skip(true, 'Exponential backoff IS implemented (lib/metering-client.ts, MAX_RETRIES=2) but SERVER-SIDE in the BFF/Node layer — it is not observable from the browser, so there is no frontend E2E signal to assert the backoff spacing.');
  });

  test('26.12 Error message does not leak sensitive info (tokens/paths)', async ({ page }) => {
    const secret = 'sk_secret_' + Date.now();
    let hit = false;
    await page.route('**/api/chat', (route) => {
      hit = true;
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'internal', token: secret, path: 'C:/app/secret/keys.env' }),
      });
    });
    await sendMessage(page, 'Trigger an error that must not leak secrets.');
    await expect.poll(() => hit, { timeout: 15_000 }).toBeTruthy(); // the leaky 500 body was genuinely returned
    await page.waitForTimeout(1500);
    // The secret token / server path from the error body must never reach the DOM
    await expect(page.getByText(secret)).toHaveCount(0);
    await expect(page.getByText('C:/app/secret/keys.env')).toHaveCount(0);
  });

  test('26.13 Unhandled promise rejection does not crash the app', async ({ page }) => {
    await page.evaluate(() => {
      // Fire-and-forget rejection with no catch handler
      Promise.reject(new Error('e2e-unhandled-rejection'));
    });
    await page.waitForTimeout(1000);
    // UI remains responsive — the rejection is not fatal
    await expect(composer(page)).toBeVisible();
  });
});
