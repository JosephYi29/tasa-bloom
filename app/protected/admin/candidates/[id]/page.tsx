import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Admin | Candidate Detail",
};

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect("/protected");

  const { id } = await params;
  const supabase = await createAdminClient();

  // Fetch candidate
  const { data: candidate, error } = await supabase
    .from("candidates")
    .select("*, cohort:cohorts(term, year)")
    .eq("id", id)
    .single();

  if (error || !candidate) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="border border-dashed rounded-lg p-12 text-center text-muted-foreground">
          Candidate not found.
        </div>
      </div>
    );
  }

  // Fetch application questions & responses
  const { data: responses } = await supabase
    .from("application_responses")
    .select("*, question:application_questions(question_text, question_order, category)")
    .eq("candidate_id", id)
    .order("question_id");

  // Fetch interview links
  const { data: interviewLinks } = await supabase
    .from("interview_links")
    .select("*")
    .eq("candidate_id", id);

  const cohort = candidate.cohort as { term?: string; year?: number } | null;
  const videoUrl = interviewLinks?.[0]?.video_url || null;

  // Separate application vs interview questions
  const applicationResponses = responses?.filter(
    (r) => (r.question as { category?: string })?.category === "application"
  ) || [];
  const interviewResponses = responses?.filter(
    (r) => (r.question as { category?: string })?.category === "interview"
  ) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/protected/admin/candidates">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {candidate.first_name} {candidate.last_name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Candidate #{candidate.candidate_number} · {cohort?.term} {cohort?.year}
            {!candidate.is_active && (
              <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-medium">
                (Inactive)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="border rounded-lg bg-card p-6 space-y-3">
        <h2 className="font-semibold text-lg">Basic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Email:</span>{" "}
            <span className="font-medium">{candidate.email || "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Year:</span>{" "}
            <span className="font-medium">{candidate.year || "—"}</span>
          </div>
        </div>
      </div>

      {/* Application Responses */}
      {applicationResponses.length > 0 && (
        <div className="border rounded-lg bg-card overflow-hidden">
          <div className="p-4 border-b bg-muted/30">
            <h2 className="font-semibold">Application Responses</h2>
          </div>
          <div className="divide-y">
            {applicationResponses
              .sort((a, b) => ((a.question as { question_order?: number })?.question_order ?? 0) - ((b.question as { question_order?: number })?.question_order ?? 0))
              .map((r) => (
                <div key={r.id} className="p-4 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {(r.question as { question_text?: string })?.question_text || "Unknown Question"}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{r.response_text || "—"}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Interview Responses */}
      {interviewResponses.length > 0 && (
        <div className="border rounded-lg bg-card overflow-hidden">
          <div className="p-4 border-b bg-muted/30">
            <h2 className="font-semibold">Interview Responses</h2>
          </div>
          <div className="divide-y">
            {interviewResponses
              .sort((a, b) => ((a.question as { question_order?: number })?.question_order ?? 0) - ((b.question as { question_order?: number })?.question_order ?? 0))
              .map((r) => (
                <div key={r.id} className="p-4 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {(r.question as { question_text?: string })?.question_text || "Unknown Question"}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{r.response_text || "—"}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Interview Video */}
      {videoUrl && (
        <div className="border rounded-lg bg-card p-6 space-y-3">
          <h2 className="font-semibold text-lg">Interview Video</h2>
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm break-all"
          >
            {videoUrl}
          </a>
        </div>
      )}

      {applicationResponses.length === 0 && interviewResponses.length === 0 && !videoUrl && (
        <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
          No application data, responses, or interview links found for this candidate.
        </div>
      )}
    </div>
  );
}
