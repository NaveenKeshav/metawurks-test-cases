import { test, expect } from '@playwright/test';
import { config } from '../shared/config';

test.describe('Contact Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${config.baseUrl}/contact`);
    await page.waitForLoadState('networkidle');
  });

  test('TC23: Contact page loads with form fields', async ({ page }) => {
    await expect(page.getByText('We will be glad to hear from you!')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Subject' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Message' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
    await expect(page.getByText('I agree to terms and conditions')).toBeVisible();
  });

  test('TC24: Contact page displays company contact info', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Phone' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Office' })).toBeVisible();

    await expect(page.getByRole('link', { name: 'Email admin@metawurks.com' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Phone +1 914-265-' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Office 16192 Coastal Hwy,' })).toBeVisible();
  });
});