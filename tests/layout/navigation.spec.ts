import { test, expect } from '@playwright/test';
import { config } from '../shared/config';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(config.baseUrl);
    await page.waitForLoadState('networkidle');
  });

  test('TC05: Header navigation links navigate to correct pages', async ({ page }) => {
    const navLinks = [
      { name: 'Home', url: '/' },
      { name: 'Product', url: '/product' },
      { name: 'Pricing', url: '/pricing' },
      { name: 'About Us', url: '/about-us' },
      { name: 'Blog', url: '/blog' },
      { name: 'Contact', url: '/contact' },
    ];
    for (const link of navLinks) {
      const navEl = page.getByRole('link', { name: link.name }).first();
      await expect(navEl).toBeVisible();
      await navEl.click();
      await page.waitForLoadState('networkidle');
      const expectedUrl = link.url === '/' ? config.baseUrl : `${config.baseUrl}${link.url}`;
      await expect(page).toHaveURL(expectedUrl);
      // Navigate back to home for next iteration
      await page.goto(config.baseUrl);
      await page.waitForLoadState('networkidle');
    }
  });

  test('TC06: Logo links back to home page', async ({ page }) => {
    await page.goto(`${config.baseUrl}/pricing`);
    await page.waitForLoadState('networkidle');
    await page.getByAltText('MetaWurks Logo').first().click();
    await expect(page).toHaveURL(config.baseUrl);
  });

  test('TC07: Sign In button navigates to external app login', async ({ page }) => {
    const signInBtn = page.getByRole('button', { name: 'Sign In' });
    await expect(signInBtn).toBeVisible();
    await expect(signInBtn).toHaveText('Sign In');
  });

  test('TC08: Get Started button navigates to external early access page', async ({ page }) => {
    const getStartedBtn = page.getByRole('link', { name: 'Get Started' }).first();
    await expect(getStartedBtn).toBeVisible();
    await expect(getStartedBtn).toHaveText('Get Started');
  });
});