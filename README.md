# MetaWurks Website - Playwright Test Suite

Automated end-to-end test suite for [https://metawurks.com/](https://metawurks.com/) using Playwright.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Test Plan Overview](#test-plan-overview)
- [Test Execution](#test-execution)
  - [Run All Tests](#run-all-tests)
  - [Run Tests by Functionality](#run-tests-by-functionality)
  - [Run Tests in Headed Mode](#run-tests-in-headed-mode)
  - [Run Tests in UI Mode](#run-tests-in-ui-mode)
  - [Run Tests in Specific Browser](#run-tests-in-specific-browser)
  - [Run a Single Test Case](#run-a-single-test-case)
  - [Run Tests with Debug Mode](#run-tests-with-debug-mode)
- [Test Reports](#test-reports)
- [Project Structure](#project-structure)
- [Test Cases Summary](#test-cases-summary)

---

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Git** (optional, for version control)

## Installation

```bash
# 1. Clone or navigate to the project directory
cd d:\MetaDot\metawurks\Testing\playwright\Latest

# 2. Install dependencies
npm install

# 3. Install Playwright browsers (if not already installed)
npx playwright install
```

## Configuration

The test suite uses environment variables defined in the `.env` file at the project root.

### Setting up `.env`

1. Copy the example file to create your own `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` to customize configuration as needed:

   | Variable | Description | Default |
   |---|---|---|
   | `BASE_URL` | Website base URL | `https://metawurks.com` |
   | `APP_URL` | External app URL | `https://apps.metawurks.com` |
   | `NAVIGATION_TIMEOUT` | Navigation timeout (ms) | `30000` |
   | `ELEMENT_TIMEOUT` | Element wait timeout (ms) | `10000` |
   | `VIEWPORT_WIDTH` | Desktop viewport width | `1280` |
   | `VIEWPORT_HEIGHT` | Desktop viewport height | `900` |
   | `RETRY_COUNT` | Number of test retries | `0` |
   | `WORKER_COUNT` | Parallel worker count | `undefined` (auto) |
   | `LOGIN_USERNAME` | Real email for auth test TC42 & post-login tests | *(optional)* |
   | `LOGIN_PASSWORD` | Real password for auth test TC42 & post-login tests | *(optional)* |

> **Note:** The `.env` file is excluded from version control via `.gitignore`. Use `.env.example` as a reference template.

## Test Plan Overview

The test suite covers **150 test cases** across **17 functional areas** of the MetaWurks website:

| # | Functionality | File Path | Tests |
|---|---------------|-----------|-------|
| 1 | **Home Page** | `tests/pages/home.spec.ts` | TC01-TC04 |
| 2 | **Navigation** | `tests/layout/navigation.spec.ts` | TC05-TC08 |
| 3 | **Product Page** | `tests/pages/product-page.spec.ts` | TC09-TC11 |
| 4 | **Pricing Page** | `tests/pages/pricing.spec.ts` | TC12-TC16 |
| 5 | **About Us** | `tests/pages/about-us.spec.ts` | TC17-TC19 |
| 6 | **Blog Page** | `tests/pages/blog.spec.ts` | TC20-TC22 |
| 7 | **Contact Page** | `tests/pages/contact.spec.ts` | TC23-TC24 |
| 8 | **Footer** | `tests/layout/footer.spec.ts` | TC25-TC26 |
| 9 | **Edge Cases** | `tests/edge-cases/edge-cases.spec.ts` | TC27-TC28 |
| 10 | **Authentication** | `tests/auth/auth.spec.ts` | TC29-TC69 |
| 11 | **Dashboard** | `tests/dashboard/dashboard.spec.ts` | TC70-TC81 |
| 12 | **Chat / Conversation** | `tests/chat/chat.spec.ts` | TC82-TC90 |
| 13 | **Knowledge Source** | `tests/knowledge-source/knowledge-source.spec.ts` | TC91-TC113 |
| 14 | **Agents / Skills** | `tests/agents/agents.spec.ts` | TC114-TC119 |
| 15 | **Projects** | `tests/projects/projects.spec.ts` | TC120-TC125 |
| 16 | **Settings / Profile** | `tests/settings/settings.spec.ts` | TC126-TC136 |
| 17 | **Post-Login Navigation** | `tests/navigation/post-login-navigation.spec.ts` | TC137-TC150 |

### Authentication Test Breakdown (`tests/auth/auth.spec.ts`)

The authentication module covers **41 test cases** across **6 sub-areas**:

| Area | Tests | Scenarios |
|------|-------|-----------|
| **Login - Positive** | TC29-TC39 (11 tests) | UI elements, Google SSO, reCAPTCHA, remember me, field inputs, forgot password link, signup link, navigation |
| **Login - API & Submission** | TC40-TC45 (6 tests) | API trigger, 401 response, remember me submit, password toggle, forgot password submit, flow cycle |
| **Login - Negative** | TC46-TC56 (11 tests) | Empty fields, invalid email, short password, SQL injection, XSS, long input, special chars, whitespace |
| **Signup - Positive** | TC57-TC60 (4 tests) | UI elements, valid form input, Google SSO, API trigger |
| **Signup - Negative** | TC61-TC65 (5 tests) | Empty fields, mismatched passwords, weak passwords, invalid email, XSS |
| **Cross-Flow** | TC66-TC69 (4 tests) | Full navigation cycle, logo visibility, testimonial, password eye toggle |

### Post-Login Test Breakdown

The post-login module covers **81 test cases** across **7 functional areas**:

| Area | Tests | Scenarios |
|------|-------|-----------|
| **Dashboard** | TC70-TC81 (12 tests) | Welcome heading, quick actions, chat input, auto mode, integration prompt, sidebar items, logo, recent conversations, privacy notice, negative checks |
| **Chat / Conversation** | TC82-TC90 (9 tests) | New conversation, text input, recent conversations, chat history, search, mode options, empty/long/special input |
| **Knowledge Source** | TC91-TC113 (23 tests) | Data Library tabs, upload prompt, privacy notice, integration categories, Gmail/Calendar/Outlook/Teams/Slack/Figma/LinkedIn/Fireflies/Facebook/Stripe/QuickBooks/Double, Custom MCP Server, filters, negative checks |
| **Agents / Skills** | TC114-TC119 (6 tests) | Skills section, existing skills, run commands, new skill button, empty state |
| **Projects** | TC120-TC125 (6 tests) | Project section, new project button, empty state, negative checks |
| **Settings / Profile** | TC126-TC136 (11 tests) | Profile menu, avatar, plan info, settings/preferences/billing/help/upgrade/logout options, menu close on outside click |
| **Post-Login Navigation** | TC137-TC150 (14 tests) | Sidebar items, expand/collapse, new conversation, conversations section, logo, toggle button, URL params, logout flow, invalid URL, back button |

For detailed test plan documentation, see `tests/shared/seed.spec.ts`.

## Test Execution

### Run All Tests

Execute the entire test suite across all configured browsers (Chromium, Firefox, WebKit). Playwright automatically discovers all `*.spec.ts` files in the `tests/` directory recursively:

```bash
npx playwright test
```

### Run Tests by Functionality

Run tests for a specific area of the website:

```bash
# --- Page Tests ---
npx playwright test tests/pages/home.spec.ts
npx playwright test tests/pages/product-page.spec.ts
npx playwright test tests/pages/pricing.spec.ts
npx playwright test tests/pages/about-us.spec.ts
npx playwright test tests/pages/blog.spec.ts
npx playwright test tests/pages/contact.spec.ts

# --- Layout Tests ---
npx playwright test tests/layout/navigation.spec.ts
npx playwright test tests/layout/footer.spec.ts

# --- Edge Case Tests ---
npx playwright test tests/edge-cases/edge-cases.spec.ts

# --- Authentication Tests (41 test cases - login, signup, forgot password) ---
npx playwright test tests/auth/auth.spec.ts

# --- Post-Login Tests (requires valid .env credentials) ---
npx playwright test tests/dashboard/dashboard.spec.ts
npx playwright test tests/chat/chat.spec.ts
npx playwright test tests/knowledge-source/knowledge-source.spec.ts
npx playwright test tests/agents/agents.spec.ts
npx playwright test tests/projects/projects.spec.ts
npx playwright test tests/settings/settings.spec.ts
npx playwright test tests/navigation/post-login-navigation.spec.ts
```

### Run Tests in Headed Mode

Run tests with the browser UI visible (useful for debugging):

```bash
npx playwright test --headed
```

### Run Tests in UI Mode

Launch the Playwright UI mode for interactive test execution and debugging:

```bash
npx playwright test --ui
```

### Run Tests in Specific Browser

Run tests only in a specific browser:

```bash
# Chromium only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# WebKit (Safari) only
npx playwright test --project=webkit
```

### Run a Single Test Case

Run a specific test by filtering with the test name:

```bash
# Run a test by its TC number
npx playwright test -g "TC70"

# Run a test by its description
npx playwright test -g "Dashboard loads"

# Run tests matching a pattern
npx playwright test -g "Knowledge Source"

# Run post-login negative tests
npx playwright test -g "Negative"
```

### Run Tests with Debug Mode

Run tests with the Playwright debugger (Pause on each action, step through tests):

```bash
npx playwright test --debug
```

## Test Reports

After test execution, an HTML report is automatically generated.

### View HTML Report

```bash
npx playwright show-report
```

This opens an interactive HTML report in your browser with:
- Test pass/fail status
- Test duration
- Error messages and stack traces
- Screenshots on failure
- Trace viewer for failed tests

### View Report in CI

The HTML report is saved to the `playwright-report/` directory. You can also configure CI pipelines to publish this as an artifact.

## Project Structure

```
├── .env                        # Environment variables (local, gitignored)
├── .env.example                # Reference template for environment variables
├── .gitignore                  # Git ignore rules
├── package.json                # Project dependencies and scripts
├── playwright.config.ts        # Playwright test configuration
├── README.md                   # This file
├── specs/                      # Additional specification files
│   └── README.md
└── tests/
    ├── shared/
    │   ├── config.ts           # Centralized configuration reader
    │   ├── seed.spec.ts        # Test plan documentation
    │   ├── recaptcha-helper.ts # reCAPTCHA mocking utility
    │   └── auth-helper.ts      # Login helper for post-login tests
    ├── pages/
    │   ├── home.spec.ts        # Home page tests (TC01-TC04)
    │   ├── product-page.spec.ts# Product page tests (TC09-TC11)
    │   ├── pricing.spec.ts     # Pricing page tests (TC12-TC16)
    │   ├── about-us.spec.ts    # About Us page tests (TC17-TC19)
    │   ├── blog.spec.ts        # Blog page tests (TC20-TC22)
    │   └── contact.spec.ts     # Contact page tests (TC23-TC24)
    ├── layout/
    │   ├── navigation.spec.ts  # Navigation tests (TC05-TC08)
    │   └── footer.spec.ts      # Footer tests (TC25-TC26)
    ├── auth/
    │   └── auth.spec.ts        # Authentication tests (TC29-TC69)
    ├── edge-cases/
    │   └── edge-cases.spec.ts  # Edge case tests (TC27-TC28)
    ├── dashboard/
    │   └── dashboard.spec.ts   # Dashboard tests (TC70-TC81)
    ├── chat/
    │   └── chat.spec.ts        # Chat/Conversation tests (TC82-TC90)
    ├── knowledge-source/
    │   └── knowledge-source.spec.ts # Data Library + Integrations tests (TC91-TC113)
    ├── agents/
    │   └── agents.spec.ts      # Agents/Skills tests (TC114-TC119)
    ├── projects/
    │   └── projects.spec.ts    # Projects tests (TC120-TC125)
    ├── settings/
    │   └── settings.spec.ts    # Settings/Profile tests (TC126-TC136)
    └── navigation/
        └── post-login-navigation.spec.ts # Post-login navigation tests (TC137-TC150)
```

## Test Cases Summary

### Unsecured Pages (TC01-TC28)

| TC ID | Test Description | File |
|-------|-----------------|------|
| TC01 | Home page loads with all key elements | `pages/home.spec.ts` |
| TC02 | AI Environment cards display Explore links | `pages/home.spec.ts` |
| TC03 | Home page model router section is displayed | `pages/home.spec.ts` |
| TC04 | Dashboard preview section displays stats | `pages/home.spec.ts` |
| TC05 | Header navigation links navigate to correct pages | `layout/navigation.spec.ts` |
| TC06 | Logo links back to home page | `layout/navigation.spec.ts` |
| TC07 | Sign In button navigates to external app login | `layout/navigation.spec.ts` |
| TC08 | Get Started button navigates to external early access page | `layout/navigation.spec.ts` |
| TC09 | Product page loads with all feature sections | `pages/product-page.spec.ts` |
| TC10 | Product page displays stat counters | `pages/product-page.spec.ts` |
| TC11 | Product page shows workflow steps | `pages/product-page.spec.ts` |
| TC12 | Pricing page displays all plan tiers | `pages/pricing.spec.ts` |
| TC13 | Pricing page has monthly/annual billing toggle | `pages/pricing.spec.ts` |
| TC14 | Compare Plans table is displayed | `pages/pricing.spec.ts` |
| TC15 | Get Started buttons on pricing cards are visible | `pages/pricing.spec.ts` |
| TC16 | FAQ accordion section is present | `pages/pricing.spec.ts` |
| TC17 | About Us page loads with core values | `pages/about-us.spec.ts` |
| TC18 | Team members section is displayed | `pages/about-us.spec.ts` |
| TC19 | About Us page has Contact Us CTA | `pages/about-us.spec.ts` |
| TC20 | Blog page loads with article cards | `pages/blog.spec.ts` |
| TC21 | Blog articles have categories, dates, and read times | `pages/blog.spec.ts` |
| TC22 | Blog newsletter signup section is present | `pages/blog.spec.ts` |
| TC23 | Contact page loads with form fields | `pages/contact.spec.ts` |
| TC24 | Contact page displays company contact info | `pages/contact.spec.ts` |
| TC25 | Footer is present on all pages with consistent links | `layout/footer.spec.ts` |
| TC26 | Footer contact details are correct | `layout/footer.spec.ts` |
| TC27 | Non-existent page returns 404 or custom error page | `edge-cases/edge-cases.spec.ts` |
| TC28 | External links open in new tab | `edge-cases/edge-cases.spec.ts` |

### Authentication (TC29-TC69)

| TC ID | Test Description | File |
|-------|-----------------|------|
| TC29 | Login page loads with all UI elements | `auth/auth.spec.ts` |
| TC30 | Login page has Google SSO button | `auth/auth.spec.ts` |
| TC31 | Login page has reCAPTCHA notice | `auth/auth.spec.ts` |
| TC32 | Remember me checkbox is present and toggleable | `auth/auth.spec.ts` |
| TC33 | Login form - fill email and password fields successfully | `auth/auth.spec.ts` |
| TC34 | Login form - submit with valid credentials format triggers API call | `auth/auth.spec.ts` |
| TC35 | Forgot password link navigates to forgot password page | `auth/auth.spec.ts` |
| TC36 | Sign up link navigates to registration page | `auth/auth.spec.ts` |
| TC37 | Sign in link on signup page navigates back to login | `auth/auth.spec.ts` |
| TC38 | Sign in link on forgot password page navigates back to login | `auth/auth.spec.ts` |
| TC39 | Forgot password page has email field and send button | `auth/auth.spec.ts` |
| TC40 | Login - fill form and submit triggers API | `auth/auth.spec.ts` |
| TC41 | Login - submit with invalid credentials shows 401 | `auth/auth.spec.ts` |
| TC42 | Login with valid credentials from .env - successful authentication | `auth/auth.spec.ts` |
| TC43 | Login - password visibility toggle works | `auth/auth.spec.ts` |
| TC44 | Forgot password - submit with valid email | `auth/auth.spec.ts` |
| TC45 | Forgot password - form fill and restore password link cycle | `auth/auth.spec.ts` |
| TC46 | Login with empty email and password shows validation | `auth/auth.spec.ts` |
| TC47 | Login with invalid email format shows validation error | `auth/auth.spec.ts` |
| TC48 | Login with empty password shows validation | `auth/auth.spec.ts` |
| TC49 | Login with very short password (less than 6 chars) | `auth/auth.spec.ts` |
| TC50 | Login with SQL injection attempt in email field | `auth/auth.spec.ts` |
| TC51 | Login with XSS attempt in email field | `auth/auth.spec.ts` |
| TC52 | Login with extremely long email and password | `auth/auth.spec.ts` |
| TC53 | Login with special characters in password | `auth/auth.spec.ts` |
| TC54 | Login with whitespace-only email and password | `auth/auth.spec.ts` |
| TC55 | Forgot password with empty email shows validation | `auth/auth.spec.ts` |
| TC56 | Forgot password with invalid email format | `auth/auth.spec.ts` |
| TC57 | Sign up page loads with all UI elements | `auth/auth.spec.ts` |
| TC58 | Sign up form accepts valid input values | `auth/auth.spec.ts` |
| TC59 | Sign up page has Google SSO button | `auth/auth.spec.ts` |
| TC60 | Sign up - fill all fields and submit triggers API call | `auth/auth.spec.ts` |
| TC61 | Sign up with empty fields shows validation errors | `auth/auth.spec.ts` |
| TC62 | Sign up with mismatched passwords | `auth/auth.spec.ts` |
| TC63 | Sign up with weak password (too short) | `auth/auth.spec.ts` |
| TC64 | Sign up with invalid email format | `auth/auth.spec.ts` |
| TC65 | Sign up with XSS in name field | `auth/auth.spec.ts` |
| TC66 | Full navigation cycle: Login -> Signup -> Forgot Password -> Login | `auth/auth.spec.ts` |
| TC67 | Logo on login page is visible | `auth/auth.spec.ts` |
| TC68 | Testimonial section is visible on login page | `auth/auth.spec.ts` |
| TC69 | Login - password hidden by default and eye toggle works | `auth/auth.spec.ts` |

### Dashboard (TC70-TC81)

| TC ID | Test Description | File |
|-------|-----------------|------|
| TC70 | Dashboard loads with welcome heading and orchestration subtitle | `dashboard/dashboard.spec.ts` |
| TC71 | Dashboard displays quick action suggestion buttons | `dashboard/dashboard.spec.ts` |
| TC72 | Dashboard has chat input area with send functionality | `dashboard/dashboard.spec.ts` |
| TC73 | Dashboard shows auto mode toggle | `dashboard/dashboard.spec.ts` |
| TC74 | Dashboard displays knowledge source integration prompt | `dashboard/dashboard.spec.ts` |
| TC75 | Dashboard sidebar shows user profile with name and plan | `dashboard/dashboard.spec.ts` |
| TC76 | Dashboard sidebar displays all main navigation items | `dashboard/dashboard.spec.ts` |
| TC77 | Dashboard sidebar logo is visible and clickable | `dashboard/dashboard.spec.ts` |
| TC78 | Dashboard displays recent conversation in sidebar | `dashboard/dashboard.spec.ts` |
| TC79 | Dashboard privacy notice is displayed | `dashboard/dashboard.spec.ts` |
| TC80 | Dashboard should not show login page elements after authentication | `dashboard/dashboard.spec.ts` |
| TC81 | Dashboard should not show unauthenticated content | `dashboard/dashboard.spec.ts` |

### Chat / Conversation (TC82-TC90)

| TC ID | Test Description | File |
|-------|-----------------|------|
| TC82 | New Conversation button in sidebar initiates a fresh chat | `chat/chat.spec.ts` |
| TC83 | Chat input accepts and displays typed text | `chat/chat.spec.ts` |
| TC84 | Recent conversation appears in the sidebar list | `chat/chat.spec.ts` |
| TC85 | Clicking a recent conversation loads the chat history | `chat/chat.spec.ts` |
| TC86 | Search functionality in chat header is accessible | `chat/chat.spec.ts` |
| TC87 | Chat area displays model router mode options | `chat/chat.spec.ts` |
| TC88 | Empty chat input should not break the UI | `chat/chat.spec.ts` |
| TC89 | Very long text in chat input does not break layout | `chat/chat.spec.ts` |
| TC90 | Chat input with special characters renders correctly | `chat/chat.spec.ts` |

### Knowledge Source - Data Library & Integrations (TC91-TC113)

| TC ID | Test Description | File |
|-------|-----------------|------|
| TC91 | Knowledge Source menu expands to show Data Library and Integrations | `knowledge-source/knowledge-source.spec.ts` |
| TC92 | Data Library section displays All Items, Local Uploads, Data Drives tabs | `knowledge-source/knowledge-source.spec.ts` |
| TC93 | Data Library shows upload prompt for first document | `knowledge-source/knowledge-source.spec.ts` |
| TC94 | Data Library displays privacy protection notice | `knowledge-source/knowledge-source.spec.ts` |
| TC95 | Data Library has Integration Guide link | `knowledge-source/knowledge-source.spec.ts` |
| TC96 | Integrations section displays all integration categories | `knowledge-source/knowledge-source.spec.ts` |
| TC97 | Gmail integration card is displayed with Connect button | `knowledge-source/knowledge-source.spec.ts` |
| TC98 | Google Calendar integration card is displayed | `knowledge-source/knowledge-source.spec.ts` |
| TC99 | Outlook integration card is displayed | `knowledge-source/knowledge-source.spec.ts` |
| TC100 | Microsoft Teams integration card is displayed | `knowledge-source/knowledge-source.spec.ts` |
| TC101 | Slack integration card is displayed | `knowledge-source/knowledge-source.spec.ts` |
| TC102 | Figma integration card is displayed | `knowledge-source/knowledge-source.spec.ts` |
| TC103 | LinkedIn integration card is displayed | `knowledge-source/knowledge-source.spec.ts` |
| TC104 | Fireflies integration card is displayed | `knowledge-source/knowledge-source.spec.ts` |
| TC105 | Facebook integration card is displayed | `knowledge-source/knowledge-source.spec.ts` |
| TC106 | Stripe integration card is displayed | `knowledge-source/knowledge-source.spec.ts` |
| TC107 | QuickBooks integration card is displayed | `knowledge-source/knowledge-source.spec.ts` |
| TC108 | Double integration card is displayed | `knowledge-source/knowledge-source.spec.ts` |
| TC109 | Custom MCP Server option is available | `knowledge-source/knowledge-source.spec.ts` |
| TC110 | All Items filter shows all integrations by default | `knowledge-source/knowledge-source.spec.ts` |
| TC111 | Connected filter tab is visible | `knowledge-source/knowledge-source.spec.ts` |
| TC112 | Knowledge Source sub-menus are hidden by default when collapsed | `knowledge-source/knowledge-source.spec.ts` |
| TC113 | Integration Connect buttons should not show error when clicked without auth | `knowledge-source/knowledge-source.spec.ts` |

### Agents / Skills (TC114-TC119)

| TC ID | Test Description | File |
|-------|-----------------|------|
| TC114 | Agents section displays heading and skill creation prompt | `agents/agents.spec.ts` |
| TC115 | Agents section shows existing skills with run commands | `agents/agents.spec.ts` |
| TC116 | Skills section has run button or action for each skill | `agents/agents.spec.ts` |
| TC117 | +New skill button is clickable for creating new skills | `agents/agents.spec.ts` |
| TC118 | Agents section shows proper empty state when no skills exist | `agents/agents.spec.ts` |
| TC119 | Agents section should not show unrelated content | `agents/agents.spec.ts` |

### Projects (TC120-TC125)

| TC ID | Test Description | File |
|-------|-----------------|------|
| TC120 | Projects section displays header with description | `projects/projects.spec.ts` |
| TC121 | Projects section has New Project button | `projects/projects.spec.ts` |
| TC122 | Projects section shows empty state message when no projects exist | `projects/projects.spec.ts` |
| TC123 | New Project button is clickable for creating projects | `projects/projects.spec.ts` |
| TC124 | Projects section does not show dashboard content | `projects/projects.spec.ts` |
| TC125 | Projects empty state should indicate no projects available | `projects/projects.spec.ts` |

### Settings / User Profile (TC126-TC136)

| TC ID | Test Description | File |
|-------|-----------------|------|
| TC126 | User profile menu opens with all options | `settings/settings.spec.ts` |
| TC127 | User profile shows avatar with initials | `settings/settings.spec.ts` |
| TC128 | User profile displays plan information | `settings/settings.spec.ts` |
| TC129 | Settings option in profile menu is clickable | `settings/settings.spec.ts` |
| TC130 | Preferences option in profile menu is clickable | `settings/settings.spec.ts` |
| TC131 | Usage & Billing option in profile menu is clickable | `settings/settings.spec.ts` |
| TC132 | Help option in profile menu is clickable | `settings/settings.spec.ts` |
| TC133 | Upgrade Plan option in profile menu is clickable | `settings/settings.spec.ts` |
| TC134 | Log out option is visible in profile menu | `settings/settings.spec.ts` |
| TC135 | Profile menu should not show login page elements | `settings/settings.spec.ts` |
| TC136 | Profile menu should close when clicking outside | `settings/settings.spec.ts` |

### Post-Login Navigation (TC137-TC150)

| TC ID | Test Description | File |
|-------|-----------------|------|
| TC137 | Sidebar navigation items are all present and clickable | `navigation/post-login-navigation.spec.ts` |
| TC138 | Clicking Knowledge Source expands sub-menu with Data Library and Integrations | `navigation/post-login-navigation.spec.ts` |
| TC139 | Clicking Knowledge Source again collapses sub-menu | `navigation/post-login-navigation.spec.ts` |
| TC140 | Clicking New Conversation resets to fresh chat state | `navigation/post-login-navigation.spec.ts` |
| TC141 | Recent conversations section is expandable | `navigation/post-login-navigation.spec.ts` |
| TC142 | Sidebar logo is visible at the top | `navigation/post-login-navigation.spec.ts` |
| TC143 | Sidebar collapse/expand toggle button is present | `navigation/post-login-navigation.spec.ts` |
| TC144 | Chat panel icon changes based on active section (agents) | `navigation/post-login-navigation.spec.ts` |
| TC145 | Application URL contains chat base path | `navigation/post-login-navigation.spec.ts` |
| TC146 | Log out from profile menu navigates to login page | `navigation/post-login-navigation.spec.ts` |
| TC147 | After logout, login page elements should be accessible | `navigation/post-login-navigation.spec.ts` |
| TC148 | Invalid URL should show 404 or redirect | `navigation/post-login-navigation.spec.ts` |
| TC149 | Direct navigation to login page after auth redirects away | `navigation/post-login-navigation.spec.ts` |
| TC150 | Back button after login stays within app | `navigation/post-login-navigation.spec.ts` |