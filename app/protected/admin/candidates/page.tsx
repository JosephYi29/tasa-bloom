import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser, getActiveCohort } from "@/lib/authUtils";
import { redirect } from "next/navigation";
import { CandidatesClient } from "./client-page";

export const metadata = {
  title: "Admin | Candidates",
};

export default async function CandidatesPage() {
  const [user, activeCohort] = await Promise.all([
    getCurrentUser(),
    getActiveCohort(),
  ]);
  if (!user?.isAdmin) redirect("/protected");

  let candidates: {
    id: string;
    candidate_number: number | null;
    first_name: string;
    last_name: string;
    email: string | null;
    year: string | null;
    custom_order: number | null;
    is_active: boolean;
  }[] = [];

  if (activeCohort) {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from("candidates")
      .select("id, candidate_number, first_name, last_name, email, year, custom_order, is_active")
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
