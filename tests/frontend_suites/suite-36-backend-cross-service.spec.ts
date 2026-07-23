import { test, expect } from '@playwright/test';
import { openDashboard } from '../shared/auth-helper';

/**
 * Suite 36 — Backend & Cross-Service Scenarios  (PDF TC 36.1–36.14)
 *
 * API-level suite — "not reachable via frontend UI" per the PDF. These target the
 * internal services (mw-payment-service, mw-action-service-v2, mw-metering-service).
 * This harness has the authenticated dev2 frontend session, which proxies to some
 * of those services through its BFF. REAL dev2 calls, NO mock routing/data.
 *
 * Reachability was verified live against dev2:
 *   • REACHABLE (real tests here): the metering service via GET /api/user/usage —
 *     36.7 (live tokens-monthly quota) and 36.11 (Free-plan reset_at null).
 *   • NOT REACHABLE (honest skips, each naming the real blocker):
 *       - /api/stripe/webhook is a DEPRECATED STUB on the frontend (returns 200
 *         "handled by payment service"); real Stripe-signature enforcement (→400)
 *         and idempotency live on mw-payment-service, which has no frontend proxy
 *         and no webhook secret in this config → 36.1–36.4.
 *       - POST /api/tasks is REMOVED (tasks spawn internally Master→Action), so a
 *         6th-spawn 429 cannot be driven from the frontend → 36.5–36.6.
 *       - /reset-counter has no frontend proxy → 36.10.
 *       - quota-exceeded needs a seeded over-quota account (can't force) → 36.7's
 *         blocked path is noted inside the real test.
 *   • SPEC-vs-DEV2 GAP (verified live): dev2 mw-metering-service supports ONLY
 *     ['tokens-monthly','storage-total']. The PDF's 'vertex-embedding-tokens' and
 *     'vertex-api-calls' return unknown_feature — those quota types are not
 *     deployed on dev2 → 36.8–36.9 skip with that finding.
 */

const SUPPORTED_FEATURES = ['tokens-monthly', 'storage-total']; // the only keys dev2 metering knows

test.describe('Suite 36 — Backend & Cross-Service (API-level)', () => {

  test.beforeEach(async ({ page }) => {
    await openDashboard(page); // establish the authenticated dev2 session for BFF calls
  });

  test('36.1 Webhook rejected without a valid Stripe signature', async () => {
    test.skip(true, 'The frontend /api/stripe/webhook is a DEPRECATED STUB (returns 200 "Webhooks are now handled by payment service", verified live). Real Stripe-signature enforcement (→400, no DB writes) lives on mw-payment-service\'s /api/stripe/webhook, which has no frontend proxy and no webhook secret in the test config — belongs to a payment-service API test.');
  });

  test('36.2 Duplicate webhook delivery is idempotent', async () => {
    test.skip(true, 'Requires a validly-signed Stripe event (webhook secret) delivered twice to mw-payment-service. The frontend webhook route is a deprecated stub — not reachable from this harness.');
  });

  test('36.3 Past-due status remains stale until reconciliation cron runs', async () => {
    test.skip(true, 'Requires seeding a past_due subscription and fixing the card in the live Stripe Customer Portal, then polling mw-payment-service reconciliation — API-level, not reachable via the frontend.');
  });

  test('36.4 Access timing when Stripe cancels for non-payment mid-period', async () => {
    test.skip(true, "Requires Stripe's dunning process to exhaust retries and cancel a subscription, then checking mw-payment-service GET /api/users/{id}/plan — API-level, not reachable via the frontend.");
  });

  test('36.5 6th concurrent task spawn is rejected with 429', async () => {
    test.skip(true, 'POST /api/tasks is REMOVED on the frontend (verified: only GET exists) — tasks spawn internally Master→Action, so a user cannot be driven to 5 pending tasks + a 6th spawn from this harness. MAX_CONCURRENT_TASKS_PER_USER=5 belongs to an mw-action-service-v2 API test.');
  });

  test('36.6 Parallel spawn burst does not exceed concurrency limit', async () => {
    test.skip(true, 'Same blocker as 36.5 — no frontend task-spawn endpoint (POST /api/tasks removed). GAP-55 regression must run against mw-action-service-v2 directly.');
  });

  test('36.7 tokens-monthly quota is tracked and enforced live by the metering service', async ({ page }) => {
    // REAL dev2 call through the BFF to mw-metering-service — no mocks.
    const res = await page.request.get('/api/user/usage?feature_key=tokens-monthly', { failOnStatusCode: false });
    expect(res.status(), 'metering usage endpoint must be reachable on dev2').toBe(200);
    const u = await res.json();
    // The quota mechanism is genuinely live: real numeric usage against a real plan
    // limit, with `allowed`/`remaining` derived correctly from current vs. limit.
    expect(typeof u.current, 'current is a real number').toBe('number');
    expect(typeof u.limit, 'limit is a real number').toBe('number');
    expect(u.limit, 'plan limit is positive').toBeGreaterThan(0);
    expect(u.allowed, 'allowed must reflect current < limit').toBe(u.current < u.limit);
    expect(u.remaining, 'remaining must equal max(0, limit - current)').toBe(Math.max(0, u.limit - u.current));
    // NOTE: exercising the BLOCKED path (allowed:false) needs an account seeded
    // at/over its tokens-monthly quota, which cannot be forced from this harness.
  });

  test('36.8 Quota-exceeded handling for vertex-embedding-tokens', async () => {
    test.skip(true, "dev2 mw-metering-service supports ONLY ['tokens-monthly','storage-total'] — 'vertex-embedding-tokens' returns unknown_feature (verified live). This quota type is not deployed on dev2, so the PDF's 4-feature-key model cannot be exercised here.");
  });

  test('36.9 Quota-exceeded handling for vertex-api-calls', async () => {
    test.skip(true, "dev2 mw-metering-service supports ONLY ['tokens-monthly','storage-total'] — 'vertex-api-calls' returns unknown_feature (verified live). This quota type is not deployed on dev2.");
  });

  test('36.10 Reset-counter rejects non-tokens-monthly feature keys', async () => {
    test.skip(true, 'POST /reset-counter is a direct mw-metering-service endpoint (RESETTABLE_FEATURES={tokens-monthly}) with no frontend proxy — not reachable from this harness.');
  });

  test('36.11 Free-plan usage responses never show a reset date', async ({ page }) => {
    // REAL dev2 metering via the BFF — the test account is Free plan. Verify reset_at
    // is null for every feature key dev2 actually supports. (dev2 metering knows only
    // tokens-monthly + storage-total; the PDF's vertex-* keys are not deployed here.)
    for (const key of SUPPORTED_FEATURES) {
      const res = await page.request.get(`/api/user/usage?feature_key=${key}`, { failOnStatusCode: false });
      expect(res.status(), `usage(${key}) must be reachable`).toBe(200);
      const u = await res.json();
      expect(u.feature_key, 'response echoes the requested feature').toBe(key);
      expect(u.reset_at, `Free-plan reset_at must be null for ${key}`).toBeNull();
    }
  });

  test('36.12 Usage check near a subscription-renewal boundary does not double-count or reset early', async () => {
    test.skip(true, 'Requires timing a usage check/record to land exactly at a subscription period rollover in mw-metering-service (GAP-60-adjacent) — non-deterministic and API-level, not reachable from this harness.');
  });

  test('36.13 External Drive/OneDrive edit reflects in the knowledge library via the real-time webhook path', async () => {
    test.skip(true, 'Requires editing a connected source file directly in Google Drive/OneDrive (external action) then waiting for the file-watcher webhook — not an in-app action, not reachable from this harness.');
  });

  test('36.14 Very large document upload — processing outcome under heavy chunking load', async () => {
    test.skip(true, 'Requires uploading a several-thousand-chunk document and monitoring rag-worker processing to a terminal state over minutes (GAP-63). dev2 processing latency exceeds practical E2E windows (observed >4min in Suite 27), so this is monitored via document status rather than a bounded assertion.');
  });
});
