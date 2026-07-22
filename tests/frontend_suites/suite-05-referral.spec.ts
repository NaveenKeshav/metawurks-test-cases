import { test, expect, Page } from '@playwright/test';
import { config } from '../shared/config';
import { gotoWithRecaptchaMock } from '../shared/recaptcha-helper';

/**
 * Suite 5 — Referral  (PDF TC 5.1–5.6)
 *
 * Signed-out suite on /signup. The referral field is #referralCode; it is
 * validated live (debounced ~500ms) via POST /api/referral/validate.
 * Valid → green "✓ Valid referral from {name}"; invalid → "Invalid referral
 * code". The UI has a single generic invalid state (no distinct expired /
 * self-referral messages), so 5.3/5.6 assert that generic feedback and note
 * the gap.
 */

const signupUrl = `${config.appUrl}/signup`;

async function mockReferral(page: Page, body: object) {
  await page.route('**/api/referral/validate', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  );
}

test.describe('Suite 5 — Referral', () => {

  test('5.1 Valid referral code auto-captured from URL', async ({ page }) => {
    await mockReferral(page, { valid: true, referrerName: 'Referrer One' });
    await gotoWithRecaptchaMock(page, `${signupUrl}?ref=VALID10`);
    // Captured into the field...
    await expect(page.locator('#referralCode')).toHaveValue('VALID10', { timeout: 10_000 });
    // ...and validated live as applicable
    await expect(page.getByText(/Valid referral/i)).toBeVisible({ timeout: 10_000 });
  });

  test('5.2 Invalid referral code rejected', async ({ page }) => {
    await mockReferral(page, { valid: false });
    await gotoWithRecaptchaMock(page, `${signupUrl}?ref=NOTREAL`);
    await expect(page.locator('#referralCode')).toHaveValue('NOTREAL');
    await expect(page.getByText('Invalid referral code')).toBeVisible({ timeout: 10_000 });
    // Signup is still allowed without a referral — the submit button remains present
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
  });

  test('5.3 Expired referral code', async ({ page }) => {
    // The app surfaces a single generic invalid state; there is no distinct
    // "expired" message, so an expired code shows the same invalid feedback.
    await mockReferral(page, { valid: false, reason: 'expired' });
    await gotoWithRecaptchaMock(page, `${signupUrl}?ref=EXP2020`);
    await expect(page.getByText('Invalid referral code')).toBeVisible({ timeout: 10_000 });
  });

  test('5.4 Empty referral field allowed', async ({ page }) => {
    await gotoWithRecaptchaMock(page, signupUrl);
    await expect(page.locator('#referralCode')).toHaveValue('');
    // No invalid indicator when empty, and signup remains available
    await expect(page.getByText('Invalid referral code')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
  });

  test('5.5 Real-time referral validation feedback', async ({ page }) => {
    await mockReferral(page, { valid: true, referrerName: 'Live Referrer' });
    await gotoWithRecaptchaMock(page, signupUrl);
    const field = page.locator('#referralCode');
    // Live/debounced validation fires as the user types
    const req = page.waitForRequest((r) => r.url().includes('/api/referral/validate'), { timeout: 10_000 }).catch(() => null);
    await field.fill('MW-LIVE01');
    expect(await req).toBeTruthy();
    await expect(page.getByText(/Valid referral/i)).toBeVisible({ timeout: 10_000 });
  });

  test('5.6 Self-referral is blocked', async ({ page }) => {
    // The signup referral field has no logged-in identity, so a self-referral
    // is surfaced through the same generic invalid feedback rather than a
    // distinct "cannot use your own code" message (documented gap).
    await mockReferral(page, { valid: false, reason: 'self_referral' });
    await gotoWithRecaptchaMock(page, signupUrl);
    await page.locator('#referralCode').fill('MY-OWN-CODE');
    await expect(page.getByText('Invalid referral code')).toBeVisible({ timeout: 10_000 });
    // (Optional) reference config so the file has access to the test account
    expect(config.appUrl).toContain('http');
  });
});
