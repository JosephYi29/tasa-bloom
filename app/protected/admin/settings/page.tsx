import Link from "next/link";
import { BarChart3, Briefcase } from "lucide-react";

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

        {/* Character Traits Setting */}
        <Link href="/protected/admin/settings/traits" className="block group">
          <div className="border border-border p-6 rounded-lg hover:border-primary/50 transition-colors bg-card h-full flex flex-col">
            <h3 className="text-lg font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 lucide lucide-users-round text-foreground group-hover:text-primary transition-colors"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/></svg>
              Character Traits
            </h3>
            <p className="text-sm text-muted-foreground mt-2 flex-1">
              Add, edit, or remove the exact traits that Board Members will evaluate candidates on.
            </p>
          </div>
        </Link>

        {/* Application Questions Setting */}
        <Link href="/protected/admin/settings/questions" className="block group">
          <div className="border border-border p-6 rounded-lg hover:border-primary/50 transition-colors bg-card h-full flex flex-col">
            <h3 className="text-lg font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 lucide lucide-file-question text-foreground group-hover:text-primary transition-colors"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><circle cx="12" cy="17" r="1"/><path d="M12 14v-2c1.5 0 2.5-1 2.5-2.5S13.5 7 12 7s-2.5 1-2.5 2.5"/></svg>
              Application Questions
            </h3>
            <p className="text-sm text-muted-foreground mt-2 flex-1">
              Configure the questions shown to Board Members during Application and Interview rating phases.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
