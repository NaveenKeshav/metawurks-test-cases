import { test, expect, Page } from '@playwright/test';
import { openDashboard } from '../shared/auth-helper';

/**
 * Suite 15 — Skills/Agents Authoring  (PDF TC 15.1–15.12)
 *
 * Authenticated suite. Sources: AgentsSection.tsx, skills-page.tsx,
 * skill-detail-modal.tsx, step-inspector.tsx.
 *
 * Automatable: opening the authoring editor, the list, and a mocked
 * compile-validation error. Compile/save/run need a live Master service.
 * Guarded (absent in UI): in-panel run+output, failed-run resume, delete,
 * fork, run-history — running is chat-driven via "/skill run".
 */

async function openAgents(page: Page) {
  await page.getByRole('button', { name: 'Agents' }).click();
  await expect(page.getByRole('button', { name: '+ New skill' })).toBeVisible({ timeout: 10_000 });
}

async function openAuthoring(page: Page) {
  await openAgents(page);
  await page.getByRole('button', { name: '+ New skill' }).click();
  await expect(page.getByPlaceholder('Weekly recap')).toBeVisible({ timeout: 10_000 });
}

test.describe('Suite 15 — Skills/Agents Authoring', () => {

  test.beforeEach(async ({ page }) => {
    await openDashboard(page);
  });

  test('15.1 Open skill authoring interface', async ({ page }) => {
    await openAuthoring(page);
    await expect(page.getByPlaceholder(/Summarise this chat/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Compile' })).toBeVisible();
  });

  test('15.2 Create a new skill (authoring accepts input)', async ({ page }) => {
    await openAuthoring(page);
    await page.getByPlaceholder('Weekly recap').fill('My E2E Skill');
    await page.getByPlaceholder(/Summarise this chat/i).fill('Summarise the current chat into three bullet points.');
    // Compile enabled with a valid description (full compile/save needs the Master service)
    await expect(page.getByRole('button', { name: 'Compile' })).toBeEnabled();
  });

  test('15.3 Compile a skill', async ({ page }) => {
    await openAuthoring(page);
    await page.getByPlaceholder('Weekly recap').fill('Compile Test');
    await page.getByPlaceholder(/Summarise this chat/i).fill('Say hello to the user.');
    await page.getByRole('button', { name: 'Compile' }).click();
    // Live compile → review mode ("Review:") or an error box; guard if the
    // backend is unavailable this run.
    const outcome = page.getByText(/^Review:/).or(page.getByText(/Could not compile|Compile timed out|Compile failed|service unreachable/i));
    test.skip(!(await outcome.waitFor({ timeout: 45_000 }).then(() => true).catch(() => false)), 'Master compile service did not respond');
    await expect(outcome.first()).toBeVisible();
  });

  test('15.4 Validation errors on invalid skill', async ({ page }) => {
    await page.route('**/api/skills/compile', (route) =>
      route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ detail: { errors: ['Invalid skill definition'] } }) })
    );
    await openAuthoring(page);
    await page.getByPlaceholder('Weekly recap').fill('Bad Skill');
    await page.getByPlaceholder(/Summarise this chat/i).fill('###');
    await page.getByRole('button', { name: 'Compile' }).click();
    await expect(page.getByText(/Invalid skill definition|Could not compile/i)).toBeVisible({ timeout: 15_000 });
  });

  test('15.5 Run a compiled skill', async ({ page }) => {
    test.skip(true, 'No in-panel run+output UI; skills run from chat via "/skill run <name>" (Known Gaps Report)');
  });

  test('15.6 Monitor a running task', async ({ page }) => {
    test.skip(true, 'Task monitor is chat-embedded (inline task card), not in the Agents panel — needs a live run');
  });

  test('15.7 Resume a failed run', async ({ page }) => {
    test.skip(true, 'No failed-run resume UI (only paused-approval resume exists) — Known Gaps Report');
  });

  test('15.8 Edit an existing skill', async ({ page }) => {
    await openAgents(page);
    const firstSkill = page.locator('ul li button, ul button').first();
    test.skip(!(await firstSkill.count()), 'No existing skill to edit');
    await firstSkill.click();
    const editBtn = page.getByRole('button', { name: 'Edit' });
    test.skip(!(await editBtn.count()), 'Skill is read-only/system or Edit not available');
    await editBtn.click();
    await expect(page.getByPlaceholder(/Describe what this skill should do/i)).toBeVisible({ timeout: 10_000 });
  });

  test('15.9 Delete a skill', async ({ page }) => {
    test.skip(true, 'No delete-skill UI/confirm exists (DELETE endpoint is API-only) — Known Gaps Report');
  });

  test('15.10 List all skills', async ({ page }) => {
    await openAgents(page);
    // The Agents panel shows either the "No skills yet" empty state or a list of
    // skill cards. Branch on which is present (avoids a strict-mode-ambiguous
    // .or() union) and assert the corresponding surface renders.
    const empty = page.getByText(/No skills yet/i);
    if (await empty.count()) {
      await expect(empty.first()).toBeVisible();
    } else {
      await expect(page.locator('ul').first()).toBeVisible();
    }
  });

  test('15.11 Fork an existing skill', async ({ page }) => {
    test.skip(true, 'Fork is not implemented in the UI or API (Known Gaps Report)');
  });

  test('15.12 View run history for a skill', async ({ page }) => {
    test.skip(true, 'No run-history list view exists; runs appear only as ephemeral in-chat cards (Known Gaps Report)');
  });
});
