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
