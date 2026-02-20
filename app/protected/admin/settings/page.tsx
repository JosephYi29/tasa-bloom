export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage cohorts, character traits, and scoring weights.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        <p className="text-sm">
          Settings management (cohorts, traits, weights) will be available in Phase 4.
        </p>
      </div>
    </div>
  );
}
