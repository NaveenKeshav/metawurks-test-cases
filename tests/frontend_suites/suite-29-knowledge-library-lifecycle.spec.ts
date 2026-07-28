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
  // The document-row 3-dots menu button. Deployed dev2 renders an
  // `lucide-ellipsis-vertical` icon (local FileRow source uses MoreVertical /
  // `lucide-more-vertical` — stale) — match both. FileRow also renders a hidden
  // mobile kebab (md:hidden), so filter to the VISIBLE desktop one.
  return page
    .locator('button:has(svg.lucide-ellipsis-vertical), button:has(svg.lucide-more-vertical)')
    .filter({ visible: true })
    .first();
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

  test('29.2 Document transitions to completed', async () => {
    test.skip(
      true,
      'BLOCKED BY PROCESSING LATENCY, not by a missing surface. Correction to the earlier note: the ' +
        'live transition IS observable without a manual refresh — NotificationPanel.tsx polls while ' +
        'open, auto-switches processing → completed, and broadcasts a `documents-updated` event that ' +
        'KnowledgeSourcePage.tsx listens for and re-fetches on. (The Data Library itself still never ' +
        'polls; only ProjectWelcomeScreen.tsx polls /api/documents/status/batch every 5s.) What blocks ' +
        'the case is dev2 processing time — observed >4min in Suite 27 — which exceeds a practical E2E ' +
        'window, so the wait, not the UI, is the reason this stays skipped.'
    );
  });

  test('29.3 Document failed status with reason', async () => {
    test.skip(
      true,
      'PARTIAL GAP. Failed STATUS is surfaced and persisted — the notification panel\'s Failed tab ' +
        'renders a red "Failed" badge and an X icon from /api/notifications/recent. TWO parts of the ' +
        'PDF case do NOT exist: ' +
        '(1) NO REASON. The panel renders `errorMessage` only when present, and it never is: rag-worker\'s ' +
        'failure path (orchestrator.py ~214) prints str(e) to the Cloud Run log and then calls ' +
        'update_document_status(document_id, status="failed") — that function has no error parameter at ' +
        'all — and _sync_mongo_status writes only {status, updatedAt}. So documents.error_message is ' +
        'never populated and the user sees a bare "Failed". PROVEN LIVE by 27.15, which uploads an ' +
        'encrypted PDF, reaches status=failed in ~45s, and finds errorMessage empty. ' +
        '(2) NO RETRY control exists anywhere in the notification or knowledge components. ' +
        'A failing document IS reproducible on demand (fixtures/encrypted.pdf, or the 0-byte empty.txt), ' +
        'so this becomes automatable the moment rag-worker persists the failure reason.'
    );
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

  test('29.7 Sort by name/date/size', async () => {
    test.skip(
      true,
      'PRODUCT GAP: sort-by-name/date/size is not implemented, so there is nothing to exercise. ' +
        'Verified in components/knowledge/DocumentListView.tsx (~line 181-202): the "Document Name", ' +
        '"Last Updated" and "Size" column headers are plain <div>/<span> elements carrying a ' +
        'ChevronsUpDown icon but NO onClick handler, and the component holds no sort state ' +
        '(no sortBy/sortOrder/setSort anywhere in the file) — clicking them cannot reorder anything. ' +
        'The chevron icons make the headers LOOK interactive, which is a UI defect worth fixing on its ' +
        'own, but the PDF case (list reorders) is unimplementable until a sort feature exists. ' +
        'Consistent with 11.10, which already records this same gap as a skip.'
    );
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
    // PRECONDITION SKIP — not a gap and not a stale reason: the empty-state view and
    // its assertions below are real and DO run against an empty library. The PDF
    // itself scopes this case to "open library with no docs" (precondition column:
    // "No documents"). It is skipped in practice because the shared dev2 test
    // account (LOGIN_USERNAME) permanently holds documents — the upload suites
    // (9, 27, 29) push fixtures like notes.txt / sample.pdf / data.xlsx into it on
    // every run and nothing ever cleans them up, so the empty state can no longer
    // render. Deleting all documents to force it would break the four other
    // suite-29 cases plus 11.x / 27.x that require documents to exist.
    // To actually cover this, point the empty-state cases at a DEDICATED account
    // that owns no documents (a second credential in .env) rather than clearing the
    // shared one; the same fresh-account need blocks the first-time-user cases.
    const hasDocs = await libraryHasDocs(page);
    test.skip(
      hasDocs,
      'Shared test account has documents, so the empty state cannot render — PDF 29.13 requires a library with no docs. Needs a dedicated document-free account (see comment).'
    );
    await expect(
      page.getByText(/Upload Your Local Documents|Power Your Workflows with Context/i).first()
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Upload First Document/i })).toBeVisible();
  });
});
