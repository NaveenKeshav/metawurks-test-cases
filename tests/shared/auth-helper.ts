import { test, expect, Page } from '@playwright/test';
import { config } from './config';
import { gotoWithRecaptchaMock } from './recaptcha-helper';

const loginUrl = `${config.appUrl}/login`;

/**
 * Performs login with credentials from .env configuration
 */
export async function loginWithEnvCredentials(page: Page): Promise<void> {
  test.skip(!config.login.isConfigured,
    'LOGIN_USERNAME and LOGIN_PASSWORD must be set in .env file to run this test. ' +
    'See .env.example for reference.');

  await gotoWithRecaptchaMock(page, loginUrl);

  // Fill credentials from .env configuration
  await page.getByLabel('Email address').fill(config.login.username);
  await page.getByLabel('Password').fill(config.login.password);

  // Submit the login form
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  // Wait for navigation away from /login (successful authentication)
  await page.waitForURL(url => !url.href.includes('/login'), { timeout: 15000 });

  // Verify we're on the app
  expect(page.url()).not.toContain('/login');
  expect(page.url()).toContain(config.appUrl);
}

/**
 * Performs login with custom credentials
 */
export async function loginWithCredentials(page: Page, username: string, password: string): Promise<void> {
  await gotoWithRecaptchaMock(page, loginUrl);

  await page.getByLabel('Email address').fill(username);
  await page.getByLabel('Password').fill(password);

  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

/**
 * Waits for the dashboard to load after login
 */
export async function waitForDashboardLoad(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: /Let's orchestrate/i })).toBeVisible({ timeout: 15000 });
}

export { loginUrl };