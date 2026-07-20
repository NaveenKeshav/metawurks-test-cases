import { test, expect } from '@playwright/test';
import { config } from '../shared/config';

test.describe('Footer', () => {
  const pages = ['/', '/product', '/pricing', '/about-us', '/blog', '/contact'];

  test('TC25: Footer is present on all pages with consistent links', async ({ page }) => {
    for (const pagePath of pages) {
      await page.goto(`${config.baseUrl}${pagePath}`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Product').last()).toBeVisible();
      await expect(page.getByText('About Us').last()).toBeVisible();
      await expect(page.getByText('Privacy Policy')).toBeVisible();
      await expect(page.getByText('Terms of Service')).toBeVisible();
      await expect(page.getByText('© 2026 MetaWurks')).toBeVisible();
    }
  });

  test('TC26: Footer contact details are correct', async ({ page }) => {
    await page.goto(config.baseUrl);
    await expect(page.getByText('16192 Coastal Hwy, Lewes, DE 19958')).toBeVisible();
    await expect(page.getByText('+1 914-265-5072')).toBeVisible();
    await expect(page.getByText('admin@metawurks.com')).toBeVisible();
  });
});