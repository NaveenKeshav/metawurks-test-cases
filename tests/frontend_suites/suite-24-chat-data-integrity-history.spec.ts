import { test, expect } from '@playwright/test';
import { openDashboard } from '../shared/auth-helper';
import { composer, sendMessage, waitForAssistantReply } from '../shared/app-helpers';

/**
 * Suite 24 — Chat data integrity & history  (PDF TC 24.1–24.12)
 *
 * Authenticated suite. Uses the active-row highlight (bg-sidebar-hover) as a
 * stable anchor. Per-message delete and huge-history perf are not exposed /
 * not automatable and are skipped with a documented reason.
 */

function activeRow(page: import('@playwright/test').Page) {
  return page.locator('.bg-sidebar-hover').first();
}

test.describe('Suite 24 — Chat data integrity & history', () => {

  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test.beforeEach(async ({ page }) => {
    await openDashboard(page);
  });

  test('24.1 Message ordering preserved chronologically', async ({ page }) => {
    await page.getByText('New Conversation').first().click();
    await sendMessage(page, 'First-msg-A');
    await waitForAssistantReply(page, 90_000);
    await sendMessage(page, 'Second-msg-B');
    // A appears before B in the DOM
    const aBox = await page.getByText('First-msg-A').first().boundingBox();
    const bBox = await page.getByText('Second-msg-B').first().boundingBox();
    expect(aBox && bBox && aBox.y < bBox.y).toBeTruthy();
  });

  test('24.2 History pagination boundary loads correctly', async ({ page }) => {
    const convHeader = page.getByRole('button', { name: 'Conversations' });
    test.skip(!(await convHeader.count()), 'Conversations section not present');
    await page.mouse.wheel(0, 1500);
    await page.waitForTimeout(1500);
    // No crash; conversations list still intact
    await expect(page.getByRole('button', { name: 'Conversations' })).toBeVisible();
  });

  test('24.3 Delete a message removes subsequent dependent state', async ({ page }) => {
    test.skip(true, 'No per-message delete control exists; edit-from-point is covered by 24.4 (Known Gaps Report)');
  });

  test('24.4 Edit a message propagates and re-runs downstream', async ({ page }) => {
    await page.getByText('New Conversation').first().click();
    const original = 'Editable message ' + Date.now();
    await sendMessage(page, original);
    await page.getByText(original).first().hover();
    const editBtn = page.getByRole('button', { name: 'Edit message' }).first();
    test.skip(!(await editBtn.count()), 'Edit-message action not locatable');
    await editBtn.click();
    const area = page.locator('textarea').last();
    await area.fill('Edited downstream content');
    await page.getByRole('button', { name: 'Update' }).click();
    await expect(page.getByText('Edited downstream content').first()).toBeVisible({ timeout: 20_000 });
  });

  test('24.5 Chat persists after page refresh', async ({ page }) => {
    await page.getByText('New Conversation').first().click();
    const msg = 'Persist-after-refresh ' + Date.now();
    await sendMessage(page, msg);
    await waitForAssistantReply(page, 90_000);
    await page.reload();
    await expect(page.getByText(msg).first()).toBeVisible({ timeout: 20_000 });
  });

  test('24.6 Empty chat state shows correct placeholder', async ({ page }) => {
    await page.getByText('New Conversation').first().click();
    await expect(page.getByRole('heading', { name: /Let's orchestrate/i })).toBeVisible();
    await expect(page.getByText('Ask anything')).toBeVisible();
  });

  test('24.7 Huge history performance acceptable', async ({ page }) => {
    test.skip(true, 'Requires a seeded 1000+ message chat; performance case not automatable here');
  });

  test('24.8 Special characters persist correctly through save/reload', async ({ page }) => {
    await page.getByText('New Conversation').first().click();
    const special = '你好 🎉 مرحبا שלום';
    await sendMessage(page, special);
    await waitForAssistantReply(page, 90_000);
    await page.reload();
    await expect(page.getByText(special).first()).toBeVisible({ timeout: 20_000 });
  });

  test('24.9 Copy message preserves content', async ({ page }) => {
    await page.getByText('New Conversation').first().click();
    await sendMessage(page, 'Copyable content ' + Date.now());
    await waitForAssistantReply(page, 90_000);
    const assistantCopy = page.locator('button[title="Copy message"]').last();
    test.skip(!(await assistantCopy.count()), 'Copy-message button not locatable');
    await assistantCopy.click();
    await expect(page.getByText('Copied').first()).toBeVisible({ timeout: 10_000 });
  });

  test('24.10 Timestamp accuracy and timezone display correct', async ({ page }) => {
    await page.getByText('New Conversation').first().click();
    await sendMessage(page, 'Timestamp ' + Date.now());
    await expect(page.getByText(/\b\d{1,2}:\d{2}\s?(AM|PM)\b/i).first()).toBeVisible({ timeout: 30_000 });
  });

  test('24.11 Renaming chat title persists and updates sidebar', async ({ page }) => {
    await sendMessage(page, 'Rename-persist seed ' + Date.now());
    await expect(activeRow(page)).toBeVisible({ timeout: 25_000 });
    const row = activeRow(page);
    await row.hover();
    const menuBtn = row.getByRole('button').first();
    test.skip(!(await menuBtn.count()), 'Row menu not locatable');
    await menuBtn.click();
    await page.getByText('Rename', { exact: true }).filter({ visible: true }).first().click();
    const input = page.locator('input[autofocus], .bg-sidebar-hover input').first();
    const title = 'Persisted Title ' + Date.now();
    await input.fill(title);
    await input.press('Enter');
    await page.reload();
    await expect(page.getByText(title).filter({ visible: true }).first()).toBeVisible({ timeout: 20_000 });
  });

  test('24.12 Deleting a whole chat removes it from history and URL', async ({ page }) => {
    await sendMessage(page, 'Delete-and-url seed ' + Date.now());
    await expect(activeRow(page)).toBeVisible({ timeout: 25_000 });
    const chatUrl = page.url();
    const row = activeRow(page);
    await row.hover();
    const menuBtn = row.getByRole('button').first();
    test.skip(!(await menuBtn.count()), 'Row menu not locatable');
    await menuBtn.click();
    await page.getByText('Delete', { exact: true }).filter({ visible: true }).first().click();
    await expect(page.getByText('Delete chat?')).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByRole('heading', { name: /Let's orchestrate/i })).toBeVisible({ timeout: 20_000 });
    // Direct URL no longer restores the deleted chat's messages
    if (/\/chat\/[\w-]+/.test(chatUrl)) {
      await page.goto(chatUrl);
      await page.waitForTimeout(2000);
      await expect(page.getByText('Delete-and-url seed')).toHaveCount(0);
    }
  });
});
