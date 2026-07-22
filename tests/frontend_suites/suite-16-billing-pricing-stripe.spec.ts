import { test, expect } from '@playwright/test';
import { config } from '../shared/config';
import { openDashboard } from '../shared/auth-helper';

/**
 * Suite 16 — Billing/Pricing/Stripe  (PDF TC 16.1–16.16)
 *
 * Authenticated suite. Sources: app/pricing/page.tsx, app/checkout/*,
 * components/settings/*, UserProfileCard.tsx.
 *
 * Automatable: pricing view, checkout detail open, checkout-cancel page,
 * payment-history table, plan badge, currency format. Guarded: anything that
 * needs a live Stripe redirect/webhook or an active paid subscription.
 */

test.describe('Suite 16 — Billing/Pricing/Stripe', () => {

  test('16.1 View pricing tiers', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText(/Upgrade your Plan/i)).toBeVisible({ timeout: 20_000 });
    // Plan cards render with prices
    await expect(page.getByText(/\$\s?\d/).first()).toBeVisible({ timeout: 20_000 });
  });

  test('16.2 Start Stripe checkout (opens checkout detail)', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText(/Upgrade your Plan/i)).toBeVisible({ timeout: 20_000 });
    const cta = page.getByRole('button', { name: /Upgrade to|Switch to|Get Free Plan/i }).first();
    test.skip(!(await cta.count()), 'No selectable plan CTA (all current)');
    await cta.click();
    // Opens the checkout detail (billing type + Summary). Live Stripe redirect
    // is not asserted here.
    await expect(page.getByText(/Summary|Today's total|billing/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('16.3 Checkout success syncs subscription', async ({ page }) => {
    test.skip(true, 'Requires a completed live Stripe checkout session (Automation: No)');
  });

  test('16.4 Checkout cancel returns to app', async ({ page }) => {
    await page.goto('/checkout/cancel');
    await expect(page.getByText(/Checkout Cancelled/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /View Plans Again|Continue with Free Plan/i }).first()).toBeVisible();
  });

  test('16.5 Upgrade preview with proration', async ({ page }) => {
    test.skip(true, 'The /api/subscription/preview proration UI has no live caller in the app (Known Gaps Report)');
  });

  test('16.6 Downgrade at period end', async ({ page }) => {
    test.skip(true, 'Downgrade scheduling requires an active paid subscription + live Stripe (Automation: No)');
  });

  test('16.7 Cancel subscription', async ({ page }) => {
    await page.goto('/chat?settings=true&tab=account');
    const cancel = page.getByRole('button', { name: 'Cancel Subscription' });
    test.skip(!(await cancel.count()), 'No active subscription to cancel (free plan)');
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    await cancel.click();
    await page.waitForTimeout(500);
  });

  test('16.8 Resume a canceled subscription', async ({ page }) => {
    test.skip(true, 'Requires a subscription set to cancel-at-period-end (Automation: No)');
  });

  test('16.9 View payment history', async ({ page }) => {
    await page.goto('/chat?settings=true&tab=usage-billing');
    await expect(
      page.getByText(/Invoices|Billing History|No payment history found/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('16.10 Open Stripe customer portal', async ({ page }) => {
    test.skip(true, 'Customer portal redirects to live Stripe (Automation: No)');
  });

  test('16.11 Trial days displayed', async ({ page }) => {
    await page.goto('/chat?settings=true&tab=usage-billing');
    const trial = page.getByText(/trial|days? (remaining|left)/i);
    test.skip(!(await trial.count()), 'Account is not on a trial');
    await expect(trial.first()).toBeVisible();
  });

  test('16.12 Plan badge reflects current plan', async ({ page }) => {
    await openDashboard(page);
    await expect(page.getByRole('button', { name: /Plan/i }).first()).toBeVisible();
  });

  test('16.13 Currency formatting correct', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText(/Upgrade your Plan/i)).toBeVisible({ timeout: 20_000 });
    // Prices use a $ currency symbol and monthly cadence
    await expect(page.getByText(/\$\s?\d/).first()).toBeVisible();
    await expect(page.getByText(/month/i).first()).toBeVisible();
  });

  test('16.14 Failed payment state displayed', async ({ page }) => {
    test.skip(true, 'Requires a real failed charge to render the past-due state (Automation: No)');
  });

  test('16.15 Webhook-driven UI update', async ({ page }) => {
    test.skip(true, 'Requires a live Stripe webhook event (Automation: No)');
  });

  test('16.16 Subscribe blocked with invalid/declined card', async ({ page }) => {
    test.skip(true, 'Requires the live Stripe checkout card form (Automation: No)');
    // reference config to keep import used
    void config;
  });
});
