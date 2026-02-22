"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { revalidatePath } from "next/cache";

export async function createQuestion(cohortId: string, questionText: string, category: 'application' | 'interview', questionOrder: number) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");

  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("application_questions")
    .insert({
      cohort_id: cohortId,
      question_text: questionText,
      category,
      question_order: questionOrder,
    });

  if (error) throw new Error(error.message);

  revalidatePath("/protected/admin/evaluation");
  return { success: true };
}

export async function updateQuestion(id: string, questionText: string, questionOrder: number) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");

  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("application_questions")
    .update({
      question_text: questionText,
      question_order: questionOrder,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/protected/admin/evaluation");
  return { success: true };
}

export async function deleteQuestion(id: string) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");

  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("application_questions")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/protected/admin/evaluation");
  return { success: true };
}

export async function toggleQuestionScorable(id: string, isScorable: boolean) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");

  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("application_questions")
    .update({ is_scorable: isScorable })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/protected/admin/evaluation");
  return { success: true };
}
