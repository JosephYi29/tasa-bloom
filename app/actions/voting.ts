"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { revalidatePath } from "next/cache";

export type RatingType = "application" | "interview" | "character";

export async function submitScores(
  candidateId: string,
  categoryId: string, // cohort_id
  ratingType: RatingType,
  scores: { id: string; score: number; comment?: string }[],
  isTrait: boolean = false
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await createClient();

  // 1. Get or create the parent rating record
  let ratingId: string;
  const { data: existingRating, error: fetchErr } = await supabase
    .from("ratings")
    .select("id")
    .eq("candidate_id", candidateId)
    .eq("voter_id", user.id)
    .eq("cohort_id", categoryId)
    .eq("rating_type", ratingType)
    .single();

  if (existingRating) {
    ratingId = existingRating.id;
    // Update updated_at via trigger or manually
    await supabase.from("ratings").update({ updated_at: new Date().toISOString() }).eq("id", ratingId);
  } else {
    // We ignore PGROUTINE errors for 0 rows if it's .single() that failed because it doesn't exist
    if (fetchErr && fetchErr.code !== "PGRST116") {
      throw fetchErr;
    }
    const { data: newRating, error: insertErr } = await supabase
      .from("ratings")
      .insert({
        candidate_id: candidateId,
        voter_id: user.id,
        cohort_id: categoryId,
        rating_type: ratingType,
      })
      .select("id")
      .single();

    if (insertErr || !newRating) throw new Error("Failed to create rating record");
    ratingId = newRating.id;
  }

  // 2. Insert or update the ranking scores
  // If scores is empty (Abstain), we still want to clear the old scores so it formally registers as a 0-score ballot.
  const scoreUpserts = scores.map((s) => ({
    rating_id: ratingId,
    ...(isTrait ? { trait_id: s.id } : { question_id: s.id }),
    score: s.score,
    comment: s.comment || null,
  }));

  // We have a unique constraint on rating_id + question_id or trait_id conceptually, 
  // but to do a real upsert, Supabase needs a UNIQUE constraint to ON CONFLICT against.
  // Wait, rating_scores only has primary key 'id'.
  // We need to either delete existing scores and re-insert, or fetch existing and update.
  // The easiest is delete and re-insert for this rating_id and type.
  
  if (isTrait) {
    await supabase.from("rating_scores").delete().eq("rating_id", ratingId).not("trait_id", "is", null);
  } else {
    await supabase.from("rating_scores").delete().eq("rating_id", ratingId).not("question_id", "is", null);
  }

  if (scoreUpserts.length > 0) {
    const { error: scoreErr } = await supabase
      .from("rating_scores")
      .insert(scoreUpserts);

    if (scoreErr) {
      throw new Error(`Failed to save scores: ${scoreErr.message}`);
    }
  }

  // Revalidate the voting hub
  revalidatePath("/protected/vote");
  revalidatePath(`/protected/vote/${candidateId}/${ratingType}`);

  return { success: true };
}
