import { test, expect } from '@playwright/test';
import { openDashboard } from '../shared/auth-helper';

/**
 * Runs with the saved session (chromium project) — no per-test login.
 */
test.describe('Dashboard - Post Login', () => {

  test.beforeEach(async ({ page }) => {
    await openDashboard(page);
  });

  test.describe('Positive Scenarios', () => {

    test('TC70: Dashboard loads with welcome heading and orchestration subtitle', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Welcome/ })).toBeVisible();
      await expect(page.getByRole('heading', { name: /Let's orchestrate/i })).toBeVisible();
      // exact:true — the sidebar tagline contains the same phrase as a substring
      await expect(page.getByText('Unify data, trigger smart workflows, and turn insight into action', { exact: true })).toBeVisible();
    });

    test('TC71: Dashboard displays quick action suggestion buttons', async ({ page }) => {
      await expect(page.getByText('Research').first()).toBeVisible();
      await expect(page.getByText('Improve writing').first()).toBeVisible();
      await expect(page.getByText('Meeting Notes').first()).toBeVisible();
      await expect(page.getByText('Analyse Resume').first()).toBeVisible();
      await expect(page.getByText('Compare').first()).toBeVisible();
      await expect(page.getByText('More', { exact: true }).first()).toBeVisible();
    });

    test('TC72: Dashboard has chat input area that accepts text', async ({ page }) => {
      // The composer is a bare textarea; "Ask anything" is a span overlay,
      // not a placeholder attribute
      const chatInput = page.locator('textarea').first();
      await expect(chatInput).toBeVisible();
      await expect(page.getByText('Ask anything')).toBeVisible();
      await chatInput.fill('What is MetaWurks?');
      await expect(chatInput).toHaveValue('What is MetaWurks?');
    });

    test('TC73: Dashboard shows auto mode toggle', async ({ page }) => {
      await expect(page.getByText('Auto')).toBeVisible();
    });

    test('TC74: Dashboard displays knowledge source integration prompt', async ({ page }) => {
      await expect(page.getByText('Integrate your Knowledge Sources')).toBeVisible();
      await expect(page.getByRole('button', { name: /Connect/i })).toBeVisible();
    });

    test('TC75: Dashboard sidebar shows user profile with name and plan', async ({ page }) => {
      // UserProfileCard: avatar initial + first name + "{plan} Plan"
      await expect(page.getByRole('button', { name: /Kishu Free Plan/i })).toBeVisible();
    });

    test('TC76: Dashboard sidebar displays all main navigation items', async ({ page }) => {
      // Panels are pre-rendered hidden in the DOM, so text locators need
      // exact matches / role scoping to avoid strict-mode collisions
      await expect(page.getByText('New Conversation', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Search', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Knowledge Source', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Agents' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Projects' })).toBeVisible();
    });

    test('TC77: Dashboard sidebar logo is visible', async ({ page }) => {
      await expect(page.getByAltText('Logo')).toBeVisible();
    });

    test('TC78: Dashboard shows the Conversations section in sidebar', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Conversations' })).toBeVisible();
    });

    test('TC79: Non-enterprise user sees the Upgrade button', async ({ page }) => {
      // UserProfileCard renders Upgrade for every plan except Enterprise
      await expect(page.getByRole('button', { name: 'Upgrade', exact: true })).toBeVisible();
    });
  });

  test.describe('Negative Scenarios', () => {

    test('TC80: Dashboard should not show login page elements after authentication', async ({ page }) => {
      await expect(page.getByText('Sign in to MetaWurks')).not.toBeVisible();
      await expect(page.getByRole('button', { name: /Sign in with Google/i })).not.toBeVisible();
    });

    test('TC81: Dashboard should not show unauthenticated content', async ({ page }) => {
      await expect(page.getByText('Create your account')).not.toBeVisible();
      await expect(page.getByText('Forgot password?')).not.toBeVisible();
    });
  });
});
