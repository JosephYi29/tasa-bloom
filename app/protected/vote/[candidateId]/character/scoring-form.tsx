"use client";

import { useState } from "react";
import { submitScores } from "@/app/actions/voting";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface CharacterFormProps {
  candidateId: string;
  cohortId: string;
  traits: { id: string; name: string }[];
  initialScores: Record<string, number>;
  isVotingOpen?: boolean;
}

export function CharacterScoringForm({ candidateId, cohortId, traits, initialScores, isVotingOpen = true }: CharacterFormProps) {
  const [scores, setScores] = useState<Record<string, number>>(initialScores);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleScoreChange = (tId: string, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setScores(prev => ({ ...prev, [tId]: Math.min(Math.max(num, 1), 10) }));
    } else if (val === "") {
      const newScores = { ...scores };
      delete newScores[tId];
      setScores(newScores);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !isVotingOpen) return;

    // Validate all have scores
    const missing = traits.filter(t => scores[t.id] === undefined);
    if (missing.length > 0) {
      setResult({ type: "error", msg: `Missing score for ${missing[0].name}` });
      return;
    }

    setSaving(true);
    setResult(null);

    try {
      const scoreArr = Object.entries(scores).map(([id, score]) => ({ id, score }));
      await submitScores(candidateId, cohortId, "character", scoreArr, true);
      setResult({ type: "success", msg: "Character scores saved successfully!" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save scores.";
      setResult({ type: "error", msg });
    } finally {
      setSaving(false);
    }
  };

  if (traits.length === 0) return null;

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-lg bg-card p-6 shadow-sm max-w-xl mx-auto space-y-8">
      <div>
        <h3 className="font-semibold text-lg">Character Evaluations</h3>
        <p className="text-sm text-muted-foreground mt-1">Rate the candidate from 1-10 on the following traits.</p>
      </div>
      
      <div className="space-y-6">
        {traits.map((t) => (
          <div key={t.id} className="space-y-3">
            <Label htmlFor={`score-${t.id}`} className="text-base font-medium">
              {t.name}
            </Label>
            <div className="flex items-center gap-3">
              <input 
                id={`score-${t.id}`}
                type="number"
                min={1}
                max={10}
                step="0.01"
                required
                value={scores[t.id] || ""}
                onChange={(e) => handleScoreChange(t.id, e.target.value)}
                className="flex h-10 w-24 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="1-10"
                disabled={saving || !isVotingOpen}
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">/ 10</span>
            </div>
          </div>
        ))}
      </div>

      {result && (
        <div className={`p-3 rounded-md text-sm ${result.type === "success" ? "bg-green-500/10 text-green-600 dark:text-green-500" : "bg-destructive/10 text-destructive"}`}>
          {result.msg}
        </div>
      )}

      <div>
        <Button type="submit" className="w-full" disabled={saving || !isVotingOpen}>
          {saving ? "Saving..." : "Save Character Scores"}
        </Button>
        {!isVotingOpen && (
          <p className="text-xs text-center text-destructive mt-3">Voting is closed.</p>
        )}
      </div>
    </form>
  );
}
