import { Page, Locator, expect } from '@playwright/test';
import path from 'path';

/**
 * Shared helpers for the post-login suites (Chat, Model/UI, Upload, Drives).
 * Selectors here are grounded in the frontend source of
 * metawurks-frontend-webapp-v2 (ChatInputBar.tsx, ConversationsList.tsx,
 * ChatContextMenu.tsx, KnowledgeSourcePage.tsx, upload-modal.tsx,
 * DriveFileBrowser.tsx). See specs/SUITES-1-10-TRACEABILITY.md.
 */

export const FIXTURES = path.resolve(__dirname, '..', 'fixtures');
export const fixture = (name: string) => path.join(FIXTURES, name);

// ---------------------------------------------------------------------------
// Chat composer
// ---------------------------------------------------------------------------

/**
 * The composer is a bare <textarea> (no placeholder attr); "Ask anything" is a
 * separate span overlay. It is the only textbox on the chat screen.
 */
export function composer(page: Page): Locator {
  return page.locator('textarea').first();
}

/** Type into the composer and press Enter (Enter sends; Shift+Enter = newline). */
export async function sendMessage(page: Page, text: string): Promise<void> {
  const input = composer(page);
  await input.click();
  await input.fill(text);
  await input.press('Enter');
}

/**
 * A finished assistant reply is signalled by its Regenerate action, which only
 * renders once streaming for that message has completed (MessageItem.tsx:
 * isAssistant && !isStreamingThisMessage). NOTE: that button has NO aria-label —
 * only title="Regenerate response" and a child <img alt="Regenerate">, so its
 * ACCESSIBLE NAME is "Regenerate" (from the alt), not "Regenerate response".
 * getByRole({name:'Regenerate response'}) therefore never matches — locate it by
 * its title attribute instead (unambiguous, tied to the completion affordance).
 */
export function regenerateButton(page: Page): Locator {
  return page.locator('button[title="Regenerate response"]');
}

export async function waitForAssistantReply(page: Page, timeout = 60_000): Promise<void> {
  await expect(regenerateButton(page).first()).toBeVisible({ timeout });
}

/**
 * The mid-stream Stop control's inner square (ChatInputBar.tsx: the streaming
 * branch renders a div.bg-muted.rounded-full wrapping a div.bg-foreground.rounded-sm
 * with onClick={onStop}). Only present while a stream is active. Precise selector —
 * do NOT use a broad [class*="rounded-sm"], which also matches streamed content.
 */
export function stopSquare(page: Page): Locator {
  return page.locator('form div.rounded-sm.bg-foreground');
}

/**
 * Robustly stop a running stream. The Stop control re-renders on every streamed
 * token, so a single click can hang on a detached node — poll-click with short
 * timeouts until the control disappears. Returns true once the stream has halted.
 */
export async function stopStream(page: Page): Promise<boolean> {
  for (let i = 0; i < 10; i++) {
    if (!(await stopSquare(page).count())) return true;
    await stopSquare(page).first().click({ force: true, timeout: 1200 }).catch(() => {});
    await page.waitForTimeout(400);
  }
  return !(await stopSquare(page).count());
}

// ---------------------------------------------------------------------------
// Sidebar: Knowledge Source → Data Library / Integrations
// ---------------------------------------------------------------------------

/**
 * The Data Library and Integrations panels are pre-rendered hidden in the DOM,
 * so shared strings resolve to multiple elements — filter on visibility.
 */
export async function expandKnowledgeSource(page: Page): Promise<void> {
  // "Knowledge Source" is a TOGGLE — clicking it when already expanded collapses
  // it and hides Data Library/Integrations. Only click when they aren't shown.
  const dataLibrary = page.getByText('Data Library', { exact: true }).filter({ visible: true }).first();
  if (!(await dataLibrary.count())) {
    await page.getByText('Knowledge Source', { exact: true }).click();
  }
  await expect(dataLibrary).toBeVisible({ timeout: 10_000 });
  await expect(
    page.getByText('Integrations', { exact: true }).filter({ visible: true }).first()
  ).toBeVisible({ timeout: 10_000 });
}

export async function openDataLibrary(page: Page): Promise<void> {
  await expandKnowledgeSource(page);
  await page.getByText('Data Library', { exact: true }).filter({ visible: true }).first().click();
  // Readiness signal must hold in BOTH library states: the "Privacy Protected"
  // card only renders in the EMPTY state, so once the account has any document
  // (e.g. our own upload tests created one) it disappears. The Upload entry-point
  // button — "Upload First Document" (empty) or "Upload Document" (populated) —
  // is present in both, and is what openUploadModal clicks next.
  await expect(
    page.getByRole('button', { name: /Upload First Document|^Upload Document$/i }).filter({ visible: true }).first()
  ).toBeVisible({ timeout: 15_000 });
}

export async function openIntegrations(page: Page): Promise<void> {
  await expandKnowledgeSource(page);
  await page.getByText('Integrations', { exact: true }).filter({ visible: true }).first().click();
  await expect(
    page.getByText('Gmail').filter({ visible: true }).first()
  ).toBeVisible({ timeout: 15_000 });
}

/**
 * Opens the Upload modal from the Data Library page. New accounts show
 * "Upload First Document" (empty state); accounts with docs show the header
 * "Upload Document" button. Either opens the same UploadModal.
 * Returns the modal dialog locator.
 */
export async function openUploadModal(page: Page): Promise<Locator> {
  await openDataLibrary(page);
  const uploadFirst = page.getByRole('button', { name: /Upload First Document/i }).filter({ visible: true });
  const uploadHeader = page.getByRole('button', { name: /^Upload Document$/i }).filter({ visible: true });
  if (await uploadFirst.count()) {
    await uploadFirst.first().click();
  } else {
    await uploadHeader.first().click();
  }
  const modal = page.getByRole('dialog').filter({ hasText: 'Upload Documents' });
  await expect(modal).toBeVisible({ timeout: 15_000 });
  return modal;
}

/**
 * The hidden multi-file <input type=file> inside the upload modal (accepts docs/images).
 * MUST be scoped to the upload dialog: the chat composer (ChatInterface) has its own
 * `input[type=file]` earlier in the DOM, so an unscoped `.first()` would attach the
 * file to the chat composer instead — leaving the modal's queue empty and the
 * "Upload File" button permanently disabled.
 */
export function fileInput(page: Page): Locator {
  return page
    .getByRole('dialog')
    .filter({ hasText: 'Upload Documents' })
    .locator('input[type="file"]:not([webkitdirectory])')
    .first();
}

/** The hidden folder <input webkitdirectory>, scoped to the upload dialog (see fileInput). */
export function folderInput(page: Page): Locator {
  return page
    .getByRole('dialog')
    .filter({ hasText: 'Upload Documents' })
    .locator('input[webkitdirectory]')
    .first();
}

// ---------------------------------------------------------------------------
// Data Drives tab (Google Drive / OneDrive connections)
// ---------------------------------------------------------------------------

/** Opens Data Library and switches to the "Data Drives" tab. */
export async function openDataDrives(page: Page): Promise<void> {
  await openDataLibrary(page);
  await page.getByRole('button', { name: 'Data Drives' }).filter({ visible: true }).first().click();
}
