import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { redirect } from "next/navigation";
import { CohortList } from "./cohort-list";
import { CreateCohortDialog } from "./create-cohort-dialog";

export const metadata = {
  title: "Admin Settings | Cohorts",
};

export default async function AdminCohortsPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect("/protected");

  const isSuperAdmin = user.email === process.env.SUPER_ADMIN_EMAIL;

  const supabase = await createAdminClient();

  const { data: rawCohorts, error } = await supabase
    .from("cohorts")
    .select("*, candidates(count)");

  if (error) {
    console.error("Failed to fetch cohorts:", error);
  }

  // Sort by school year: Fall Y comes before Spring Y+1
  // Academic sort key: Fall Y → (Y, 0), Spring Y → (Y-1, 1)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cohorts = (rawCohorts || []).map((c: any) => ({
    ...c,
    candidate_count: c.candidates?.[0]?.count ?? 0,
  })).sort((a: { term: string; year: number }, b: { term: string; year: number }) => {
    const aYear = a.term === "Spring" ? a.year - 1 : a.year;
    const bYear = b.term === "Spring" ? b.year - 1 : b.year;
    if (aYear !== bYear) return bYear - aYear; // descending by academic year
    const aSem = a.term === "Fall" ? 0 : 1;
    const bSem = b.term === "Fall" ? 0 : 1;
    return bSem - aSem; // within same academic year: Spring (1) before Fall (0) in descending
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Cohorts</h2>
          <p className="text-sm text-muted-foreground">
            Activate a cohort to make it the active cycle for the entire platform. Lock/unlock voting phases here.
          </p>
        </div>
        <CreateCohortDialog />
      </div>

      <CohortList initialCohorts={cohorts || []} isSuperAdmin={isSuperAdmin} />
    </div>
  );
}
