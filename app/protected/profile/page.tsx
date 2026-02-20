import { getCurrentUser } from "@/lib/authUtils";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileGrid } from "@/components/profile-grid";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const supabase = await createClient();

  // Fetch existing profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, grad_year")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="max-w-5xl space-y-6 flex-1">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account profile and visual appearance.
        </p>
      </div>
      
      <ProfileGrid 
        userId={user.id}
        initialData={{
          firstName: profile?.first_name ?? "",
          lastName: profile?.last_name ?? "",
          gradYear: profile?.grad_year ?? null,
        }}
      />
    </div>
  );
}
