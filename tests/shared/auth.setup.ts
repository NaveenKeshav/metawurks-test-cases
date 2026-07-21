import { test as setup, expect } from '@playwright/test';
import { config } from './config';
import { gotoWithRecaptchaMock } from './recaptcha-helper';

/**
 * Logs in once through the real UI (with reCAPTCHA mocked) and saves the
 * session to .auth/user.json. Every spec in the 'chromium' project starts
 * from that saved session instead of logging in per test.
 */
setup('authenticate', async ({ page }) => {
  setup.skip(!config.login.isConfigured,
    'LOGIN_USERNAME and LOGIN_PASSWORD must be set in .env file. See .env.example.');

  await gotoWithRecaptchaMock(page, `${config.appUrl}/login`);
  await page.locator('#email').fill(config.login.username);
  await page.locator('#password').fill(config.login.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/chat/, { timeout: 30_000 });

  const session = await (await page.request.get('/api/auth/session')).json();
  expect(session?.user?.email?.toLowerCase()).toBe(config.login.username.toLowerCase());

  await page.context().storageState({ path: '.auth/user.json' });
});
