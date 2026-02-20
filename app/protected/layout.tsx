import { getCurrentUser } from "@/lib/authUtils";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        isAdmin={user.isAdmin}
        userName={user.fullName}
        position={user.position}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar user={user} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
