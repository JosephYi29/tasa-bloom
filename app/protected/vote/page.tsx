import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function VoteHubPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const isSuperAdmin = user.email === process.env.SUPER_ADMIN_EMAIL;
  const supabase = isSuperAdmin ? await createAdminClient() : await createClient();

  const { data: activeCohort } = await supabase
    .from("cohorts")
    .select("id, term, year, app_voting_open")
    .eq("is_active", true)
    .single();

  let candidates: {
    id: string;
    candidate_number: number;
    first_name: string;
    last_name: string;
    ratings: { rating_type: string }[];
  }[] = [];

  if (activeCohort) {
    const { data } = await supabase
      .from("candidates")
      .select(`
        id,
        candidate_number,
        first_name,
        last_name,
        ratings 
          (rating_type)
      `)
      .eq("cohort_id", activeCohort.id)
      .eq("ratings.voter_id", user.id) // Only get ratings submitted by current user
      .order("candidate_number", { ascending: true });
    
    // The cast is needed because Supabase types might not perfectly match the join structure
    candidates = (data as unknown as typeof candidates) ?? [];
  }

  const getStatusIndicator = (candidateRatings: { rating_type: string }[], type: string) => {
    return candidateRatings.some((r) => r.rating_type === type) ? "✅" : "⬜";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Voting Hub</h1>
        <p className="text-muted-foreground mt-1">
          {activeCohort
            ? `Evaluate candidates for ${activeCohort.term} ${activeCohort.year}`
            : "No active cohort set"}
        </p>
      </div>

      {!activeCohort ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          No active cohort found. Please contact an admin.
        </div>
      ) : candidates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          No candidates have been imported for this cohort yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {candidates.map((c) => {
            const hasApp = getStatusIndicator(c.ratings || [], "application");
            const hasInt = getStatusIndicator(c.ratings || [], "interview");
            const hasChar = getStatusIndicator(c.ratings || [], "character");

            return (
              <div
                key={c.id}
                className="rounded-lg border border-border bg-card p-5 hover:border-primary/50 transition-colors flex flex-col"
              >
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                      Candidate #{c.candidate_number}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold">
                    {activeCohort.app_voting_open ? (
                      <span className="text-muted-foreground italic text-sm">Hidden (App Eval)</span>
                    ) : (
                      `${c.first_name} ${c.last_name}`
                    )}
                  </h3>
                </div>

                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Application</span>
                    <span>{hasApp}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Interview</span>
                    <span>{hasInt}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Character</span>
                    <span>{hasChar}</span>
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-3 gap-1.5">
                  <Button asChild variant="secondary" className="w-full h-8 px-1 text-xs">
                    <Link href={`/protected/vote/${c.id}/application`}>App</Link>
                  </Button>
                  <Button asChild variant="secondary" className="w-full h-8 px-1 text-xs">
                    <Link href={`/protected/vote/${c.id}/interview`}>Interview</Link>
                  </Button>
                  <Button asChild variant="secondary" className="w-full h-8 px-1 text-xs">
                    <Link href={`/protected/vote/${c.id}/character`}>Character</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
