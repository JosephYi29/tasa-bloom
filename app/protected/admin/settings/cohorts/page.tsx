import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();

  const { data: cohorts, error } = await supabase
    .from("cohorts")
    .select("*")
    .order("year", { ascending: false })
    .order("term", { ascending: false });

  if (error) {
    console.error("Failed to fetch cohorts:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Cohorts</h2>
          <p className="text-sm text-muted-foreground">
            Activate a cohort to make it the active cycle for the entire platform. Lock/unlock voting phases here.
          </p>
        </div>
        <CreateCohortDialog />
      </div>

      <CohortList initialCohorts={cohorts || []} />
    </div>
  );
}
