"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { revalidatePath } from "next/cache";

export async function createTrait(cohortId: string, traitName: string, traitOrder: number) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");

  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("character_traits")
    .insert({
      cohort_id: cohortId,
      trait_name: traitName,
      trait_order: traitOrder,
    });

  if (error) throw new Error(error.message);

  revalidatePath("/protected/admin/evaluation");
  return { success: true };
}

export async function updateTrait(id: string, traitName: string, traitOrder: number) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");

  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("character_traits")
    .update({
      trait_name: traitName,
      trait_order: traitOrder,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/protected/admin/evaluation");
  return { success: true };
}

export async function deleteTrait(id: string) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");

  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("character_traits")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/protected/admin/evaluation");
  return { success: true };
}
