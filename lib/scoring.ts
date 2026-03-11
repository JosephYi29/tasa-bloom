import { SupabaseClient } from "@supabase/supabase-js";
import { defaultWeights } from "@/lib/constants"; // fallback
import { cache } from "react";

export type CandidateScoreCategory = {
  average: number | null;
  rawScores: number[];
  outliers: number[];
  isComplete: boolean;
};

export type TraitScore = {
  trait_id: string;
  trait_name: string;
  average: number | null;
  rawScores: number[];
  outliers: number[];
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
  characterTraits: TraitScore[];
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

export const computeScoresForCohort = cache(async (supabase: SupabaseClient, cohortId: string) => {
  // Fetch all data in parallel — these 4 queries are independent
  const [
    { data: candidates, error: candError },
    { data: dbSettings },
    { data: characterTraits, error: traitError },
    { data: rawRatings, error: ratError },
  ] = await Promise.all([
    supabase
      .from("candidates")
      .select("id, first_name, last_name, candidate_number, email")
      .eq("cohort_id", cohortId)
      .eq("is_active", true),
    supabase
      .from("cohort_settings")
      .select("*")
      .eq("cohort_id", cohortId)
      .single(),
    supabase
      .from("character_traits")
      .select("id, trait_name, trait_order, weight")
      .eq("cohort_id", cohortId)
      .order("trait_order", { ascending: true }),
    supabase
      .from("ratings")
      .select(`
        id,
        candidate_id,
        rating_type,
        voter_id,
        rating_scores (score, question_id, trait_id)
      `)
      .eq("cohort_id", cohortId),
  ]);

  if (candError) throw candError;
  if (traitError) throw traitError;
  if (ratError) throw ratError;

  let settings = Object.assign({}, defaultWeights);
  if (dbSettings) {
    settings = {
      outlier_std_devs: dbSettings.outlier_std_devs ?? defaultWeights.outlier_std_devs,
      application_weight: dbSettings.application_weight ?? defaultWeights.application_weight,
      interview_weight: dbSettings.interview_weight ?? defaultWeights.interview_weight,
      character_weight: dbSettings.character_weight ?? defaultWeights.character_weight,
      top_n_display: dbSettings.top_n_display ?? defaultWeights.top_n_display
    };
  }

  // Group scores by category per candidate, but also track per-item scores for outlier detection
  // scoreMap[candidate_id][rating_type] = all scores (flat, for average)
  // itemScoreMap[candidate_id][rating_type][question_id|trait_id] = scores for that specific item
  const scoreMap: Record<string, { application: number[], interview: number[], character: number[] }> = {};
  const itemScoreMap: Record<string, { application: Record<string, number[]>, interview: Record<string, number[]>, character: Record<string, number[]> }> = {};
  // Per-trait score map: traitScoreMap[candidate_id][trait_id] = scores[]
  const traitScoreMap: Record<string, Record<string, number[]>> = {};

  candidates.forEach(c => {
    scoreMap[c.id] = { application: [], interview: [], character: [] };
    itemScoreMap[c.id] = { application: {}, interview: {}, character: {} };
    traitScoreMap[c.id] = {};
    (characterTraits || []).forEach(t => {
      traitScoreMap[c.id][t.id] = [];
    });
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

          // Track per-trait scores for individual trait columns
          if (type === "character" && rs.trait_id && traitScoreMap[rating.candidate_id][rs.trait_id]) {
            traitScoreMap[rating.candidate_id][rs.trait_id].push(rs.score);
          }
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

    // Compute per-trait averages with outlier filtering
    const perTraitScores: TraitScore[] = (characterTraits || []).map(trait => {
      const scores = traitScoreMap[c.id][trait.id] || [];
      if (scores.length === 0) {
        return { trait_id: trait.id, trait_name: trait.trait_name, average: null, rawScores: [], outliers: [] };
      }
      const m = mean(scores);
      const s = stdev(scores);
      const outliers: number[] = [];
      const valid: number[] = [];
      scores.forEach(score => {
        if (s > 0 && Math.abs(score - m) > (stdThreshold * s)) {
          outliers.push(score);
        } else {
          valid.push(score);
        }
      });
      const avg = valid.length > 0 ? mean(valid) : mean(scores);
      return { trait_id: trait.id, trait_name: trait.trait_name, average: avg, rawScores: scores, outliers };
    });

    // Compute composite
    // If trait weights are configured (sum > 0), use weighted trait averages for character portion.
    // Otherwise, fall back to flat character average * character_weight.
    let composite = null;
    if (appData.average !== null && intData.average !== null) {
      const appPart = appData.average * settings.application_weight;
      const intPart = intData.average * settings.interview_weight;

      // Check if trait weights are configured
      const traitWeightSum = (characterTraits || []).reduce((sum, t) => sum + (Number(t.weight) || 0), 0);
      const hasTraitWeights = traitWeightSum > 0.001;

      let charPart: number | null = null;
      if (hasTraitWeights) {
        // Use per-trait weighted averages
        // Each trait's weight is an absolute decimal (e.g., 0.15 means 15% of total composite)
        let traitComposite = 0;
        let allTraitsHaveData = true;
        for (const traitScore of perTraitScores) {
          const traitDef = (characterTraits || []).find(t => t.id === traitScore.trait_id);
          const traitWeight = Number(traitDef?.weight) || 0;
          if (traitWeight > 0) {
            if (traitScore.average !== null) {
              traitComposite += traitScore.average * traitWeight;
            } else {
              allTraitsHaveData = false;
              break;
            }
          }
        }
        if (allTraitsHaveData) {
          charPart = traitComposite;
        }
      } else {
        // Fall back to flat character average
        if (charData.average !== null) {
          charPart = charData.average * settings.character_weight;
        }
      }

      if (charPart !== null) {
        composite = appPart + intPart + charPart;
      }
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
      characterTraits: perTraitScores,
      composite_score: composite !== null ? Number((composite * 10).toFixed(2)) : null,
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
});
