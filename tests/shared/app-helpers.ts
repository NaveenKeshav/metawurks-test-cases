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
 * A finished assistant reply is signalled by its "Regenerate response" action,
 * which only renders once streaming for that message has completed
 * (MessageItem.tsx: isAssistant && !isStreamingThisMessage).
 */
export async function waitForAssistantReply(page: Page, timeout = 60_000): Promise<void> {
  await expect(
    page.getByRole('button', { name: 'Regenerate response' }).first()
  ).toBeVisible({ timeout });
}

// ---------------------------------------------------------------------------
// Sidebar: Knowledge Source → Data Library / Integrations
// ---------------------------------------------------------------------------

/**
 * The Data Library and Integrations panels are pre-rendered hidden in the DOM,
 * so shared strings resolve to multiple elements — filter on visibility.
 */
export async function expandKnowledgeSource(page: Page): Promise<void> {
  await page.getByText('Knowledge Source', { exact: true }).click();
  await expect(
    page.getByText('Data Library', { exact: true }).filter({ visible: true }).first()
  ).toBeVisible();
  await expect(
    page.getByText('Integrations', { exact: true }).filter({ visible: true }).first()
  ).toBeVisible();
}

export async function openDataLibrary(page: Page): Promise<void> {
  await expandKnowledgeSource(page);
  await page.getByText('Data Library', { exact: true }).filter({ visible: true }).first().click();
  await expect(
    page.getByText('Privacy Protected').filter({ visible: true }).first()
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

/** The hidden multi-file <input type=file> inside the upload modal (accepts docs/images). */
export function fileInput(page: Page): Locator {
  return page.locator('input[type="file"]:not([webkitdirectory])').first();
}

/** The hidden folder <input webkitdirectory>. */
export function folderInput(page: Page): Locator {
  return page.locator('input[webkitdirectory]').first();
}

// ---------------------------------------------------------------------------
// Data Drives tab (Google Drive / OneDrive connections)
// ---------------------------------------------------------------------------

/** Opens Data Library and switches to the "Data Drives" tab. */
export async function openDataDrives(page: Page): Promise<void> {
  await openDataLibrary(page);
  await page.getByRole('button', { name: 'Data Drives' }).filter({ visible: true }).first().click();
}
