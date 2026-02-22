import { CsvImporter } from "@/components/csv-importer";
import { LegacyCsvImporter } from "@/components/legacy-csv-importer";
import { createClient } from "@/lib/supabase/server";

export default async function ImportPage() {
  const supabase = await createClient();

  const { data: activeCohort } = await supabase
    .from("cohorts")
    .select("id, term, year")
    .eq("is_active", true)
    .single();

  // Fetch existing questions and traits for the active cohort (for legacy import mapping)
  let existingQuestions: { id: string; text: string; category: string }[] = [];
  let existingTraits: { id: string; text: string }[] = [];

  if (activeCohort) {
    const [{ data: questions }, { data: traits }] = await Promise.all([
      supabase
        .from("application_questions")
        .select("id, question_text, category")
        .eq("cohort_id", activeCohort.id)
        .eq("is_scorable", true)
        .order("question_order", { ascending: true }),
      supabase
        .from("character_traits")
        .select("id, trait_name")
        .eq("cohort_id", activeCohort.id)
        .order("trait_order", { ascending: true }),
    ]);

    existingQuestions = (questions ?? []).map(q => ({ id: q.id, text: q.question_text, category: q.category }));
    existingTraits = (traits ?? []).map(t => ({ id: t.id, text: t.trait_name }));
  }

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
        <div className="space-y-12">
          <section>
            <CsvImporter
              cohortId={activeCohort.id}
              cohortLabel={`${activeCohort.term} ${activeCohort.year}`}
            />
          </section>
          
          <section className="border-t pt-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight">Historical Voting Data</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Upload historical cohort voting scores where board members do not have a registered profile.
              </p>
            </div>
            <LegacyCsvImporter
              cohortId={activeCohort.id}
              cohortLabel={`${activeCohort.term} ${activeCohort.year}`}
              existingQuestions={existingQuestions}
              existingTraits={existingTraits}
            />
          </section>
        </div>
      )}
    </div>
  );
}
