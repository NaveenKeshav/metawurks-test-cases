import { Page } from '@playwright/test';

/**
 * Blocks the real Google reCAPTCHA Enterprise script and injects a mock that
 * auto-resolves with a fake token, allowing form submissions to proceed.
 * 
 * Usage: Call this before navigating to any page that uses reCAPTCHA.
 */
export async function mockRecaptcha(page: Page): Promise<void> {
  // Block the real reCAPTCHA Enterprise script from loading
  await page.route('**/recaptcha/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        // Mock grecaptcha to auto-resolve with a fake token
        window.grecaptcha = {
          enterprise: {
            ready: function(cb) { if (cb) cb(); },
            execute: function() { return Promise.resolve('mock-token'); },
            render: function() { return 'mock-widget'; },
            getResponse: function() { return 'mock-token'; },
            reset: function() {}
          },
          ready: function(cb) { if (cb) cb(); },
          execute: function() { return Promise.resolve('mock-token'); },
          render: function() { return 'mock-widget'; },
          getResponse: function() { return 'mock-token'; },
          reset: function() {}
        };

        // Dispatch ready event for scripts that wait for it
        window.dispatchEvent(new Event('grecaptcha-ready'));
      `,
    });
  });

  // Also block the /recaptcha/api.js endpoint
  await page.route('**/recaptcha/api.js**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        window.grecaptcha = {
          enterprise: {
            ready: function(cb) { if (cb) cb(); },
            execute: function() { return Promise.resolve('mock-token'); },
            render: function() { return 'mock-widget'; },
            getResponse: function() { return 'mock-token'; },
            reset: function() {}
          },
          ready: function(cb) { if (cb) cb(); },
          execute: function() { return Promise.resolve('mock-token'); },
          render: function() { return 'mock-widget'; },
          getResponse: function() { return 'mock-token'; },
          reset: function() {}
        };
      `,
    });
  });

  // Block the grecaptcha badge iframe
  await page.route('**/recaptcha/enterprise/anchor**', route => route.abort());
}

/**
 * Navigates to a URL with reCAPTCHA mocked at the network level.
 */
export async function gotoWithRecaptchaMock(page: Page, url: string): Promise<void> {
  await mockRecaptcha(page);
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}