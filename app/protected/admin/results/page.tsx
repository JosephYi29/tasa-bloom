import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { redirect } from "next/navigation";
import { computeScoresForCohort } from "@/lib/scoring";
import { ResultsClient } from "./results-client";

export const metadata = {
  title: "Admin | Voting Results",
};

export default async function AdminResultsPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect("/protected");

  const supabase = await createAdminClient();

  // Get active cohort
  const { data: activeCohort } = await supabase
    .from("cohorts")
    .select("id, term, year")
    .eq("is_active", true)
    .single();

  if (!activeCohort) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <p className="text-muted-foreground">
          No active cohort found. Please activate a cohort first.
        </p>
      </div>
    );
  }

  // Fetch and compute scores
  const results = await computeScoresForCohort(supabase, activeCohort.id);

  // Get settings to know `top_n_display`
  const { data: settings } = await supabase
    .from("cohort_settings")
    .select("top_n_display")
    .eq("cohort_id", activeCohort.id)
    .single();

  const topN = settings?.top_n_display ?? 20;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Voting Results</h1>
          <p className="text-muted-foreground mt-1">
            Displaying computed results for the active cohort (
            {activeCohort.term} {activeCohort.year}).
          </p>
        </div>
      </div>

      <ResultsClient data={results} topN={topN} activeCohort={activeCohort} />
    </div>
  );
}
