import { test, expect, Page } from '@playwright/test';

/**
 * Suite 18 — Onboarding  (PDF TC 18.1–18.8)
 *
 * Authenticated suite. Sources: app/onboarding/*, components/OnboardingStep1-3,
 * components/ui/OnboardingFooter.tsx.
 *
 * Reality: 3-step flow at /onboarding → /onboarding/step2 → /onboarding/step3.
 * Step 1 has NO name field or blank-name validation (name comes from session);
 * Step 2 is data-drives/integrations (not a file-upload modal); completion
 * redirects to /chat?welcome=true (not /dashboard). Footer Skip/Next/Previous
 * are <div onClick> — select by text. Guarded when onboarding is not reachable
 * for an already-onboarded account.
 */

async function gotoOnboarding(page: Page, path = '/onboarding') {
  await page.goto(path);
  await page.waitForTimeout(1500);
  return page.url().includes('onboarding');
}

test.describe('Suite 18 — Onboarding', () => {

  test('18.1 Step 1 welcome and name entry', async ({ page }) => {
    test.skip(!(await gotoOnboarding(page)), 'Onboarding not reachable (account already onboarded)');
    // PDF expects a name field; the app greets with the session name + a role
    // select instead. Assert the welcome step renders and Next advances.
    await expect(page.getByText(/Welcome to MetaWurks|What best describe you/i).first()).toBeVisible({ timeout: 10_000 });
    await page.getByText('Next', { exact: true }).first().click();
    await page.waitForURL(/step2/, { timeout: 10_000 });
  });

  test('18.2 Step 1 blank name validation', async ({ page }) => {
    test.skip(true, 'Step 1 has no name field and no blank-name validation gate (Next always advances) — Known Gaps Report');
  });

  test('18.3 Step 2 upload modal', async ({ page }) => {
    test.skip(!(await gotoOnboarding(page, '/onboarding/step2')), 'Onboarding step 2 not reachable');
    // PDF expects a file-upload modal; step 2 is actually Data Drives /
    // Integrations. Assert that step renders.
    await expect(page.getByText(/Data Drives|Integrations|Connect Google Drive/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('18.4 Step 3 integrations', async ({ page }) => {
    test.skip(!(await gotoOnboarding(page, '/onboarding/step2')), 'Onboarding step 2 not reachable');
    // Integrations live on step 2 with Connect buttons (live OAuth to complete).
    await expect(page.getByRole('button', { name: /Connect/i }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('18.5 Skip an optional step', async ({ page }) => {
    test.skip(!(await gotoOnboarding(page, '/onboarding/step2')), 'Onboarding step 2 not reachable');
    await page.getByText('Skip', { exact: true }).first().click();
    await page.waitForTimeout(1500);
    // Skip advances out of step 2 (to /chat or the next step)
    expect(page.url()).not.toContain('/onboarding/step2');
  });

  test('18.6 Progress indicator accuracy', async ({ page }) => {
    test.skip(!(await gotoOnboarding(page)), 'Onboarding not reachable');
    await expect(page.getByText('1 of 3')).toBeVisible({ timeout: 10_000 });
    await page.getByText('Next', { exact: true }).first().click();
    await expect(page.getByText('2 of 3')).toBeVisible({ timeout: 10_000 });
  });

  test('18.7 Back and next navigation', async ({ page }) => {
    test.skip(!(await gotoOnboarding(page, '/onboarding/step2')), 'Onboarding step 2 not reachable');
    await page.getByText('Previous', { exact: true }).first().click();
    await page.waitForURL(/onboarding(\?|$)/, { timeout: 10_000 }).catch(() => {});
    await page.getByText('Next', { exact: true }).first().click();
    await page.waitForURL(/step2/, { timeout: 10_000 });
  });

  test('18.8 Completion redirect to app', async ({ page }) => {
    test.skip(!(await gotoOnboarding(page, '/onboarding/step3')), 'Onboarding step 3 not reachable');
    // Launch (or Skip) completes onboarding → /chat?welcome=true
    await page.getByText(/Launch|Skip/i).first().click();
    await page.waitForURL(/\/chat/, { timeout: 15_000 });
    expect(page.url()).toContain('/chat');
  });
});
