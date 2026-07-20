import { test, expect } from '@playwright/test';
import { config } from '../shared/config';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(config.baseUrl);
    await page.waitForLoadState('networkidle');
  });

  test('TC01: Home page loads with all key elements', async ({ page }) => {
    await expect(page).toHaveTitle(/MetaWurks/);
    // Header
    await expect(page.getByRole('link', { name: 'MetaWurks Logo' }).first()).toBeVisible();
    // Hero section
    await expect(page.getByRole('button', { name: 'Book a Demo' })).toBeVisible();
    // AI Environments section
    await expect(page.getByText('Conversational AI')).toBeVisible();
    await expect(page.getByText('Deep Analysis')).toBeVisible();
    await expect(page.getByText('Task Automation')).toBeVisible();
    await expect(page.getByText('Knowledge Retrieval')).toBeVisible();
    await expect(page.getByText('Multi-Agent Pipelines')).toBeVisible();
    await expect(page.getByText('Custom Assistants')).toBeVisible();
    // Key Features
    await expect(page.getByText('Proactive Task Assistance')).toBeVisible();
    await expect(page.getByText('Enterprise Workflow Integration')).toBeVisible();
    // Footer
    await expect(page.getByText('© 2026 MetaWurks')).toBeVisible();
  });

  test('TC02: AI Environment cards display Explore links', async ({ page }) => {
    const exploreLinks = page.getByText('Explore');
    const count = await exploreLinks.count();
    expect(count).toBe(6); // 6 environment cards
  });

  test('TC03: Home page model router section is displayed', async ({ page }) => {
    await expect(page.getByText('GPT-5').first()).toBeVisible();
    await expect(page.getByText('Claude').first()).toBeVisible();
    await expect(page.getByText('Gemini').first()).toBeVisible();
    await expect(page.getByText('Llama').first()).toBeVisible();
    await expect(page.getByText('Mistral').first()).toBeVisible();
  });

  test('TC04: Dashboard preview section displays stats', async ({ page }) => {
    await expect(page.getByText('Total Requests')).toBeVisible();
    await expect(page.getByText('Avg Latency')).toBeVisible();
    await expect(page.getByText('Active Models')).toBeVisible();
    await expect(page.getByText('Cost Saved')).toBeVisible();
  });
});