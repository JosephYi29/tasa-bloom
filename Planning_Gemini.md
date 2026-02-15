# 📂 Project Manifest: JO Application Portal (Multi-Cohort Edition)

## 📋 1. Project Overview

A robust application and voting management system built with Next.js (App Router) and Supabase. The system is designed for longevity, supporting multiple recruitment cycles (cohorts) while maintaining historical data and dynamic permissions for rotating Executive Board members.

---

## 🏗 2. Database Architecture (The Foundation)

To support the requirement of roles changing year-to-year, we move away from a static role column on the user and toward a **Temporal Junction Table** approach.

### 2.1 Schema Definition

#### `cohorts`

| Column      | Type    | Constraints                       |
| ----------- | ------- | --------------------------------- |
| `id`        | UUID    | PK, Default: `gen_random_uuid()` |
| `term`      | TEXT    | NOT NULL (e.g., "Fall", "Spring") |
| `year`      | INT     | NOT NULL (e.g., 2026)             |
| `is_active` | BOOLEAN | DEFAULT `false`                   |

#### `board_memberships`

| Column    | Type | Constraints                          |
| --------- | ---- | ------------------------------------ |
| `user_id` | UUID | FK to `auth.users`, ON DELETE CASCADE |
| `cohort_id` | UUID | FK to `public.cohorts`, ON DELETE CASCADE |
| `role`    | TEXT | CHECK (role IN ('ADMIN', 'MEMBER'))  |

### 2.2 Key Migration SQL

```sql
-- Unique constraint to prevent duplicate cycles
ALTER TABLE public.cohorts ADD CONSTRAINT unique_cohort UNIQUE (term, year);

-- Primary key on composite IDs ensures 1 role per user per cycle
ALTER TABLE public.board_memberships ADD PRIMARY KEY (user_id, cohort_id);

-- Enable RLS
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_memberships ENABLE ROW LEVEL SECURITY;
```

---

## 🔐 3. Security & Logic Requirements

### 3.1 Dynamic Role Resolution

The application must determine permissions based on the **currently active cohort**.

- **Super Admin:** If `user.email === 'admin@yourclub.edu'`, grant ADMIN status globally.
- **Transition Logic:** If a user was an "Admin" in Fall 2025 but is a "Member" in Spring 2026, the system must only respect the "Member" role once the Spring 2026 cohort is toggled to `is_active: true`.

### 3.2 Middleware Enforcement

`middleware.ts` must intercept requests to `/dashboard` and `/admin` to ensure a valid Supabase session exists, redirecting to `/login` otherwise.

---

## 🛠 4. Phase 1: Implementation Steps

### Step 1: Database Setup

1. **Initialize Migration:** `supabase migration new create_rbac_structure`
2. **Apply Schema:** Paste the SQL provided in section 2.2.
3. **Push to Cloud:** `supabase db push`

### Step 2: Core Server Utilities

Create `@/lib/utils.ts` to handle the heavy lifting of role resolution.

```typescript
export async function getCurrentUserRole() {
  // 1. Get Session
  // 2. Check Super Admin Email
  // 3. Query 'cohorts' where is_active = true
  // 4. Query 'board_memberships' for current user + active cohort
  // 5. Return 'ADMIN', 'MEMBER', or null
}
```

### Step 3: UI Integration

- Modify `layout.tsx` to call `getCurrentUserRole()`.
- Wrap Admin-only UI elements in a conditional: `{role === 'ADMIN' && <AdminLink />}`.

---

## 🧪 5. Testing Protocol (For Antigravity Agent)

Use the following checklist to verify the build:

- [ ] **Unauthorized Access:** Navigate to `/admin` while logged out. *(Result: Redirect to Login).*
- [ ] **Historical Integrity:** Set a past cohort to `is_active: false`. Verify the user no longer sees Admin tools even if they were an Admin for that year.
- [ ] **Role Swap:** Update a user's role from `ADMIN` to `MEMBER` in the DB for the active cohort. Refresh page. *(Result: Admin UI disappears).*
- [ ] **Super Admin Bypass:** Log in with the master email and verify access regardless of cohort status.

---

## 🚀 6. Deployment Milestones

1. **Milestone 1:** Database Schema & RLS Policies active on Supabase.
2. **Milestone 2:** Auth Middleware protecting sensitive routes.
3. **Milestone 3:** Dynamic Header/Navigation reacting to user roles.
4. **Milestone 4:** Seed production database with the first "Live" cohort.

---
