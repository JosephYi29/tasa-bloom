import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

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
    candidate_number: number;
    first_name: string;
    last_name: string;
    email: string | null;
    year: string | null;
  }[] = [];

  if (activeCohort) {
    const { data } = await supabase
      .from("candidates")
      .select("id, candidate_number, first_name, last_name, email, year")
      .eq("cohort_id", activeCohort.id)
      .order("candidate_number", { ascending: true });
    candidates = data ?? [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Candidates</h1>
          <p className="text-muted-foreground mt-1">
            {activeCohort
              ? `${activeCohort.term} ${activeCohort.year} · ${candidates.length} candidates`
              : "No active cohort"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/protected/admin/import">
              <Upload size={16} className="mr-2" />
              Import CSV
            </Link>
          </Button>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">No candidates yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Import candidates from a Google Sheets CSV export.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/protected/admin/import">
              <Upload size={16} className="mr-2" />
              Import from CSV
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  #
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Email
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Year
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {c.candidate_number}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {c.first_name} {c.last_name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.year ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/protected/admin/candidates/${c.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View
                      </Link>
                      <button className="text-sm text-destructive hover:underline opacity-50 cursor-not-allowed" title="Delete functionality not yet implemented">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
