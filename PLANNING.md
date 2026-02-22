# TASA Bloom — Full End-to-End Planning Document

> **Project**: JO (Junior Officer) Application & Voting Portal  
> **Stack**: Next.js 15 (App Router) · Supabase (Auth + Postgres + RLS) · Tailwind CSS  
> **Last Updated**: February 2026

---

## 📖 Overview

A streamlined web app that replaces the current multi-Google-Form workflow for evaluating Junior Officer candidates. Board members log in, view candidate applications, and submit ratings for **Applications**, **Interviews**, and **Character Evaluations** — all in one place. Admins (Secretary & President) can view aggregated scores, individual votes, and export results. The system is built for longevity, supporting biannual cohorts (Fall / Spring) with full historical data.

---

## 🗺️ Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    NEXT.JS APP                      │
│                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Auth    │  │  Board       │  │  Admin        │  │
│  │  Pages   │  │  Member      │  │  Dashboard    │  │
│  │          │  │  Voting UI   │  │  (Scores,     │  │
│  │ /login   │  │  /vote       │  │   Manage)     │  │
│  │ /sign-up │  │              │  │  /admin       │  │
│  └──────────┘  └──────────────┘  └───────────────┘  │w
│                        │                            │
│                  middleware.ts                      │
│             (session + role gating)                 │
└────────────────────────┬────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │     SUPABASE        │
              │  ┌────────────────┐ │
              │  │  Auth (users)  │ │
              │  │  Postgres DB   │ │
              │  │  RLS Policies  │ │
              │  │  Storage       │ │
              │  └────────────────┘ │
              └─────────────────────┘
```

---

## ✅ Phase 1: Authentication & Multi-Cohort Infrastructure — COMPLETE

### 🛠 Step 1: Database & Migrations ✅
- [x] `cohorts` table (id, term, year, is_active, created_at)
- [x] `board_memberships` table (user_id, cohort_id, position_id, created_at)
- [x] `profiles` table (id, user_id, first_name, last_name, grad_year, updated_at)
- [x] `board_positions` table (id, name, is_admin)
- [x] Unique `(term, year)` constraint on cohorts
- [x] Composite PK `(user_id, cohort_id)` on memberships
- [x] RLS policies on all tables

**Migrations Completed:**
- `01_create_cohorts_and_membership_table.sql`
- `02_create_profiles_and_positions.sql`
- `03_update_positions_and_memberships.sql`

## 🔐 Phase 1.5: Security & Logic Requirements

### Dynamic Role Resolution
The application determines permissions based on the **currently active cohort**.
- **Super Admin:** Hardcoded `SUPER_ADMIN_EMAIL` grants global Admin status.
- **Transition Logic:** If a user was an "Admin" in Fall 2025 but is a "Member" in Spring 2026, the system only respects the "Member" role once the Spring 2026 cohort is activated.

### Middleware Enforcement
`middleware.ts` intercepts requests to `/protected` to ensure a valid Supabase session exists, redirecting to `/auth/login` otherwise.

### 🔒 Step 2: Middleware & Security ✅
- [x] `middleware.ts` using `createMiddlewareClient` for session protection
- [x] Unauthenticated redirect to `/login`
- [x] RLS policies for all tables

### 👔 Step 3: Role-Gating & Super Admin ✅
- [x] `SUPER_ADMIN_EMAIL` hardcoded in `lib/authUtils.ts`
- [x] `getCurrentUser()` server utility resolves role from active cohort

### 🔑 Step 4: Auth Flows ✅
- [x] Login (`/auth/login`)
- [x] Sign-up (`/auth/sign-up`)
- [x] Forgot password (`/auth/forgot-password`)
- [x] Update password (`/auth/update-password`)
- [x] Sign-up success & error pages

### ✅ Remaining Phase 1 Items — COMPLETE
- [x] Create `<AdminNav />` component for admin-specific navigation (`components/app-sidebar.tsx`)
- [x] Update `app/protected/layout.tsx` to use `getCurrentUser()` and show admin UI
- [x] Seed `board_positions` with standard positions (`04_seed_board_positions.sql` — pushed to Supabase)
- [x] Update `SUPER_ADMIN_EMAIL` in `lib/authUtils.ts` to use `process.env.SUPER_ADMIN_EMAIL`
- [x] Build profile setup / onboarding flow for new board members (`/protected/profile`)
- [x] Update root layout metadata to TASA Bloom branding

**Additional migrations:**
- `04_seed_board_positions.sql`

---

## 📦 Phase 2: Candidate & Application Data Model

> **Goal**: Establish the database schema for candidates, their application responses, and interview data.

### Step 2.1: New Database Tables

#### `candidates`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `cohort_id` | UUID | FK → `cohorts` |
| `candidate_number` | INT | Unique per cohort |
| `first_name` | TEXT | |
| `last_name` | TEXT | |
| `email` | TEXT | Optional |
| `created_at` | TIMESTAMPTZ | |

#### `application_questions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `cohort_id` | UUID | FK → `cohorts` |
| `question_text` | TEXT | The actual question |
| `question_order` | INT | Display ordering |
| `category` | TEXT | `'application'` or `'interview'` |

#### `application_responses`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `candidate_id` | UUID | FK → `candidates` |
| `question_id` | UUID | FK → `application_questions` |
| `response_text` | TEXT | The candidate's answer |

#### `interview_links`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `candidate_id` | UUID | FK → `candidates` |
| `video_url` | TEXT | Google Drive link to interview recording |
| `notes` | TEXT | Optional notes about the interview |

### Step 2.2: Migration & RLS ✅
- [x] Write migration `05_create_candidate_tables.sql`
- [x] Enable RLS on all new tables
- [x] Policies: Board members (with membership in active cohort) can **read** candidates, questions, and responses
- [x] Only admins (positions with `is_admin = true`) can **insert/update/delete** candidate data
- [x] Run `supabase db push`

### Step 2.3: Google Sheets → Database Import Strategy

The application responses currently live in Google Forms → Google Sheets. We need a reliable way to get this data into Supabase.

#### Primary Method: CSV Upload with Column Mapping
1. Admin exports Google Sheet as `.csv` file
2. Admin uploads CSV to the app via a drag-and-drop upload area on `/admin/import`
3. The app parses the CSV and displays a **column mapping UI**:
   - Left column: detected CSV headers (e.g., "Timestamp", "Full Name", "Why do you want to join?")
   - Right column: dropdown to map each header → a database field or new application question
   - Auto-detect obvious mappings (e.g., "Name" → `first_name + last_name`, "Email" → `email`)
4. Admin reviews a **preview table** showing the first 5 rows of parsed data
5. Admin clicks "Import" → the app inserts candidates + their responses into the DB in a single transaction
6. Show a summary: "Imported 42 candidates with 8 questions each"

#### Alternative Method: Google Sheets API (Future Enhancement)
- Connect directly via OAuth + Google Sheets API
- Admin pastes a Google Sheet URL → app reads it live
- This avoids the manual export step but requires Google Cloud project setup
- **Deferred to a future phase** to keep the initial build simple

#### Import Flow Database Operations
```
CSV Row → Parse → Create `candidate` record
                → Create `application_response` records (one per question)
CSV Headers → Map → Create/reuse `application_question` records
```

### Step 2.4: Admin — Candidate Management UI
- [x] Create `/protected/admin/candidates` page (list view with table)
- [x] **Import page** (`/protected/admin/import`): CSV upload + column mapping + preview + import (`components/csv-importer.tsx`)
- [x] Admin route protection (`/protected/admin/layout.tsx` — redirects non-admins)
- [x] Admin overview page with quick action cards
- [x] **Candidate Detail View** (`/protected/admin/candidates/[id]`): Shows full profile, responses, and interview video.
- [x] Manual add/edit/delete individual candidates (Include Edit modal and Delete confirmation on the candidate list table)
- [x] Upload/link interview recordings per candidate
- [x] Manage application questions per cohort (add, edit, reorder, delete)
- [x] **Dynamic Sorting**: Allow admins to easily sort the candidate table list numerically by Candidate Number.
- [x] **Remap Candidate Order Feature**: Introduce an action button allowing admins to visually sort the table (e.g., alphabetically) and then automatically reassign all Candidate Numbers sequentially (1, 2, 3...) based on that new view.

---

## 🗳️ Phase 3: Voting & Rating System

> **Goal**: Build the core voting interface where board members rate candidates on applications, interviews, and character traits.

### Step 3.1: Rating Database Tables

#### `ratings`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `candidate_id` | UUID | FK → `candidates` |
| `voter_id` | UUID | FK → `auth.users` (the board member) |
| `cohort_id` | UUID | FK → `cohorts` |
| `rating_type` | TEXT | `'application'`, `'interview'`, or `'character'` |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### `rating_scores`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `rating_id` | UUID | FK → `ratings` |
| `question_id` | UUID | FK → `application_questions` (nullable for character traits) |
| `trait_name` | TEXT | For character ratings: `'overall_character'`, `'drive'`, `'logistical_abilities'` |
| `score` | INT | 1–10, CHECK constraint |
| `comment` | TEXT | Optional free-text feedback |

> **Design Decision**: Separating `ratings` (one per voter × candidate × type) from `rating_scores` (one per question/trait) allows flexible questions across cohorts and clean aggregation queries.

### Step 3.2: Character Trait Configuration (Admin-Configurable)

#### `character_traits`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `cohort_id` | UUID | FK → `cohorts` |
| `trait_name` | TEXT | e.g., "Overall Character", "Drive", "Logistical Abilities" |
| `trait_order` | INT | Display ordering |

> **Key Requirement**: Admins can add, edit, reorder, and remove character traits per cohort via an admin UI (`/admin/settings/traits`). Default traits are seeded when a new cohort is created, but can be customized for any cycle.

**Default seed traits**: Overall Character, Drive, Logistical Abilities (with the ability to modify as the club evolves).

### Step 3.3: Migration & RLS ✅
- [x] Write migration `05_create_rating_tables.sql`
- [x] RLS: Board members can **insert and update their own ratings** only
- [x] RLS: Board members **cannot read other members' ratings**
- [x] RLS: Admins can **read all ratings** for the active cohort
- [x] Unique constraint: one rating per `(candidate_id, voter_id, cohort_id, rating_type)`
- [x] CHECK constraint: `score BETWEEN 1 AND 10`

### Step 3.4: Voting UI — Application Rating ✅
- [x] Create `/vote` route — the main voting hub
- [x] Candidate list sidebar (or top nav) showing all candidates for the active cohort
- [x] **Application Rating View** (`/vote/[candidateId]/application`):
  - [x] Display each application question alongside the candidate's response
  - [x] Slider or number input (1–10) for each question
  - [x] Optional comment box per question
  - [x] Save as draft / Submit final rating (with AlertDialog confirmation)
  - [x] Visual indicator showing which candidates the voter has already rated
  - [x] **CRITICAL**: Application rating must be completely anonymous. The candidate's name and identifying details should be hidden from the voter during this phase.

### Step 3.5: Voting UI — Interview Rating ✅
- [x] **Interview Rating View** (`/vote/[candidateId]/interview`):
  - [x] Embedded video player or link to Google Drive recording
  - [x] Display interview questions alongside rating inputs (1–10)
  - [x] Optional comment box per question
  - [x] Save / Submit final rating (with AlertDialog confirmation)

### Step 3.6: Voting UI — Character Evaluation ✅
- [x] **Character Evaluation View** (`/vote/[candidateId]/character`):
  - [x] Display character traits (Overall Character, Drive, Logistical Abilities, etc.)
  - [x] Score input (1–10) per trait
  - [x] Optional comment per trait
  - [x] Save / Submit final rating (with AlertDialog confirmation)
  - [x] **Abstain Option**: Allow voters to explicitly "Abstain" from evaluating a candidate. This records their ballot as submitted (for voting progress tracking) but excludes their null scores from the candidate's average calculation entirely.
  - Note: This phase will *always* occur AFTER the Interview and Application phases, typically during an in-person group discussion. Admins will lock this phase until the earlier phases are complete.

### Step 3.7: Voting Progress Tracker
- [x] Dashboard showing the voter's progress: which candidates have been rated, which are pending
- [x] Color-coded status: ⬜ Not Started, 🟡 In Progress (drafted), ✅ Complete
- [x] Separate progress for Application / Interview / Character

---

## 🔧 Phase 4: Admin Dashboard & Management

> **Goal**: Give admins (President, Secretary) full visibility into the voting process and tools to manage the evaluation cycle.

### Step 4.1: Admin Route Protection ✅
- [x] Create `/admin` route group
- [x] Middleware: verify `isAdmin === true` before granting access
- [x] Redirect non-admin users to `/vote` with a toast/error message

### Step 4.2: Admin — Cohort Management ✅
- [x] View all cohorts (historical + current)
- [x] Create new cohort (e.g., "Fall 2026")
- [x] Toggle `is_active` on a cohort (only one active at a time — enforce via DB trigger or app logic)
- [x] View/manage board memberships for each cohort
- [x] Invite/add board members to a cohort, assign positions

### Step 4.3: Admin — Voting Oversight
- [x] **Board Member Progress**: See which board members have completed their ratings (per category)
- [x] **Individual Vote Viewer**: View all scores submitted by a specific board member
- [x] **Candidate Vote Breakdown**: View all individual scores for a specific candidate, broken down by voter

### Step 4.4: Admin — Lock/Unlock Voting Phases ✅
- [x] Ability to open/close each voting phase independently:
  - Application Rating: Open / Closed
  - Interview Rating: Open / Closed
  - Character Evaluation: Open / Closed
- [x] Board members see a clear "Voting is closed" message when a phase is locked
- [x] Store phase status in a `voting_phases` table or as columns on `cohorts`

---

## 📊 Phase 5: Analytics, Scoring & Export

> **Goal**: Replace the Python/Pandas scripts with in-app analytics. Compute weighted averages, remove outliers, and display ranked candidate results.

### Step 5.0: Admin-Configurable Scoring Weights

#### `cohort_settings`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `cohort_id` | UUID | FK → `cohorts`, UNIQUE |
| `application_weight` | DECIMAL | Default 0.40 (40%) |
| `interview_weight` | DECIMAL | Default 0.35 (35%) |
| `character_weight` | DECIMAL | Default 0.25 (25%) |
| `outlier_std_devs` | DECIMAL | Default 2.0 (how many σ to flag outliers) |
| `top_n_display` | INT | Default 20 (how many top candidates to highlight) |

> **Admin UI** (`/admin/settings/weights`): Admins set the exact weights for each scoring category. Weights must sum to 1.0 — the UI validates this in real-time. These settings are persisted per cohort so historical results are reproducible.

### Step 5.1: Scoring Engine (Server-Side)
- [x] **Aggregation Logic** (Supabase SQL function or Next.js API route):
  - [x] Compute average score per candidate per category (application, interview, character)
  - [x] Pull weights from `cohort_settings` for the active cohort
  - [x] Weighted average: `composite = (app_avg × app_weight) + (interview_avg × int_weight) + (char_avg × char_weight)`
  - [x] Outlier removal: Flag/exclude scores that are > N standard deviations from the mean per question (N from `cohort_settings.outlier_std_devs`)
  - [x] Final composite score per candidate

### Step 5.2: Admin — Results Dashboard
- [x] **Leaderboard View**: Ranked list of all candidates by composite score
  - [x] Show top N highlighted (N from `cohort_settings.top_n_display`)
  - [x] Columns: Rank, Name, App Avg, Interview Avg, Character Avg, Composite Score
- [x] **Candidate Detail View**: Drill down into a specific candidate's full score breakdown
  - [x] Per-question averages
  - [x] Per-voter breakdown (admin only)
  - [x] Outlier flags
- [x] **Statistical Summary**: Number of voters, response rate, score distributions

### Step 5.3: Export & Historical Logging
- [x] **CSV Export**: Export full results table as CSV for archival
- [x] **Per-Cohort Archives**: Previous cohort results remain viewable (read-only) when a new cohort is activated
- [x] All data persists in Supabase — no manual spreadsheet management needed

---

## 💅 Phase 6: Polish, UX & Deployment

### Step 6.1: Navigation & Layout
- [x] Build proper app shell with sidebar navigation:
  - **Board Members**: Vote, My Progress, Profile
  - **Admins** (additional): Candidates, Results, Board Management, Cohort Settings
- [x] `<AdminNav />` component (conditionally rendered based on `isAdmin`)
- [ ] Responsive design for tablet/mobile use during character eval meetings

### Step 6.2: User Onboarding ✅
- [x] Profile setup flow on first login (name, grad year)
- [x] Welcome page explaining the voting process
- [x] Auto-detect if user has a board membership for the active cohort

### Step 6.3: UX Enhancements
- [x] Toast notifications for save/submit actions
- [x] Confirmation dialog before final submission ("Are you sure? Once submitted, you cannot edit these scores.")
- [ ] Loading states and skeleton screens
- [x] Dark mode support (already have `next-themes` installed)

### Step 6.4: Deployment
- [x] Deploy frontend to Vercel
- [x] Supabase project configured for production
- [x] Environment variables set in Vercel dashboard
- [ ] Custom domain setup (optional)
- [x] Seed production DB: Create first "Spring 2026" cohort, seed board positions, invite initial admin users

### Step 6.5: Backlog / Future Enhancements
- [x] **Global Settings Page (`/protected/admin/settings`)**: A dedicated page for managing global configurations such as scoring weights, default character traits, notification settings, and other app-wide parameters that don't belong strictly to a single cohort.

---

## 📜 Phase 7: Legacy Historical Data Import (Completed)

> **Goal**: Allow import and preservation of raw application, interview, and character voting records from previous cohorts where the original board members will never register on the platform.

### Step 7.1: Database Schema Modifications
- [x] Modify `public.ratings` table to drop `NOT NULL` constraint on `voter_id`.
- [x] Add new text column `legacy_voter_alias` to `public.ratings`.
- [x] Add `imported_by` column pointing to `auth.users(id)` for strict audit trails.
- [x] Implement check constraint `voter_id_or_legacy_voter_alias` to ensure either `voter_id` or (`legacy_voter_alias` AND `imported_by`) exists.
- [x] Configure dedicated `INSERT` and `UPDATE` Row Level Security policies explicitly targeting these legacy conditions.
- [x] Regenerate TypeScript Supabase definitions.

### Step 7.2: Legacy Data Import UI (Completed)
- [x] Create `/protected/admin/import` second dedicated upload section exclusively for administrators uploading past data.
- [x] Develop `legacy-csv-importer.tsx` tailored with auto-detecting column mappings like `voter_name` or `question`.
- [x] Provide robust data preview steps similar to standard Candidate Imports.
- [x] Added dynamic dropdown to allow importing scores into either Application, Interview, or Character phases.

### Step 7.3: Import Execution Engine (Completed)
- [x] Create the server action `importLegacyRatings` to handle bulk transaction.
- [x] Idempotent Pre-processing: Validate cohort, safely fetch/create Candidates.
- [x] Handle generic scores by gracefully injecting Application Question rows (e.g. "Legacy Q1") on the fly.
- [x] Insert `public.ratings` (`voter_id` = null) and `public.rating_scores`.
- [x] Enforced `NUMERIC(4,2)` precision to preserve raw decimal scores from historical datasets instead of rounding.
- [x] Created `guessMapping` parser to prioritize reviewer identification and prevent ballot overwriting.

### Step 7.4: Results Engine Compatibility (Completed)
- [x] Ensure the existing `lib/scoring.ts` logic safely calculates candidate averages when a rating's `voter_id` is null.
- [x] Update frontend Admin views (like the per-voter breakdowns on the Details page) to seamlessly fall back to displaying the `legacy_voter_alias` when `voter_id` is missing.
- [x] Applied automatic UI filters to block "Ghost records" (users with 0 scores) from appearing in breakdown lists.

### Step 7.5: UX/UI Quality of Life Features (Completed)
- [x] Added `lucide-react` loading spinners (`Loader2`) and explicit warning panels during bulk CSV Candidate and Historical Data uploads to prevent accidental page reloads.
- [x] Integrated `shadcn/ui` Tooltips across the Results dashboard to display helpful contextual hover-text for statistical score Outliers (Yellow Triangles).
- [x] Extended Outlier logic into the deepest `[id]/page.tsx` Individual Voter detailed breakdown so admins can isolate exactly who skewed the candidate's average on a per-question basis.

---

## ⚙️ Phase 8: Character Trait Management (Completed)

> **Goal**: Provide administrators full dynamic control over the qualitative tags that board members are asked to rate candidates on during the Character Evaluation phase of Voting.

### Step 8.1: Settings Dashboard
- [x] Appended a new `Character Traits` tile into the global `/protected/admin/settings` UI.
- [x] Built `trait-manager.tsx` capable of fetching the current Active Cohort's exact evaluations requirements.

### Step 8.2: Database Interaction
- [x] Added Server Actions (`createTrait`, `updateTrait`, `deleteTrait`) to fully handle relational logic.
- [x] Automatically re-order or append new qualities globally across the platform.

---

## 🔒 Phase 9: Audit Logging & Security

> **Goal**: Ensure the integrity of the voting process by tracking sensitive administrative and voting actions.

### Step 8.1: Audit Log Architecture
- [ ] **`audit_logs` table**: Record `action_type`, `user_id`, `target_id`, `metadata` (JSON), and `created_at`.
- [ ] Log admin actions: Changing scoring weights, opening/closing voting phases, adding/removing board members.
- [ ] Log voting actions: Track when a board member starts and finally submits a voting phase (no need to log every individual keystroke, just state changes).

### Step 8.2: Admin Audit Dashboard
- [ ] Create `/protected/admin/oversight/audit` page.
- [ ] Display a chronological timeline of system events.
- [ ] Filter by action type, date, or specific user.

---

## 📐 Database Schema Summary (All Phases)

```
┌──────────────┐     ┌───────────────────┐     ┌─────────────────┐
│   cohorts    │────▶│ board_memberships │◀────│  board_positions│
│              │     │                   │     │                 │
│ id           │     │ user_id (FK)      │     │ id              │
│ term         │     │ cohort_id (FK)    │     │ name            │
│ year         │     │ position_id (FK)  │     │ is_admin        │
│ is_active    │     │ created_at        │     └─────────────────┘
│ created_at   │     └───────────────────┘
└──────┬───────┘              │
       │               auth.users ◀─── profiles (1:1)
       │                      │
       ├──────────────────────┤
       │                      │
       ▼                      ▼
┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐
│  candidates  │     │     ratings       │     │ cohort_settings  │
│              │     │                   │     │                  │
│ id           │     │ id                │     │ id               │
│ cohort_id    │     │ candidate_id (FK) │     │ cohort_id (FK)   │
│ candidate_no │     │ voter_id (FK)     │     │ app_weight       │
│ first_name   │     │ cohort_id (FK)    │     │ interview_weight │
│ last_name    │     │ rating_type       │     │ character_weight │
│ email        │     │ created_at        │     │ outlier_std_devs │
│ created_at   │     │ updated_at        │     │ top_n_display    │
└──────┬───────┘     └────────┬──────────┘     └──────────────────┘
       │                      │
       ▼                      ▼
┌────────────────────┐  ┌───────────────────┐
│ application_       │  │  rating_scores    │
│ questions          │  │                   │
│                    │  │ id                │
│ id                 │  │ rating_id (FK)    │
│ cohort_id          │  │ question_id (FK)  │
│ question_text      │  │ trait_name        │
│ question_order     │  │ score (1-10)      │
│ category           │  │ comment           │
└────────┬───────────┘  └───────────────────┘
         │
         ▼
┌────────────────────┐     ┌──────────────────┐
│ application_       │     │ character_traits  │
│ responses          │     │  (configurable)   │
│                    │     │                   │
│ id                 │     │ id                │
│ candidate_id (FK)  │     │ cohort_id         │
│ question_id (FK)   │     │ trait_name        │
│ response_text      │     │ trait_order       │
└────────────────────┘     └──────────────────┘
         
┌────────────────────┐
│ interview_links    │
│                    │
│ id                 │
│ candidate_id (FK)  │
│ video_url          │
│ notes              │
└────────────────────┘
```

---

## 🚀 Implementation Order (Recommended)

| Step | Phase | Description | Depends On |
|------|-------|-------------|------------|
| 1 | 1 (remaining) | Finish `<AdminNav />`, seed positions, profile onboarding | — |
| 2 | 2.1–2.2 | Candidate & question DB schema + migration | Step 1 |
| 3 | 3.1–3.3 | Rating DB schema + migration | Step 2 |
| 4 | 2.3 | Admin candidate management UI (import, CRUD) | Step 2 |
| 5 | 3.4–3.7 | Board member voting UI (app, interview, character) | Steps 3 & 4 |
| 6 | 4.1–4.4 | Admin dashboard (oversight, lock/unlock phases) | Step 5 |
| 7 | 5.1–5.3 | Analytics engine, leaderboard, CSV export | Step 6 |
| 8 | 6.1–6.4 | Polish, responsive design, deploy | Step 7 |
| 9 | 7.1-7.4 | Legacy data import schema, UI, and algorithms | Step 8 |
| 10 | 8.1-8.2 | Audit Logging & Security | Step 8 |

---

## 🧪 Verification Plan

### Automated / Dev Verification
- After each migration, verify tables via `supabase db push` and Supabase Studio
- Test RLS policies by querying as different users (admin vs. member) in the Supabase SQL editor
- Verify unique constraints by attempting duplicate inserts

### Browser Testing (Per Phase)
- **Phase 2**: As admin, create/import candidates → verify they appear in the candidate list
- **Phase 3**: As board member, open `/vote`, rate a candidate → verify rating is saved. Try to view another member's rating → should be blocked by RLS
- **Phase 4**: As admin, view all ratings → should see every board member's scores. As non-admin, try `/admin` → should be redirected
- **Phase 5**: Submit ratings from multiple test accounts → verify aggregated scores, outlier removal, and export functionality

### Manual / User Testing
- Deploy to Vercel preview → invite 2–3 board members to test the full voting flow
- Verify CSV export matches expected format for archival
- Test cohort switching: deactivate old cohort, activate new one → verify roles update

### Completed Local Testing (Phases 1-6 + UI Enhancements)
- **Phase 1-2**: Authentication, Admin Role parsing, and Database Schema verified manually.
- **Phase 2.3**: CSV Candidate Importer successfully tested parsing & data mapping.
- **Phase 3**: End-to-end Voting System tested (Application, Interview, Character ratings workflows) and database state verified.
- **Phase 4**: Admin Settings & Phase Locks (Voting toggles, Cohort switching, Board Member assignment) verified.
- **Phase 5**: Admin Scoring Details, DB Aggregation math algorithms tested manually, CSV blob-exporting works, and custom Candidate display Ordering (via drag-and-drop `@dnd-kit`) built out successfully.
- **Phase 6**: Per-user Personal Theme Settings (Light/Dark, custom Accent Colors, and Base Backgrounds) verified.

---

## 📝 Notes & Decisions

1. **Data Import**: For the initial rollout, admins will export Google Sheets as CSV and import into the app. A future enhancement could integrate directly with the Google Sheets API.
2. **Interview Videos**: Videos remain on Google Drive. The app stores links, not the files themselves.
3. **Score Visibility**: Board members can only see their own submitted ratings. Admins see everything. This is enforced at the database level via RLS.
4. **Cohort Lifecycle**: Only one cohort is `is_active = true` at a time. Historical cohorts and their data remain in the DB for archival.
5. **Character Evaluation Timing**: The character eval is typically done during an in-person meeting. The admin can lock/unlock this phase to control when board members can submit character scores.
6. **Candidate Ordering**: Admins have manual control over how they are displayed to voters during evaluated using the draggable grid logic (`custom_order`).