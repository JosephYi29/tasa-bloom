# Admin Page Load Times

## Comparison

The times below represent **warm-load** requests (subsequent requests after initial compilation).

| Page | Before (Baseline) | After Round 1 (`cache()`) | After Round 2 (`Promise.all`) | Overall Impact |
|---|---|---|---|---|
| `/protected/admin` | 1192ms | ~892ms | **659ms** | **~45% faster** |
| `/protected/admin/candidates` | 1468ms | ~658ms | **~742ms** | **~50% faster** |
| `/protected/admin/results` | 2312ms | ~1403ms | **1133ms** | **~51% faster** |
| `/protected/admin/cohorts` | — | 482ms | **498ms** | ~same |
| `/protected/admin/board` | — | 858ms | **537ms** | **~37% faster** |
| `/protected/admin/evaluation` | — | 824ms | **489ms** | **~40% faster** |
| `/protected/admin/import` | 858ms | 872ms | **416ms** | **~51% faster** |
| `/protected/admin/settings` | — | 253ms | **58ms** | **~77% faster** |
| `/protected/admin/settings/positions` | — | 680ms | **—** | — |

> **Note**: "Before" baseline times are from the first dev session prior to the performance optimizations. Not all pages were tested for baseline, leaving some fields empty.

## Optimizations Made

### Round 1: React `cache()` + Static Imports
- **`getCurrentUser()` Cached**: Reduced redundant auth calls (3 calls to 1 per request), saving ~8 Supabase queries per page.
- **`createAdminClient` Fix**: Converted a dynamic `import()` to a static one.

### Round 2: Query Parallelization
- **Cached `getActiveCohort()`**: Deduplicated recurring active cohort lookups.
- **`Promise.all` in `scoring.ts`**: Transformed 4 sequential queries into a concurrent operation, vastly aiding the `/admin/results` page.
- **Parallelized Page Queries**: Restructured data fetching on all 10 admin pages to fetch independent chunks in parallel.

> **Next Steps**: Re-run the pages locally to evaluate the extra savings provided by the Round 2 optimizations.
