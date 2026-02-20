import { redirect } from "next/navigation";

export default function AdminSettingsPage() {
  redirect("/protected/admin/settings/cohorts");
}
