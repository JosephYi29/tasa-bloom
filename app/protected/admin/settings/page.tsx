import Link from "next/link";
import { Briefcase } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure application-wide settings.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Board Positions Setting */}
        <Link href="/protected/admin/settings/positions" className="block group">
          <div className="border border-border p-6 rounded-lg hover:border-primary/50 transition-colors bg-card h-full flex flex-col">
            <h3 className="text-lg font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
              <Briefcase className="w-5 h-5" />
              Board Positions
            </h3>
            <p className="text-sm text-muted-foreground mt-2 flex-1">
              Add new board positions or toggle existing ones active/inactive. Inactive positions are hidden from assignment but preserved for audit.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
