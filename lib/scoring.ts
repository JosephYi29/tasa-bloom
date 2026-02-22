import { SupabaseClient } from "@supabase/supabase-js";
import { defaultWeights } from "@/lib/constants"; // fallback

export type CandidateScoreCategory = {
  average: number | null;
  rawScores: number[];
  outliers: number[];
  isComplete: boolean;
};

export type ScoredCandidate = {
  candidate_id: string;
  first_name: string;
  last_name: string;
  candidate_number: number | null;
  email: string | null;
  application: CandidateScoreCategory;
  interview: CandidateScoreCategory;
  character: CandidateScoreCategory;
  composite_score: number | null;
};

// Standard deviation helper
function stdev(array: number[]) {
  if (array.length === 0) return 0;
  const n = array.length;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
}

function mean(array: number[]) {
  if (array.length === 0) return 0;
  return array.reduce((a, b) => a + b) / array.length;
}

export async function computeScoresForCohort(supabase: SupabaseClient, cohortId: string) {
  // 1. Fetch Candidates
  const { data: candidates, error: candError } = await supabase
    .from("candidates")
    .select("id, first_name, last_name, candidate_number, email")
    .eq("cohort_id", cohortId)
    .eq("is_active", true);

  if (candError) throw candError;

  let settings = Object.assign({}, defaultWeights);
  const { data: dbSettings } = await supabase
    .from("cohort_settings")
    .select("*")
    .eq("cohort_id", cohortId)
    .single();

  if (dbSettings) {
    settings = {
      outlier_std_devs: dbSettings.outlier_std_devs ?? defaultWeights.outlier_std_devs,
      application_weight: dbSettings.application_weight ?? defaultWeights.application_weight,
      interview_weight: dbSettings.interview_weight ?? defaultWeights.interview_weight,
      character_weight: dbSettings.character_weight ?? defaultWeights.character_weight,
      top_n_display: dbSettings.top_n_display ?? defaultWeights.top_n_display
    };
  }

  // 3. Fetch Ratings & Scores (include question_id/trait_id for per-item outlier detection)
  const { data: rawRatings, error: ratError } = await supabase
    .from("ratings")
    .select(`
      id,
      candidate_id,
      rating_type,
      voter_id,
      rating_scores (score, question_id, trait_id)
    `)
    .eq("cohort_id", cohortId);

  if (ratError) throw ratError;

  // Group scores by category per candidate, but also track per-item scores for outlier detection
  // scoreMap[candidate_id][rating_type] = all scores (flat, for average)
  // itemScoreMap[candidate_id][rating_type][question_id|trait_id] = scores for that specific item
  const scoreMap: Record<string, { application: number[], interview: number[], character: number[] }> = {};
  const itemScoreMap: Record<string, { application: Record<string, number[]>, interview: Record<string, number[]>, character: Record<string, number[]> }> = {};

  candidates.forEach(c => {
    scoreMap[c.id] = { application: [], interview: [], character: [] };
    itemScoreMap[c.id] = { application: {}, interview: {}, character: {} };
  });

  rawRatings.forEach(rating => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rating.rating_scores.forEach((rs: any) => {
      if (rating.candidate_id && scoreMap[rating.candidate_id]) {
        const type = rating.rating_type as "application" | "interview" | "character";
        if (scoreMap[rating.candidate_id][type]) {
          scoreMap[rating.candidate_id][type].push(rs.score);
          
          // Track per-item for outlier detection
          const itemKey = rs.question_id || rs.trait_id || "unknown";
          if (!itemScoreMap[rating.candidate_id][type][itemKey]) {
            itemScoreMap[rating.candidate_id][type][itemKey] = [];
          }
          itemScoreMap[rating.candidate_id][type][itemKey].push(rs.score);
        }
      }
    });
  });

  // Calculate averages & outliers (per-item outlier detection to match detail page)
  const stdThreshold = settings.outlier_std_devs;

  const results: ScoredCandidate[] = candidates.map(c => {
    const processCategory = (allScores: number[], itemGroups: Record<string, number[]>): CandidateScoreCategory => {
      if (allScores.length === 0) return { average: null, rawScores: [], outliers: [], isComplete: false };
      
      // Detect outliers per question/trait (matching the detail page logic)
      const allOutliers: number[] = [];
      const allValid: number[] = [];
      
      Object.values(itemGroups).forEach(itemScores => {
        if (itemScores.length === 0) return;
        const m = mean(itemScores);
        const s = stdev(itemScores);
        
        itemScores.forEach(score => {
          if (s > 0 && Math.abs(score - m) > (stdThreshold * s)) {
            allOutliers.push(score);
          } else {
            allValid.push(score);
          }
        });
      });

      const finalAverage = allValid.length > 0 ? mean(allValid) : mean(allScores);

      return {
        average: finalAverage,
        rawScores: allScores,
        outliers: allOutliers,
        isComplete: true
      };
    };

    const appData = processCategory(scoreMap[c.id].application, itemScoreMap[c.id].application);
    const intData = processCategory(scoreMap[c.id].interview, itemScoreMap[c.id].interview);
    const charData = processCategory(scoreMap[c.id].character, itemScoreMap[c.id].character);

    // Compute composite if all three have averages (or if you want to allow partial composites, adjust here)
    let composite = null;
    if (appData.average !== null && intData.average !== null && charData.average !== null) {
      composite = 
        (appData.average * settings.application_weight) + 
        (intData.average * settings.interview_weight) + 
        (charData.average * settings.character_weight);
    }

    return {
      candidate_id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      candidate_number: c.candidate_number,
      email: c.email,
      application: appData,
      interview: intData,
      character: charData,
      composite_score: composite ? Number(composite.toFixed(2)) : null,
    };
  });

  // Sort by composite score descending
  results.sort((a, b) => {
    if (a.composite_score === null && b.composite_score === null) return 0;
    if (a.composite_score === null) return 1;
    if (b.composite_score === null) return -1;
    return b.composite_score - a.composite_score;
  });

  return results;
}
