import { CsvImporter } from "@/components/csv-importer";
import { createClient } from "@/lib/supabase/server";

export default async function ImportPage() {
  const supabase = await createClient();

  const { data: activeCohort } = await supabase
    .from("cohorts")
    .select("id, term, year")
    .eq("is_active", true)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Candidates</h1>
        <p className="text-muted-foreground mt-1">
          Upload a CSV export from your Google Sheets application form.
        </p>
      </div>

      {!activeCohort ? (
        <div className="rounded-lg border border-dashed border-destructive/50 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-medium text-destructive">
            No active cohort found
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Create and activate a cohort in Settings before importing.
          </p>
        </div>
      ) : (
        <CsvImporter
          cohortId={activeCohort.id}
          cohortLabel={`${activeCohort.term} ${activeCohort.year}`}
        />
      )}
    </div>
  );
}
