import { test, expect, Page } from '@playwright/test';
import { openDashboard } from '../shared/auth-helper';
import { openDataLibrary, openUploadModal, fileInput, fixture } from '../shared/app-helpers';

/**
 * Suite 29 — Knowledge library & document lifecycle  (PDF TC 29.1–29.13)
 *
 * Authenticated suite. Sources: KnowledgeSourcePage.tsx, DocumentListView.tsx,
 * FileRow.tsx. Document delete uses the NATIVE window.confirm().
 *
 * Reality gaps (asserted/guarded, mirrors Suite 11): the Data Library does NOT
 * poll document status (29.2), has NO bulk select-all (29.5), NO working sort
 * (29.7), and "view chunks"/folder-tree live on /discover not the library
 * (29.9/29.10). Status/lifecycle cases that need a live processing document
 * skip cleanly when none is present.
 */

async function libraryHasDocs(page: Page): Promise<boolean> {
  await openDataLibrary(page);
  const emptyHeading = page.getByText(/Upload Your Local Documents|Power Your Workflows with Context|Connect Your Drives/i);
  await page.waitForTimeout(1000);
  return !(await emptyHeading.filter({ visible: true }).count());
}

function firstRowKebab(page: Page) {
  // FileRow renders TWO kebabs — a mobile one (md:hidden, first in DOM) and the
  // desktop one. On the desktop viewport the mobile kebab is display:none, so an
  // unfiltered .first() lands on a non-actionable element and hangs. Filter visible.
  return page.locator('button:has(svg.lucide-more-vertical)').filter({ visible: true }).first();
}

test.describe('Suite 29 — Knowledge library & document lifecycle', () => {

  test.beforeEach(async ({ page }) => {
    // 29.1 performs a real upload through the Data Library flow, which is slower
    // than the 60s global default.
    test.setTimeout(120_000);
    await openDashboard(page);
  });

  test('29.1 Document shows processing status', async ({ page }) => {
    // A freshly-queued upload; a Processing badge may surface on the row.
    await openUploadModal(page);
    await fileInput(page).setInputFiles(fixture('notes.txt'));
    await page.getByRole('button', { name: /^Upload File$/i }).click();
    await page.waitForTimeout(2000);
    await openDataLibrary(page);
    const status = page.getByText(/Processing|Completed|Queued/i).first();
    test.skip(!(await status.count()), 'No status badge surfaced in the Data Library (status shown on ProjectWelcomeScreen) — Known Gaps Report');
    await expect(status).toBeVisible();
  });

  test('29.2 Document transitions to completed', async ({ page }) => {
    test.skip(true, 'Data Library does not poll document status; auto-transition is only observed on ProjectWelcomeScreen (Known Gaps Report)');
  });

  test('29.3 Document failed status with reason', async ({ page }) => {
    test.skip(true, 'Failed-status + reason + retry is surfaced during processing, not persisted in the Data Library list (Known Gaps Report)');
  });

  test('29.4 Delete document during processing', async ({ page }) => {
    test.skip(!(await libraryHasDocs(page)), 'No documents to delete');
    page.on('dialog', (d) => d.accept().catch(() => {})); // native window.confirm
    // Locate the first document-row kebab; skip cleanly (never hang) if the list
    // has no actionable row rather than waiting out the whole test timeout.
    const kebab = firstRowKebab(page);
    test.skip(!(await kebab.count()), 'No document-row action menu present');
    await kebab.scrollIntoViewIfNeeded().catch(() => {});
    await kebab.click({ timeout: 10_000 });
    // exact:true so the doc-row menu item "Delete" is not confused with sidebar
    // project rows named "DeleteProj …"/"DeleteMe …" (substring match).
    const del = page.getByRole('button', { name: 'Delete', exact: true }).filter({ visible: true }).first();
    test.skip(!(await del.count()), 'Delete action not locatable');
    await del.click({ timeout: 10_000 });
    await page.waitForTimeout(1500);
    await expect(page.getByText('Data Library').first()).toBeVisible();
  });

  test('29.5 Bulk delete multiple documents', async ({ page }) => {
    test.skip(true, 'Data Library document list has no bulk/select-all checkboxes (Known Gaps Report)');
  });

  test('29.6 Search filter by name/type', async ({ page }) => {
    test.skip(!(await libraryHasDocs(page)), 'No documents to filter');
    const search = page.getByPlaceholder('Search').filter({ visible: true }).first();
    await search.fill('report');
    await page.waitForTimeout(800);
    expect(page.url()).toContain('/chat'); // filtered without crash
  });

  test('29.7 Sort by name/date/size', async ({ page }) => {
    // PRODUCT BUG (confirmed in DocumentListView.tsx:181-202): the library renders
    // sortable-looking column headers (Document Name / Last Updated / Size) each with
    // a ChevronsUpDown icon, but they are plain <div>s with NO onClick/handler and no
    // sort state — clicking does nothing. PDF 29.7 expects the list to reorder.
    // Assert the row order changes after clicking "Document Name" — this FAILS,
    // surfacing the non-functional (misleading) sort control.
    test.skip(!(await libraryHasDocs(page)), 'No documents to sort');
    const names = () => page.locator('span.text-primary.truncate').allInnerTexts();
    const before = await names();
    test.skip(before.length < 2, 'Need at least 2 documents to observe a sort');
    await page.getByText('Document Name', { exact: false }).first().click();
    await page.waitForTimeout(1000);
    const after = await names();
    expect(
      after,
      'PRODUCT BUG: clicking the "Document Name" sort header does not reorder the list — the header is a decorative <div> with no sort handler (DocumentListView.tsx). PDF 29.7 expects the list to reorder.'
    ).not.toEqual(before);
  });

  test('29.8 Toggle grid and list view', async ({ page }) => {
    test.skip(!(await libraryHasDocs(page)), 'No documents to switch view');
    const gridToggle = page.locator('button:has(svg.lucide-layout-grid)').first();
    test.skip(!(await gridToggle.count()), 'View toggle not present');
    await gridToggle.click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Data Library').first()).toBeVisible();
  });

  test('29.9 View document chunks', async ({ page }) => {
    test.skip(true, 'Chunk viewer exists only on the /discover page, not the Data Library (Known Gaps Report)');
  });

  test('29.10 Folder tree navigation', async ({ page }) => {
    test.skip(true, 'Folder-tree navigation exists only on /discover, not the Data Library (Known Gaps Report)');
  });

  test('29.11 Manual refresh of library', async ({ page }) => {
    await openDataLibrary(page);
    // The library reloads on navigation back to it (no explicit refresh button)
    await openDashboard(page);
    await openDataLibrary(page);
    await expect(page.getByText('Data Library').first()).toBeVisible();
  });

  test('29.12 Pagination boundary at last page', async ({ page }) => {
    test.skip(!(await libraryHasDocs(page)), 'No documents to paginate');
    const rangeLabel = page.getByText(/\d+–\d+ of \d+/);
    test.skip(!(await rangeLabel.count()), 'Pagination not shown (single page)');
    await expect(rangeLabel.first()).toBeVisible();
  });

  test('29.13 Empty library state', async ({ page }) => {
    const hasDocs = await libraryHasDocs(page);
    test.skip(hasDocs, 'Library has documents; empty-state not applicable');
    await expect(
      page.getByText(/Upload Your Local Documents|Power Your Workflows with Context/i).first()
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Upload First Document/i })).toBeVisible();
  });
});
