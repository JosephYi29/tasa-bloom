import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, VideoOff } from "lucide-react";
import { ApplicationScoringForm } from "../application/scoring-form";

export default async function CandidateInterviewPage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();

  // 1. Get Candidate & Interview Link
  const { data: candidate } = await supabase
    .from("candidates")
    .select(`
      id, 
      candidate_number, 
      first_name, 
      last_name, 
      cohort_id,
      interview_links (video_url)
    `)
    .eq("id", candidateId)
    .single();

  if (!candidate) notFound();

  const videoUrl = Array.isArray(candidate.interview_links) 
    ? candidate.interview_links[0]?.video_url 
    : (candidate.interview_links as { video_url?: string })?.video_url;

  // 2. Get Interview Questions
  const { data: questions } = await supabase
    .from("application_questions")
    .select("id, question_text")
    .eq("cohort_id", candidate.cohort_id)
    .eq("category", "interview")
    .order("question_order", { ascending: true });

  const mappedQuestions = (questions ?? []).map((q) => ({
    id: q.id,
    text: q.question_text,
  }));

  // 3. Get Existing Scores for current user
  const { data: rating } = await supabase
    .from("ratings")
    .select("id")
    .eq("candidate_id", candidateId)
    .eq("voter_id", user.id)
    .eq("rating_type", "interview")
    .single();

  let existingScores: Record<string, number> = {};
  if (rating) {
    const { data: scores } = await supabase
      .from("rating_scores")
      .select("question_id, score")
      .eq("rating_id", rating.id)
      .not("question_id", "is", null);
      
    existingScores = (scores ?? []).reduce((acc, s) => {
      if (s.question_id) acc[s.question_id] = s.score;
      return acc;
    }, {} as Record<string, number>);
  }

  // Handle Google Drive embed conversion
  // Transforms docs.google.com/file/d/.../view to .../preview
  let embedUrl = videoUrl;
  if (videoUrl && videoUrl.includes("drive.google.com/file/d/")) {
    embedUrl = videoUrl.replace(/\/view.*$/, "/preview");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/protected/vote">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Rate Interview
          </h1>
          <p className="text-muted-foreground mt-1">
            Candidate #{candidate.candidate_number}: {candidate.first_name} {candidate.last_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8 items-start">
        {/* Left Column: Video Embed */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm aspect-video flex flex-col items-center justify-center bg-muted/30">
            {embedUrl ? (
              <iframe 
                src={embedUrl}
                className="w-full h-full border-0"
                allow="autoplay"
                allowFullScreen
              />
            ) : (
              <div className="text-center text-muted-foreground p-8 flex flex-col items-center">
                <VideoOff size={48} className="mb-4 opacity-50" />
                <p>No interview recording linked.</p>
                <p className="text-sm mt-1">An admin needs to add the Google Drive link.</p>
              </div>
            )}
          </div>
          
          {videoUrl && (
            <div className="flex justify-end">
              <Button asChild variant="ghost" size="sm">
                <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                  Open in Google Drive <ExternalLink size={14} className="ml-2" />
                </a>
              </Button>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Scoring Form */}
        <div className="sticky top-20">
          {mappedQuestions.length > 0 ? (
            <ApplicationScoringForm 
              candidateId={candidateId}
              cohortId={candidate.cohort_id}
              questions={mappedQuestions}
              initialScores={existingScores}
            />
          ) : (
            <div className="border border-border border-dashed rounded-lg bg-card p-5 text-center text-muted-foreground text-sm">
              <p>No interview questions configured for this cohort.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
