import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env'), quiet: true });

export const config = {
  baseUrl: process.env.BASE_URL || 'https://metawurks.com',
  appUrl: process.env.APP_URL || 'https://apps.metawurks.com',

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