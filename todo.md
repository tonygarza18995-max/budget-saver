# Budget Saver — Project TODO

## Core App

- [x] Generate and set app logo/icon
- [x] Update theme colors (green/teal brand palette)
- [x] Update app.config.ts with app name and logo URL
- [x] Add icon mappings for all required tab/UI icons
- [x] Create data models and AsyncStorage persistence layer
- [x] Build Home (Dashboard) screen with balance, budget overview, savings, recent transactions
- [x] Build Transactions screen with filter and grouped list
- [x] Build Budget screen with category cards and progress bars
- [x] Build Savings screen with goal cards and progress rings
- [x] Build Add Transaction bottom sheet modal
- [x] Build Add Budget Category modal
- [x] Build Add Savings Goal modal
- [x] Build Savings Goal Detail screen with contribution history
- [x] Set up 4-tab navigation (Home, Transactions, Budget, Savings)
- [x] Wire up all FAB "+" buttons
- [x] Add long-press-to-delete on transactions and goals
- [x] Implement month selector on Budget screen
- [x] Write and pass unit tests (15 tests passing)
- [x] Save initial checkpoint

## Subscription Feature

- [x] Add subscription data model and AsyncStorage persistence
- [x] Build SubscriptionContext for global subscription state
- [x] Build Subscription/Paywall modal with "pay what you want" tiers ($3, $6, $12/mo + custom)
- [x] Build Subscription Management (current plan, cancel, change amount) in same modal
- [x] Add Profile/Settings tab with subscription entry point
- [x] Add premium badge on Profile tab icon when subscribed
- [x] Add "Upgrade" banner on Dashboard for free users
- [x] Wire Profile tab into 5-tab navigation
- [x] Add SubscriptionProvider to root layout

## Card / Account Management Feature

- [x] Add card/account data model and AsyncStorage persistence (in SubscriptionContext)
- [x] Build Add Card modal (card name, type, last 4 digits, balance, color, visual preview)
- [x] Show linked cards in Profile tab with long-press-to-delete
- [x] Associate transactions with a card when logging (card selector in Add Transaction modal)
- [x] Show mini card carousel on Dashboard
- [x] Save final checkpoint and deliver

## New Features (Round 3)

- [x] Spending insights chart (pie chart by category on Dashboard/Insights tab)
- [x] Recurring transactions (weekly/monthly repeat option when logging)
- [x] Auto-apply recurring transactions each period
- [x] Bill reminders with push notifications (due date + alert)
- [x] Dark mode toggle in Profile tab
- [x] Onboarding flow (3-screen welcome walkthrough on first launch)
- [x] CSV export (email monthly spending report)
- [x] Save checkpoint and deliver

## Bug Fixes

- [x] Fix appearance toggle — dark/light mode should switch immediately without restart

## Premium "Wow Factor" Features (Round 4)

- [x] Financial health score (0-100 animated score on Dashboard based on budgeting, saving, bills)
- [x] Celebration moments — confetti on savings goal hit, count-up number animations, streak tracker
- [x] Smart spending tips — personalized insights based on spending patterns shown on Dashboard
- [x] Savings challenges — preset challenges (No-Spend Weekend, 52-Week, Save $5/day) with progress
- [x] Animated gradient headers — dynamic color shifts based on financial health
- [x] Micro-animations — card slide-ins, progress bar animations, smooth transitions
- [x] Save checkpoint and deliver

## Stripe Payment Integration

- [x] Read backend docs and plan Stripe integration
- [x] Request Stripe secret key and publishable key from user
- [x] Install Stripe dependencies (server + client)
- [x] Create server-side Stripe endpoints (create payment intent, create subscription, cancel subscription, webhook)
- [x] Build client-side Stripe payment sheet in subscription modal
- [x] Wire up subscription modal to use real Stripe payments instead of local-only
- [x] Handle payment success/failure states with user feedback
- [x] Test and save checkpoint

## Website / Landing Page

- [x] Build a polished marketing landing page as the web version of the app
- [x] Add hero section with app description and call-to-action
- [x] Add features showcase section
- [x] Add pricing/subscription section
- [x] Add download/get started section
- [x] Ensure responsive design for desktop and mobile web
- [x] Deploy permanently

## Bug Fixes (Round 2)

- [x] Fix "Rendered more hooks than during the previous render" error on native — early return for landing page breaks hooks order

## Deployment Fix

- [x] Fix Metro/Expo export build failure during deployment
- [x] Add gitignore exception for dist-web/assets/node_modules (font/image assets)
- [x] Remove expo export from cloud build script (serve pre-built static files)
- [x] Verify production server serves all static assets correctly

## Deployment Fix (Round 2)

- [x] Fix deployed website showing "Not Found" — server is live but static files not found
- [x] Ensure dist-web path resolution works in Cloud Run production environment
- [x] Use import.meta.url + __dirname instead of process.cwd() for reliable path resolution
- [x] Add multiple fallback path candidates for dist-web location
- [x] Add /api/debug-paths endpoint for deployment diagnostics

## Deployment Fix (Round 3)

- [x] Discovered platform reverse proxy only forwards /api/* to Express — non-API routes get 404 from Cloudflare
- [x] Added experiments.baseUrl: "/api/web" to app.config.ts so Expo exports with /api/web/ prefixed asset paths
- [x] Mounted express.static under /api/web prefix instead of root
- [x] Added SPA fallback for /api/web/* routes
- [x] Re-exported Expo web build with new baseUrl
- [x] Verified all endpoints return 200 locally (index, CSS, JS, fonts, SPA fallback, API health)
- [x] All 50 tests passing

## Google Search Console

- [x] Add Google site verification meta tag to landing page HTML
- [x] Re-export web build and re-deploy

## Open Graph Tags for Social Sharing

- [x] Generate OG preview image (1200x630) for social media sharing
- [x] Add Open Graph and Twitter Card meta tags to landing page HTML
- [x] Deploy updated site

## Email Waitlist

- [x] Create waitlist database table to store emails
- [x] Create API endpoint via tRPC (waitlist.join and waitlist.count)
- [x] Create waitlist modal with email form on landing page
- [x] Update all CTA buttons to open waitlist modal
- [x] Add email validation and success/error/duplicate feedback
- [x] Re-export web build and deploy

## Google Play Store Listing

- [x] Write app title, short description, and full description
- [x] Generate feature graphic (1024x500)
- [x] Generate phone screenshot mockups (5 screens)
- [x] Create submission guide for the user

## Landing Page Navigation Fix

- [x] Make landing page always show first when visiting the website
- [x] Add a "Back to Home Page" button at top of dashboard (web only)
- [x] Re-export and deploy

## Back to Home Page Button Visibility Fix

- [x] Move "Back to Home Page" button outside ScrollView to be always visible at top
- [x] Style button as prominent colored banner (white text on primary color background)
- [x] Re-export web build with meta tags and deploy

## Privacy Policy

- [x] Write privacy policy content
- [x] Add privacy policy as a viewable page on the landing page
- [x] Make footer "Privacy Policy" link open the policy page
- [x] Re-export web build and deploy
- [x] Fix deployment caching issue: build script now copies dist-web into dist/ so server always serves fresh files
## Bug Fixes (Round 3)

- [x] Fix subscribe button showing raw '\u00B7' instead of actual middle dot character (·)

## Bug Fixes (Round 4)

- [x] Fix subscribe button not doing anything when tapped on the website
- [x] Fix raw Unicode escape '\u2014' showing instead of em dash (—) in subscription description
- [x] Fix raw Unicode escapes for emojis (✅, 🔒, ⭐) showing as text in subscription modal

## Bug Report Feature

- [x] Create bug_reports database table (description, screen, platform, email, status, timestamps)
- [x] Create API endpoints for submitting and listing bug reports
- [x] Build bug report form in the mobile app (accessible from Profile/Settings tab)
- [x] Add bug report form/button to the website landing page
- [x] Send notification to owner when a new bug is reported
- [x] Rebuild web export and save checkpoint

## Waitlist Notification

- [x] Add owner notification when someone joins the waitlist on the website

## Email Notifications

- [x] Set up email sending service for owner notifications (Resend)
- [x] Send email to owner when someone joins the waitlist
- [x] Send email to owner when someone submits a bug report

## Bug Fixes (Round 5)

- [x] Fix CSV export crash on Android — ExpoSharing.shareAsync rejected with NoSuchMethodError getFilePermission

## Features (Round 6)

- [x] Add ability to manually edit card balances (tap to update balance without adding transactions)

## Bug Fixes (Round 6) - Website

- [x] Fix "Cancel Subscription" button on website — does nothing when tapped
- [x] Fix "Update Plan" button on website — gets stuck on loading spinner forever

## SEO Fix

- [x] Fix robots.txt blocking Google from indexing the website
- [x] Fix deployed website 500 error (Stripe apiVersion crash)

## Tester Engagement Update

- [x] Add Tip of the Day card on home screen
- [x] Add Send Feedback button in settings
