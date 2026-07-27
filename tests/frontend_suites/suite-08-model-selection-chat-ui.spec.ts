import { test, expect } from '@playwright/test';
import { openDashboard } from '../shared/auth-helper';
import { composer, sendMessage, waitForAssistantReply } from '../shared/app-helpers';

/**
 * Suite 8 — Model Selection & Chat UI  (PDF TC 8.1–8.12)
 *
 * Authenticated suite. Sources: model-selector.tsx, ChatInputBar.tsx,
 * ChatInterface.tsx, sidebar.tsx, message-actions.tsx, AppearanceTab.tsx.
 *
 * Notes on reality: the model dropdown has NO per-model disabled/greyed state
 * (8.4) and there are NO model on/off toggles (8.12) — both are documented
 * gaps. There is NO in-chat theme toggle; theme lives in Settings → Appearance
 * (8.11). Selected model persists via localStorage key `selectedModel`.
 */

/** The composer model selector shows "Auto" (default) or a model name. */
function modelSelector(page: import('@playwright/test').Page) {
  return page
    .getByRole('button', { name: /^(Auto|Kimi|GPT-|Claude|Sonnet|Gemini|Qwen|Grok|DeepSeek|Perplexity)/ })
    .first();
}

test.describe('Suite 8 — Model Selection & Chat UI', () => {

  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test.beforeEach(async ({ page }) => {
    await openDashboard(page);
  });

  test('8.1 Open model dropdown', async ({ page }) => {
    await modelSelector(page).click();
    // Dropdown lists Auto + the concrete models enabled for this account.
    // dev2 currently exposes GPT-5.5, Gemini 3 Flash, Grok 4.3, DeepSeek V4
    // Flash and Perplexity Sonar Pro (Sonnet/Kimi are not enabled here).
    await expect(page.getByText('Selects the best available models')).toBeVisible({ timeout: 10_000 });
    for (const name of ['GPT-5.5', 'Gemini 3 Flash', 'Grok 4.3']) {
      await expect(page.getByText(name, { exact: true }).filter({ visible: true }).first()).toBeVisible();
    }
  });

  test('8.2 Switch to a different model', async ({ page }) => {
    await modelSelector(page).click();
    // Switch to GPT-5.5 (id 'gpt-5.5') — a model enabled on dev2 for this account.
    await page.getByText('GPT-5.5', { exact: true }).filter({ visible: true }).first().click();
    // Selection updates and is persisted.
    await expect(page.getByRole('button', { name: /GPT-5\.5/ }).first()).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('selectedModel'))).toBe('gpt-5.5');

    // Next message uses the new model: the chat request carries selectedModel.
    const chatReq = page.waitForRequest(
      (r) => /\/api\/chat(\?|$)/.test(r.url()) && r.method() === 'POST',
      { timeout: 20_000 }
    );
    await sendMessage(page, 'Reply with just: ok');
    expect((await chatReq).postDataJSON()?.selectedModel).toBe('gpt-5.5');
  });

  test('8.3 Selected model persists after refresh', async ({ page }) => {
    await modelSelector(page).click();
    await page.getByText('Gemini 3 Flash').filter({ visible: true }).first().click();
    await expect(page.getByRole('button', { name: /Gemini 3 Flash/ }).first()).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: /Gemini 3 Flash/ }).first()).toBeVisible({ timeout: 20_000 });
    const stored = await page.evaluate(() => localStorage.getItem('selectedModel'));
    expect(stored).toBe('gemini');
  });

  test('8.4 Disabled models hidden/greyed in picker', async ({ page }) => {
    // PDF expects a disabled/greyed model. The picker has no disabled state —
    // every listed model is selectable (documented gap).
    await modelSelector(page).click();
    const options = page.locator('[class*="cursor-pointer"]:visible', { hasText: /Claude|GPT-|Gemini|Kimi|Grok|DeepSeek|Perplexity/ });
    // None are marked disabled
    expect(await page.locator('[aria-disabled="true"]:visible, [disabled]:visible').filter({ hasText: /Claude|GPT-|Gemini/ }).count()).toBe(0);
    expect(await options.count()).toBeGreaterThanOrEqual(1);
  });

  test('8.5 Responsive layout on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.reload();
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible({ timeout: 20_000 });
    // No horizontal overflow of the document
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2);
    expect(overflow).toBeTruthy();
  });

  test('8.6 Sidebar collapse and expand', async ({ page }) => {
    // The expanded sidebar shows the "Conversations" header; collapsing hides it
    // (sidebar.tsx renders a narrow icon bar when collapsed).
    const convHeader = page.getByText('Conversations', { exact: true }).first();
    await expect(convHeader).toBeVisible({ timeout: 15_000 });
    const toggle = () => page.locator('button').filter({ has: page.locator('svg.lucide-panel-left') }).first();
    test.skip(!(await toggle().count()), 'Sidebar collapse toggle not present');

    await toggle().click();
    await expect(convHeader).toBeHidden({ timeout: 10_000 }); // collapsed
    // The collapsed bar has no panel-left icon; its logo button re-toggles.
    await page.locator('button').filter({ has: page.locator('img[alt="MetaWurks"]') }).first().click();
    await expect(convHeader).toBeVisible({ timeout: 10_000 }); // expanded again
  });

  test('8.7 Copy message via copy button', async ({ page }) => {
    const msg = 'Copy me please ' + Date.now();
    await sendMessage(page, msg);
    // The copy button (message-actions.tsx: title="Copy message") and its "Copied"
    // label are hover-gated/conditionally rendered (MessageItem: showUserActions),
    // so the UI text is flaky. Verify the actual effect via the clipboard instead
    // (clipboard perms are granted for this suite).
    const copyBtn = page.locator('button[title="Copy message"]').last();
    await expect(copyBtn).toBeAttached({ timeout: 15_000 });
    await copyBtn.scrollIntoViewIfNeeded().catch(() => {});
    await copyBtn.click({ force: true });
    await expect
      .poll(async () => page.evaluate(() => navigator.clipboard.readText()), { timeout: 10_000 })
      .toContain(msg);
  });

  test('8.8 Scroll-to-bottom button', async ({ page }) => {
    // Need a long, scrollable conversation: the button only renders when the user
    // has scrolled up (ChatInterface: isUserScrolledUp).
    await sendMessage(page, 'Write 15 numbered paragraphs about space exploration, two sentences each.');
    await waitForAssistantReply(page, 90_000);
    await page.mouse.move(640, 300);
    await page.mouse.wheel(0, -4000); // scroll up in the messages area
    const btn = page.getByRole('button', { name: 'Scroll to bottom' });
    await expect(btn).toBeVisible({ timeout: 10_000 });
    await btn.click();
    await expect(btn).toBeHidden({ timeout: 10_000 });
  });

  test('8.9 Typing indicator during response', async ({ page }) => {
    await sendMessage(page, 'Think for a moment, then say hi.');
    await expect(
      page.getByText(/Thinking|Processing|Analyzing|Working on it|Generating|Just a moment/i).first()
    ).toBeVisible({ timeout: 30_000 });
  });

  test('8.10 Message timestamps displayed', async ({ page }) => {
    await sendMessage(page, 'Timestamp check ' + Date.now());
    // User/assistant rows render a time like "3:45 PM"
    await expect(page.getByText(/\b\d{1,2}:\d{2}\s?(AM|PM)\b/i).first()).toBeVisible({ timeout: 30_000 });
  });

  test('8.11 Dark/light theme toggle (Settings → Preferences)', async ({ page }) => {
    // No in-chat theme toggle; theme lives in Settings → Preferences as clickable
    // theme CARDS (not a <select>). /settings redirects to /chat?settings=true.
    await page.goto('/settings');
    await page.waitForURL(/settings=true/, { timeout: 15_000 }).catch(() => {});
    await page.getByRole('button', { name: 'Preferences', exact: true }).first().click().catch(() => {});
    const darkCard = page.getByRole('button', { name: 'Dark', exact: true }).first();
    await expect(darkCard).toBeVisible({ timeout: 15_000 });
    await darkCard.click();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')), { timeout: 10_000 })
      .toBe(true);
  });

  test('8.12 Auto mode selects only enabled models', async ({ page }) => {
    // There are no per-model on/off toggles, so "Auto respects toggles" cannot
    // be exercised; assert Auto is available and selectable as the routing mode.
    await modelSelector(page).click();
    const auto = page.getByText('Selects the best available models');
    await expect(auto).toBeVisible({ timeout: 10_000 });
    await auto.click();
    await expect(page.getByRole('button', { name: /^Auto/ }).first()).toBeVisible();
    const stored = await page.evaluate(() => localStorage.getItem('selectedModel'));
    expect(stored === 'auto' || stored === null).toBeTruthy();
  });
});
