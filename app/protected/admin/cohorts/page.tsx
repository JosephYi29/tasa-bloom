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
    .select("*, candidates(count)")
    .order("year", { ascending: false })
    .order("term", { ascending: false });

  if (error) {
    console.error("Failed to fetch cohorts:", error);
  }

  const cohorts = (rawCohorts || []).map((c: any) => ({
    ...c,
    candidate_count: c.candidates?.[0]?.count ?? 0,
  }));

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
