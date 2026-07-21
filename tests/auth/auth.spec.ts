import { test, expect, Page } from '@playwright/test';
import { config } from '../shared/config';
import { gotoWithRecaptchaMock } from '../shared/recaptcha-helper';

const loginUrl = `${config.appUrl}/login`;
const signupUrl = `${config.appUrl}/signup`;
const forgotPasswordUrl = `${config.appUrl}/forgot-password`;

/**
 * Signup submissions are intercepted so test data never reaches the dev
 * database — we assert the request fires, not that an account is created.
 */
async function blockSignupApi(page: Page) {
  await page.route('**/api/signup', (route) =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'blocked by e2e test' }),
    })
  );
}

test.describe('Authentication - Login Page', () => {

  // =========================================================================
  // POSITIVE SCENARIOS - UI & NAVIGATION
  // =========================================================================

  test.describe('Positive Scenarios', () => {
    test('TC29: Login page loads with all UI elements', async ({ page }) => {
      await gotoWithRecaptchaMock(page, loginUrl);
      await expect(page.getByText('Sign in to MetaWurks')).toBeVisible();
      await expect(page.getByRole('button', { name: /Sign in with Google/i })).toBeVisible();
      await expect(page.getByLabel('Email address')).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();
      await expect(page.getByRole('checkbox', { name: 'Remember me' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
      await expect(page.getByText("Don't have an account?")).toBeVisible();
      await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
    });

    test('TC30: Login page has Google SSO button', async ({ page }) => {
      await gotoWithRecaptchaMock(page, loginUrl);
      const googleBtn = page.getByRole('button', { name: /Sign in with Google/i });
      await expect(googleBtn).toBeVisible();
    });

    test('TC31: Login page has reCAPTCHA notice', async ({ page }) => {
      await gotoWithRecaptchaMock(page, loginUrl);
      await expect(page.getByText('This site is protected by reCAPTCHA')).toBeVisible();
      await expect(page.getByText('Privacy Policy').first()).toBeVisible();
      await expect(page.getByText('Terms of Service').first()).toBeVisible();
    });

    test('TC32: Remember me checkbox is present and toggleable', async ({ page }) => {
      await gotoWithRecaptchaMock(page, loginUrl);
      const checkbox = page.getByRole('checkbox', { name: 'Remember me' });
      await expect(checkbox).toBeVisible();
      await checkbox.check();
      await expect(checkbox).toBeChecked();
      await checkbox.uncheck();
      await expect(checkbox).not.toBeChecked();
    });

    test('TC33: Login form - fill email and password fields successfully', async ({ page }) => {
      await gotoWithRecaptchaMock(page, loginUrl);
      await page.getByLabel('Email address').fill('testuser@example.com');
      await page.getByLabel('Password').fill('MyPassword123');
      await expect(page.getByLabel('Email address')).toHaveValue('testuser@example.com');
      await expect(page.getByLabel('Password')).toHaveValue('MyPassword123');
    });

    test('TC34: Login submit with unknown credentials returns 401 from NextAuth', async ({ page }) => {
      await gotoWithRecaptchaMock(page, loginUrl);
      await page.getByLabel('Email address').fill('validuser@metawurks.com');
      await page.getByLabel('Password').fill('ValidPass123');

      // NextAuth credentials login posts to /api/auth/callback/credentials
      const responsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/auth/callback/credentials'),
        { timeout: 15000 }
      );

      await page.getByRole('button', { name: 'Sign in', exact: true }).click();

      const response = await responsePromise;
      expect(response.status()).toBe(401);
    });

    test('TC35: Forgot password link navigates to forgot password page', async ({ page }) => {
      await gotoWithRecaptchaMock(page, loginUrl);
      await page.getByRole('link', { name: 'Forgot password?' }).click();
      await expect(page).toHaveURL(forgotPasswordUrl);
      await expect(page.getByText('Forgot Password')).toBeVisible();
      await expect(page.getByText('Enter your email to receive a reset link')).toBeVisible();
    });

    test('TC36: Sign up link navigates to registration page', async ({ page }) => {
      await gotoWithRecaptchaMock(page, loginUrl);
      await page.getByRole('link', { name: 'Sign up' }).click();
      await expect(page).toHaveURL(signupUrl);
      await expect(page.getByText('Create your account')).toBeVisible();
    });

    test('TC37: Sign in link on signup page navigates back to login', async ({ page }) => {
      await gotoWithRecaptchaMock(page, signupUrl);
      await page.getByRole('link', { name: 'Sign in' }).click();
      await expect(page).toHaveURL(loginUrl);
    });

    test('TC38: Sign in link on forgot password page navigates back to login', async ({ page }) => {
      await gotoWithRecaptchaMock(page, forgotPasswordUrl);
      await page.getByRole('link', { name: 'Sign in' }).click();
      await expect(page).toHaveURL(loginUrl);
    });

    test('TC39: Forgot password page has email field and send button', async ({ page }) => {
      await gotoWithRecaptchaMock(page, forgotPasswordUrl);
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.getByRole('button', { name: /Send Reset Link/i })).toBeVisible();
    });
  });

  // =========================================================================
  // SUCCESS SCENARIOS - FORM SUBMISSION & API INTERACTION
  // =========================================================================

  test.describe('Form Submission & API Interaction', () => {
    test('TC40: Login submit sends the reCAPTCHA token to the verify endpoint', async ({ page }) => {
      await gotoWithRecaptchaMock(page, loginUrl);
      await page.getByLabel('Email address').fill('demo@metawurks.com');
      await page.getByLabel('Password').fill('Demo1234');

      const [request] = await Promise.all([
        page.waitForRequest((req) => req.url().includes('/api/recaptcha/verify'), { timeout: 15000 }),
        page.getByRole('button', { name: 'Sign in', exact: true }).click(),
      ]);

      expect(request.postData() || '').toContain('mock-token');
    });

    test('TC41: Login - submit with invalid credentials shows error and stays on login', async ({ page }) => {
      await gotoWithRecaptchaMock(page, loginUrl);
      await page.getByLabel('Email address').fill('wrong@example.com');
      await page.getByLabel('Password').fill('WrongPassword');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 30_000 });
      expect(page.url()).toContain('/login');
    });

    test('TC42: Login with valid credentials from .env - successful authentication', async ({ page }) => {
      test.skip(!config.login.isConfigured,
        'LOGIN_USERNAME and LOGIN_PASSWORD must be set in .env file to run this test. ' +
        'See .env.example for reference.');

      await gotoWithRecaptchaMock(page, loginUrl);

      await page.getByLabel('Email address').fill(config.login.username);
      await page.getByLabel('Password').fill(config.login.password);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();

      // Successful login lands on /chat
      await page.waitForURL(/\/chat/, { timeout: 30_000 });
      expect(page.url()).toContain('/chat');

      // Dashboard WelcomeScreen renders the greeting headings
      await expect(page.getByRole('heading', { name: /Welcome/ })).toBeVisible({ timeout: 20_000 });
      await expect(page.getByRole('heading', { name: /Let's orchestrate your work!/ })).toBeVisible();
    });

    test('TC43: Login - password visibility toggle works', async ({ page }) => {
      await gotoWithRecaptchaMock(page, loginUrl);
      const passwordInput = page.getByLabel('Password');
      await passwordInput.fill('VisiblePass123');

      // Hidden by default
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // The eye toggle is the only textless button inside the form
      const eyeButton = page.locator('form').getByRole('button').filter({ hasText: /^$/ });
      await eyeButton.click();

      // LoginForm switches the input type to text when visible
      await expect(passwordInput).toHaveAttribute('type', 'text');
    });

    test('TC44: Forgot password - submit with valid email does not crash', async ({ page }) => {
      await gotoWithRecaptchaMock(page, forgotPasswordUrl);
      await page.locator('#email').fill('testuser@example.com');
      await page.getByRole('button', { name: /Send Reset Link/i }).click();

      // Whatever the backend answers, the page must stay functional
      await page.waitForTimeout(2000);
      await expect(page.locator('#email')).toBeVisible();
    });

    test('TC45: Forgot password - form fill and back-to-login cycle', async ({ page }) => {
      await gotoWithRecaptchaMock(page, loginUrl);
      await expect(page).toHaveURL(loginUrl);

      await page.getByRole('link', { name: 'Forgot password?' }).click();
      await expect(page).toHaveURL(forgotPasswordUrl);

      await page.locator('#email').fill('reset@example.com');
      await expect(page.locator('#email')).toHaveValue('reset@example.com');

      await page.getByRole('link', { name: 'Sign in', exact: true }).click();
      await expect(page).toHaveURL(loginUrl);
    });
  });

  // =========================================================================
  // NEGATIVE SCENARIOS - FORM VALIDATION & ERROR HANDLING
  // =========================================================================

  test.describe('Negative Scenarios', () => {
    test('TC46: Login with empty email and password shows validation', async ({ page }) => {
      await gotoWithRecaptchaMock(page, loginUrl);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      const emailInput = page.getByLabel('Email address');
      const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.checkValidity());
      expect(isValid).toBeFalsy();
    });

    test('TC47: Login with invalid email format shows validation error', async ({ page }) => {
      await gotoWithRecaptchaMock(page, loginUrl);
      const emailInput = page.getByLabel('Email address');
      await emailInput.fill('invalid-email');
      await page.getByLabel('Password').fill('SomePass123');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
      expect(validationMessage.length).toBeGreaterThan(0);
    });

    test('TC48: Login with empty password shows validation', async ({ page }) => {
      await gotoWithRecaptchaMock(page, loginUrl);
      await page.getByLabel('Email address').fill('test@example.com');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      const passwordInput = page.getByLabel('Password');
      const isValid = await passwordInput.evaluate((el: HTMLInputElement) => el.checkValidity());
      expect(isValid).toBeFalsy();
    });

    test('TC49: Login with very short password stays on login', async ({ page }) => {
      await gotoWithRecaptchaMock(page, loginUrl);
      await page.getByLabel('Email address').fill('test@example.com');
      await page.getByLabel('Password').fill('Ab1');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 30_000 });
      await expect(page).toHaveURL(loginUrl);
    });

    test('TC50: Login with SQL injection attempt in email field', async ({ page }) => {
      await gotoWithRecaptchaMock(page, loginUrl);
      await page.getByLabel('Email address').fill("' OR 1=1 --");
      await page.getByLabel('Password').fill('password');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      // type=email blocks the malformed value client-side; never authenticated
      await expect(page).toHaveURL(loginUrl);
    });

    test('TC51: Login with XSS attempt in email field', async ({ page }) => {
      await gotoWithRecaptchaMock(page, loginUrl);
      await page.getByLabel('Email address').fill('<script>alert("xss")</script>');
      await page.getByLabel('Password').fill('password');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page).toHaveURL(loginUrl);
    });

    test('TC52: Login with extremely long email and password', async ({ page }) => {
      await gotoWithRecaptchaMock(page, loginUrl);
      const longString = 'a'.repeat(1000);
      await page.getByLabel('Email address').fill(`${longString}@example.com`);
      await page.getByLabel('Password').fill(longString);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 30_000 });
      await expect(page).toHaveURL(loginUrl);
    });

    test('TC53: Login with special characters in password', async ({ page }) => {
      await gotoWithRecaptchaMock(page, loginUrl);
      await page.getByLabel('Email address').fill('test@example.com');
      await page.getByLabel('Password').fill('!@#$%^&*()_+-=[]{}|;:,.<>?');
      await expect(page.getByLabel('Password')).toHaveValue('!@#$%^&*()_+-=[]{}|;:,.<>?');
    });

    test('TC54: Login with whitespace-only email and password', async ({ page }) => {
      await gotoWithRecaptchaMock(page, loginUrl);
      await page.getByLabel('Email address').fill('   ');
      await page.getByLabel('Password').fill('   ');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      const isValid = await page.getByLabel('Email address').evaluate((el: HTMLInputElement) => el.checkValidity());
      expect(isValid).toBeFalsy();
    });

    test('TC55: Forgot password with empty email shows validation', async ({ page }) => {
      await gotoWithRecaptchaMock(page, forgotPasswordUrl);
      await page.getByRole('button', { name: /Send Reset Link/i }).click();
      const isValid = await page.locator('#email').evaluate((el: HTMLInputElement) => el.checkValidity());
      expect(isValid).toBeFalsy();
    });

    test('TC56: Forgot password with invalid email format', async ({ page }) => {
      await gotoWithRecaptchaMock(page, forgotPasswordUrl);
      const emailInput = page.locator('#email');
      await emailInput.fill('not-an-email');
      await page.getByRole('button', { name: /Send Reset Link/i }).click();
      const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
      expect(validationMessage.length).toBeGreaterThan(0);
    });
  });
});

test.describe('Authentication - Sign Up Page', () => {

  // =========================================================================
  // POSITIVE SCENARIOS - UI & NAVIGATION
  // =========================================================================

  test.describe('Positive Scenarios', () => {
    test('TC57: Sign up page loads with all UI elements', async ({ page }) => {
      await gotoWithRecaptchaMock(page, signupUrl);
      await expect(page.getByText('Create your account')).toBeVisible();
      await expect(page.getByRole('button', { name: /Sign up with Google/i })).toBeVisible();
      await expect(page.locator('#name')).toBeVisible();
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.locator('#confirmPassword')).toBeVisible();
      await expect(page.locator('#referralCode')).toBeVisible();
      await expect(page.getByText('Terms of Service').first()).toBeVisible();
      await expect(page.getByText('Privacy Policy').first()).toBeVisible();
      await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
      await expect(page.getByText('Already have an account?')).toBeVisible();
    });

    test('TC58: Sign up form accepts valid input values', async ({ page }) => {
      await gotoWithRecaptchaMock(page, signupUrl);
      await page.locator('#name').fill('John Doe');
      await page.locator('#email').fill('john.doe@example.com');
      await page.locator('#password').fill('StrongP@ss1');
      await page.locator('#confirmPassword').fill('StrongP@ss1');

      await expect(page.locator('#name')).toHaveValue('John Doe');
      await expect(page.locator('#email')).toHaveValue('john.doe@example.com');
      await expect(page.locator('#password')).toHaveValue('StrongP@ss1');
      await expect(page.locator('#confirmPassword')).toHaveValue('StrongP@ss1');
    });

    test('TC59: Sign up page has Google SSO button', async ({ page }) => {
      await gotoWithRecaptchaMock(page, signupUrl);
      await expect(page.getByRole('button', { name: /Sign up with Google/i })).toBeVisible();
    });

    test('TC60: Sign up - fill all fields and submit fires the signup API call', async ({ page }) => {
      await gotoWithRecaptchaMock(page, signupUrl);
      await blockSignupApi(page); // never create real accounts in the dev DB

      await page.locator('#name').fill('New User');
      await page.locator('#email').fill('newuser-e2e@example.com');
      await page.locator('#password').fill('SecurePass123');
      await page.locator('#confirmPassword').fill('SecurePass123');

      const termsCheckbox = page.getByRole('checkbox').first();
      if (await termsCheckbox.count() > 0) {
        await termsCheckbox.check();
      }

      const requestPromise = page
        .waitForRequest((req) => req.url().includes('/api/signup'), { timeout: 15000 })
        .catch(() => null);

      await page.getByRole('button', { name: 'Create account' }).click();

      const request = await requestPromise;
      expect(request).toBeTruthy();
    });
  });

  // =========================================================================
  // NEGATIVE SCENARIOS - FORM VALIDATION
  // =========================================================================

  test.describe('Negative Scenarios', () => {
    test('TC61: Sign up with empty fields shows validation errors', async ({ page }) => {
      await gotoWithRecaptchaMock(page, signupUrl);
      await page.getByRole('button', { name: 'Create account' }).click();
      const nameValid = await page.locator('#name').evaluate((el: HTMLInputElement) => el.checkValidity());
      const emailValid = await page.locator('#email').evaluate((el: HTMLInputElement) => el.checkValidity());
      const passwordValid = await page.locator('#password').evaluate((el: HTMLInputElement) => el.checkValidity());
      expect(nameValid && emailValid && passwordValid).toBeFalsy();
    });

    test('TC62: Sign up with mismatched passwords stays on signup', async ({ page }) => {
      await gotoWithRecaptchaMock(page, signupUrl);
      await blockSignupApi(page);
      await page.locator('#name').fill('John Doe');
      await page.locator('#email').fill('john@example.com');
      await page.locator('#password').fill('Password1');
      await page.locator('#confirmPassword').fill('DifferentPass1');
      const termsCheckbox = page.getByRole('checkbox').first();
      if (await termsCheckbox.count() > 0) await termsCheckbox.check();
      await page.getByRole('button', { name: 'Create account' }).click();
      await expect(page).toHaveURL(signupUrl);
    });

    test('TC63: Sign up with weak password (too short) stays on signup', async ({ page }) => {
      await gotoWithRecaptchaMock(page, signupUrl);
      await blockSignupApi(page);
      await page.locator('#name').fill('John Doe');
      await page.locator('#email').fill('john@example.com');
      await page.locator('#password').fill('Ab1');
      await page.locator('#confirmPassword').fill('Ab1');
      const termsCheckbox = page.getByRole('checkbox').first();
      if (await termsCheckbox.count() > 0) await termsCheckbox.check();
      await page.getByRole('button', { name: 'Create account' }).click();
      await expect(page).toHaveURL(signupUrl);
    });

    test('TC64: Sign up with invalid email format', async ({ page }) => {
      await gotoWithRecaptchaMock(page, signupUrl);
      await page.locator('#name').fill('John Doe');
      const emailInput = page.locator('#email');
      await emailInput.fill('not-an-email');
      await page.locator('#password').fill('StrongP@ss1');
      await page.locator('#confirmPassword').fill('StrongP@ss1');
      await page.getByRole('button', { name: 'Create account' }).click();
      const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
      expect(validationMessage.length).toBeGreaterThan(0);
    });

    test('TC65: Sign up with XSS in name field stays on signup', async ({ page }) => {
      await gotoWithRecaptchaMock(page, signupUrl);
      await blockSignupApi(page);
      await page.locator('#name').fill('<script>alert("xss")</script>');
      await page.locator('#email').fill('test@example.com');
      await page.locator('#password').fill('StrongP@ss1');
      await page.locator('#confirmPassword').fill('StrongP@ss1');
      const termsCheckbox = page.getByRole('checkbox').first();
      if (await termsCheckbox.count() > 0) await termsCheckbox.check();
      await page.getByRole('button', { name: 'Create account' }).click();
      await expect(page).toHaveURL(signupUrl);
    });
  });
});

test.describe('Authentication - Cross-Flow Navigation', () => {
  test('TC66: Full navigation cycle: Login -> Signup -> Forgot Password -> Login', async ({ page }) => {
    await gotoWithRecaptchaMock(page, loginUrl);
    await expect(page).toHaveURL(loginUrl);

    // Login -> Signup
    await page.getByRole('link', { name: 'Sign up' }).click();
    await expect(page).toHaveURL(signupUrl);

    // Signup -> Login
    await page.getByRole('link', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(loginUrl);

    // Login -> Forgot Password
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await expect(page).toHaveURL(forgotPasswordUrl);

    // Forgot Password -> Login
    await page.getByRole('link', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(loginUrl);
  });

  test('TC67: Logo on login page is visible', async ({ page }) => {
    await gotoWithRecaptchaMock(page, loginUrl);
    await expect(page.getByAltText('Logo')).toBeVisible();
    await expect(page.getByText('MetaWurks').first()).toBeVisible();
  });

  test('TC68: Testimonial section is visible on login page', async ({ page }) => {
    await gotoWithRecaptchaMock(page, loginUrl);
    await expect(page.getByText('Metawurks cut our support resolution time')).toBeVisible();
    await expect(page.getByText('Sarah Chen')).toBeVisible();
  });

  test('TC69: Login - password hidden by default', async ({ page }) => {
    await gotoWithRecaptchaMock(page, loginUrl);
    const passwordInput = page.getByLabel('Password', { exact: true });
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await passwordInput.fill('MySecretPass');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
