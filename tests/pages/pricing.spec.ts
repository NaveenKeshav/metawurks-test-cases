import { test, expect } from '@playwright/test';
import { config } from '../shared/config';

test.describe('Pricing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${config.baseUrl}/pricing`);
    await page.waitForLoadState('networkidle');
  });

  test('TC12: Pricing page displays all plan tiers', async ({ page }) => {
    await expect(page.getByText('Free').first()).toBeVisible();
    await expect(page.getByText('Starter').first()).toBeVisible();
    await expect(page.getByText('Professional').first()).toBeVisible();
    await expect(page.getByText('Enterprise').first()).toBeVisible();
    await expect(page.getByText('Custom Version').first()).toBeVisible();
  });

  test('TC13: Pricing page has monthly/annual billing toggle', async ({ page }) => {
    await expect(page.getByText('Monthly')).toBeVisible();
    await expect(page.getByText('Annually')).toBeVisible();
  });

  test('TC14: Compare Plans table is displayed', async ({ page }) => {
    await expect(page.getByText('Compare Plans')).toBeVisible();
    await expect(page.getByText('Available Models')).toBeVisible();
  });

  test('TC15: Get Started buttons on pricing cards are visible', async ({ page }) => {
    const getStartedButtons = page.getByRole('link', { name: 'Get Started' });
    const count = await getStartedButtons.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('TC16: FAQ accordion section is present', async ({ page }) => {
    await expect(page.getByText('Frequently Asked Questions')).toBeVisible();
    await expect(page.getByText('What is MetaWurks?')).toBeVisible();
  });
});