import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser, getActiveCohort } from "@/lib/authUtils";
import { redirect } from "next/navigation";
import { EvaluationTabs } from "./evaluation-tabs";

export const metadata = {
  title: "Admin | Evaluation Config",
};

export default async function AdminEvaluationPage() {
  const [user, activeCohort] = await Promise.all([
    getCurrentUser(),
    getActiveCohort(),
  ]);
  if (!user?.isAdmin) redirect("/protected");

  if (!activeCohort) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <p className="text-muted-foreground">
          No active cohort found. Please activate a cohort first.
        </p>
      </div>
    );
  }

  const supabase = await createAdminClient();

  // Fetch traits and questions in parallel
  const [{ data: traits }, { data: questions }] = await Promise.all([
    supabase
      .from("character_traits")
      .select("*")
      .eq("cohort_id", activeCohort.id)
      .order("trait_order", { ascending: true }),
    supabase
      .from("application_questions")
      .select("*")
      .eq("cohort_id", activeCohort.id)
      .order("question_order", { ascending: true }),
  ]);

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
