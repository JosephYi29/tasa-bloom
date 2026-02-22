import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { redirect } from "next/navigation";
import { EvaluationTabs } from "./evaluation-tabs";

export const metadata = {
  title: "Admin | Evaluation Config",
};

export default async function AdminEvaluationPage() {
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
      <div className="max-w-4xl mx-auto space-y-6">
        <p className="text-muted-foreground">
          No active cohort found. Please activate a cohort first.
        </p>
      </div>
    );
  }

  // Fetch current traits for the active cohort
  const { data: traits } = await supabase
    .from("character_traits")
    .select("*")
    .eq("cohort_id", activeCohort.id)
    .order("trait_order", { ascending: true });

  // Fetch current questions for the active cohort
  const { data: questions } = await supabase
    .from("application_questions")
    .select("*")
    .eq("cohort_id", activeCohort.id)
    .order("question_order", { ascending: true });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Evaluation Config</h1>
        <p className="text-muted-foreground mt-1">
          Configure character traits and application questions for the{" "}
          {activeCohort.term} {activeCohort.year} cohort. These settings are unique to each cohort.
        </p>
      </div>

      <EvaluationTabs
        cohortId={activeCohort.id}
        traits={traits || []}
        questions={questions || []}
      />
    </div>
  );
}
