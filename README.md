# MetaWurks Frontend Web App v2 — Playwright Test Suite

End-to-end Playwright tests for the MetaWurks Frontend Web App v2, targeting the
**dev2** deployment (`https://dev2.metawurks.com`). Tests are organised to match
the **Test Case Document** (`Frontend_WebApp_v2_TestCases_Updated.pdf`, rev.3):
one spec file per PDF suite, with each `test()` titled by its exact TC ID.

Currently implemented: **Suites 1–25 (340 test cases).**
See [`specs/SUITES-TRACEABILITY.md`](specs/SUITES-TRACEABILITY.md) for the full
suite table and the reality-vs-PDF gap notes.

## Prerequisites

- Node.js 18+, npm 9+
- `npx playwright install chromium`

## Configuration

Copy `.env.example` → `.env` and set the dev2 test account:

| Variable | Description | Default |
|---|---|---|
| `BASE_URL` / `APP_URL` | App base URL | `https://dev2.metawurks.com` |
| `LOGIN_USERNAME` / `LOGIN_PASSWORD` | dev2 test account (required for authenticated suites) | — |
| `NAVIGATION_TIMEOUT` / `ELEMENT_TIMEOUT` | timeouts (ms) | 30000 / 15000 |

`.env` is gitignored.

## Structure

```
tests/
  suites/           suite-01..25-*.spec.ts     # one file per PDF suite
  shared/           config.ts, auth.setup.ts, auth-helper.ts,
                    app-helpers.ts, recaptcha-helper.ts
  fixtures/         sample.pdf, sample.docx, image.png, clip.mp4,
                    notes.md/.txt, empty.txt, malware.exe
specs/
  SUITES-TRACEABILITY.md
```

## Projects (see `playwright.config.ts`)

- **`setup`** — logs in once via the real UI (reCAPTCHA mocked) and saves the
  session to `.auth/user.json`.
- **`chromium-no-auth`** — signed-out suites: **1, 2, 3, 5, 20, 21**.
- **`chromium`** — authenticated suites (reuse the saved session): **4, 6–19,
  22–25**. Suite 4 clears the session internally for its logged-out cases.

## Running

```bash
# Everything
npx playwright test

# Signed-out suites only (no credentials needed for most cases)
npx playwright test --project=chromium-no-auth

# Authenticated suites only (needs LOGIN_* in .env)
npx playwright test --project=chromium

# One suite / one case
npx playwright test suite-07
npx playwright test -g "7.4"

# Interactive UI mode
npx playwright test --ui

# HTML report
npx playwright show-report
```

## How the tests treat the PDF vs the real app

The PDF states intended behaviour; known product/backend gaps are tracked
separately. Where the app genuinely differs, a test asserts the **actual**
behaviour with a `// PDF expects X` comment instead of failing. Cases that need
a live third party (Google/Microsoft/Stripe/MCP OAuth), seeded data, or a UI
that isn't implemented use `test.skip(...)` with a documented reason, so they
remain visible in the report and never produce false failures. The full list of
these is in `specs/SUITES-TRACEABILITY.md`.
