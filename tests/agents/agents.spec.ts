import { test, expect } from '@playwright/test';
import { openDashboard } from '../shared/auth-helper';

/**
 * Runs with the saved session (chromium project).
 * The sidebar "Agents" button (AgentsSection) opens the Skills authoring
 * panel (components/skills/skills-page.tsx). Skills can be entitlement-gated
 * per account, so list contents are asserted loosely. The panel is
 * pre-rendered hidden, so locators filter on visibility.
 */
test.describe('Agents / Skills - Post Login', () => {

  test.beforeEach(async ({ page }) => {
    await openDashboard(page);
    await page.getByRole('button', { name: 'Agents' }).click();
    await expect(
      page.getByText(/Build and run multi-step skills/i).filter({ visible: true }).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test.describe('Positive Scenarios', () => {

    test('TC104: Agents section displays heading and skill creation prompt', async ({ page }) => {
      await expect(page.getByText(/Build and run multi-step skills/i).filter({ visible: true }).first()).toBeVisible();
      await expect(page.getByText('+ New skill').filter({ visible: true }).first()).toBeVisible();
    });

    test('TC105: +New skill button is clickable for creating new skills', async ({ page }) => {
      const newSkillBtn = page.getByText('+ New skill').filter({ visible: true }).first();
      await expect(newSkillBtn).toBeVisible();
      await expect(newSkillBtn).toBeEnabled();
    });

    test('TC106: Skills list renders a valid state (skills, empty state, or entitlement notice)', async ({ page }) => {
      // One of: actual skill rows, "No skills yet." empty state, or an
      // entitlement error — never a blank/crashed panel
      const anyState = page.getByText(/No skills yet/i)
        .or(page.getByText(/Run with/i))
        .or(page.getByText(/not enabled/i))
        .filter({ visible: true });
      await expect(anyState.first()).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe('Negative Scenarios', () => {

    test('TC107: Agents panel does not replace the whole app shell', async ({ page }) => {
      // Sidebar must remain functional while the skills panel is open
      await expect(page.getByText('New Conversation', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Knowledge Source', { exact: true })).toBeVisible();
    });
  });
});
