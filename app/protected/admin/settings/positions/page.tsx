import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/authUtils";
import { redirect } from "next/navigation";
import { PositionManager } from "./position-manager";

export const metadata = {
  title: "Admin Settings | Board Positions",
};

export default async function PositionsSettingsPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect("/protected");

  const supabase = await createAdminClient();

  const { data: positions } = await supabase
    .from("board_positions")
    .select("id, name, is_admin, is_active")
    .order("name");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Board Positions</h1>
        <p className="text-muted-foreground mt-1">
          Manage the positions available for board member assignments. Toggling a position off hides it from assignment dropdowns but preserves historical records.
        </p>
      </div>

      <PositionManager initialPositions={positions || []} />
    </div>
  );
}
