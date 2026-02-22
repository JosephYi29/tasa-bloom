"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { revalidatePath } from "next/cache";

export async function createPosition(name: string, isAdmin: boolean = false) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");

  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("board_positions")
    .insert({ name: name.trim(), is_admin: isAdmin, is_active: true });

  if (error) {
    if (error.code === "23505") throw new Error("A position with that name already exists.");
    throw new Error(error.message);
  }

  revalidatePath("/protected/admin/settings/positions");
  return { success: true };
}

export async function togglePosition(id: string, isActive: boolean) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Unauthorized");

  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("board_positions")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/protected/admin/settings/positions");
  revalidatePath("/protected/admin/board");
  return { success: true };
}
