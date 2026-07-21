/**
 * =====================================================================
 * TEST PLAN: MetaWurks App — https://dev2.metawurks.com
 * =====================================================================
 *
 * OVERVIEW:
 * This suite tests the MetaWurks web app (metawurks-frontend-webapp-v2),
 * the user-facing frontend of the MetaWurks platform, deployed at dev2.
 * There is no marketing site in this codebase — the root path `/`
 * redirects straight to `/login`.
 *
 * =====================================================================
 * APP ARCHITECTURE (routes that actually exist)
 * =====================================================================
 *
 * [Public routes]
 *   /            -> redirects to /login
 *   /login       -> email+password form, Google SSO, Remember me,
 *                   Forgot password?, Sign up link, testimonial panel,
 *                   reCAPTCHA Enterprise protection
 *   /signup      -> Create your account: #name, #email, #password,
 *                   #confirmPassword, #referralCode, Google SSO
 *   /forgot-password -> email + "Send Reset Link"
 *
 * [Authenticated routes]
 *   /chat        -> main app. WelcomeScreen ("Welcome, {name}" /
 *                   "Let's orchestrate your work!"), composer ("Ask anything"),
 *                   quick actions (Research, Improve writing, Meeting Notes,
 *                   Analyse Resume, Compare, More), model mode "Auto"
 *   /chat/{id}   -> a conversation
 *   /pricing     -> plan selection & billing
 *   /settings    -> profile/settings
 *
 * [Sidebar]
 *   New Conversation | Search | Knowledge Source (expands: Data Library,
 *   Integrations) | AGENTS | Projects | Conversations list
 *   Footer: user card (avatar initial, first name, "{Plan} Plan"), Upgrade.
 *   Profile menu: Upgrade Plan, Settings, Preferences, Usage & Billing,
 *   Help, Log out (opens "Confirm Logout" dialog with Yes/No).
 *
 * [Knowledge Source]
 *   Data Library  -> tabs All Items / Local Uploads / Data Drives,
 *                    empty state "Power Your Workflows with Context" +
 *                    "Upload First Document", Privacy Protected notice
 *   Integrations  -> filter tabs All Items / Connected / Mails /
 *                    Documentation / Communications / Productivity / Finance;
 *                    cards: Gmail, Google Calendar, Outlook, Microsoft Teams,
 *                    Slack, Figma, LinkedIn, Fireflies, Facebook, Stripe,
 *                    QuickBooks, Double + Custom MCP Server
 *
 * [Agents]
 *   Skills panel — "Build and run multi-step skills across your connected
 *   tools", "+ New skill". May be entitlement-gated per account.
 *
 * =====================================================================
 * SUITE LAYOUT
 * =====================================================================
 *
 * Folder & File                             | Coverage
 * ------------------------------------------|--------------------------------
 * tests/shared/auth.setup.ts                | one-time UI login, saves session
 * tests/auth/auth.spec.ts                   | login/signup/forgot UI + validation (signed out)
 * tests/edge-cases/edge-cases.spec.ts       | root redirect, 404, external links (signed out)
 * tests/dashboard/dashboard.spec.ts         | WelcomeScreen, quick actions, sidebar basics
 * tests/chat/chat.spec.ts                   | composer, send message + AI reply, conversations
 * tests/knowledge-source/knowledge-source.spec.ts | Data Library + Integrations
 * tests/agents/agents.spec.ts               | Skills panel
 * tests/projects/projects.spec.ts           | Projects empty state / creation UI
 * tests/settings/settings.spec.ts           | profile menu
 * tests/navigation/post-login-navigation.spec.ts | sidebar nav, logout, back button
 * tests/pricing/pricing.spec.ts             | app pricing page
 *
 * reCAPTCHA: real reCAPTCHA Enterprise blocks automated browsers, so
 * tests/shared/recaptcha-helper.ts stubs window.grecaptcha and mocks
 * /api/recaptcha/verify. Without it every login attempt fails with
 * "reCAPTCHA verification failed".
 *
 * =====================================================================
 * TEST EXECUTION COMMANDS
 * =====================================================================
 *
 * Run all tests:            npx playwright test
 * Run one file:             npx playwright test tests/chat/chat.spec.ts
 * Headed / UI mode:         npx playwright test --headed | --ui
 * View HTML report:         npx playwright show-report
 */
