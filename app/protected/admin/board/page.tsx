import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { redirect } from "next/navigation";
import { BoardList } from "./board-list";

export const metadata = {
  title: "Admin Settings | Board Members",
};

export default async function AdminBoardPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect("/protected");

  const supabase = await createClient();

  // Get active cohort
  const { data: activeCohort } = await supabase
    .from("cohorts")
    .select("*")
    .eq("is_active", true)
    .single();

  if (!activeCohort) {
    return (
      <div className="text-center p-12 border border-dashed rounded-lg text-muted-foreground mt-6">
        No active cohort found. Please activate a cohort in the Cohorts tab first.
      </div>
    );
  }

  // Get all members for this cohort
  const { data: memberships } = await supabase
    .from("board_memberships")
    .select(`
      user_id,
      position_id,
      board_positions ( id, name, is_admin )
    `)
    .eq("cohort_id", activeCohort.id);

  // We have the user_ids, but need their profile info 
  // (First Name, Last Name). Since we can't join auth.users easily without a view,
  // we join our public.profiles table.
  const userIds = memberships?.map((m) => m.user_id) || [];
  
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name")
    .in("user_id", userIds);

  const mappedMemberships = memberships?.map((m) => {
    const profile = profiles?.find((p) => p.user_id === m.user_id);
    return {
      userId: m.user_id,
      name: profile ? `${profile.first_name} ${profile.last_name}` : "Unknown User",
      positionId: m.position_id,
      positionName: (m.board_positions as { name?: string })?.name || "Unknown",
      isAdmin: (m.board_positions as { is_admin?: boolean })?.is_admin || false,
    };
  }) || [];

  // Get all available positions for the dropdown
  const { data: positions } = await supabase
    .from("board_positions")
    .select("*")
    .order("name");

  // Get all registered profiles that ARE NOT in this cohort yet for the invite dropdown
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, user_id");
    
  // Filter out users already on the board
  const availableProfiles = allProfiles
    ?.filter(p => !userIds.includes(p.user_id))
    .map(p => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name}`
    })) || [];


  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Board Members</h2>
          <p className="text-sm text-muted-foreground">
            Manage who has access to the active voting cycle ({activeCohort.term} {activeCohort.year}).
          </p>
        </div>
      </div>

      <BoardList 
        members={mappedMemberships} 
        positions={positions || []}
        availableProfiles={availableProfiles}
      />
    </div>
  );
}
