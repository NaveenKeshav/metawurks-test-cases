import { test, expect } from '@playwright/test';
import { config } from '../shared/config';

test.describe('Product Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${config.baseUrl}/product`);
    await page.waitForLoadState('networkidle');
  });

  test('TC09: Product page loads with all feature sections', async ({ page }) => {
    await expect(page.getByText('We Deliver Smart').first()).toBeVisible();
    await expect(page.getByText('Semantic Query Engine')).toBeVisible();
    await expect(page.getByText('Document Intelligence')).toBeVisible();
    await expect(page.getByText('Contextual Memory')).toBeVisible();
    await expect(page.getByText('Secure Access & Audit Logs')).toBeVisible();
  });

  test('TC10: Product page displays stat counters', async ({ page }) => {
    await expect(page.getByText('Embeddings')).toBeVisible();
    await expect(page.getByText('LLM')).toBeVisible();
    await expect(page.getByText('Tokens Capacity')).toBeVisible();
    await expect(page.getByText('File Types')).toBeVisible();
  });

  test('TC11: Product page shows workflow steps', async ({ page }) => {
    await expect(page.getByText('Intelligent Setup')).toBeVisible();
    await expect(page.getByText('Semantic Understanding')).toBeVisible();
    await expect(page.getByText('Personalized Insight Delivery')).toBeVisible();
  });
});