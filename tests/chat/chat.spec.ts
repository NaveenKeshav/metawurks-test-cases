import { test, expect } from '@playwright/test';
import { openDashboard } from '../shared/auth-helper';

/**
 * Runs with the saved session (chromium project) — no per-test login.
 * The composer is a bare <textarea>; "Ask anything" is a span overlay,
 * not a placeholder attribute, so tests use locator('textarea').
 */
test.describe('Chat / Conversation - Post Login', () => {

  test.beforeEach(async ({ page }) => {
    await openDashboard(page);
  });

  test.describe('Positive Scenarios', () => {

    test('TC82: New Conversation button in sidebar initiates a fresh chat', async ({ page }) => {
      await page.getByText('New Conversation').first().click();
      await expect(page.locator('textarea').first()).toBeVisible();
      await expect(page.getByText('Ask anything')).toBeVisible();
    });

    test('TC83: Chat input accepts and displays typed text', async ({ page }) => {
      const chatInput = page.locator('textarea').first();
      await chatInput.fill('What is the weather today?');
      await expect(chatInput).toHaveValue('What is the weather today?');
    });

    test('TC84: Sending a message gets an AI reply and creates a conversation', async ({ page }) => {
      const chatInput = page.locator('textarea').first();
      await chatInput.fill('What is the capital of France? Reply in one word.');
      await chatInput.press('Enter');

      // Our message renders immediately
      await expect(page.getByText('What is the capital of France?').first()).toBeVisible();

      // The Regenerate button only renders once the assistant reply has
      // finished streaming — that's the "reply is done" signal
      await expect(page.getByRole('button', { name: 'Regenerate' })).toBeVisible({ timeout: 60_000 });
    });

    test('TC85: Opening a recent conversation loads the chat history', async ({ page }) => {
      // Resolve the most recent conversation via the history API, then open it
      const historyRes = await page.request.get('/api/chat/history?page=1&limit=1');
      test.skip(!historyRes.ok(), 'chat history API unavailable');
      const history = await historyRes.json();
      const chats = history.chats || history.conversations || history.data || [];
      test.skip(!Array.isArray(chats) || chats.length === 0, 'no existing conversations to open');

      // /api/chat/history returns { chats: [{ chat_id, id, ... }] } where both
      // fields carry the same chat_id (app/api/chat/history/route.ts)
      const chatId = chats[0].chat_id ?? chats[0].id;
      await page.goto(`/chat/${chatId}`);

      // A finished conversation shows at least one Regenerate action
      await expect(page.getByRole('button', { name: 'Regenerate' }).first()).toBeVisible({ timeout: 30_000 });
    });

    test('TC86: Search in the sidebar is accessible', async ({ page }) => {
      await page.getByText('Search').first().click();
      // Search opens without crashing and we stay in the app
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/chat');
    });

    test('TC87: Chat area displays model router mode options', async ({ page }) => {
      await expect(page.getByText('Auto')).toBeVisible();
    });
  });

  test.describe('Negative Scenarios', () => {

    test('TC88: Empty chat input should not break the UI', async ({ page }) => {
      const chatInput = page.locator('textarea').first();
      await chatInput.fill('');
      await chatInput.press('Enter');
      await expect(chatInput).toBeVisible();
      await expect(page.getByRole('heading', { name: /Let's orchestrate/i })).toBeVisible();
    });

    test('TC89: Very long text in chat input does not break layout', async ({ page }) => {
      const longText = 'A'.repeat(5000);
      const chatInput = page.locator('textarea').first();
      await chatInput.fill(longText);
      await expect(chatInput).toHaveValue(longText);
      await expect(page.getByText('New Conversation')).toBeVisible();
    });

    test('TC90: Chat input with special characters renders correctly', async ({ page }) => {
      const specialChars = '<script>alert("xss")</script> !@#$%^&*()_+-=[]{}|;:,.<>?';
      const chatInput = page.locator('textarea').first();
      await chatInput.fill(specialChars);
      await expect(chatInput).toHaveValue(specialChars);
    });
  });
});
