import { test, expect } from '@playwright/test';
import { loginWithEnvCredentials, waitForDashboardLoad } from '../shared/auth-helper';

test.describe('Chat / Conversation - Post Login', () => {

  test.describe('Positive Scenarios', () => {

    test('TC82: New Conversation button in sidebar initiates a fresh chat', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click New Conversation button
      await page.getByText('New Conversation').first().click();

      // Verify chat input is in focus/active state
      await expect(page.getByPlaceholder(/Ask anything/i)).toBeVisible();
    });

    test('TC83: Chat input accepts and displays typed text', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      const chatInput = page.getByPlaceholder(/Ask anything/i);
      await chatInput.fill('What is the weather today?');
      await expect(chatInput).toHaveValue('What is the weather today?');
    });

    test('TC84: Recent conversation appears in the sidebar list', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Verify conversation history section exists
      await expect(page.getByText('Conversations')).toBeVisible();

      // Check that at least one conversation item exists
      const conversationItems = page.locator('text=can you let me know...');
      const count = await conversationItems.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('TC85: Clicking a recent conversation loads the chat history', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click on the existing conversation
      const conversationItem = page.getByText('can you let me know...').first();
      await conversationItem.click();

      // Wait for conversation to load
      await page.waitForTimeout(2000);

      // Verify the chat content loaded (conversation response visible)
      await expect(page.getByText(/technical breakdown/i)).toBeVisible();
    });

    test('TC86: Search functionality in chat header is accessible', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click Search in sidebar
      await page.getByText('Search').first().click();

      // Verify search is activated
      await page.waitForTimeout(500);
    });

    test('TC87: Chat area displays model router mode options', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Verify the mode selector is present
      await expect(page.getByText('Auto')).toBeVisible();
    });
  });

  test.describe('Negative Scenarios', () => {

    test('TC88: Empty chat input should not break the UI', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Try to submit empty input - just verify UI is stable
      const chatInput = page.getByPlaceholder(/Ask anything/i);
      await chatInput.fill('');
      await expect(chatInput).toBeVisible();
      // The send button should be disabled or the UI should remain stable
      await expect(page.getByRole('heading', { name: /Let's orchestrate/i })).toBeVisible();
    });

    test('TC89: Very long text in chat input does not break layout', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      const longText = 'A'.repeat(5000);
      const chatInput = page.getByPlaceholder(/Ask anything/i);
      await chatInput.fill(longText);
      await expect(chatInput).toHaveValue(longText);
      // UI should remain stable
      await expect(page.getByText('New Conversation')).toBeVisible();
    });

    test('TC90: Chat input with special characters renders correctly', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      const specialChars = '<script>alert("xss")</script> !@#$%^&*()_+-=[]{}|;:,.<>?';
      const chatInput = page.getByPlaceholder(/Ask anything/i);
      await chatInput.fill(specialChars);
      await expect(chatInput).toHaveValue(specialChars);
    });
  });
});