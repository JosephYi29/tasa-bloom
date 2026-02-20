"use client";

import { ProfileForm } from "./profile-form";
import { AppearanceForm } from "./appearance-form";

interface ProfileGridProps {
  userId: string;
  initialData: {
    firstName: string;
    lastName: string;
    gradYear: number | null;
  };
}

export function ProfileGrid({ userId, initialData }: ProfileGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      {/* Settings Column */}
      <div className="space-y-6">
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Personal Details</h2>
          <ProfileForm userId={userId} initialData={initialData} />
        </div>
      </div>

      {/* Appearance Column */}
      <div className="space-y-6">
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Appearance</h2>
          <AppearanceForm />
        </div>
      </div>
    </div>
  );
}
