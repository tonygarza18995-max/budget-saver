# Budget Saver — Mobile App Interface Design

## Brand Identity

- **App Name:** Budget Saver
- **Tagline:** Track. Budget. Save.
- **Color Palette:**
  - Primary (Teal/Green): `#10B981` (light) / `#34D399` (dark) — conveys growth and money
  - Background: `#FFFFFF` (light) / `#0F1117` (dark)
  - Surface: `#F3F4F6` (light) / `#1A1D23` (dark)
  - Foreground: `#111827` (light) / `#F9FAFB` (dark)
  - Muted: `#6B7280` (light) / `#9CA3AF` (dark)
  - Border: `#E5E7EB` (light) / `#2D3748` (dark)
  - Success: `#22C55E` (light) / `#4ADE80` (dark)
  - Warning: `#F59E0B` (light) / `#FBBF24` (dark)
  - Error: `#EF4444` (light) / `#F87171` (dark)
  - Accent (Indigo for savings): `#6366F1` (light) / `#818CF8` (dark)

---

## Screen List

1. **Home (Dashboard)** — Overview of finances
2. **Transactions** — Full expense/income log
3. **Budget** — Monthly budget categories
4. **Savings** — Savings goals tracker
5. **Add Transaction (Modal/Sheet)** — Quick add income or expense
6. **Add Budget Category (Modal)** — Create/edit budget category
7. **Add Savings Goal (Modal)** — Create/edit savings goal
8. **Savings Goal Detail** — Progress and contributions for a goal

---

## Screen Details

### 1. Home (Dashboard)
**Content:**
- Total balance card (large, prominent)
- Monthly income vs. expenses summary bar
- Budget overview: progress bars per category (top 3)
- Savings goals: horizontal scroll cards with progress
- Recent transactions list (last 5)

**Functionality:**
- Tap "+" FAB → Add Transaction sheet
- Tap budget category → Budget screen
- Tap savings goal card → Savings Goal Detail
- Tap "See all" on transactions → Transactions screen

### 2. Transactions
**Content:**
- Filter bar (All / Income / Expense)
- Grouped by date (Today, Yesterday, older dates)
- Each item: category icon, title, amount (colored), date

**Functionality:**
- Swipe left to delete transaction
- Tap transaction → inline detail or delete
- FAB "+" to add new transaction

### 3. Budget
**Content:**
- Month selector (← Month →)
- Total budgeted vs. spent summary
- Category cards: icon, name, spent/limit, progress bar
- Color-coded: green (safe), yellow (warning >75%), red (over budget)

**Functionality:**
- Tap "+" → Add Budget Category modal
- Tap category → edit or delete
- Long press → delete

### 4. Savings
**Content:**
- Total saved across all goals
- Goal cards: name, target amount, saved amount, progress ring, deadline
- Motivational progress text ("You're 60% there!")

**Functionality:**
- Tap "+" → Add Savings Goal modal
- Tap goal card → Savings Goal Detail screen
- Swipe to delete goal

### 5. Add Transaction (Bottom Sheet Modal)
**Content:**
- Toggle: Income / Expense
- Amount input (large, numeric keyboard)
- Category picker (icon grid)
- Title/Note text input
- Date picker (defaults to today)
- Save button

### 6. Add Budget Category (Modal)
**Content:**
- Category name input
- Icon/emoji picker
- Monthly limit amount input
- Save button

### 7. Add Savings Goal (Modal)
**Content:**
- Goal name input
- Target amount input
- Current saved amount input
- Target date picker
- Save button

### 8. Savings Goal Detail
**Content:**
- Large progress ring (animated)
- Goal name, target, saved, remaining
- Deadline countdown
- "Add Contribution" button → input sheet
- Contribution history list

---

## Key User Flows

### Flow 1: Add an Expense
Home → Tap "+" FAB → Select "Expense" → Enter amount → Pick category → Enter note → Tap Save → Returns to Home with updated balance

### Flow 2: Set a Budget
Budget tab → Tap "+" → Enter category name, icon, limit → Save → Category appears with 0% progress

### Flow 3: Create a Savings Goal
Savings tab → Tap "+" → Enter goal name, target, current amount, deadline → Save → Goal card appears with progress ring

### Flow 4: Add to Savings Goal
Savings tab → Tap goal card → Goal Detail → Tap "Add Contribution" → Enter amount → Confirm → Progress ring animates

---

## Layout Principles

- **One-handed usage:** Primary actions (FAB, tab bar) reachable with thumb
- **Card-based UI:** Rounded corners (16px), subtle shadows, clear hierarchy
- **Typography:** Large amounts in bold, category names in medium, dates/notes in muted
- **Tab Bar:** 4 tabs — Home, Transactions, Budget, Savings
- **FAB:** Floating "+" button on Home, Transactions, Budget, Savings screens
