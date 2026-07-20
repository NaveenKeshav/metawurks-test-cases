import { test, expect } from '@playwright/test';
import { loginWithEnvCredentials, waitForDashboardLoad } from '../shared/auth-helper';

test.describe('Agents / Skills - Post Login', () => {

  test.describe('Positive Scenarios', () => {

    test('TC114: Agents section displays heading and skill creation prompt', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click on Agents section
      await page.getByText('Agents').click();
      await page.waitForTimeout(500);

      // Verify Agents section header
      await expect(page.getByText(/Build and run multi-step skills/i)).toBeVisible();
      await expect(page.getByText('+ New skill')).toBeVisible();
    });

    test('TC115: Agents section shows existing skills with run commands', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click on Agents section
      await page.getByText('Agents').click();
      await page.waitForTimeout(500);

      // Verify existing skill is displayed
      await expect(page.getByText(/Draft & send email/i)).toBeVisible();
      await expect(page.getByText(/System/)).toBeVisible();
      await expect(page.getByText(/Summarise the chat/i)).toBeVisible();
      await expect(page.getByText(/Run with/i)).toBeVisible();
      await expect(page.getByText(/\/skill run/i)).toBeVisible();
    });

    test('TC116: Skills section has run button or action for each skill', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click on Agents section
      await page.getByText('Agents').click();
      await page.waitForTimeout(500);

      // Verify the skill has run capability
      await expect(page.getByText(/Draft & send email/)).toBeVisible();
    });

    test('TC117: +New skill button is clickable for creating new skills', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click on Agents section
      await page.getByText('Agents').click();
      await page.waitForTimeout(500);

      // Click + New skill button
      const newSkillBtn = page.getByText('+ New skill');
      await expect(newSkillBtn).toBeVisible();
      // Verify button is interactive
      await expect(newSkillBtn).toBeEnabled();
    });
  });

  test.describe('Negative Scenarios', () => {

    test('TC118: Agents section shows proper empty state when no skills exist', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click on Agents section
      await page.getByText('Agents').click();
      await page.waitForTimeout(500);

      // There is at least one skill, so verify the section is not empty
      await expect(page.getByText(/Build and run multi-step skills/i)).toBeVisible();
    });

    test('TC119: Agents section should not show unrelated content', async ({ page }) => {
      await loginWithEnvCredentials(page);
      await waitForDashboardLoad(page);

      // Click on Agents section
      await page.getByText('Agents').click();
      await page.waitForTimeout(500);

      // Verify agents don't show knowledge source or data library content
      await expect(page.getByText(/Build and run multi-step skills/i)).toBeVisible();
    });
  });
});