import { getCurrentUser } from "@/lib/authUtils";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user.fullName ?? "Board Member"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {user.position
            ? `${user.position} · TASA Executive Board`
            : "TASA Executive Board"}
        </p>
      </div>

      {/* Quick status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">
            Your Voting Progress
          </p>
          <p className="text-2xl font-bold mt-1">—</p>
          <p className="text-xs text-muted-foreground mt-1">
            Voting not yet open
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">
            Candidates
          </p>
          <p className="text-2xl font-bold mt-1">—</p>
          <p className="text-xs text-muted-foreground mt-1">
            No candidates imported yet
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">
            Active Cohort
          </p>
          <p className="text-2xl font-bold mt-1">—</p>
          <p className="text-xs text-muted-foreground mt-1">
            No active cohort set
          </p>
        </div>
      </div>

      {/* Placeholder for future content */}
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        <p className="text-sm">
          More features coming soon — voting, candidate management, and results
          will appear here.
        </p>
      </div>
    </div>
  );
}
