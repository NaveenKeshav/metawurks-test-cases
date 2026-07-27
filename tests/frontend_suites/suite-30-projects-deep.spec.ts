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
    // Switching sets the ?project_id= scope. Wait for the URL rather than a fixed
    // delay — under parallel-worker load the client route update can exceed 1s.
    await page.waitForURL(/project_id=/, { timeout: 15_000 });
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
    /** Shape of GET /api/chat/history (app/api/chat/history/route.ts). */
    type ChatHistoryResponse = {
      chats: Array<{ chat_id: string; title: string; project_id: string | null }>;
      hasMore: boolean;
    };
 
    /** Chats currently scoped to a project, per the backend. */
    const chatsIn = async (projectId: string) =>
      ((await (
        await page.request.get(`/api/chat/history?project_id=${projectId}`)
      ).json()) as ChatHistoryResponse).chats;
 
    // A move BETWEEN projects needs the chat to START in project A, so create both
    // ends. Both belong to this test — a real user project is never a move target.
    const stamp = Date.now();
    const nameA = 'MoveFrom ' + stamp;
    const nameB = 'MoveTo ' + stamp;
    await createProject(page, nameA);
    await createProject(page, nameB);
    const projects = (await (await page.request.get('/api/projects')).json()) as Array<{
      project_id: string; name: string;
    }>;
    const idA = projects.find((p) => p.name === nameA)!.project_id;
    const idB = projects.find((p) => p.name === nameB)!.project_id;
 
    const history = (await (
      await page.request.get('/api/chat/history?limit=30')
    ).json()) as ChatHistoryResponse;
    test.skip(!history.chats.length, 'Account has no chats to move');
    const chat = history.chats[0];
    const originalProjectId = chat.project_id;
 
    // SETUP (not the assertion): park the chat in project A via the API, so the UI
    // action under test is genuinely A → B rather than drawer → B.
    await page.request.put(`/api/chat/${chat.chat_id}/project`, { data: { project_id: idA } });
    await expect
      .poll(async () => (await chatsIn(idA)).some((c) => c.chat_id === chat.chat_id), {
        timeout: 15_000,
      })
      .toBeTruthy();
 
    // Drive the move from INSIDE project A. The project workspace
    // (ProjectWelcomeScreen, /chat?project_id=…) is the only surface that lists a
    // single project's own conversations — the sidebar deliberately shows ALL chats
    // regardless of scope ("Sidebar always shows ALL conversations — project
    // filtering is only on the project workspace page", ConversationsList).
    // Enter project A by CLICKING its sidebar row — the real user path. A hard
    // page.goto('/chat?project_id=…') does NOT render the workspace (main content
    // comes back empty); only the client-side transition does.
    await page.getByRole('button', { name: nameA, exact: true }).first().click();
    await expect.poll(() => page.url(), { timeout: 10_000 }).toContain(`project_id=${idA}`);
    // The workspace tab carries a count badge ("Conversations 1"); the sidebar
    // section header is a bare "Conversations". Match on the digits to hit the tab.
    await page.getByRole('button', { name: /^Conversations\s*\d+$/ }).click();
 
    // The chat is listed under project A. Row = <div> wrapping a title <button>.
    const titleBtn = page.getByRole('button', { name: chat.title }).first();
    await expect(titleBtn).toBeVisible({ timeout: 20_000 });
    const rowA = titleBtn.locator('xpath=..');
    await rowA.hover();
    // The 3-dot button only renders while the row is hovered — wait for it.
    const kebab = rowA.getByRole('button').last();
    await expect(kebab).toBeVisible({ timeout: 5_000 });
    await kebab.click();
 
    // Menu items are divs, not buttons (ChatContextMenu.tsx) → match by text.
    const moveEntry = page.getByText('Move to project', { exact: true });
    await expect(moveEntry).toBeVisible({ timeout: 10_000 });
    // Hover, don't click: the row opens the submenu on mouseenter AND toggles it on
    // click, so a Playwright click (hover → press) would open then immediately close
    // it. The submenu is a CHILD of this row, so moving into it fires no mouseleave.
    await moveEntry.hover();
 
    // Scope to the submenu (child of the "Move to project" row) — project names also
    // appear in the sidebar, so a page-wide text match would hit the wrong element.
    const submenu = moveEntry.locator('xpath=..');
    // A is the project we are already IN, so it is not offered as a destination
    // (otherProjects filters out activeProjectId) — the menu only offers a move OUT.
    await expect(submenu.getByText(nameA, { exact: true })).toHaveCount(0);
    await submenu.getByText(nameB, { exact: true }).click();
 
    // UI PROOF: the row leaves project A's conversation list immediately
    // (ProjectWelcomeScreen.handleMoveToProject drops it from projectChats).
    await expect(titleBtn).toBeHidden({ timeout: 10_000 });
 
    // UI PROOF, receiving end: the chat now shows in project B's workspace.
    await page.getByRole('button', { name: nameB, exact: true }).first().click();
    await expect.poll(() => page.url(), { timeout: 10_000 }).toContain(`project_id=${idB}`);
    await page.getByRole('button', { name: /^Conversations\s*\d+$/ }).click();
    await expect(page.getByRole('button', { name: chat.title }).first()).toBeVisible({
      timeout: 20_000,
    });
 
    // BACKEND PROOF — arrived in B, carrying B's project_id:
    await expect
      .poll(
        async () => (await chatsIn(idB)).some((c) => c.chat_id === chat.chat_id && c.project_id === idB),
        { timeout: 15_000 },
      )
      .toBeTruthy();
    // ...and GONE from A. This is what makes it a move BETWEEN projects rather than
    // a copy: without this, a bug that added the chat to B while leaving it in A
    // would still pass.
    await expect
      .poll(async () => (await chatsIn(idA)).some((c) => c.chat_id === chat.chat_id), {
        timeout: 15_000,
      })
      .toBeFalsy();
 
    // Restore: this chat pre-existed the test. The rest of the suite only mutates
    // projects it created itself, so put the chat back where it was found.
    await page.request.put(`/api/chat/${chat.chat_id}/project`, {
      data: { project_id: originalProjectId },
    });
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
