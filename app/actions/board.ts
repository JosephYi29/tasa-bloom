"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { revalidatePath } from "next/cache";

export async function addBoardMember(profileId: string, positionId: string) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");

  const supabase = await createAdminClient();

  const { data: activeCohort } = await supabase
    .from("cohorts")
    .select("id")
    .eq("is_active", true)
    .single();

  if (!activeCohort) throw new Error("No active cohort found");

  // Get the user_id from the profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("id", profileId)
    .single();
    
  if (!profile) throw new Error("Profile not found");

  const { error } = await supabase
    .from("board_memberships")
    .insert({
      user_id: profile.user_id,
      cohort_id: activeCohort.id,
      position_id: positionId,
    });

  if (error) {
    if (error.code === '23505') throw new Error("User is already on the board for this cohort.");
    throw new Error(error.message);
  }

  revalidatePath("/protected/admin/board");
  return { success: true };
}

export async function removeBoardMember(userId: string) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");
  if (user.id === userId) throw new Error("Cannot remove yourself.");

  const supabase = await createAdminClient();

  const { data: activeCohort } = await supabase
    .from("cohorts")
    .select("id")
    .eq("is_active", true)
    .single();

  if (!activeCohort) throw new Error("No active cohort found");

  const { error } = await supabase
    .from("board_memberships")
    .delete()
    .eq("user_id", userId)
    .eq("cohort_id", activeCohort.id);

  if (error) throw new Error(error.message);

  revalidatePath("/protected/admin/board");
  return { success: true };
}
