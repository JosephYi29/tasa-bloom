"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { revalidatePath } from "next/cache";

export async function importLegacyRatings(
  cohortId: string,
  questionHeaders: { header: string; colIndex: number }[],
  rows: string[][],
  columnIndices: {
    voterIdx: number;
    fnIdx: number;
    lnIdx: number;
    fullIdx: number;
  },
  ratingType: "application" | "interview" | "character" = "application"
) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");

  const supabase = await createAdminClient();

  // 1. Create Application Questions or Character Traits for the legacy scores
  const questionIds: Record<number, string> = {};
  for (let qi = 0; qi < questionHeaders.length; qi++) {
    const q = questionHeaders[qi];
    
    if (ratingType === "character") {
      const { data: existingQ } = await supabase
        .from("character_traits")
        .select("id")
        .eq("cohort_id", cohortId)
        .eq("trait_name", q.header)
        .maybeSingle();

      if (existingQ) {
        questionIds[q.colIndex] = existingQ.id;
      } else {
        const { data, error } = await supabase
          .from("character_traits")
          .insert({
            cohort_id: cohortId,
            trait_name: q.header,
            trait_order: qi + 1,
          })
          .select("id")
          .single();

        if (error) throw new Error(`Failed to create character trait: ${error.message}`);
        if (data) questionIds[q.colIndex] = data.id;
      }
    } else {
      const { data: existingQ } = await supabase
        .from("application_questions")
        .select("id")
        .eq("cohort_id", cohortId)
        .eq("question_text", q.header)
        .maybeSingle();

      if (existingQ) {
        questionIds[q.colIndex] = existingQ.id;
      } else {
        const { data, error } = await supabase
          .from("application_questions")
          .insert({
            cohort_id: cohortId,
            question_text: q.header,
            question_order: qi + 1,
            category: ratingType,
          })
          .select("id")
          .single();

        if (error) throw new Error(`Failed to create question: ${error.message}`);
        if (data) questionIds[q.colIndex] = data.id;
      }
    }
  }

  const cleanName = (name: string) => {
    if (!name) return "";
    return name
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  let imported = 0;

  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri];

    let firstName = "";
    let lastName = "";

    if (columnIndices.fullIdx >= 0) {
      const parts = (row[columnIndices.fullIdx] ?? "").trim().split(/\s+/);
      firstName = parts[0] ?? "";
      lastName = parts.slice(1).join(" ") || "";
    } else {
      if (columnIndices.fnIdx >= 0) firstName = (row[columnIndices.fnIdx] ?? "").trim();
      if (columnIndices.lnIdx >= 0) lastName = (row[columnIndices.lnIdx] ?? "").trim();
    }

    firstName = cleanName(firstName);
    lastName = cleanName(lastName);
    const voterAlias = columnIndices.voterIdx >= 0 ? cleanName(row[columnIndices.voterIdx] ?? "") : "Unknown Voter";

    if (!firstName && !lastName) continue;

    // 2. Idempotent Candidate creation/fetch
    let candidateId = null;
    const { data: existingCandidate } = await supabase
      .from("candidates")
      .select("id")
      .eq("cohort_id", cohortId)
      .eq("first_name", firstName)
      .eq("last_name", lastName)
      .maybeSingle();

    if (existingCandidate) {
      candidateId = existingCandidate.id;
    } else {
      const { data: newCandidate, error: candErr } = await supabase
        .from("candidates")
        .insert({
          cohort_id: cohortId,
          first_name: firstName,
          last_name: lastName,
        })
        .select("id")
        .single();
      if (candErr) throw new Error(`Failed to insert candidate row ${ri + 1}: ${candErr.message}`);
      candidateId = newCandidate.id;
    }

    if (candidateId) {
      // 3. Create rating record
      const { data: existingRating } = await supabase
        .from("ratings")
        .select("id")
        .eq("candidate_id", candidateId)
        .eq("legacy_voter_alias", voterAlias)
        .eq("cohort_id", cohortId)
        .eq("rating_type", ratingType)
        .maybeSingle();

      let ratingId = existingRating?.id;

      if (!ratingId) {
        const { data: newRating, error: ratingErr } = await supabase
          .from("ratings")
          .insert({
            candidate_id: candidateId,
            cohort_id: cohortId,
            legacy_voter_alias: voterAlias,
            imported_by: user.id,
            rating_type: ratingType
          })
          .select("id")
          .single();

        if (ratingErr) throw new Error(`Failed to insert rating for row ${ri + 1}: ${ratingErr.message}`);
        ratingId = newRating.id;
      }

      // 4. Insert corresponding rating_scores
      const scoresToInsert = [];
      for (const q of questionHeaders) {
        if (!questionIds[q.colIndex]) continue;
        const scoreStr = (row[q.colIndex] ?? "").trim();
        const scoreVal = parseFloat(scoreStr);
        
        if (!isNaN(scoreVal) && scoreVal >= 1 && scoreVal <= 10) {
          scoresToInsert.push({
            rating_id: ratingId,
            ...(ratingType === "character" 
              ? { trait_id: questionIds[q.colIndex] } 
              : { question_id: questionIds[q.colIndex] }
            ),
            score: scoreVal
          });
        }
      }

      if (scoresToInsert.length > 0) {
        // We do an upsert or let it fail if unique, though rating_scores doesn't have a unique constraint on rating_id + question_id natively
        // To be safe we could delete existing ones first, or assume it's a fresh import. Let's do a fast fresh insert.
        // Wait, it might duplicate if the admin runs it twice. Let's delete existing scores for this rating_id first.
        await supabase.from("rating_scores").delete().eq("rating_id", ratingId);
        
        const { error: respErr } = await supabase.from("rating_scores").insert(scoresToInsert);
        if (respErr) throw new Error(`Failed to insert scores for row ${ri + 1}: ${respErr.message}`);
      }
    }
    imported++;
  }

  revalidatePath("/protected/admin/results");
  return { success: true, imported, questions: questionHeaders.length };
}
