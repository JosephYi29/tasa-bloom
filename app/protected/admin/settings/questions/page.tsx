import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { QuestionManager } from "./question-manager";

export const metadata = {
  title: "Admin | Application Questions",
};

export default async function AdminQuestionsPage() {
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
        <p className="text-muted-foreground">No active cohort found. Please activate a cohort first.</p>
      </div>
    );
  }

  // Fetch current questions for the active cohort
  const { data: questions } = await supabase
    .from("application_questions")
    .select("*")
    .eq("cohort_id", activeCohort.id)
    .order("question_order", { ascending: true });

  return (
    <div className="max-w-4xl mx-auto space-y-6 flex flex-col min-h-[80vh]">
      <div className="flex items-center gap-4 mb-2">
        <Link 
          href="/protected/admin/settings" 
          className="p-2 -ml-2 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Application Questions</h1>
          <p className="text-muted-foreground mt-1">
            Configure the questions that Board Members will read and evaluate across phases for the {activeCohort.term} {activeCohort.year} cohort.
          </p>
        </div>
      </div>

      <div className="flex-1">
        <QuestionManager cohortId={activeCohort.id} initialQuestions={questions || []} />
      </div>
    </div>
  );
}
