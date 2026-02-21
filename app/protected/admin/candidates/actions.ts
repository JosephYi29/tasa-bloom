"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { revalidatePath } from "next/cache";

export async function updateCandidateOrderAction(orderedIds: string[]) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return { error: "Unauthorized" };
  }

  const supabase = await createAdminClient();

  // Create an array of updates: { id, custom_order }
  // We can use an upsert to perform bulk updates efficiently
  const updates = orderedIds.map((id, index) => ({
    id,
    custom_order: index + 1 // 1-based ordering
  }));

  // But Supabase JS upsert requires all non-null columns if we don't specify them
  // A safer approach is to update each row individually, or use a Postgres function
  // Let's loop and update for simplicity, since the number of candidates is typically < 100
  
  for (const update of updates) {
    const { error } = await supabase
      .from("candidates")
      .update({ custom_order: update.custom_order })
      .eq("id", update.id);
      
    if (error) {
       console.error("Failed to update candidate order:", error);
       return { error: "Failed to save order" };
    }
  }

  revalidatePath("/protected/admin/candidates");
  revalidatePath("/protected/vote");
  return { success: true };
}

export async function deleteCandidateAction(candidateId: string) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return { error: "Unauthorized" };
  }

  const supabase = await createAdminClient();
  
  const { error } = await supabase
    .from("candidates")
    .delete()
    .eq("id", candidateId);

  if (error) {
    console.error("Failed to delete candidate:", error);
    return { error: "Failed to delete candidate" };
  }

  revalidatePath("/protected/admin/candidates");
  revalidatePath("/protected/vote");
  return { success: true };
}

export async function updateCandidateAction(
  candidateId: string,
  data: {
    first_name?: string;
    last_name?: string;
    candidate_number?: number | null;
    email?: string | null;
    year?: string | null;
  }
) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return { error: "Unauthorized" };
  }

  const supabase = await createAdminClient();

  // If candidate_number is being updated to a non-null value, we might want to ensure uniqueness
  // However, DB constraints will catch it if it's strictly enforced per cohort.
  // Assuming the DB handles duplicate candidate_number within a cohort gracefully (or errors appropriately).

  const { error } = await supabase
    .from("candidates")
    .update({
      first_name: data.first_name,
      last_name: data.last_name,
      candidate_number: data.candidate_number,
      email: data.email,
      year: data.year,
    })
    .eq("id", candidateId);

  if (error) {
    console.error("Failed to update candidate:", error);
    if (error.code === '23505') { // Postgres unique violation code
       return { error: "A candidate with this number already exists" };
    }
    return { error: "Failed to update candidate" };
  }

  revalidatePath("/protected/admin/candidates");
  revalidatePath("/protected/vote");
  return { success: true, candidate: { id: candidateId, ...data } };
}
