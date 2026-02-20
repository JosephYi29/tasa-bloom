import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CharacterScoringForm } from "./scoring-form";

export default async function CandidateCharacterPage({
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
    .select(`
      id, 
      candidate_number, 
      first_name, 
      last_name, 
      cohort_id,
      cohorts ( char_voting_open )
    `)
    .eq("id", candidateId)
    .single();

  if (!candidate) notFound();
  
  const isVotingOpen = (candidate.cohorts as any)?.char_voting_open ?? false;

  // 2. Get Character Traits
  const { data: traits } = await supabase
    .from("character_traits")
    .select("id, trait_name")
    .eq("cohort_id", candidate.cohort_id)
    .order("trait_order", { ascending: true });

  const mappedTraits = (traits ?? []).map((t) => ({
    id: t.id,
    name: t.trait_name,
  }));

  // 3. Get Existing Scores for current user
  const { data: rating } = await supabase
    .from("ratings")
    .select("id")
    .eq("candidate_id", candidateId)
    .eq("voter_id", user.id)
    .eq("rating_type", "character")
    .single();

  let existingScores: Record<string, number> = {};
  if (rating) {
    const { data: scores } = await supabase
      .from("rating_scores")
      .select("trait_id, score")
      .eq("rating_id", rating.id)
      .not("trait_id", "is", null);
      
    existingScores = (scores ?? []).reduce((acc, s) => {
      if (s.trait_id) acc[s.trait_id] = s.score;
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
            Rate Character
          </h1>
          <p className="text-muted-foreground mt-1">
            Candidate #{candidate.candidate_number}: {candidate.first_name} {candidate.last_name}
          </p>
        </div>
      </div>
      
      {!isVotingOpen && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg flex items-center gap-3">
          <div className="font-semibold">Character Voting is Closed</div>
          <div className="text-sm opacity-90">An admin has locked this voting phase. You can view your past scores but cannot submit changes.</div>
        </div>
      )}

      <div className="pt-8">
        {mappedTraits.length > 0 ? (
          <CharacterScoringForm 
            candidateId={candidateId}
            cohortId={candidate.cohort_id}
            traits={mappedTraits}
            initialScores={existingScores}
            isVotingOpen={isVotingOpen}
          />
        ) : (
          <div className="border border-border border-dashed rounded-lg bg-card p-12 text-center text-muted-foreground">
            <p>No character traits configured for this cohort.</p>
            <p className="text-sm mt-1">An admin needs to set them up in Settings.</p>
          </div>
        )}
      </div>
    </div>
  );
}
