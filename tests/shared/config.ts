import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env'), quiet: true });

export const config = {
  baseUrl: process.env.BASE_URL || 'https://metawurks.com',
  appUrl: process.env.APP_URL || 'https://apps.metawurks.com',

  /**
   * Backend service base URLs (Suite 36 — API-level cases the frontend cannot
   * reach). Defaults are the dev2 deployments taken from the app's own
   * config/dev2/.env; all are publicly reachable and were verified live.
   * Override per-environment via .env.
   */
  services: {
    payment:
      process.env.PAYMENT_SERVICE_URL ||
      'https://dev2-metawurks-payment-service-306667460443.us-central1.run.app',
    metering:
      process.env.METERING_SERVICE_URL ||
      'https://dev2-metawurks-metering-service-306667460443.us-central1.run.app',
    master:
      process.env.MASTER_SERVICE_URL ||
      'https://dev2-metawurks-master-service-v2-306667460443.us-central1.run.app',
    action:
      process.env.ACTION_SERVICE_URL ||
      'https://dev2-metawurks-action-service-v2-306667460443.us-central1.run.app',
  },

  navigationTimeout: parseInt(process.env.NAVIGATION_TIMEOUT || '30000', 10),
  elementTimeout: parseInt(process.env.ELEMENT_TIMEOUT || '10000', 10),

  viewport: {
    width: parseInt(process.env.VIEWPORT_WIDTH || '1280', 10),
    height: parseInt(process.env.VIEWPORT_HEIGHT || '900', 10),
  },

  retryCount: parseInt(process.env.RETRY_COUNT || '0', 10),
  workerCount: process.env.WORKER_COUNT === 'undefined' ? undefined : parseInt(process.env.WORKER_COUNT || '0', 10),

  // Login Credentials (from .env)
  login: {
    username: process.env.LOGIN_USERNAME || '',
    password: process.env.LOGIN_PASSWORD || '',
    isConfigured: !!(process.env.LOGIN_USERNAME && process.env.LOGIN_PASSWORD),
  },

  // reCAPTCHA Configuration
  recaptcha: {
    siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '',
    secretKey: process.env.RECAPTCHA_SECRET_KEY || '',
    projectId: process.env.RECAPTCHA_PROJECT_ID || '',
    isConfigured: !!(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
  },
};