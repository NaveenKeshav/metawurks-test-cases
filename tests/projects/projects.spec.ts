import { test, expect } from '@playwright/test';
import { openDashboard } from '../shared/auth-helper';

/**
 * Runs with the saved session (chromium project).
 *
 * Projects lives in the sidebar (components/sidebar/ProjectsSection.tsx):
 * the "Projects" header toggles the section open/closed, a hover-revealed
 * "+" button (aria-label "New project") opens the create dialog, and the
 * dev test account has no projects so the empty state shows.
 * (The full-page AllProjectsPage exists in code but is not reachable from
 * the sidebar header in this build — its onActivate prop is unwired.)
 */
test.describe('Projects - Post Login', () => {

  test.beforeEach(async ({ page }) => {
    await openDashboard(page);
  });

  test.describe('Positive Scenarios', () => {

    test('TC108: Projects section is present in the sidebar', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Projects' })).toBeVisible();
    });

    test('TC109: Projects section shows empty state for an account without projects', async ({ page }) => {
      await expect(page.getByText('No projects yet').filter({ visible: true }).first()).toBeVisible();
    });

    test('TC110: Projects header toggles the section open and closed', async ({ page }) => {
      const emptyState = page.getByText('No projects yet').filter({ visible: true });

      // Open by default
      await expect(emptyState.first()).toBeVisible();

      // Collapse
      await page.getByRole('button', { name: 'Projects' }).click();
      await expect(page.getByText('No projects yet').filter({ visible: true })).toHaveCount(0);

      // Expand again
      await page.getByRole('button', { name: 'Projects' }).click();
      await expect(page.getByText('No projects yet').filter({ visible: true }).first()).toBeVisible();
    });

    test('TC111: Hover + button opens the New Project dialog', async ({ page }) => {
      // The "+" appears only while hovering the Projects header row
      await page.getByRole('button', { name: 'Projects' }).hover();
      await page.getByRole('button', { name: 'New project' }).click();

      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByRole('dialog').getByText('New Project')).toBeVisible();

      // Close without creating anything
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test.describe('Negative Scenarios', () => {

    test('TC112: Projects sidebar interactions do not disturb the chat area', async ({ page }) => {
      await page.getByRole('button', { name: 'Projects' }).click();
      await page.getByRole('button', { name: 'Projects' }).click();
      await expect(page.getByRole('heading', { name: /Let's orchestrate/i })).toBeVisible();
    });
  });
});
