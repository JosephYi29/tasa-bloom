"use server";

import { createClient } from "@/lib/supabase/server";
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
