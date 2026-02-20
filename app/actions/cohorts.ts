"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { revalidatePath } from "next/cache";

export async function createCohort(term: string, year: number) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");

  const supabase = await createClient();

  const { error } = await supabase
    .from("cohorts")
    .insert({
      term,
      year,
      is_active: false,
    });

  if (error) {
    if (error.code === '23505') throw new Error("A cohort with this term and year already exists.");
    throw new Error(error.message);
  }

  revalidatePath("/protected/admin/settings/cohorts");
  return { success: true };
}

export async function updateCohort(id: string, field: string, value: boolean) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");

  const supabase = await createClient();

  // Validate field to prevent SQL injection or bad updates
  const validFields = ["is_active", "app_voting_open", "int_voting_open", "char_voting_open"];
  if (!validFields.includes(field)) throw new Error("Invalid field update");

  const { error } = await supabase
    .from("cohorts")
    .update({ [field]: value })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/protected/admin/settings/cohorts");
  return { success: true };
}

export async function deleteCohort(id: string) {
  const user = await getCurrentUser();
  // Strictly enforce that ONLY the super admin can delete a cohort
  if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
    throw new Error("Unauthorized: Only a Super Admin can delete a cohort.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("cohorts")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/protected/admin/settings/cohorts");
  return { success: true };
}

export async function importCandidates(
  cohortId: string,
  questionHeaders: { header: string; colIndex: number }[],
  rows: string[][],
  columnIndices: {
    numIdx: number;
    fnIdx: number;
    lnIdx: number;
    fullIdx: number;
    emailIdx: number;
    phoneIdx: number;
    yearIdx: number;
    interviewLinkIdx: number;
  }
) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");

  const supabase = await createAdminClient();

  // 1. Create Application Questions
  const questionIds: Record<number, string> = {};
  for (let qi = 0; qi < questionHeaders.length; qi++) {
    const q = questionHeaders[qi];
    const { data, error } = await supabase
      .from("application_questions")
      .insert({
        cohort_id: cohortId,
        question_text: q.header,
        question_order: qi + 1,
        category: "application",
      })
      .select("id")
      .single();

    if (error) throw new Error(`Failed to create question: ${error.message}`);
    if (data) questionIds[q.colIndex] = data.id;
  }

  // Helper for names
  const cleanName = (name: string) => {
    if (!name) return "";
    return name
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  let imported = 0;
  // 2. Insert Candidates and Responses
  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri];

    let firstName = "";
    let lastName = "";

    if (columnIndices.fullIdx >= 0) {
      const parts = (row[columnIndices.fullIdx] ?? "").trim().split(/\s+/);
      firstName = parts[0] ?? "";
      lastName = parts.slice(1).join(" ") || "";
    }
    if (columnIndices.fnIdx >= 0) firstName = (row[columnIndices.fnIdx] ?? "").trim();
    if (columnIndices.lnIdx >= 0) lastName = (row[columnIndices.lnIdx] ?? "").trim();

    firstName = cleanName(firstName);
    lastName = cleanName(lastName);

    if (!firstName && !lastName) continue;

    const candidateNumber =
      columnIndices.numIdx >= 0 ? parseInt(row[columnIndices.numIdx], 10) || ri + 1 : ri + 1;
    const email = columnIndices.emailIdx >= 0 ? (row[columnIndices.emailIdx] ?? "").trim() || null : null;
    const phoneNumber = columnIndices.phoneIdx >= 0 ? (row[columnIndices.phoneIdx] ?? "").trim() || null : null;
    const year = columnIndices.yearIdx >= 0 ? (row[columnIndices.yearIdx] ?? "").trim() || null : null;

    const { data: candidate, error: candErr } = await supabase
      .from("candidates")
      .insert({
        cohort_id: cohortId,
        candidate_number: candidateNumber,
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phoneNumber,
        year,
      })
      .select("id")
      .single();

    if (candErr) throw new Error(`Failed to insert candidate row ${ri + 1}: ${candErr.message}`);

    if (candidate) {
      // 3. Insert responses
      const responses = questionHeaders
        .filter((q) => questionIds[q.colIndex])
        .map((q) => ({
          candidate_id: candidate.id,
          question_id: questionIds[q.colIndex],
          response_text: (row[q.colIndex] ?? "").trim() || null,
        }));

      if (responses.length > 0) {
        const { error: respErr } = await supabase.from("application_responses").insert(responses);
        if (respErr) throw new Error(`Failed to insert responses for row ${ri + 1}: ${respErr.message}`);
      }

      // 4. Insert interview link
      if (columnIndices.interviewLinkIdx >= 0) {
        const videoUrl = (row[columnIndices.interviewLinkIdx] ?? "").trim();
        if (videoUrl) {
          const { error: intErr } = await supabase.from("interview_links").insert({
            candidate_id: candidate.id,
            video_url: videoUrl,
          });
          if (intErr) throw new Error(`Failed to insert interview link for row ${ri + 1}: ${intErr.message}`);
        }
      }
    }
    imported++;
  }

  revalidatePath("/protected/admin/candidates");
  return { success: true, imported, questions: questionHeaders.length };
}
