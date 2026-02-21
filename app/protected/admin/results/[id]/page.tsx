import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { defaultWeights } from "@/lib/constants";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const metadata = {
  title: "Admin | Candidate Details",
};

// Helper to compute mean and stddev
function getStats(scores: number[]) {
  if (scores.length === 0) return { mean: 0, stdev: 0 };
  const n = scores.length;
  const m = scores.reduce((a, b) => a + b) / n;
  const s = Math.sqrt(scores.map(x => Math.pow(x - m, 2)).reduce((a, b) => a + b) / n);
  return { mean: m, stdev: s };
}

export default async function CandidateDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect("/protected");

  const supabase = await createAdminClient();
  const candidateId = (await params).id;

  // 1. Fetch Candidate info
  const { data: candidate, error: candError } = await supabase
    .from("candidates")
    .select("*, cohort:cohorts(term, year)")
    .eq("id", candidateId)
    .single();

  if (candError || !candidate) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <p className="text-muted-foreground">Candidate not found.</p>
      </div>
    );
  }

  // 2. Fetch Settings for Outlier Threshold
  const { data: settings } = await supabase
    .from("cohort_settings")
    .select("outlier_std_devs")
    .eq("cohort_id", candidate.cohort_id)
    .single();

  const stdThreshold = settings?.outlier_std_devs ?? defaultWeights.outlier_std_devs;

  // 3. Fetch Ratings with Scores
  const { data: rawRatings } = await supabase
    .from("ratings")
    .select(`
      id,
      rating_type,
      voter_id,
      legacy_voter_alias,
      imported_by,
      rating_scores (
        score,
        question_id,
        trait_id,
        comment,
        application_questions (
          question_text
        ),
        character_traits (
          trait_name
        )
      )
    `)
    .eq("candidate_id", candidateId);

  // 4. Process scores per question/trait
  const scoresByItem: Record<string, { type: string, text: string, scores: number[], comments: string[] }> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawRatings?.forEach((rating: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rating.rating_scores.forEach((rs: any) => {
      const key = rs.question_id || rs.trait_id || "unknown";
      if (!scoresByItem[key]) {
        scoresByItem[key] = {
          type: rating.rating_type,
          text: rs.application_questions?.question_text || rs.character_traits?.trait_name || "Unknown Item",
          scores: [],
          comments: []
        };
      }
      scoresByItem[key].scores.push(rs.score);
      if (rs.comment) {
        scoresByItem[key].comments.push(rs.comment);
      }
    });
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-4">
        <Link
          href="/protected/admin/results"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Results
        </Link>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {candidate.first_name} {candidate.last_name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Candidate #{candidate.candidate_number} • {candidate.email}
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {["application", "interview", "character"].map(type => {
          const items = Object.values(scoresByItem).filter(i => i.type === type);
          if (items.length === 0) return null;

          return (
            <div key={type} className="border rounded-lg bg-card overflow-hidden">
              <div className="bg-muted px-4 py-3 border-b">
                <h2 className="font-semibold capitalize text-lg">{type} Scores</h2>
              </div>
              <div className="divide-y">
                {items.map((item, idx) => {
                  const stats = getStats(item.scores);
                  const outliers = item.scores.filter(s => Math.abs(s - stats.mean) > stdThreshold * stats.stdev);
                  const validScores = item.scores.filter(s => Math.abs(s - stats.mean) <= stdThreshold * stats.stdev);
                  
                  const adjustedMean = validScores.length > 0 
                    ? validScores.reduce((a, b) => a + b, 0) / validScores.length 
                    : stats.mean;

                  return (
                    <div key={idx} className="p-4 space-y-3">
                      <div className="font-medium text-sm text-foreground/90">
                        {item.text}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">Adjusted Avg:</span>
                          <span className="font-bold">{adjustedMean.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 border-l pl-4">
                          <span className="text-muted-foreground">Raw Avg:</span>
                          <span>{stats.mean.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 border-l pl-4">
                          <span className="text-muted-foreground">Votes:</span>
                          <span>{item.scores.length}</span>
                        </div>
                        {outliers.length > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5 border-l pl-4 text-amber-600 dark:text-amber-500 cursor-help transition-colors hover:text-amber-700 dark:hover:text-amber-400">
                                <AlertTriangle className="w-4 h-4" />
                                <span>{outliers.length} Outlier(s) flagged</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Specific outlier values: <span className="font-bold">{outliers.join(", ")}</span></p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>

                      {item.comments.length > 0 && (
                        <div className="pt-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Comments</p>
                          <ul className="space-y-1.5">
                            {item.comments.map((comment, i) => (
                              <li key={i} className="text-sm bg-muted/40 p-2 rounded-md border text-foreground/80 italic">
                                &quot;{comment}&quot;
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Voter Breakdown Section */}
        {rawRatings && rawRatings.filter((r: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rating = r as any;
          return rating.rating_scores && rating.rating_scores.length > 0;
        }).length > 0 && (
          <div className="border rounded-lg bg-card overflow-hidden mt-8">
            <div className="bg-muted px-4 py-3 border-b flex items-center justify-between">
              <h2 className="font-semibold text-lg">Detailed Voter Breakdown</h2>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">Admin Only</span>
            </div>
            <div className="divide-y">
              {rawRatings.filter((r: unknown) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const rating = r as any;
                return rating.rating_scores && rating.rating_scores.length > 0;
              }).map((rating: unknown, rIdx: number) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const r = rating as any;
                const voterName = r.legacy_voter_alias 
                  ? `${r.legacy_voter_alias} (Historical Import)` 
                  : r.voter_id 
                    ? `Voter ID: ${r.voter_id.substring(0, 8)}...` 
                    : "Unknown Voter";

                return (
                  <div key={r.id || rIdx} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm text-foreground/90 flex items-center gap-2">
                        {voterName}
                        {r.imported_by && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded border">
                            Imported manually
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        {r.rating_type} Phase
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {r.rating_scores.map((rs: unknown, rsIdx: number) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const score = rs as any;
                        const questionLabel = score.application_questions?.question_text || score.character_traits?.trait_name || "Unknown Item";
                        
                        const key = score.question_id || score.trait_id || "unknown";
                        let isOutlier = false;
                        if (scoresByItem[key]) {
                          const stats = getStats(scoresByItem[key].scores);
                          isOutlier = Math.abs(score.score - stats.mean) > stdThreshold * stats.stdev;
                        }

                        return (
                          <div key={rsIdx} className={`text-sm border rounded-md p-2 flex flex-col justify-between ${isOutlier ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50" : "bg-muted/20"}`}>
                            <span className="text-muted-foreground text-xs line-clamp-1 truncate block mb-1" title={questionLabel}>
                              {questionLabel}
                            </span>
                            <div className="flex justify-between items-end">
                              <span className="font-bold text-base flex items-center gap-1.5">
                                {score.score} <span className="text-xs font-normal text-muted-foreground">/10</span>
                                {isOutlier && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="cursor-help transition-colors hover:opacity-80">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p>This score is a statistical outlier compared to the board average.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </span>
                              {score.comment && (
                                <span className="text-xs text-muted-foreground italic truncate max-w-[120px]" title={score.comment}>
                                  &quot;{score.comment}&quot;
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {Object.keys(scoresByItem).length === 0 && (
          <div className="text-center py-12 border rounded-lg border-dashed">
            <p className="text-muted-foreground">No scores have been submitted for this candidate yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
