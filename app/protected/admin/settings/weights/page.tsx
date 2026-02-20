import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { redirect } from "next/navigation";
import { WeightsForm } from "./weights-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { defaultWeights } from "@/lib/constants";

export const metadata = {
  title: "Admin Settings | Scoring Weights",
};

export default async function AdminWeightsPage() {
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
      <div className="max-w-3xl mx-auto space-y-6">
        <p className="text-muted-foreground">
          No active cohort found. Please activate a cohort first.
        </p>
      </div>
    );
  }

  // Get settings for active cohort
  let { data: settings } = await supabase
    .from("cohort_settings")
    .select("*")
    .eq("cohort_id", activeCohort.id)
    .single();
    
  if (!settings) {
    // If no settings exist yet, we can supply the defaults to the form
    settings = {
      id: "new",
      cohort_id: activeCohort.id,
      application_weight: defaultWeights.application_weight,
      interview_weight: defaultWeights.interview_weight,
      character_weight: defaultWeights.character_weight,
      outlier_std_devs: defaultWeights.outlier_std_devs,
      top_n_display: defaultWeights.top_n_display,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-4">
        <Link
          href="/protected/admin/settings"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Settings
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scoring Weights</h1>
        <p className="text-muted-foreground mt-1">
          Configure how scores are calculated for the active cohort (
          {activeCohort.term} {activeCohort.year}).
        </p>
      </div>

      <WeightsForm initialSettings={settings} activeCohortId={activeCohort.id} />
    </div>
  );
}
