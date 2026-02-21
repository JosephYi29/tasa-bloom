import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, Upload, Settings } from "lucide-react";
import { BoardMemberProgress } from "./board-member-progress";

export default async function AdminOverviewPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect("/protected");

  const supabase = await createAdminClient();

  // Get active cohort
  const { data: activeCohort } = await supabase
    .from("cohorts")
    .select("id, term, year")
    .eq("is_active", true)
    .single();

  // Get candidate count for active cohort
  let candidateCount = 0;
  if (activeCohort) {
    const { count } = await supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })
      .eq("cohort_id", activeCohort.id);
    candidateCount = count ?? 0;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {activeCohort
            ? `Active Cohort: ${activeCohort.term} ${activeCohort.year}`
            : "No active cohort set"}
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/protected/admin/candidates" className="group">
          <div className="rounded-lg border border-border bg-card p-5 transition-colors group-hover:border-primary/50">
            <div className="flex items-center gap-3 mb-3">
              <Users size={20} className="text-muted-foreground" />
              <p className="text-sm font-medium">Candidates</p>
            </div>
            <p className="text-2xl font-bold">{candidateCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {candidateCount === 0
                ? "Import candidates to get started"
                : `candidates in this cohort`}
            </p>
          </div>
        </Link>

        <Link href="/protected/admin/import" className="group">
          <div className="rounded-lg border border-border bg-card p-5 transition-colors group-hover:border-primary/50">
            <div className="flex items-center gap-3 mb-3">
              <Upload size={20} className="text-muted-foreground" />
              <p className="text-sm font-medium">Import Data</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Upload CSV from Google Sheets export
            </p>
          </div>
        </Link>

        <Link href="/protected/admin/settings" className="group">
          <div className="rounded-lg border border-border bg-card p-5 transition-colors group-hover:border-primary/50">
            <div className="flex items-center gap-3 mb-3">
              <Settings size={20} className="text-muted-foreground" />
              <p className="text-sm font-medium">Settings</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Manage cohorts, traits, and weights
            </p>
          </div>
        </Link>
      </div>

      {activeCohort && (
        <BoardMemberProgress cohortId={activeCohort.id} candidateCount={candidateCount} />
      )}

      {!activeCohort && (
        <div className="rounded-lg border border-dashed border-destructive/50 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-medium text-destructive">
            No active cohort found
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Create and activate a cohort in Settings before importing candidates.
          </p>
          <Button asChild size="sm" className="mt-3">
            <Link href="/protected/admin/settings">Go to Settings</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
