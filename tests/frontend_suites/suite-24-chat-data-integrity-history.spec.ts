import { test, expect } from '@playwright/test';
import { openDashboard } from '../shared/auth-helper';
import { composer, sendMessage, waitForAssistantReply } from '../shared/app-helpers';

/**
 * Suite 24 — Chat data integrity & history  (PDF TC 24.1–24.12)
 *
 * Authenticated suite. Per-message delete and huge-history perf are not exposed /
 * not automatable and are skipped with a documented reason.
 *
 * Sidebar row-menu note: the active/newest chat row sits far down the shared
 * sidebar scroll (hundreds of projects above it) and is overlapped by project
 * cards, so a direct hover is intercepted. openActiveChatRowMenu() collapses the
 * Agents + Projects sections first, which lifts the active conversation row to a
 * clear, hoverable position — the row-kebab (Rename/Share/Delete) then opens.
 */

import type { Page } from '@playwright/test';

/** The chat message-thread container (excludes the sidebar, which shows previews). */
function thread(page: Page) {
  return page.locator('div.overflow-y-auto.pt-\\[56px\\]');
}

/** The active conversation row (font-normal title, unlike font-medium project cards). */
function activeChatRow(page: Page) {
  return page
    .locator('div.h-\\[32px\\].bg-sidebar-hover')
    .filter({ has: page.locator('span.font-normal') })
    .first();
}

/** Collapse Agents + Projects so the Conversations list rises to the top. */
async function collapseSidebarSections(page: Page) {
  for (const name of ['Agents', 'Projects']) {
    // MUST bound the click: with no timeout, an un-actionable (covered/hidden)
    // section button makes .click() hang until the whole test times out (the
    // .catch only catches throws, not a hang). 5s cap → give up and move on.
    await page.getByRole('button', { name, exact: true }).first().click({ timeout: 5_000 }).catch(() => {});
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(300);
}

/** Open the active chat's 3-dot row menu (Rename/Share/Delete). */
async function openActiveChatRowMenu(page: Page) {
  await collapseSidebarSections(page);
  const row = activeChatRow(page);
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.hover({ timeout: 8_000 });
  await row.getByRole('button').first().click({ timeout: 8_000 });
  return row;
}

test.describe('Suite 24 — Chat data integrity & history', () => {

  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test.beforeEach(async ({ page }) => {
    // Real chat sends + reply waits (and dashboard load under concurrent load) are
    // slower than the 60s global default — give every test in this suite headroom.
    test.setTimeout(120_000);
    await openDashboard(page);
  });

  test('24.1 Message ordering preserved chronologically', async ({ page }) => {
    await page.getByText('New Conversation').first().click();
    await sendMessage(page, 'First-msg-A');
    await waitForAssistantReply(page, 90_000);
    await sendMessage(page, 'Second-msg-B');
    await page.waitForTimeout(1500);
    // Scope to the message THREAD (the sidebar also shows the text in a hidden chat
    // preview). Within the thread the text can appear more than once (user bubble +
    // assistant echo); take the first VISIBLE occurrence of each — the user bubbles
    // are ordered A above B.
    const aBox = await thread(page).getByText('First-msg-A').filter({ visible: true }).first().boundingBox();
    const bBox = await thread(page).getByText('Second-msg-B').filter({ visible: true }).first().boundingBox();
    expect(aBox, 'First-msg-A should be rendered').not.toBeNull();
    expect(bBox, 'Second-msg-B should be rendered').not.toBeNull();
    expect(aBox!.y, 'the first message must appear above the second').toBeLessThan(bBox!.y);
  });

  test('24.2 History pagination boundary loads correctly', async ({ page }) => {
    // Genuine infinite-scroll check: scrolling the last loaded chat row into view
    // fires the load-more IntersectionObserver and the NEXT page of chats loads.
    const rows = page.locator('div.h-\\[32px\\]').filter({ has: page.locator('span.font-normal') });
    const before = await rows.count();
    test.skip(before < 30, `Not enough chats to paginate (only ${before} on the first page)`);
    let after = before;
    for (let i = 0; i < 6 && after <= before; i++) {
      await rows.last().scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(1200);
      after = await rows.count();
    }
    expect(after, 'scrolling to the boundary must load the next page of chats').toBeGreaterThan(before);
  });

  test('24.3 Delete a message removes subsequent dependent state', async ({ page }) => {
    test.skip(true, 'No per-message delete control exists; edit-from-point is covered by 24.4 (Known Gaps Report)');
  });

  test('24.4 Edit a message propagates and re-runs downstream', async ({ page }) => {
    test.setTimeout(120_000);
    await page.getByText('New Conversation').first().click();
    const original = 'Editable message ' + Date.now();
    await sendMessage(page, original);
    // The user-message Edit action only renders once the reply has finished
    // streaming — wait for completion BEFORE hovering/editing.
    await waitForAssistantReply(page, 90_000);
    // Hover the user bubble in the THREAD (not the hidden sidebar preview) to reveal
    // the per-message actions.
    await thread(page).getByText(original).filter({ visible: true }).first().hover();
    const editBtn = page.locator('button[title="Edit message"]').first();
    await expect(editBtn, 'Edit-message action should be available after the reply').toBeVisible({ timeout: 10_000 });
    await editBtn.click();
    const area = page.locator('textarea').last();
    await area.fill('Edited downstream content');
    await page.getByRole('button', { name: 'Update' }).click();
    await expect(page.getByText('Edited downstream content').filter({ visible: true }).first()).toBeVisible({ timeout: 30_000 });
  });

  test('24.5 Chat persists after page refresh', async ({ page }) => {
    await page.getByText('New Conversation').first().click();
    const msg = 'Persist-after-refresh ' + Date.now();
    await sendMessage(page, msg);
    await waitForAssistantReply(page, 90_000);
    await page.reload();
    // The message must be restored in the THREAD (not just the sidebar preview).
    await expect(thread(page).getByText(msg).first()).toBeVisible({ timeout: 20_000 });
  });

  test('24.6 Empty chat state shows correct placeholder', async ({ page }) => {
    await page.getByText('New Conversation').first().click();
    await expect(page.getByRole('heading', { name: /Let's orchestrate/i }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Ask anything').first()).toBeVisible({ timeout: 15_000 });
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
    // The special characters must round-trip intact in the restored THREAD.
    await expect(thread(page).getByText(special).first()).toBeVisible({ timeout: 20_000 });
  });

  test('24.9 Copy message preserves content', async ({ page }) => {
    await page.getByText('New Conversation').first().click();
    await sendMessage(page, 'Copyable content ' + Date.now());
    await waitForAssistantReply(page, 90_000);
    const assistantCopy = page.locator('button[title="Copy message"]').last();
    await expect(assistantCopy, 'Copy-message action should be present').toBeVisible({ timeout: 10_000 });
    await assistantCopy.click();
    await page.waitForTimeout(600);
    // PDF 24.9: the clipboard holds the message content. Verify the real effect
    // (robust) rather than the transient "Copied" indicator.
    const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => '')).catch(() => '');
    expect(clip.trim().length, 'copying an assistant message must place its content on the clipboard').toBeGreaterThan(0);
  });

  test('24.10 Timestamp accuracy and timezone display correct', async ({ page }) => {
    await page.getByText('New Conversation').first().click();
    await sendMessage(page, 'Timestamp ' + Date.now());
    await waitForAssistantReply(page, 90_000);
    // The message timestamp must reflect the CURRENT LOCAL time (browser timezone),
    // not just be some time string. Accept the current or previous minute to avoid a
    // rollover race.
    const expected = await page.evaluate(() => {
      const fmt = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return [fmt(new Date()), fmt(new Date(Date.now() - 60_000))];
    });
    const shown = (
      await thread(page).getByText(/\b\d{1,2}:\d{2}\s?(AM|PM)\b/i).filter({ visible: true }).allInnerTexts()
    ).join(' | ');
    expect(
      expected.some((t) => shown.includes(t)),
      `the thread must show an accurate local timestamp (expected ~${expected[0]}; shown: ${shown})`,
    ).toBeTruthy();
  });

  test('24.11 Renaming chat title persists and updates sidebar', async ({ page }) => {
    test.setTimeout(120_000);
    await sendMessage(page, 'Rename-persist seed ' + Date.now());
    // Wait for the real chat URL instead of a fixed sleep. A flat 2.5s wait raced
    // dev2 under load: the URL was still /chat, so `split('/chat/')[1]` produced
    // undefined and the later history lookup returned undefined — a false failure
    // that looked like "rename did not persist".
    await page.waitForURL(/\/chat\/[0-9a-f-]{36}/i, { timeout: 60_000 });
    const chatId = page.url().match(/\/chat\/([0-9a-f-]{36})/i)![1];
    await openActiveChatRowMenu(page);
    await page.getByText('Rename', { exact: true }).filter({ visible: true }).first().click();
    // The renaming row shows an inline input (React autoFocus → no `autofocus`
    // attribute, so match by container).
    const input = page.locator('.bg-sidebar-hover input').first();
    await expect(input).toBeVisible({ timeout: 10_000 });
    const title = 'Persisted Title ' + Date.now();
    await input.fill(title);
    await input.press('Enter');
    // (a) The sidebar updates LIVE with the new title.
    await expect(page.getByText(title).filter({ visible: true }).first()).toBeVisible({ timeout: 10_000 });
    // (b) It PERSISTS after a refresh — verified against the REAL dev2 backend (the
    // sidebar's own source of truth). This is robust to sidebar pagination in a
    // large account and is a genuine persistence check, not a mock.
    await page.reload();
    await page.waitForTimeout(1500);
    const persisted = await page.request
      .get('/api/chat/history')
      .then((r) => r.json())
      .then((d) => (d.chats ?? []).find((c: any) => (c.id ?? c.chat_id) === chatId)?.title)
      .catch(() => null);
    expect(persisted, 'the renamed title must persist after refresh').toBe(title);
  });

  test('24.12 Deleting a whole chat removes it from history and URL', async ({ page }) => {
    test.setTimeout(120_000);
    const seed = 'Delete-and-url seed ' + Date.now(); // unique (timestamped)
    await sendMessage(page, seed);
    // Wait for the real chat URL rather than a fixed sleep (see 24.11 — the flat
    // wait raced dev2 and captured '/chat' instead of the chat's own URL).
    await page.waitForURL(/\/chat\/[0-9a-f-]{36}/i, { timeout: 60_000 });
    const chatUrl = page.url();
    await openActiveChatRowMenu(page);
    await page.getByText('Delete', { exact: true }).filter({ visible: true }).first().click();
    await expect(page.getByText('Delete chat?')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Delete', exact: true }).filter({ visible: true }).last().click();
    // Deleting the ACTIVE chat must return the user to the welcome view. Assert the
    // navigation first (the reliable signal, as used by 7.20), then the heading —
    // waiting only on the heading conflated "did not navigate" with "rendered slowly".
    await page.waitForURL(/\/chat(\?|$)/, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: /Let's orchestrate/i }).first()).toBeVisible({ timeout: 30_000 });
    // Direct URL no longer restores the deleted chat's message. Match the UNIQUE
    // seed (timestamped) inside the THREAD — the sidebar can contain other runs'
    // "Delete-and-url seed …" rows, and a substring match would falsely count them.
    if (/\/chat\/[\w-]+/.test(chatUrl)) {
      await page.goto(chatUrl);
      await page.waitForTimeout(2000);
      await expect(thread(page).getByText(seed)).toHaveCount(0);
    }
  });
});
