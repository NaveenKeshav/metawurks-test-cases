import { Page } from '@playwright/test';

/**
 * Real reCAPTCHA Enterprise detects the automated browser and refuses to
 * issue a token, so login/signup submissions die with "reCAPTCHA verification
 * failed" before any credentials are checked. Two-part mock:
 *
 * 1. addInitScript plants a fake `window.grecaptcha.enterprise` before the
 *    page's own JS runs — the app sees it and never loads Google's script.
 * 2. page.route short-circuits the app's server-side check at
 *    /api/recaptcha/verify so the fake token is accepted.
 */
export async function mockRecaptcha(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // @ts-expect-error - test-only global stub
    window.grecaptcha = {
      enterprise: {
        ready: (cb: () => void) => cb(),
        execute: async () => 'mock-token',
      },
    };
  });
  await page.route('**/api/recaptcha/verify', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    })
  );
}

/**
 * Navigates to a URL with reCAPTCHA mocked.
 */
export async function gotoWithRecaptchaMock(page: Page, url: string): Promise<void> {
  await mockRecaptcha(page);
  await page.goto(url);
}
