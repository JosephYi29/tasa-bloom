import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ApplicationScoringForm } from "./scoring-form";

export default async function CandidateApplicationPage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();

  // 1. Get Candidate
  const { data: candidate } = await supabase
    .from("candidates")
    .select("id, candidate_number, first_name, last_name, cohort_id")
    .eq("id", candidateId)
    .single();

  if (!candidate) notFound();

  // 2. Get Application Questions and Responses
  // We fetch explicitly instead of relying on the complex join.
  
  const { data: explicitQuestions } = await supabase
    .from("application_questions")
    .select("id, question_text")
    .eq("cohort_id", candidate.cohort_id)
    .eq("category", "application")
    .order("question_order", { ascending: true });

  const { data: explicitResponses } = await supabase
    .from("application_responses")
    .select("question_id, response_text")
    .eq("candidate_id", candidateId);

  const mergedQuestions = (explicitQuestions ?? []).map((q) => {
    const resp = explicitResponses?.find((r) => r.question_id === q.id);
    return {
      id: q.id,
      questionText: q.question_text,
      responseText: resp?.response_text ?? null,
    };
  });

  // 3. Get Existing Scores for current user
  const { data: rating } = await supabase
    .from("ratings")
    .select("id")
    .eq("candidate_id", candidateId)
    .eq("voter_id", user.id)
    .eq("rating_type", "application")
    .single();

  let existingScores: Record<string, number> = {};
  if (rating) {
    const { data: scores } = await supabase
      .from("rating_scores")
      .select("question_id, score")
      .eq("rating_id", rating.id)
      .not("question_id", "is", null);
      
    existingScores = (scores ?? []).reduce((acc, s) => {
      if (s.question_id) acc[s.question_id] = s.score;
      return acc;
    }, {} as Record<string, number>);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/protected/vote">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Rate Application
          </h1>
          <p className="text-muted-foreground mt-1">
            Candidate #{candidate.candidate_number}: {candidate.first_name} {candidate.last_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8 items-start">
        {/* Left Column: Application Responses */}
        <div className="space-y-8">
          {mergedQuestions.map((q, idx) => (
            <div key={q.id} className="space-y-3">
              <h3 className="font-medium flex gap-2 text-foreground">
                <span className="text-muted-foreground shrink-0">{idx + 1}.</span>
                {q.questionText}
              </h3>
              <div className="rounded-lg bg-muted/50 p-4 border border-border text-sm leading-relaxed whitespace-pre-wrap">
                {q.responseText || <span className="text-muted-foreground italic">No response provided.</span>}
              </div>
            </div>
          ))}

          {mergedQuestions.length === 0 && (
            <div className="text-muted-foreground italic p-8 border border-dashed text-center rounded-lg">
              No application questions found for this cohort.
            </div>
          )}
        </div>

        {/* Right Column: Sticky Scoring Form */}
        <div className="sticky top-20">
          <ApplicationScoringForm 
            candidateId={candidateId}
            cohortId={candidate.cohort_id}
            questions={mergedQuestions.map(q => ({ id: q.id, text: q.questionText }))}
            initialScores={existingScores}
          />
        </div>
      </div>
    </div>
  );
}
