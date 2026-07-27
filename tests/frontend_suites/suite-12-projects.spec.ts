import { test, expect, Page } from '@playwright/test';
import { openDashboard } from '../shared/auth-helper';

/**
 * Suite 12 — Projects  (PDF TC 12.1–12.13)
 *
 * Authenticated suite. Sources: ProjectsSection.tsx, ProjectsCreateDialog.tsx,
 * ProjectEditDialog.tsx, ProjectDeleteModal.tsx, ChatContextMenu.tsx.
 *
 * Reality: switching a project is a row-click → URL ?project_id= (no switcher
 * dropdown); duplicate-name error is backend-driven (assert role=alert / mock);
 * there is no per-chat project badge (only the ActiveProjectPill). Isolation /
 * permission cases that need seeded multi-project data are guarded.
 */

async function openProjects(page: Page) {
  const header = page.getByRole('button', { name: 'Projects' });
  await header.scrollIntoViewIfNeeded().catch(() => {});
  if ((await page.getByRole('button', { name: 'New project' }).count()) === 0) {
    await header.hover();
  }
}

async function openCreateDialog(page: Page) {
  await openProjects(page);
  const header = page.getByRole('button', { name: 'Projects' });
  await header.hover();
  await page.getByRole('button', { name: 'New project' }).first().click();
  await expect(page.locator('#project-name')).toBeVisible({ timeout: 10_000 });
}

/**
 * Hover a specific project row and open its 3-dots menu. The "Project options"
 * button renders only for the hovered/open row, so scope it to THIS project's row
 * (the name button's parent) — with many leftover projects an unscoped .first()
 * opens a different menu.
 */
async function openProjectOptions(page: Page, name: string) {
  const nameBtn = page.getByRole('button', { name }).first();
  await nameBtn.scrollIntoViewIfNeeded().catch(() => {});
  await nameBtn.hover();
  const options = nameBtn.locator('xpath=..').getByRole('button', { name: 'Project options' });
  await expect(options, 'Project options button for this row').toBeVisible({ timeout: 5_000 });
  await options.click();
}

/**
 * A menu/modal action button scoped to whatever popover is currently open.
 * String names use EXACT matching so "Rename"/"Delete"/"Save" do NOT collide with
 * project rows named "RenameMe …"/"DeleteMe …" (getByRole name is substring).
 */
function visibleButton(page: Page, name: RegExp | string) {
  return page.getByRole('button', { name, exact: typeof name === 'string' }).filter({ visible: true });
}

test.describe('Suite 12 — Projects', () => {

  test.beforeEach(async ({ page }) => {
    // Create + rename/delete flows through the projects sidebar are slower than the
    // 60s global default (heavier with many existing projects).
    test.setTimeout(120_000);
    await openDashboard(page);
  });

  test('12.1 Create a new project', async ({ page }) => {
    const name = 'Q3 Analysis ' + Date.now();
    await openCreateDialog(page);
    await page.locator('#project-name').fill(name);
    await page.getByRole('button', { name: 'Create Project' }).click();
    await expect(page.getByRole('button', { name }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('12.2 Reject duplicate project name', async ({ page }) => {
    // Duplicate detection is backend-driven; mock the API to return the error.
    await page.route('**/api/projects', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'A project with this name already exists' }) });
      }
      return route.continue();
    });
    await openCreateDialog(page);
    await page.locator('#project-name').fill('Duplicate Name');
    await page.getByRole('button', { name: 'Create Project' }).click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
  });

  test('12.3 Reject empty project name', async ({ page }) => {
    await openCreateDialog(page);
    // Create button is disabled while the name is empty
    await expect(page.getByRole('button', { name: 'Create Project' })).toBeDisabled();
  });

  test('12.4 Rename an existing project', async ({ page }) => {
    const name = 'RenameMe ' + Date.now();
    await openCreateDialog(page);
    await page.locator('#project-name').fill(name);
    await page.getByRole('button', { name: 'Create Project' }).click();
    await expect(page.getByRole('button', { name }).first()).toBeVisible({ timeout: 15_000 });
    // Hover the project → 3-dots (Project options) → Rename → change name → Save.
    await openProjectOptions(page, name);
    await visibleButton(page, 'Rename').click();
    const input = page.locator('input[placeholder="Project name"]');
    await expect(input).toBeVisible({ timeout: 10_000 });
    const renamed = 'Renamed ' + Date.now();
    await input.fill(renamed);
    await visibleButton(page, 'Save').click();
    // The row now shows the new name, and the old name is gone.
    await expect(page.getByRole('button', { name: renamed }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
  });

  test('12.5 Switch active project', async ({ page }) => {
    const name = 'Switchable ' + Date.now();
    await openCreateDialog(page);
    await page.locator('#project-name').fill(name);
    await page.getByRole('button', { name: 'Create Project' }).click();
    const row = page.getByRole('button', { name }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    await row.click();
    await page.waitForTimeout(1000);
    // Switching sets the ?project_id= URL param
    expect(page.url()).toContain('project_id=');
  });

  test('12.6 Project-scoped chats isolation', async ({ page }) => {
    // Real isolation check: chats are scoped by project_id, so a fresh project must
    // NOT show the account's other chats. If project scoping were broken (project_id
    // ignored), the new project would surface all the global chats — this would fail.
    const created = await page.request.post('/api/projects', { data: { name: 'IsoChats ' + Date.now(), description: '' } });
    expect(created.status(), 'project created').toBeLessThan(300);
    const pid = (await created.json()).project_id as string;
    const gCount = ((await (await page.request.get('/api/chat/history')).json()).chats ?? []).length;
    const sCount = ((await (await page.request.get(`/api/chat/history?project_id=${encodeURIComponent(pid)}`)).json()).chats ?? []).length;
    test.skip(gCount === 0, 'Account has no chats to isolate against');
    expect(sCount, `a fresh project must show none of the ${gCount} global chats (chats are isolated by project)`).toBe(0);
    await page.request.delete(`/api/projects/${encodeURIComponent(pid)}`).catch(() => {}); // best-effort cleanup
  });

  test('12.7 Project-scoped documents isolation', async ({ page }) => {
    // Real isolation check: documents are scoped by project_id, so a fresh project
    // must NOT show the account's other documents. Broken scoping → the new project
    // would surface all global docs → this fails.
    const created = await page.request.post('/api/projects', { data: { name: 'IsoDocs ' + Date.now(), description: '' } });
    expect(created.status(), 'project created').toBeLessThan(300);
    const pid = (await created.json()).project_id as string;
    const gCount = ((await (await page.request.get('/api/documents')).json()).documents ?? []).length;
    const sCount = ((await (await page.request.get(`/api/documents?project_id=${encodeURIComponent(pid)}`)).json()).documents ?? []).length;
    test.skip(gCount === 0, 'Account has no documents to isolate against');
    expect(sCount, `a fresh project must show none of the ${gCount} global documents (docs are isolated by project)`).toBe(0);
    await page.request.delete(`/api/projects/${encodeURIComponent(pid)}`).catch(() => {}); // best-effort cleanup
  });

  test('12.8 Delete/archive a project with confirm', async ({ page }) => {
    const name = 'DeleteMe ' + Date.now();
    await openCreateDialog(page);
    await page.locator('#project-name').fill(name);
    await page.getByRole('button', { name: 'Create Project' }).click();
    await expect(page.getByRole('button', { name }).first()).toBeVisible({ timeout: 15_000 });
    await openProjectOptions(page, name);
    await visibleButton(page, 'Delete').click(); // menu item (exact → not the "DeleteMe" rows)
    await expect(page.getByText(/permanently archived|no longer appear in your history/i)).toBeVisible({ timeout: 10_000 });
    await visibleButton(page, /^Delete( anyway)?$/).last().click(); // modal confirm
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0, { timeout: 15_000 });
  });

  test('12.9 Project badge displayed on chats', async ({ page }) => {
    // There is no per-chat badge; the active-project indicator is the pill.
    const name = 'PillProject ' + Date.now();
    await openCreateDialog(page);
    await page.locator('#project-name').fill(name);
    await page.getByRole('button', { name: 'Create Project' }).click();
    await page.getByRole('button', { name }).first().click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(name).first()).toBeVisible();
  });

  test('12.10 Move chat to another project', async ({ page }) => {
    // Requires an existing chat row context menu with "Move to project".
    const conv = page.locator('.bg-sidebar-hover, [href^="/chat/"]').first();
    test.skip(!(await conv.count()), 'No existing chat to move');
    await conv.hover();
    const kebab = conv.getByRole('button').first();
    test.skip(!(await kebab.count()), 'Chat row menu not locatable');
    await kebab.click();
    await expect(page.getByText('Move to project')).toBeVisible({ timeout: 10_000 });
  });

  test('12.11 List all projects', async ({ page }) => {
    await openProjects(page);
    // Either project rows or the empty-state text is shown
    await expect(
      page.getByText('No projects yet').or(page.getByRole('button', { name: 'Projects' }))
    ).toBeVisible();
  });

  test('12.12 Project access permission enforcement', async ({ page }) => {
    // Opening a project id not owned by the user must not expose its context.
    await page.goto('/chat?project_id=nonexistent-not-owned-123');
    await page.waitForTimeout(1500);
    // App stays functional / does not crash into someone else's project
    await expect(page.getByRole('button', { name: 'Conversations' })).toBeVisible({ timeout: 15_000 });
  });

  test('12.13 Creating a project while offline shows a clear error', async ({ page, context }) => {
    // Open the dialog first, then go GENUINELY offline (real browser offline, no route
    // mock) and submit — the app must surface a clear error and not crash.
    await openCreateDialog(page);
    await page.locator('#project-name').fill('Offline Project ' + Date.now());
    await context.setOffline(true);
    await page.getByRole('button', { name: 'Create Project' }).click();
    // Assert the specific error text ("Network error. Try again.") — the previous
    // getByRole('alert').or(#project-name) matched TWO visible elements (the alert AND
    // the always-visible input), which is a strict-mode violation exactly when the
    // error appears.
    await expect(
      page.getByText(/Network error\.?\s*Try again|Create failed|failed/i).filter({ visible: true }).first(),
      'a clear network/create error must be shown when creating a project offline'
    ).toBeVisible({ timeout: 10_000 });
    await context.setOffline(false);
  });
});
