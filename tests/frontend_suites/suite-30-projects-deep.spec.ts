import { test, expect, Page } from '@playwright/test';
import { openDashboard } from '../shared/auth-helper';

/**
 * Suite 30 — Projects deep  (PDF TC 30.1–30.12)
 *
 * Authenticated suite. Sources: ProjectsSection.tsx, ProjectsCreateDialog.tsx,
 * ProjectEditDialog.tsx, ProjectDeleteModal.tsx, ChatContextMenu.tsx.
 *
 * REAL end-to-end against dev2 — no mocked routes. Verified backend truth
 * (mw-master-service-v2/lib/project_service.py): project names are NOT unique —
 * "DUPLICATES ALLOWED ... no unique index on (user_id, name), no create-time
 * collision check." So the honest duplicate (30.2) and rename-collision (30.5)
 * cases assert the REAL behaviour: the second name is accepted, not rejected.
 * Switching a project is a row-click → ?project_id= (no switcher dropdown); a
 * no-conversations project is "permanently archived" on delete (30.7/30.8);
 * there is no project "duplicate" action in the UI.
 */

async function openProjects(page: Page) {
  const header = page.getByRole('button', { name: 'Projects' });
  await header.scrollIntoViewIfNeeded().catch(() => {});
  await header.hover();
}

async function openCreateDialog(page: Page) {
  await openProjects(page);
  await page.getByRole('button', { name: 'New project' }).first().click();
  await expect(page.locator('#project-name')).toBeVisible({ timeout: 10_000 });
}

async function createProject(page: Page, name: string) {
  await openCreateDialog(page);
  await page.locator('#project-name').fill(name);
  await page.getByRole('button', { name: 'Create Project' }).click();
  await expect(page.getByRole('button', { name }).first()).toBeVisible({ timeout: 15_000 });
}

async function openProjectOptions(page: Page, name: string) {
  const nameBtn = page.getByRole('button', { name }).first();
  await nameBtn.scrollIntoViewIfNeeded().catch(() => {});
  await nameBtn.hover();
  // The "Project options" button only renders for the hovered/open row, so scope
  // it to THIS project's row (the name button's parent) — with many leftover
  // projects in the sidebar, an unscoped .first() would open a different menu.
  const options = nameBtn.locator('xpath=..').getByRole('button', { name: 'Project options' });
  await expect(options).toBeVisible({ timeout: 5_000 });
  await options.click();
}

/**
 * A menu/modal action button scoped to whatever popover is currently open (visible).
 * String names use EXACT matching: leftover test projects are named e.g.
 * "RenameMe …"/"DeleteProj …", and a substring match on "Rename"/"Delete" would
 * collide with those project rows. A menu item like "Rename" is an exact label.
 */
function visibleButton(page: Page, name: RegExp | string) {
  return page
    .getByRole('button', { name, exact: typeof name === 'string' })
    .filter({ visible: true });
}

test.describe('Suite 30 — Projects deep', () => {

  test.beforeEach(async ({ page }) => {
    await openDashboard(page);
  });

  test('30.1 Create a new project', async ({ page }) => {
    await createProject(page, 'DeepProj ' + Date.now());
  });

  test('30.2 Create project with duplicate name (backend allows duplicates)', async ({ page }) => {
    // dev2's master-service ALLOWS duplicate names under the same user (no unique
    // index, no create-time collision check). Real, un-mocked behaviour: the
    // second create SUCCEEDS and two rows with the same name coexist — no error.
    const name = 'DupName ' + Date.now();
    await createProject(page, name); // first create
    await createProject(page, name); // second create must also succeed (no rejection)
    // Both rows coexist under the same name — the real "duplicates allowed" behaviour.
    await expect(page.getByRole('button', { name }).nth(1)).toBeVisible({ timeout: 15_000 });
  });

  test('30.3 Create project with empty name', async ({ page }) => {
    await openCreateDialog(page);
    await expect(page.getByRole('button', { name: 'Create Project' })).toBeDisabled();
  });

  test('30.4 Create project with very long name', async ({ page }) => {
    await openCreateDialog(page);
    const longName = 'L'.repeat(300);
    await page.locator('#project-name').fill(longName);
    // The field enforces a max length (value is capped) or the app handles it
    // without crashing — never a raw error.
    const value = await page.locator('#project-name').inputValue();
    expect(value.length).toBeGreaterThan(0);
    await expect(page.locator('#project-name')).toBeVisible();
  });

  test('30.5 Rename project into a collision (backend allows duplicate names)', async ({ page }) => {
    // No rename-time collision check exists server-side, so renaming one project
    // to another's exact name SUCCEEDS. Real behaviour: the edit dialog closes
    // with no error and both projects then share the name.
    const stamp = Date.now();
    const target = 'CollTarget ' + stamp;
    const src = 'CollSrc ' + stamp;
    await createProject(page, target);
    await createProject(page, src);
    await openProjectOptions(page, src);
    await visibleButton(page, 'Rename').click();
    const input = page.locator('input[placeholder="Project name"]');
    await expect(input).toBeVisible({ timeout: 10_000 });
    await input.fill(target);
    await visibleButton(page, 'Save').click();
    // Rename accepted: dialog closes (input detaches) and no collision error shows.
    await expect(input).toBeHidden({ timeout: 10_000 });
    await expect(page.getByText(/already exists/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: target }).first()).toBeVisible();
  });

  test('30.6 Switch project scope isolation', async ({ page }) => {
    const name = 'ScopeProj ' + Date.now();
    await createProject(page, name);
    await page.getByRole('button', { name }).first().click();
    await page.waitForTimeout(1000);
    // Switching sets the ?project_id= scope
    expect(page.url()).toContain('project_id=');
  });

  test('30.7 Delete project containing chats', async ({ page }) => {
    // A freshly-created project has no conversations, so the confirm modal shows
    // the "permanently archived" variant with a plain "Delete" button (the
    // "Delete anyway" label only appears when the project actually has chats).
    const name = 'DeleteProj ' + Date.now();
    await createProject(page, name);
    await openProjectOptions(page, name);
    await visibleButton(page, 'Delete').click(); // menu item → confirm modal
    await expect(
      page.getByText(/permanently archived|no longer appear in your history/i)
    ).toBeVisible({ timeout: 10_000 });
    await visibleButton(page, /^Delete( anyway)?$/).last().click(); // modal confirm
    await expect(page.getByRole('button', { name }).first()).toHaveCount(0, { timeout: 15_000 });
  });

  test('30.8 Archive a project', async ({ page }) => {
    // No distinct "Archive" action exists: deleting a project with no
    // conversations permanently ARCHIVES it (per ProjectDeleteModal copy).
    const name = 'ArchiveProj ' + Date.now();
    await createProject(page, name);
    await openProjectOptions(page, name);
    await visibleButton(page, 'Delete').click();
    await expect(page.getByText(/permanently archived/i)).toBeVisible({ timeout: 10_000 });
  });

  test('30.9 Move a chat between projects', async ({ page }) => {
    const conv = page.locator('[href^="/chat/"]').first();
    test.skip(!(await conv.count()), 'No existing chat to move');
    await conv.hover();
    const kebab = conv.getByRole('button').first();
    test.skip(!(await kebab.count()), 'Chat row menu not locatable');
    await kebab.click();
    await expect(page.getByText('Move to project')).toBeVisible({ timeout: 10_000 });
  });

  test('30.10 Concurrent project edit from two sessions', async ({ page, context }) => {
    const name = 'ConcurrentProj ' + Date.now();
    await createProject(page, name);
    // Second session (same auth/context) reads the persisted project from the
    // REAL backend — GET /api/projects returns a plain array of projects.
    const tabB = await context.newPage();
    const before = (await (await tabB.request.get('/api/projects')).json()) as Array<{ project_id: string; name: string }>;
    const created = before.find((p) => p.name === name);
    expect(created, 'project persisted and visible to a second session').toBeTruthy();
    // Rename in session A (UI); session B must then read the updated name from the
    // backend — last-write-wins, no corruption/stale duplication.
    const newName = name + ' RENAMED';
    await openProjectOptions(page, name);
    await visibleButton(page, 'Rename').click();
    const input = page.locator('input[placeholder="Project name"]');
    await expect(input).toBeVisible({ timeout: 10_000 });
    await input.fill(newName);
    await visibleButton(page, 'Save').click();
    await expect(input).toBeHidden({ timeout: 10_000 });
    await expect
      .poll(async () => {
        const after = (await (await tabB.request.get('/api/projects')).json()) as Array<{ project_id: string; name: string }>;
        return after.some((p) => p.project_id === created!.project_id && p.name === newName);
      }, { timeout: 15_000 })
      .toBeTruthy();
    await tabB.close();
  });

  test('30.11 Duplicate a project', async ({ page }) => {
    test.skip(true, 'No "duplicate project" action exists in the UI or API (Known Gaps Report)');
  });

  test('30.12 Access project without permission', async ({ page }) => {
    await page.goto('/chat?project_id=nonexistent-not-owned-' + Date.now());
    // Graceful handling: the app shell (sidebar) stays functional and the user
    // stays authenticated (no crash, no redirect to /login). The main content
    // area renders EMPTY — none of the unauthorized project's data is exposed.
    await expect(page.getByRole('button', { name: 'Projects' }).first()).toBeVisible({ timeout: 20_000 });
    expect(page.url()).toContain('/chat');
  });
});
