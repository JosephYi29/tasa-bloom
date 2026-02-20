export default function AdminSettingsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure application-wide settings.
        </p>
      </div>
      
      <div className="border border-dashed border-border p-12 text-center rounded-lg text-muted-foreground w-full">
        <p>No global settings available yet.</p>
        <p className="text-sm mt-2">More functionalities will be added here in the future.</p>
      </div>
    </div>
  );
}
