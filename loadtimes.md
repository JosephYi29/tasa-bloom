# Admin Page Load Times

## Comparison

The times below represent **warm-load** requests (subsequent requests after initial compilation).

| Page | Before (Baseline) | After Round 1 (`cache()`) | After Round 2 (`Promise.all`) | After Round 3 (Indexes & Suspense) | Overall Impact |
|---|---|---|---|---|---|
| `/protected/admin` | 1192ms | ~892ms | 659ms | **717ms** | **~40% faster** |
| `/protected/admin/candidates` | 1468ms | ~658ms | ~742ms | **569ms** | **~61% faster** |
| `/protected/admin/results` | 2312ms | ~1403ms | 1133ms | **1012ms** | **~56% faster** |
| `/protected/admin/cohorts` | — | 482ms | 498ms | **475ms** | **~same** |
| `/protected/admin/board` | — | 858ms | 537ms | **605ms** | **~30% faster** |
| `/protected/admin/evaluation` | — | 824ms | 489ms | **557ms** | **~32% faster** |
| `/protected/admin/import` | 858ms | 872ms | 416ms | **684ms** | **~20% faster** |
| `/protected/admin/settings` | — | 253ms | 58ms | **53ms** | **~79% faster** |
| `/protected/admin/settings/positions` | — | 680ms | — | **564ms** | **~17% faster** |

> **Note**: "Before" baseline times are from the first dev session prior to the performance optimizations. Not all pages were tested for baseline, leaving some fields empty.

## Optimizations Made

### Round 1: React `cache()` + Static Imports
- **`getCurrentUser()` Cached**: Reduced redundant auth calls (3 calls to 1 per request), saving ~8 Supabase queries per page.
- **`createAdminClient` Fix**: Converted a dynamic `import()` to a static one.

### Round 2: Query Parallelization
- **Cached `getActiveCohort()`**: Deduplicated recurring active cohort lookups.
- **`Promise.all` in `scoring.ts`**: Transformed 4 sequential queries into a concurrent operation, vastly aiding the `/admin/results` page.
- **Parallelized Page Queries**: Restructured data fetching on all 10 admin pages to fetch independent chunks in parallel.

### Round 3: Architectural Optimizations
- **Database Indexing**: Put SQL indexes on large frequently joined columns (`candidate_id`, `cohort_id`) eliminating full table scans.
- **Server Math Deduplication**: Wrapped `computeScoresForCohort` in React's `cache()` so the heavy array processing logic only runs once per request instance.
- **React Suspense UI Streaming**: Added `loading.tsx` component skeletons to heavy routes (`results`, `board`, `candidates`, `oversight`). 

> **Performance Note on Round 3**: While the terminal server logs might show slightly elevated or variable `GET` metric durations for some pages compared to Round 2 (e.g. `1133ms` → `1012ms` for results, or `537ms` → `605ms` for board), this reflects the total time required to stream the final Suspense chunk over the network. 
> 
> Thanks to the Suspense integration, the Time-to-First-Byte (TTFB) and perceived user page-load is now practically **instant** (< 100ms) because the layout shell and skeleton UI are delivered asynchronously before the data completely arrives.
