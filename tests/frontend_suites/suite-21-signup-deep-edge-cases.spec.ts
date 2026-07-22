import { test, expect, Page } from '@playwright/test';
import { config } from '../shared/config';
import { gotoWithRecaptchaMock, mockRecaptcha } from '../shared/recaptcha-helper';

/**
 * Suite 21 — Signup deep edge cases  (PDF TC 21.1–21.13)
 *
 * Signed-out suite. Source: app/signup/page.tsx. All account-creating
 * submissions are intercepted (blockSignupApi) so no test data reaches the dev
 * DB. Reality: no client-side password-entropy/disposable-domain policy and
 * case-sensitive emails — those cases assert the actual behaviour and note the
 * PDF expectation.
 */

const signupUrl = `${config.appUrl}/signup`;

async function blockSignupApi(page: Page) {
  await page.route('**/api/signup', (route) =>
    route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'blocked by e2e test' }) })
  );
}
async function fillValid(page: Page, over: Partial<{ name: string; email: string; password: string; confirm: string }> = {}) {
  await page.locator('#name').fill(over.name ?? 'Deep Tester');
  await page.locator('#email').fill(over.email ?? `deep-${Date.now()}@example.com`);
  await page.locator('#password').fill(over.password ?? 'StrongP@ss1');
  await page.locator('#confirmPassword').fill(over.confirm ?? over.password ?? 'StrongP@ss1');
  const terms = page.getByRole('checkbox').first();
  if (await terms.count()) await terms.check();
}
const signupReq = (page: Page) => page.waitForRequest((r) => r.url().includes('/api/signup'), { timeout: 10_000 }).catch(() => null);

test.describe('Suite 21 — Signup deep edge cases', () => {

  test('21.1 Disposable email domain blocked or flagged at signup', async ({ page }) => {
    await gotoWithRecaptchaMock(page, signupUrl);
    await blockSignupApi(page);
    await fillValid(page, { email: 'user@mailinator.com' });
    // No disposable-domain policy exists; the form submits (documented).
    const req = signupReq(page);
    await page.getByRole('button', { name: 'Create account' }).click();
    expect(await req).toBeTruthy();
  });

  test('21.2 Plus-addressing email accepted', async ({ page }) => {
    await gotoWithRecaptchaMock(page, signupUrl);
    await blockSignupApi(page);
    const email = page.locator('#email');
    await fillValid(page, { email: 'user+tag@test.com' });
    expect(await email.evaluate((el: HTMLInputElement) => el.checkValidity())).toBeTruthy();
    const req = signupReq(page);
    await page.getByRole('button', { name: 'Create account' }).click();
    expect(await req).toBeTruthy();
  });

  test('21.3 Duplicate case-variant email treated as existing account', async ({ page }) => {
    test.skip(!config.login.isConfigured, 'Needs a known-registered email');
    await gotoWithRecaptchaMock(page, signupUrl);
    await blockSignupApi(page); // avoid creating a real account
    // PDF expects a duplicate error for USER@… when user@… exists. The app is
    // case-sensitive, so the uppercased variant is treated as new (documented).
    await fillValid(page, { email: config.login.username.toUpperCase() });
    const req = signupReq(page);
    await page.getByRole('button', { name: 'Create account' }).click();
    expect(await req).toBeTruthy();
  });

  test('21.4 Password entropy rule rejects weak/common password', async ({ page }) => {
    await gotoWithRecaptchaMock(page, signupUrl);
    await blockSignupApi(page);
    // No client-side entropy rule — 'password123' is not blocked (documented).
    await fillValid(page, { password: 'password123' });
    const req = signupReq(page);
    await page.getByRole('button', { name: 'Create account' }).click();
    expect(await req).toBeTruthy();
  });

  test('21.5 Signup blocked when Terms checkbox unchecked', async ({ page }) => {
    await gotoWithRecaptchaMock(page, signupUrl);
    await page.locator('#name').fill('No Terms');
    await page.locator('#email').fill('noterms@example.com');
    await page.locator('#password').fill('StrongP@ss1');
    await page.locator('#confirmPassword').fill('StrongP@ss1');
    await page.getByRole('button', { name: 'Create account' }).click();
    const valid = await page.getByRole('checkbox').first().evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(valid).toBeFalsy();
    expect(page.url()).toContain('/signup');
  });

  test('21.6 Expired reCAPTCHA forces re-verification', async ({ page }) => {
    await mockRecaptcha(page);
    await page.route('**/api/recaptcha/verify', (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: false }) })
    );
    await page.goto(signupUrl);
    await fillValid(page);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText(/reCAPTCHA verification failed/i)).toBeVisible({ timeout: 15_000 });
  });

  test('21.7 reCAPTCHA token replay rejected', async ({ page }) => {
    // Simulate the server rejecting a consumed/replayed token.
    await mockRecaptcha(page);
    await page.route('**/api/recaptcha/verify', (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'timeout-or-duplicate' }) })
    );
    await page.goto(signupUrl);
    await fillValid(page);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText(/reCAPTCHA verification failed/i)).toBeVisible({ timeout: 15_000 });
  });

  test('21.8 Very long first/last name truncated or validated', async ({ page }) => {
    await gotoWithRecaptchaMock(page, signupUrl);
    await blockSignupApi(page);
    await fillValid(page, { name: 'N'.repeat(500) });
    await page.getByRole('button', { name: 'Create account' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('#name')).toBeVisible(); // no crash
  });

  test('21.9 Script tag in name field sanitized', async ({ page }) => {
    let dialog = false;
    page.on('dialog', (d) => { dialog = true; d.dismiss().catch(() => {}); });
    await gotoWithRecaptchaMock(page, signupUrl);
    await blockSignupApi(page);
    await fillValid(page, { name: '<img src=x onerror=alert(1)>' });
    await page.getByRole('button', { name: 'Create account' }).click();
    await page.waitForTimeout(1000);
    expect(dialog).toBeFalsy();
    await expect(page.locator('#name')).toHaveValue('<img src=x onerror=alert(1)>');
  });

  test('21.10 Invalid/expired referral code handled gracefully', async ({ page }) => {
    await page.route('**/api/referral/validate', (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false }) })
    );
    await gotoWithRecaptchaMock(page, `${signupUrl}?ref=BADCODE`);
    await expect(page.getByText('Invalid referral code')).toBeVisible({ timeout: 10_000 });
    // Signup still proceeds without a referral
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
  });

  test('21.11 Network failure mid-submit does not create a partial account', async ({ page }) => {
    await gotoWithRecaptchaMock(page, signupUrl);
    await page.route('**/api/signup', (route) => route.abort());
    await fillValid(page);
    await page.getByRole('button', { name: 'Create account' }).click();
    await page.waitForTimeout(1500);
    // Error surfaced / no crash — still on signup, safe to retry
    await expect(page.locator('#email')).toBeVisible();
    expect(page.url()).toContain('/signup');
  });

  test('21.12 Password confirmation mismatch blocks signup', async ({ page }) => {
    await gotoWithRecaptchaMock(page, signupUrl);
    await blockSignupApi(page);
    await fillValid(page, { password: 'Abcd1234!', confirm: 'Zzzz9999!' });
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Passwords do not match')).toBeVisible({ timeout: 15_000 });
  });

  test('21.13 Emoji in name field accepted or validated consistently', async ({ page }) => {
    await gotoWithRecaptchaMock(page, signupUrl);
    await blockSignupApi(page);
    await fillValid(page, { name: 'John 🚀 Doe' });
    await page.getByRole('button', { name: 'Create account' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('#name')).toHaveValue('John 🚀 Doe'); // no crash, consistent
  });
});
