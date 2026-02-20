# TASA Bloom

Internal platform for managing Junior Officer (JO) candidate evaluations. Board members log in, review applications, and submit ratings — replacing the multi-Google-Form workflow.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend/DB**: Supabase (Postgres + Auth + RLS + Storage)
- **UI**: Radix UI primitives, Lucide icons, `next-themes` for dark mode

## Features

- **Role-based access**: Admin (President/Secretary) vs. Member, resolved per active cohort
- **Multi-cohort support**: Fall/Spring cycles with full historical data retention
- **Candidate voting**: Application, interview, and character trait ratings (1–10 scale)
- **CSV import**: Bulk-import candidate data from Google Sheets exports
- **Analytics**: Weighted scoring, outlier removal, leaderboard, CSV export
- **Admin dashboard**: Voting oversight, configurable weights/traits, board management

## Project Structure

```
app/
├── auth/            # Login, sign-up, forgot/update password
├── protected/       # Authenticated routes (dashboard, voting)
components/          # Reusable UI components
lib/
├── authUtils.ts     # getCurrentUser() — role resolution from active cohort
├── supabase/        # Supabase client (server, client, middleware)
supabase/
└── migrations/      # SQL migrations for schema changes
types/               # TypeScript types (app, supabase generated)
```

## Local Development

1. Clone the repo
2. `npm install`
3. Create `.env.local` with Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=<your-anon-key>
   ```
   Request these from an existing team member.
4. `npm run dev`

> **⚠️ Caution**: The local dev server connects to the **production** Supabase database by default if you use the live keys. Be careful with schema changes — they affect live data.

## Testing & Usage Guide
See [testing.md](./testing.md) for a comprehensive, step-by-step walkthrough of how to test the application's core flows, including:
- Admin authentication and database setup
- Importing Google Forms CSV exports
- Voting on candidate applications and interviews

## Before Pushing

Run `npm run build` locally to catch compilation errors before pushing to GitHub.

## Database

Schema is managed via Supabase migrations in `supabase/migrations/`. See [PLANNING.md](./PLANNING.md) for the full schema diagram and roadmap.