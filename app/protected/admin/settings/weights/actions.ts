"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { revalidatePath } from "next/cache";


export async function saveWeightsAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return { error: "Unauthorized" };
  }

  const cohort_id = formData.get("cohort_id") as string;
  const application_weight = parseFloat(formData.get("application_weight") as string);
  const interview_weight = parseFloat(formData.get("interview_weight") as string);
  const character_weight = parseFloat(formData.get("character_weight") as string);
  const outlier_std_devs = parseFloat(formData.get("outlier_std_devs") as string);
  const top_n_display = parseInt(formData.get("top_n_display") as string, 10);

  if (!cohort_id) return { error: "Missing cohort ID" };
  
  // Validation: sum must be exactly 1.00 when rounded to 2 decimal places
  const sum = application_weight + interview_weight + character_weight;
  if (Math.abs(sum - 1.0) > 0.001) {
    return { error: "Weights must sum to exactly 1.00 (100%). Currently sums to " + sum.toFixed(2) };
  }

  const supabase = await createAdminClient();

  const { error } = await supabase.from("cohort_settings").upsert({
    cohort_id,
    application_weight,
    interview_weight,
    character_weight,
    outlier_std_devs,
    top_n_display,
    updated_at: new Date().toISOString()
  }, {
    onConflict: 'cohort_id'
  });

  if (error) {
    console.error("Error saving weights:", error);
    return { error: error.message };
  }

  revalidatePath("/protected/admin/settings");
  revalidatePath("/protected/admin/settings/weights");
  revalidatePath("/protected/admin/results");
  return { success: true };
}
