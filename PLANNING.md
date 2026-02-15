# Phase 1: Authentication & Multi-Cohort Infrastructure

## 🎯 Mission Objective
Implement a multi-cohort, role-gated authentication system using Supabase and Next.js that persists historical access data and allows for dynamic Executive Board transitions.

---

## 🛠 Step 1: Database & Migrations
**Goal:** Establish the schema for time-based access control.

- [x] **Create Migration:** Run `supabase migration new initial_auth_schema`.
- [x] **Schema Definition:**
  - [x] `cohorts`: (id, term, year, is_active, created_at)
  - [x] `board_memberships`: (user_id, cohort_id, position_id, created_at)
  - [x] `profiles`: (id, user_id, first_name, last_name, grad_year, updated_at)
  - [x] `board_positions`: (id, name, is_admin)
  - [x] Constraint: Unique `(term, year)` in cohorts
  - [x] Constraint: Unique `(user_id, cohort_id)` in memberships (composite primary key)
- [x] **Deploy:** Run `supabase db push`.

**Migrations Completed:**
- `01_create_cohorts_and_membership_table.sql`
- `02_create_profiles_and_positions.sql`
- `03_update_positions_and_memberships.sql`

---

## 🔒 Step 2: Middleware & Security
**Goal:** Enforce session-based protection at the edge.

- [x] **Middleware Logic:** Implemented `middleware.ts` using `createMiddlewareClient`.
- [x] **Redirects:** Unauthenticated users accessing protected routes redirect to `/login`.
- [x] **RLS Policies:** Enabled RLS on all tables with appropriate policies:
  - [x] Authenticated users can read cohorts
  - [x] Users can only read their own board_memberships
  - [x] Users can read/update their own profiles
  - [x] Authenticated users can read board_positions

---

## 👔 Step 3: Role-Gating & Super Admin
**Goal:** Handle the "General Admin" account and year-to-year role changes.

- [x] **Super Admin:** Hardcoded `SUPER_ADMIN_EMAIL` in `lib/authUtils.ts` to prevent lockouts.
- [x] **Dynamic Role Resolver:** Created `getCurrentUser()` server utility that:
  - [x] Checks for Super Admin status
  - [x] Fetches the `is_active` cohort
  - [x] Cross-references the current user in `board_memberships` for that cohort
  - [x] Returns user data with position and admin status
- [ ] **UI Implementation:** Use the resolver in `layout.tsx` to conditionally render the `<AdminNav />`.

**Remaining Work:**
- [ ] Create `<AdminNav />` component for admin-specific navigation
- [ ] Update `app/protected/layout.tsx` to use `getCurrentUser()` and show admin UI
- [ ] Consider adding admin-only routes (e.g., `/admin/*`)

---

## 🧪 Verification & Testing
**Antigravity Agent Instructions:** Run these checks via the integrated browser.

- [ ] **Anonymous Access:** Verify `/dashboard` or protected routes redirect to `/login`.
- [ ] **Historical Context:** Manually toggle `is_active` in the DB; verify a user loses "Admin" visibility when their cohort is no longer active.
- [ ] **Role Promotion:** Simulate a "Secretary to VP" move by adding a user to two cohorts with different roles.
- [ ] **Super Admin:** Verify the master email has access even if no cohort is active.

---

## 🚀 Deployment Milestones

| Milestone | Status | Description |
|-----------|--------|-------------|
| Local Alpha | ✅ Done | Schema migrations and Middleware functional |
| Role Beta | 🔲 Pending | RBAC verified with manual DB entries |
| Staging | 🔲 Pending | Deploy to Supabase/Vercel preview environment |
| Production | 🔲 Pending | Seed the initial "Spring 2026" cohort and invite the first Board members |

---

## 📋 Additional Tasks Identified

### Authentication Flow (Completed)
- [x] Login page at `/auth/login`
- [x] Sign-up page at `/auth/sign-up`
- [x] Forgot password flow at `/auth/forgot-password`
- [x] Update password flow at `/auth/update-password`
- [x] Sign-up success confirmation page
- [x] Auth error handling page

### Next Steps
- [ ] **Seed Data:** Populate `board_positions` with standard positions (President, VP, Secretary, Treasurer, etc.)
- [ ] **Admin Dashboard:** Create admin pages for managing cohorts and memberships
- [ ] **User Onboarding:** Build profile setup flow for new board members
- [ ] **Environment Config:** Update `SUPER_ADMIN_EMAIL` in `lib/authUtils.ts` to use actual admin email