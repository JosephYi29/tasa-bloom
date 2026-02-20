"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

interface Cohort {
  id: string;
  term: string;
  year: number;
  is_active: boolean;
  app_voting_open: boolean;
  int_voting_open: boolean;
  char_voting_open: boolean;
}

export function CohortList({ initialCohorts }: { initialCohorts: Cohort[] }) {
  const [cohorts, setCohorts] = useState<Cohort[]>(initialCohorts);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const toggleTarget = async (id: string, field: keyof Cohort, currentVal: boolean) => {
    setLoading(`${id}-${field}`);
    try {
      const { error } = await supabase
        .from("cohorts")
        .update({ [field]: !currentVal })
        .eq("id", id);

      if (error) throw error;

      // Optimistically update local state.
      // If setting is_active = true, we must set all others to false locally too
      // because the DB trigger handles it on the backend.
      setCohorts((prev) => 
        prev.map((c) => {
          if (c.id === id) {
            return { ...c, [field]: !currentVal };
          }
          // If we just activated this cohort, deactivate all others instantly on client
          if (field === "is_active" && !currentVal === true) {
            return { ...c, is_active: false };
          }
          return c;
        })
      );
      
      router.refresh();
    } catch (err: any) {
      alert(`Failed to update settings: ${err.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid gap-6">
      {cohorts.map((cohort) => (
        <div 
          key={cohort.id} 
          className={`border rounded-lg p-6 bg-card transition-colors ${cohort.is_active ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold">{cohort.term} {cohort.year}</h3>
                {cohort.is_active && (
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    Active Cycle
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                ID: {cohort.id.split('-')[0]}...
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor={`active-${cohort.id}`} className="text-sm font-medium mr-2">
                Set as Active
              </Label>
              <Switch 
                id={`active-${cohort.id}`}
                checked={cohort.is_active}
                disabled={loading === `${cohort.id}-is_active` || cohort.is_active} // Don't let them un-check the active one directly, force checking another
                onCheckedChange={() => toggleTarget(cohort.id, "is_active", cohort.is_active)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-border">
            {/* App Voting */}
            <div className="flex items-center justify-between p-4 rounded-md bg-muted/30 border border-border">
              <div>
                <Label htmlFor={`app-${cohort.id}`} className="text-base font-semibold block mb-1">Applications</Label>
                <span className="text-xs text-muted-foreground">
                  {cohort.app_voting_open ? "Voting is Open" : "Voting is Closed"}
                </span>
              </div>
              <Switch 
                id={`app-${cohort.id}`}
                checked={cohort.app_voting_open}
                disabled={loading === `${cohort.id}-app_voting_open` || !cohort.is_active}
                onCheckedChange={() => toggleTarget(cohort.id, "app_voting_open", cohort.app_voting_open)}
              />
            </div>

            {/* Interview Voting */}
            <div className="flex items-center justify-between p-4 rounded-md bg-muted/30 border border-border">
              <div>
                <Label htmlFor={`int-${cohort.id}`} className="text-base font-semibold block mb-1">Interviews</Label>
                <span className="text-xs text-muted-foreground">
                  {cohort.int_voting_open ? "Voting is Open" : "Voting is Closed"}
                </span>
              </div>
              <Switch 
                id={`int-${cohort.id}`}
                checked={cohort.int_voting_open}
                disabled={loading === `${cohort.id}-int_voting_open` || !cohort.is_active}
                onCheckedChange={() => toggleTarget(cohort.id, "int_voting_open", cohort.int_voting_open)}
              />
            </div>

            {/* Character Voting */}
            <div className="flex items-center justify-between p-4 rounded-md bg-muted/30 border border-border">
              <div>
                <Label htmlFor={`char-${cohort.id}`} className="text-base font-semibold block mb-1">Character Traits</Label>
                <span className="text-xs text-muted-foreground">
                  {cohort.char_voting_open ? "Voting is Open" : "Voting is Closed"}
                </span>
              </div>
              <Switch 
                id={`char-${cohort.id}`}
                checked={cohort.char_voting_open}
                disabled={loading === `${cohort.id}-char_voting_open` || !cohort.is_active}
                onCheckedChange={() => toggleTarget(cohort.id, "char_voting_open", cohort.char_voting_open)}
              />
            </div>
          </div>
        </div>
      ))}
      
      {cohorts.length === 0 && (
        <div className="text-center p-12 border border-dashed rounded-lg text-muted-foreground">
          No cohorts found.
        </div>
      )}
    </div>
  );
}
