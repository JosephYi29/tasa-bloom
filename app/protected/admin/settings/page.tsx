import Link from "next/link";
import { BarChart3 } from "lucide-react";

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
        <Link href="/protected/admin/settings/weights" className="block group">
          <div className="border border-border p-6 rounded-lg hover:border-primary/50 transition-colors bg-card h-full flex flex-col">
            <h3 className="text-lg font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
              <BarChart3 className="w-5 h-5" />
              Scoring Weights
            </h3>
            <p className="text-sm text-muted-foreground mt-2 flex-1">
              Configure the weights for application, interview, and character scores, as well as outlier removal settings.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
