import { test, expect, Page } from '@playwright/test';
import { config } from './config';
import { gotoWithRecaptchaMock } from './recaptcha-helper';

const loginUrl = `${config.appUrl}/login`;

/**
 * Performs a full UI login with credentials from .env configuration.
 * Successful login lands on /chat (LoginForm does router.push('/chat')).
 *
 * Post-login specs normally DON'T need this — they run in the 'chromium'
 * project which reuses the session saved by auth.setup.ts. Use openDashboard()
 * there instead. This helper is for tests that exercise the login flow itself.
 */
export async function loginWithEnvCredentials(page: Page): Promise<void> {
  test.skip(!config.login.isConfigured,
    'LOGIN_USERNAME and LOGIN_PASSWORD must be set in .env file to run this test. ' +
    'See .env.example for reference.');

  await gotoWithRecaptchaMock(page, loginUrl);

  await page.locator('#email').fill(config.login.username);
  await page.locator('#password').fill(config.login.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  await page.waitForURL(/\/chat/, { timeout: 30_000 });
  expect(page.url()).toContain('/chat');
}

/**
 * For specs running with the saved session: open /chat and wait for the
 * dashboard (WelcomeScreen) to be ready.
 */
export async function openDashboard(page: Page): Promise<void> {
  await page.goto('/chat');
  await waitForDashboardLoad(page);
}

/**
 * Waits for the dashboard WelcomeScreen to load — it renders two h1s:
 * "Welcome, {firstName}" and "Let's orchestrate your work!"
 */
export async function waitForDashboardLoad(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: /Let's orchestrate/i })).toBeVisible({ timeout: 20_000 });
}

export { loginUrl };
