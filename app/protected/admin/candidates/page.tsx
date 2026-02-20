import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { redirect } from "next/navigation";
import { CandidatesClient } from "./client-page";

export const metadata = {
  title: "Admin | Candidates",
};

export default async function CandidatesPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect("/protected");

  const supabase = await createAdminClient();

  const { data: activeCohort } = await supabase
    .from("cohorts")
    .select("id, term, year")
    .eq("is_active", true)
    .single();

  let candidates: {
    id: string;
    candidate_number: number | null;
    first_name: string;
    last_name: string;
    email: string | null;
    year: string | null;
    custom_order: number | null;
  }[] = [];

  if (activeCohort) {
    const { data } = await supabase
      .from("candidates")
      .select("id, candidate_number, first_name, last_name, email, year, custom_order")
      .eq("cohort_id", activeCohort.id)
      .order("custom_order", { ascending: true }) // First sort by custom_order
      .order("candidate_number", { ascending: true }); // Fallback to candidate_number
      
    candidates = data ?? [];
  }

  return (
    <div className="max-w-6xl mx-auto">
      <CandidatesClient 
        initialCandidates={candidates} 
        activeCohort={activeCohort} 
      />
    </div>
  );
}
