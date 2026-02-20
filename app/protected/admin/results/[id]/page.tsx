import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { defaultWeights } from "@/lib/constants";

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
      rating_scores (
        score,
        question_id,
        trait_name,
        comment,
        application_questions (
          question_text
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
      const key = rs.question_id || rs.trait_name || "unknown";
      if (!scoresByItem[key]) {
        scoresByItem[key] = {
          type: rating.rating_type,
          text: rs.application_questions?.question_text || rs.trait_name || "Unknown Item",
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
                          <div className="flex items-center gap-1.5 border-l pl-4 text-amber-600 dark:text-amber-500">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{outliers.length} Outlier(s): {outliers.join(", ")}</span>
                          </div>
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

        {Object.keys(scoresByItem).length === 0 && (
          <div className="text-center py-12 border rounded-lg border-dashed">
            <p className="text-muted-foreground">No scores have been submitted for this candidate yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
