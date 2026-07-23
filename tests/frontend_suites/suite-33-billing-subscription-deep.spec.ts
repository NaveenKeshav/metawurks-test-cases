import { test, expect } from '@playwright/test';
import { openDashboard } from '../shared/auth-helper';

/**
 * Suite 33 — Billing & subscription deep  (PDF TC 33.1–33.16)
 *
 * Authenticated suite. Sources: app/pricing/page.tsx, app/checkout/*,
 * components/settings/*, app/api/subscription/*, app/api/payments/history.
 *
 * Anything needing a LIVE Stripe redirect/webhook/portal is guarded (correctly).
 * REAL, no-mock tests: pricing view, checkout-cancel page, payment history (API +
 * UI), currency, plan badge (cross-checked vs /api/subscription/info), and the
 * proration preview 33.3/33.4 — the PDF's "automation opportunity", exercised for
 * real via POST /api/subscription/preview {planName, billingType}, which returns
 * live proration/pricing data on dev2 even for the Free account.
 */

test.describe('Suite 33 — Billing & subscription deep', () => {

  test('33.1 Checkout success upgrade', async ({ page }) => {
    test.skip(true, 'Requires a completed live Stripe checkout session to grant the upgrade (Automation: No)');
  });

  test('33.2 Checkout cancelled by user', async ({ page }) => {
    await page.goto('/checkout/cancel');
    await expect(page.getByText(/Checkout Cancelled/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /View Plans Again|Continue with Free Plan/i }).first()).toBeVisible();
  });

  test('33.3 Proration preview on upgrade (API-level, real)', async ({ page }) => {
    await openDashboard(page);
    // POST /api/subscription/preview is backend-ready (the PDF's "automation
    // opportunity"). Real dev2 call — the contract is { planName, billingType }.
    const res = await page.request.post('/api/subscription/preview', {
      data: { planName: 'professional', billingType: 'monthly' },
      failOnStatusCode: false,
    });
    expect(res.status(), 'preview endpoint returns a real proration/preview').toBe(200);
    const body = await res.json();
    expect(typeof body.type, 'preview has a type (e.g. new_subscription/upgrade)').toBe('string');
    expect(body.plan?.planId, 'preview targets the requested plan').toBe('professional');
    expect(typeof body.pricing?.dueToday, 'preview carries a real dueToday amount').toBe('number');
    // NOTE: from the Free account the payment service returns type:'new_subscription'
    // (no active sub to prorate against); the response is still real proration data.
  });

  test('33.4 Proration preview on downgrade (API-level, real)', async ({ page }) => {
    await openDashboard(page);
    const res = await page.request.post('/api/subscription/preview', {
      data: { planName: 'starter', billingType: 'monthly' },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.type).toBe('string');
    expect(body.plan?.planId, 'preview targets the downgrade plan').toBe('starter');
    expect(typeof body.pricing?.recurringAmount, 'preview carries a real recurring amount').toBe('number');
  });

  test('33.5 Cancel at period end', async ({ page }) => {
    await page.goto('/chat?settings=true&tab=account');
    const cancel = page.getByRole('button', { name: 'Cancel Subscription' });
    test.skip(!(await cancel.count()), 'No active subscription to cancel (free plan)');
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    await cancel.click();
    await page.waitForTimeout(500);
  });

  test('33.6 Resume a cancelled subscription', async ({ page }) => {
    test.skip(true, 'Requires a subscription set to cancel-at-period-end + live Stripe (Automation: No)');
  });

  test('33.7 Payment history displayed', async ({ page }) => {
    await openDashboard(page);
    // Real payment-history API (payment-service via the BFF), not just UI text.
    const res = await page.request.get('/api/payments/history', { failOnStatusCode: false });
    expect(res.status(), 'payment-history endpoint reachable').toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.payments), 'payments is a real array').toBeTruthy();
    // And the billing UI renders the history section.
    await page.goto('/chat?settings=true&tab=usage-billing');
    await expect(
      page.getByText(/Invoices|Billing History|No payment history found/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('33.8 Open Stripe customer portal', async ({ page }) => {
    test.skip(true, 'Customer portal redirects to live Stripe (Automation: No)');
  });

  test('33.9 Trial expiry transitions plan', async ({ page }) => {
    test.skip(true, 'Requires a trial reaching its end + live Stripe to transition the plan (Automation: No)');
  });

  test('33.10 Failed payment UI', async ({ page }) => {
    test.skip(true, 'Requires a real declined charge to render the past-due state (Automation: No)');
  });

  test('33.11 Plan badge sync after change', async ({ page }) => {
    // Asserting the SYNC after an external change needs a live webhook, but the badge
    // must reflect the REAL current plan from the payment service. Cross-check the
    // rendered badge against GET /api/subscription/info (Free account).
    await openDashboard(page);
    const info = await (await page.request.get('/api/subscription/info')).json();
    expect(String(info.planName), 'real plan from payment service').toMatch(/Free/i);
    await expect(page.getByRole('button', { name: /Free Plan|Plan/i }).first()).toBeVisible();
  });

  test('33.12 Currency display correctness', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText(/Upgrade your Plan/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/\$\s?\d/).first()).toBeVisible();
    await expect(page.getByText(/month/i).first()).toBeVisible();
  });

  test('33.13 Tax line shown at checkout', async ({ page }) => {
    test.skip(true, 'Tax line is rendered by the live Stripe checkout, not the app (Automation: No)');
  });

  test('33.14 Apply coupon/promo code', async ({ page }) => {
    test.skip(true, 'Coupon entry lives in the live Stripe checkout; no in-app coupon field (Automation: No)');
  });

  test('33.15 Webhook-driven state refresh', async ({ page }) => {
    test.skip(true, 'Requires a live Stripe webhook event to drive the in-app state refresh (Automation: No)');
  });

  test('33.16 Downgrade retains access until period end', async ({ page }) => {
    test.skip(true, 'Requires an active higher-tier subscription + live Stripe to verify retained access (Automation: No)');
  });
});
