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
- [ ] Run `supabase db push`

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
- [ ] Manual add/edit/delete individual candidates
- [ ] Upload/link interview recordings per candidate
- [ ] Manage application questions per cohort (add, edit, reorder, delete)

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

### Step 3.3: Migration & RLS
- [ ] Write migration `05_create_rating_tables.sql`
- [ ] RLS: Board members can **insert and update their own ratings** only
- [ ] RLS: Board members **cannot read other members' ratings**
- [ ] RLS: Admins can **read all ratings** for the active cohort
- [ ] Unique constraint: one rating per `(candidate_id, voter_id, cohort_id, rating_type)`
- [ ] CHECK constraint: `score BETWEEN 1 AND 10`

### Step 3.4: Voting UI — Application Rating
- [ ] Create `/vote` route — the main voting hub
- [ ] Candidate list sidebar (or top nav) showing all candidates for the active cohort
- [ ] **Application Rating View** (`/vote/[candidateId]/application`):
  - Display each application question alongside the candidate's response
  - Slider or number input (1–10) for each question
  - Optional comment box per question
  - Save as draft / Submit final rating
  - Visual indicator showing which candidates the voter has already rated

### Step 3.5: Voting UI — Interview Rating
- [ ] **Interview Rating View** (`/vote/[candidateId]/interview`):
  - Embedded video player or link to Google Drive recording
  - Display interview questions alongside rating inputs (1–10)
  - Optional comment box per question
  - Save / Submit

### Step 3.6: Voting UI — Character Evaluation
- [ ] **Character Evaluation View** (`/vote/[candidateId]/character`):
  - Display character traits (Overall Character, Drive, Logistical Abilities, etc.)
  - Score input (1–10) per trait
  - Optional comment per trait
  - Save / Submit
  - Note: This step typically happens *after* the group discussion, so it could be locked/unlocked by admin

### Step 3.7: Voting Progress Tracker
- [ ] Dashboard showing the voter's progress: which candidates have been rated, which are pending
- [ ] Color-coded status: ⬜ Not Started, 🟡 In Progress (drafted), ✅ Complete
- [ ] Separate progress for Application / Interview / Character

---

## 🔧 Phase 4: Admin Dashboard & Management

> **Goal**: Give admins (President, Secretary) full visibility into the voting process and tools to manage the evaluation cycle.

### Step 4.1: Admin Route Protection
- [ ] Create `/admin` route group
- [ ] Middleware: verify `isAdmin === true` before granting access
- [ ] Redirect non-admin users to `/vote` with a toast/error message

### Step 4.2: Admin — Cohort Management
- [ ] View all cohorts (historical + current)
- [ ] Create new cohort (e.g., "Fall 2026")
- [ ] Toggle `is_active` on a cohort (only one active at a time — enforce via DB trigger or app logic)
- [ ] View/manage board memberships for each cohort
- [ ] Invite/add board members to a cohort, assign positions

### Step 4.3: Admin — Voting Oversight
- [ ] **Board Member Progress**: See which board members have completed their ratings (per category)
- [ ] **Individual Vote Viewer**: View all scores submitted by a specific board member
- [ ] **Candidate Vote Breakdown**: View all individual scores for a specific candidate, broken down by voter

### Step 4.4: Admin — Lock/Unlock Voting Phases
- [ ] Ability to open/close each voting phase independently:
  - Application Rating: Open / Closed
  - Interview Rating: Open / Closed
  - Character Evaluation: Open / Closed
- [ ] Board members see a clear "Voting is closed" message when a phase is locked
- [ ] Store phase status in a `voting_phases` table or as columns on `cohorts`

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
- [ ] **Aggregation Logic** (Supabase SQL function or Next.js API route):
  - Compute average score per candidate per category (application, interview, character)
  - Pull weights from `cohort_settings` for the active cohort
  - Weighted average: `composite = (app_avg × app_weight) + (interview_avg × int_weight) + (char_avg × char_weight)`
  - Outlier removal: Flag/exclude scores that are > N standard deviations from the mean per question (N from `cohort_settings.outlier_std_devs`)
  - Final composite score per candidate

### Step 5.2: Admin — Results Dashboard
- [ ] **Leaderboard View**: Ranked list of all candidates by composite score
  - Show top N highlighted (N from `cohort_settings.top_n_display`)
  - Columns: Rank, Name, App Avg, Interview Avg, Character Avg, Composite Score
- [ ] **Candidate Detail View**: Drill down into a specific candidate's full score breakdown
  - Per-question averages
  - Per-voter breakdown (admin only)
  - Outlier flags
- [ ] **Statistical Summary**: Number of voters, response rate, score distributions

### Step 5.3: Export & Historical Logging
- [ ] **CSV Export**: Export full results table as CSV for archival
- [ ] **Per-Cohort Archives**: Previous cohort results remain viewable (read-only) when a new cohort is activated
- [ ] All data persists in Supabase — no manual spreadsheet management needed

---

## 💅 Phase 6: Polish, UX & Deployment

### Step 6.1: Navigation & Layout
- [ ] Build proper app shell with sidebar navigation:
  - **Board Members**: Vote, My Progress, Profile
  - **Admins** (additional): Candidates, Results, Board Management, Cohort Settings
- [ ] `<AdminNav />` component (conditionally rendered based on `isAdmin`)
- [ ] Responsive design for tablet/mobile use during character eval meetings

### Step 6.2: User Onboarding
- [ ] Profile setup flow on first login (name, grad year)
- [ ] Welcome page explaining the voting process
- [ ] Auto-detect if user has a board membership for the active cohort

### Step 6.3: UX Enhancements
- [ ] Toast notifications for save/submit actions
- [ ] Confirmation dialog before final submission ("Are you sure? You cannot change your scores after submitting.")
- [ ] Loading states and skeleton screens
- [ ] Dark mode support (already have `next-themes` installed)

### Step 6.4: Deployment
- [ ] Deploy frontend to Vercel
- [ ] Supabase project configured for production
- [ ] Environment variables set in Vercel dashboard
- [ ] Custom domain setup (optional)
- [ ] Seed production DB: Create first "Spring 2026" cohort, seed board positions, invite initial admin users

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

---

## 📝 Notes & Decisions

1. **Data Import**: For the initial rollout, admins will export Google Sheets as CSV and import into the app. A future enhancement could integrate directly with the Google Sheets API.
2. **Interview Videos**: Videos remain on Google Drive. The app stores links, not the files themselves.
3. **Score Visibility**: Board members can only see their own submitted ratings. Admins see everything. This is enforced at the database level via RLS.
4. **Cohort Lifecycle**: Only one cohort is `is_active = true` at a time. Historical cohorts and their data remain in the DB for archival.
5. **Character Evaluation Timing**: The character eval is typically done during an in-person meeting. The admin can lock/unlock this phase to control when board members can submit character scores.