import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getActiveCohort } from "@/lib/authUtils";
import { redirect } from "next/navigation";
import { Progress } from "@/components/ui/progress";

export const metadata = {
  title: "Admin | Voting Oversight",
};

export default async function AdminOversightPage() {
  const [user, activeCohort] = await Promise.all([
    getCurrentUser(),
    getActiveCohort(),
  ]);
  if (!user?.isAdmin) redirect("/protected");

  if (!activeCohort) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
        No active cohort. Please activate one in Settings.
      </div>
    );
  }

  const supabase = await createClient();

  // Fetch candidate count, board members, and ratings in parallel
  const [{ count: candidateCount }, { data: boardMembers }, { data: ratings }] = await Promise.all([
    supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })
      .eq("cohort_id", activeCohort.id)
      .eq("is_active", true),
    supabase
      .from("board_memberships")
      .select(`
        user_id,
        is_available,
        board_positions ( name )
      `)
      .eq("cohort_id", activeCohort.id)
      .eq("is_available", true),
    supabase
      .from("ratings")
      .select("voter_id, rating_type, candidate_id")
      .eq("cohort_id", activeCohort.id),
  ]);

  const totalCandidates = candidateCount || 0;
  const userIds = boardMembers?.map((m) => m.user_id) || [];

  // Fetch profiles for names
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name")
    .in("user_id", userIds);

  const progressData = boardMembers?.map((member) => {
    const profile = profiles?.find((p) => p.user_id === member.user_id);
    const name = profile ? `${profile.first_name} ${profile.last_name}` : "Unknown User";
    const position = (member.board_positions as { name?: string })?.name || "Member";

    const userRatings = ratings?.filter((r) => r.voter_id === member.user_id) || [];
    
    // Count distinct candidates rated per type
    const appCount = new Set(userRatings.filter((r) => r.rating_type === "application").map(r => r.candidate_id)).size;
    const intCount = new Set(userRatings.filter((r) => r.rating_type === "interview").map(r => r.candidate_id)).size;
    const charCount = new Set(userRatings.filter((r) => r.rating_type === "character").map(r => r.candidate_id)).size;

    return {
      userId: member.user_id,
      name,
      position,
      appCount,
      intCount,
      charCount,
      appPercent: totalCandidates > 0 ? (appCount / totalCandidates) * 100 : 0,
      intPercent: totalCandidates > 0 ? (intCount / totalCandidates) * 100 : 0,
      charPercent: totalCandidates > 0 ? (charCount / totalCandidates) * 100 : 0,
    };
  }) || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Voting Oversight</h1>
        <p className="text-muted-foreground mt-1">
          Monitor board member progress for {activeCohort.term} {activeCohort.year}. Total Candidates: {totalCandidates}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {progressData.map((data) => (
          <div key={data.userId} className="border border-border rounded-lg bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-lg">{data.name}</h3>
            <p className="text-sm text-muted-foreground mb-6">{data.position}</p>
            
            <div className="space-y-5">
              {/* App Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Applications</span>
                  <span className="text-muted-foreground">{data.appCount} / {totalCandidates}</span>
                </div>
                <Progress value={data.appPercent} className="h-2" />
              </div>

              {/* Int Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Interviews</span>
                  <span className="text-muted-foreground">{data.intCount} / {totalCandidates}</span>
                </div>
                <Progress value={data.intPercent} className="h-2" />
              </div>

              {/* Char Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Character</span>
                  <span className="text-muted-foreground">{data.charCount} / {totalCandidates}</span>
                </div>
                <Progress value={data.charPercent} className="h-2" />
              </div>
            </div>
          </div>
        ))}
        {progressData.length === 0 && (
          <div className="col-span-full border border-dashed rounded-lg p-12 text-center text-muted-foreground">
            No board members added to this active cohort yet.
          </div>
        )}
      </div>
    </div>
  );
}
