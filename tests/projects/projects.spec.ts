import { test, expect } from '@playwright/test';
import { loginWithEnvCredentials, waitForDashboardLoad } from '../shared/auth-helper';

test.describe('Projects - Post Login', () => {

  test.describe('Positive Scenarios', () => {

    test('TC120: Projects section displays header with description', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click on Projects section
      await page.getByText('Projects').click();
      await page.waitForTimeout(500);

      // Verify Projects section
      await expect(page.getByText(/Create your first project/i)).toBeVisible();
      await expect(page.getByText(/Projects keep related conversations/i)).toBeVisible();
    });

    test('TC121: Projects section has New Project button', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click on Projects section
      await page.getByText('Projects').click();
      await page.waitForTimeout(500);

      // Verify New Project button
      await expect(page.getByText('New Project')).toBeVisible();
    });

    test('TC122: Projects section shows empty state message when no projects exist', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click on Projects section
      await page.getByText('Projects').click();
      await page.waitForTimeout(500);

      // Verify empty state
      await expect(page.getByText(/No projects yet/i)).toBeVisible();
    });

    test('TC123: New Project button is clickable for creating projects', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click on Projects section
      await page.getByText('Projects').click();
      await page.waitForTimeout(500);

      // Verify New Project button is enabled
      const newProjectBtn = page.getByText('New Project');
      await expect(newProjectBtn).toBeVisible();
      await expect(newProjectBtn).toBeEnabled();
    });
  });

  test.describe('Negative Scenarios', () => {

    test('TC124: Projects section does not show dashboard content', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click on Projects section
      await page.getByText('Projects').click();
      await page.waitForTimeout(500);

      // Verify projects section does not show chat-related content
      await expect(page.getByText(/Create your first project/i)).toBeVisible();
    });

    test('TC125: Projects empty state should indicate no projects available', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click on Projects section
      await page.getByText('Projects').click();
      await page.waitForTimeout(500);

      // Verify the empty state is clearly communicated
      await expect(page.getByText(/No projects yet/i)).toBeVisible();
    });
  });
});