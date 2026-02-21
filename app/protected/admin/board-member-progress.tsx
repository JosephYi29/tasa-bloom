import { createAdminClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export async function BoardMemberProgress({ cohortId, candidateCount }: { cohortId: string; candidateCount: number }) {
  const supabase = await createAdminClient();

  // 1. Fetch Board Members for this cohort
  const { data: boardMembers } = await supabase
    .from("board_memberships")
    .select(`
      user_id,
      users:user_id (email, first_name, last_name)
    `)
    .eq("cohort_id", cohortId);

  if (!boardMembers || boardMembers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground bg-card mt-6">
        No board members assigned to this cohort.
      </div>
    );
  }

  // 2. Fetch all ratings for this cohort to calculate progress
  const { data: allRatings } = await supabase
    .from("ratings")
    .select("voter_id, rating_type")
    .eq("cohort_id", cohortId);

  // 3. Process data
  const progressMap = boardMembers.map((bm) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = bm.users as any; // Handle join type
    const voterId = bm.user_id;
    
    const userRatings = allRatings?.filter(r => r.voter_id === voterId) || [];
    
    const countApp = userRatings.filter(r => r.rating_type === "application").length;
    const countInt = userRatings.filter(r => r.rating_type === "interview").length;
    const countChar = userRatings.filter(r => r.rating_type === "character").length;

    return {
      name: user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email : "Unknown User",
      email: user?.email,
      app: countApp,
      int: countInt,
      char: countChar,
    };
  });

  const getStatusBadge = (count: number, total: number) => {
    if (total === 0) return <Badge variant="outline" className="text-muted-foreground w-16 justify-center">0 / 0</Badge>;
    if (count === 0) return <Badge variant="destructive" className="w-16 justify-center">0 / {total}</Badge>;
    if (count >= total) return <Badge className="bg-green-500 hover:bg-green-600 w-16 justify-center">{count} / {total}</Badge>;
    return <Badge variant="secondary" className="w-16 justify-center bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-500">{count} / {total}</Badge>;
  };

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Board Member Voting Progress</h2>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Board Member</TableHead>
              <TableHead className="text-center w-32">App Phase</TableHead>
              <TableHead className="text-center w-32">Interview Phase</TableHead>
              <TableHead className="text-center w-32">Character Phase</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {progressMap.map((pm, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <div className="font-medium">{pm.name}</div>
                  <div className="text-xs text-muted-foreground">{pm.email}</div>
                </TableCell>
                <TableCell className="text-center">{getStatusBadge(pm.app, candidateCount)}</TableCell>
                <TableCell className="text-center">{getStatusBadge(pm.int, candidateCount)}</TableCell>
                <TableCell className="text-center">{getStatusBadge(pm.char, candidateCount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
