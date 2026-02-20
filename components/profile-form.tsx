"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileFormProps {
  userId: string;
  initialData: {
    firstName: string;
    lastName: string;
    gradYear: number | null;
  };
}

export function ProfileForm({ userId, initialData }: ProfileFormProps) {
  const [firstName, setFirstName] = useState(initialData.firstName);
  const [lastName, setLastName] = useState(initialData.lastName);
  const [gradYear, setGradYear] = useState(
    initialData.gradYear?.toString() ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const supabase = createClient();

    const { error } = await supabase.from("profiles").upsert(
      {
        user_id: userId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        grad_year: gradYear ? parseInt(gradYear, 10) : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    setSaving(false);

    if (error) {
      setMessage({ type: "error", text: "Failed to save profile. Try again." });
    } else {
      setMessage({ type: "success", text: "Profile saved!" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="gradYear">Graduation Year</Label>
        <Input
          id="gradYear"
          type="number"
          value={gradYear}
          onChange={(e) => setGradYear(e.target.value)}
          placeholder="e.g. 2027"
          min={2020}
          max={2035}
        />
      </div>

      {message && (
        <p
          className={
            message.type === "success"
              ? "text-sm text-green-600 dark:text-green-400"
              : "text-sm text-destructive"
          }
        >
          {message.text}
        </p>
      )}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save Profile"}
      </Button>
    </form>
  );
}
