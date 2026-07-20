import { test, expect } from '@playwright/test';
import { config } from '../shared/config';

test.describe('About Us Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${config.baseUrl}/about-us`);
    await page.waitForLoadState('networkidle');
  });

  test('TC17: About Us page loads with core values', async ({ page }) => {
    await expect(page.getByText('Innovation First')).toBeVisible();
    await expect(page.getByText('Customer-Centric')).toBeVisible();
    await expect(page.getByText('Trust & Security')).toBeVisible();
    await expect(page.getByText('Results-Driven')).toBeVisible();
  });

  test('TC18: Team members section is displayed', async ({ page }) => {
    await expect(page.getByText('Abdul S')).toBeVisible();
    await expect(page.getByText('Andrew John')).toBeVisible();
    await expect(page.getByText('Aditya Rai')).toBeVisible();
    await expect(page.getByText('Sachin')).toBeVisible();
  });

  test('TC19: About Us page has Contact Us CTA', async ({ page }) => {
    await expect(page.getByText('We will be glad to hear from you!')).toBeVisible();
    await expect(page.getByText('Contact Us')).toBeVisible();
  });
});