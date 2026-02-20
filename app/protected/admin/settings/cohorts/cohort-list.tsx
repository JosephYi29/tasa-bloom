"use client";

import { useState, useEffect } from "react";
import { updateCohort, deleteCohort } from "@/app/actions/cohorts";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Cohort {
  id: string;
  term: string;
  year: number;
  is_active: boolean;
  app_voting_open: boolean;
  int_voting_open: boolean;
  char_voting_open: boolean;
  candidate_count: number;
}

export function CohortList({ initialCohorts, isSuperAdmin = false }: { initialCohorts: Cohort[], isSuperAdmin?: boolean }) {
  const [cohorts, setCohorts] = useState<Cohort[]>(initialCohorts);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setCohorts(initialCohorts);
  }, [initialCohorts]);

  const toggleTarget = async (id: string, field: keyof Cohort, currentVal: boolean) => {
    setLoading(`${id}-${field}`);
    try {
      await updateCohort(id, field, !currentVal);

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
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-muted-foreground">
                  ID: {cohort.id.split('-')[0]}...
                </p>
                <span className="text-sm text-muted-foreground">•</span>
                <p className="text-sm font-medium text-foreground">
                  {cohort.candidate_count} candidates
                </p>
                {isSuperAdmin && (
                  <DeleteCohortDialog cohort={cohort} />
                )}
              </div>
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

function DeleteCohortDialog({ cohort }: { cohort: Cohort }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText !== "confirm") return;
    setLoading(true);
    try {
      await deleteCohort(cohort.id);
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      alert(`Error deleting cohort: ${err.message}`);
    } finally {
      setLoading(false);
      setConfirmText("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setConfirmText(""); setOpen(o); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete Cohort">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Cohort: {cohort.term} {cohort.year}?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the cohort and all associated data, including 
            application questions, candidates, character traits, and all submitted board ratings securely.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleDelete} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor={`confirm-${cohort.id}`}>
              Type <strong className="font-mono text-foreground">confirm</strong> to verify.
            </Label>
            <Input 
              id={`confirm-${cohort.id}`}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="confirm"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="destructive" disabled={confirmText !== "confirm" || loading}>
              {loading ? "Deleting..." : "Delete Cohort"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
