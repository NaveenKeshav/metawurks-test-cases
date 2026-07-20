/**
 * =====================================================================
 * TEST PLAN: https://metawurks.com/
 * =====================================================================
 * 
 * OVERVIEW:
 * MetaWurks is an all-in-one multi-modal AI orchestration platform that 
 * aggregates GPT-5, Claude, Gemini, DeepSeek, Grok, Mistral, LLaMA, and 
 * 30+ other AI models. The marketing site has 6 main pages: Home, Product, 
 * Pricing, About Us, Blog, Contact.
 * 
 * =====================================================================
 * SITE ARCHITECTURE
 * =====================================================================
 * 
 * [Header - Appears on ALL pages]
 *   - Logo (linked to /)
 *   - Nav links: Home (/), Product (/product), Pricing (/pricing), 
 *     About Us (/about-us), Blog (/blog), Contact (/contact)
 *   - CTA buttons: Sign In (https://apps.metawurks.com/login), 
 *     Get Started (https://apps.metawurks.com/early-access)
 * 
 * [Home Page - /]
 *   - Hero section: "All-in-One Multi-Modal AI Orchestrator" with model icons
 *   - "Book a Demo" button
 *   - AI Environments section (6 cards):
 *     - Conversational AI, Deep Analysis, Task Automation, 
 *       Knowledge Retrieval, Multi-Agent Pipelines, Custom Assistants
 *   - Key Features section (4 features):
 *     - Proactive Task Assistance, Enterprise Workflow Integration,
 *       Intelligent Context Awareness, Secure Scalable Collaboration
 *   - Router visualization (GPT-5, Claude, Gemini, Llama, Mistral)
 *   - Pricing section (tier summary cards)
 *   - Dashboard preview section ("Your AI command center")
 *   - Stats: 1.2M Total Requests, 124ms Avg Latency, 6 Active Models, $4.2k Cost Saved
 *   - Recent Activity feed & Model Distribution chart
 *   - Footer
 * 
 * [Product Page - /product]
 *   - Hero: "We Deliver Smart AI-Powered Business Insights"
 *   - Why Choose Us section (4 items):
 *     - Semantic Query Engine, Document Intelligence,
 *       Contextual Memory, Secure Access & Audit Logs
 *   - Stats counters: 500M+ Embeddings, 5+ LLM, 30000+ Tokens Capacity, 10+ File Types
 *   - Empowering Your Business section (3-step workflow)
 *   - CTA: "Stay ahead with enterprise-grade AI insights"
 *   - Footer
 * 
 * [Pricing Page - /pricing]
 *   - Monthly / Annual billing toggle
 *   - Plan cards:
 *     - Free ($0/mo): Standard AI Models, 1M Token Limit, Limited storage
 *     - Starter ($19/mo): Standard & Enhanced Models, 3M Token Limit, 1GB
 *     - Professional ($39/mo): All Premium Models, 6M Token Limit, 5GB (Popular Choice)
 *     - Enterprise ($99/mo): All Premium Models, 10M Token Limit, 15GB (Best Value)
 *     - Custom: Tailored solutions, Dedicated infrastructure
 *   - Compare Plans table (rows: Models, Token Limit, Message History, 
 *     Live Web Search, Speed, Storage, Support)
 *   - FAQ accordion section (8 questions)
 *   - Footer
 * 
 * [About Us - /about-us]
 *   - Hero section
 *   - Empowering Your Business section (3-step workflow)
 *   - Core Values (4 items): Innovation First, Customer-Centric, 
 *     Trust & Security, Results-Driven
 *   - Team section: Abdul S (CEO), Andrew John (Co-Founder), 
 *     Aditya Rai (Director), Sachin (VP Engineering)
 *   - "Contact Us" CTA
 *   - Footer
 * 
 * [Blog Page - /blog]
 *   - Blog article cards with: Category tag, Title, Excerpt, Date, Read time, "Read More" link
 *   - Categories: Finance, AI, Accounting, Productivity, Use Cases, Enterprise, Technology, Workflows
 *   - Newsletter signup section with email input and "Sign Up" button
 *   - Footer
 * 
 * [Contact Page - /contact]
 *   - Contact info: admin@metawurks.com, +1 914-265-5072, 16192 Coastal Hwy, Lewes, DE 19958
 *   - Contact form fields: Name, Email, Subject, Message
 *   - "I agree to terms and conditions" checkbox
 *   - Submit button
 *   - Footer
 * 
 * [Footer - Appears on ALL pages]
 *   - Product, Features, Pricing, Docs links
 *   - Company: About Us, Blog, Contact
 *   - Legal: Privacy Policy, Terms of Service
 *   - Contact: Address, Phone, Email
 *   - Copyright © 2026 MetaWurks
 * 
 * [External App URLs]
 *   - https://apps.metawurks.com/login (Sign In)
 *   - https://apps.metawurks.com/early-access (Get Started)
 * 
 * =====================================================================
 * CONFIGURATION
 * =====================================================================
 * 
 * Environment variables are managed via `.env` file at project root:
 *   - BASE_URL     : Website base URL (default: https://metawurks.com)
 *   - APP_URL      : External app URL (default: https://apps.metawurks.com)
 *   - VIEWPORT_*   : Desktop viewport dimensions
 *   - MOBILE_*     : Mobile viewport dimensions
 *   - TABLET_*     : Tablet viewport dimensions
 *   - TIMEOUT_*    : Timeout configurations
 * 
 * Runtime configuration is centralized in `tests/shared/config.ts` which 
 * reads from `.env` and provides typed configuration objects.
 * 
 * =====================================================================
 * TEST FILES & FUNCTIONALITIES
 * =====================================================================
 * 
 * Folder & File                          | Tests  | Functionality
 * ---------------------------------------|--------|----------------------------------
 * tests/pages/home.spec.ts               | TC01-04  | Home page elements, environments, router, dashboard
 * tests/layout/navigation.spec.ts        | TC05-08  | Nav links, logo, Sign In / Get Started
 * tests/pages/product-page.spec.ts       | TC09-11  | Features, stat counters, workflow steps
 * tests/pages/pricing.spec.ts            | TC12-16  | Plan tiers, billing toggle, comparison table, FAQ
 * tests/pages/about-us.spec.ts           | TC17-19  | Core values, team members, contact CTA
 * tests/pages/blog.spec.ts               | TC20-22  | Article cards, categories/dates, newsletter
 * tests/pages/contact.spec.ts            | TC23-24  | Form fields, company contact info
 * tests/layout/footer.spec.ts            | TC25-26  | Footer consistency, contact details
 * tests/responsive/responsive.spec.ts    | TC27-28  | Mobile hamburger menu, tablet rendering
 * tests/edge-cases/edge-cases.spec.ts    | TC29-30  | 404 handling, external links target
 * tests/auth/auth.spec.ts                | TC31-71  | Login/Signup positive & negative scenarios
 * 
 * =====================================================================
 * AUTHENTICATION TEST SCENARIOS (tests/auth/auth.spec.ts)
 * =====================================================================
 * 
 * Login Page - Positive Scenarios (TC31-TC41):
 *   TC31: Login page loads with all UI elements
 *   TC32: Login page has Google SSO button
 *   TC33: Login page has reCAPTCHA notice
 *   TC34: Remember me checkbox is present and toggleable
 *   TC35: Login form - fill email and password fields successfully
 *   TC36: Login form - submit with valid credentials format triggers API call
 *   TC37: Forgot password link navigates to forgot password page
 *   TC38: Sign up link navigates to registration page
 *   TC39: Sign in link on signup page navigates back to login
 *   TC40: Sign in link on forgot password page navigates back to login
 *   TC41: Forgot password page has email field and send button
 * 
 * Login - Form Submission & API Interaction (TC42-TC47):
 *   TC42: Login - fill form and submit with valid email format triggers API
 *   TC43: Login - submit with invalid credentials shows 401 response
 *   TC44: Login - fill with remember me checked and submit
 *   TC45: Login - password visibility toggle works
 *   TC46: Forgot password - submit with valid email
 *   TC47: Forgot password - form fill and restore password link click cycle
 * 
 * Login Page - Negative Scenarios (TC48-TC58):
 *   TC48: Login with empty email and password
 *   TC49: Login with invalid email format
 *   TC50: Login with empty password
 *   TC51: Login with very short password
 *   TC52: Login with SQL injection attempt
 *   TC53: Login with XSS attempt in email field
 *   TC54: Login with extremely long email and password
 *   TC55: Login with special characters in password
 *   TC56: Login with whitespace-only fields
 *   TC57: Forgot password with empty email
 *   TC58: Forgot password with invalid email format
 * 
 * Sign Up Page - Positive Scenarios (TC59-TC62):
 *   TC59: Sign up page loads with all UI elements
 *   TC60: Sign up form accepts valid input values
 *   TC61: Sign up page has Google SSO button
 *   TC62: Sign up - fill all fields and submit triggers API call
 * 
 * Sign Up Page - Negative Scenarios (TC63-TC67):
 *   TC63: Sign up with empty fields
 *   TC64: Sign up with mismatched passwords
 *   TC65: Sign up with weak password (too short)
 *   TC66: Sign up with invalid email format
 *   TC67: Sign up with XSS in name field
 * 
 * Cross-Flow Navigation (TC68-TC71):
 *   TC68: Full navigation cycle: Login -> Signup -> Forgot Password -> Login
 *   TC69: Logo on login page is visible
 *   TC70: Testimonial section is visible on login page
 *   TC71: Login - password hidden by default and eye toggle works
 * 
 * =====================================================================
 * TEST EXECUTION COMMANDS
 * =====================================================================
 * 
 * Run all tests:
 *   npx playwright test
 * 
 * Run specific test category (using the main runner):
 *   npx playwright test tests/all-tests.spec.ts
 * 
 * Run specific test file:
 *   npx playwright test tests/pages/home.spec.ts
 * 
 * Run auth tests:
 *   npx playwright test tests/auth/auth.spec.ts
 * 
 * Run tests in headed mode (visible browser):
 *   npx playwright test --headed
 * 
 * Run tests with UI mode:
 *   npx playwright test --ui
 * 
 * View HTML report:
 *   npx playwright show-report
 * 
 * =====================================================================
 * EXECUTION SUMMARY
 * =====================================================================
 * Total Test Files   : 11
 * Total Test Cases   : 71
 * 
 * Coverage Areas:
 *   - Home Page (4 tests)
 *   - Navigation (4 tests)
 *   - Product Page (3 tests)
 *   - Pricing Page (5 tests)
 *   - About Us (3 tests)
 *   - Blog Page (3 tests)
 *   - Contact Page (2 tests)
 *   - Footer (2 tests)
 *   - Responsive Design (2 tests)
 *   - Edge Cases / Error Handling (2 tests)
 *   - Authentication (41 tests)
 *       - Login Positive (11 tests)
 *       - Login API & Submission (6 tests)
 *       - Login Negative (11 tests)
 *       - Signup Positive (4 tests)
 *       - Signup Negative (5 tests)
 *       - Cross-Flow (4 tests)
 */