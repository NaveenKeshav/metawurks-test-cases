# MetaWurks Frontend Web App v2 — Playwright Suites 1–25

Source of truth: `Frontend_WebApp_v2_TestCases_Updated.pdf` (rev.3, 486 TCs).
Target environment: **dev2.metawurks.com** (see `.env`). Every PDF test case in
Suites 1–25 has a 1:1 Playwright `test()` with the exact TC ID in its title.

## Layout & projects

```
tests/suites/suite-01..25-*.spec.ts   # one file per PDF suite, 340 tests
tests/shared/                          # config, auth.setup, helpers, recaptcha mock
tests/fixtures/                        # upload sample files
```

- **`chromium-no-auth`** (signed-out): Suites 1, 2, 3, 5, 20, 21.
- **`chromium`** (authenticated via `auth.setup.ts` → `.auth/user.json`): Suites
  4, 6–19, 22–25. Suite 4 clears storageState internally for its logged-out
  route-protection cases.

| Suite | Area | TCs | Suite | Area | TCs |
|---|---|---|---|---|---|
| 1 | Login | 21 | 14 | Integrations & MCP | 12 |
| 2 | Signup | 17 | 15 | Skills/Agents Authoring | 12 |
| 3 | Forgot/Reset Password | 8 | 16 | Billing/Pricing/Stripe | 16 |
| 4 | OAuth & Route Protection | 10 | 17 | Settings | 16 |
| 5 | Referral | 6 | 18 | Onboarding | 8 |
| 6 | Chat Send/Stream | 18 | 19 | Notifications/Voice/Misc | 10 |
| 7 | Chat Management | 20 | 20 | Login deep edge cases | 15 |
| 8 | Model Selection & Chat UI | 12 | 21 | Signup deep edge cases | 13 |
| 9 | Local File Upload | 20 | 22 | Session & Token management | 12 |
| 10 | Google Drive / OneDrive | 16 | 23 | Chat streaming deep | 16 |
| 11 | Knowledge/Data Library | 17 | 24 | Chat data integrity & history | 12 |
| 12 | Projects | 13 | 25 | Accessibility & i18n | 12 |
| 13 | Global Search | 8 | | **Total (1–25)** | **340** |

## How tests handle reality vs the PDF's ideal

The PDF describes intended behaviour; product/backend gaps are tracked in the
companion "Known Gaps Report". Where the app deviates, the test asserts the
**actual** behaviour with a `// PDF expects X` comment, rather than failing.
Cases that need a live third party, seeded data, or a UI that doesn't exist use
`test.skip(...)` with a documented reason (so they stay visible and never
false-fail).

### Documented gaps asserted/guarded in the code

- **Auth:** email is not trimmed/lowercased (1.8/1.9/20.1 case-sensitive); no
  client password-strength rule (2.3/21.4); signup → `/dashboard`, not
  onboarding (2.14); authed user on `/login` is not redirected (4.10); no
  account lockout / rate-limit / caps-lock warning (1.15/20.7/20.13/20.4).
- **Chat:** 500 / network-drop / unavailable-model recover **silently** — no
  error banner or Retry (6.6/6.13/6.16/23.2/23.10); only a 402 raises the
  "Monthly Token Limit Reached" dialog (6.14). No share-revoke UI (7.11); no
  in-chat theme toggle (8.11 → Settings); no per-model disabled state (8.4).
- **Upload:** no drag-drop highlight, 0-byte rejection, duplicate detection,
  progress bar, or in-progress cancel; extension-only validation
  (9.6/9.11/9.13/9.14/9.16/9.19). No mounted toast — reject cases assert the
  file is not queued (9.9/9.10). Status is surfaced via a bell that is **not
  mounted** (9.18/19.1 guarded).
- **Drive:** no public shared-link field (10.8); no broken-connection error
  badge (10.14). Connection-dependent cases skip when no drive is connected.
- **Library:** delete uses native `window.confirm()`; no bulk select-all, no
  working sort; chunks/folder-tree live on `/discover` (11.6/11.8/11.10/11.16).
- **Search:** conversations-only in-panel page — no document search, no
  debounce, no recent-searches (13.2/13.7/13.8).
- **Projects:** switch = row-click → `?project_id=` (no dropdown); duplicate
  error is backend-driven (mocked in 12.2); no per-chat badge (12.9).
- **Integrations/MCP:** Custom-MCP client validation is automatable (14.6); no
  test-connection UI, no tools/capabilities list (14.5/14.12).
- **Skills:** no in-panel run/output, delete, fork, or run-history — running is
  chat-driven via `/skill run`; compile needs the live Master service
  (15.5/15.9/15.11/15.12 guarded).
- **Settings:** name/email are read-only; no password/API-keys/models/env tabs
  (17.1–17.5/17.7/17.8/17.10–17.13 guarded). Theme + usage are automatable.
- **Billing:** pricing view + checkout-cancel page automatable; checkout /
  portal / webhooks need live Stripe (guarded).
- **Misc:** no toast system (uses `alert()`/`confirm()`) — 19.6 guarded; invalid
  routes render the default Next.js 404 with no home link (19.8).

## Running

```bash
npm install
npx playwright install chromium
# signed-out suites (no creds needed for most):
npx playwright test --project=chromium-no-auth
# authenticated suites (needs LOGIN_USERNAME/PASSWORD in .env):
npx playwright test --project=chromium
# a single suite:
npx playwright test suite-07
```
