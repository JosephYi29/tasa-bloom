import { getCurrentUser } from "@/lib/authUtils";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (!user.isAdmin) {
    redirect("/protected");
  }

  return <>{children}</>;
}
