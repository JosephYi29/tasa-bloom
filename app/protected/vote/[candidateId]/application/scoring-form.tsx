"use client";

import { useState } from "react";
import { submitScores } from "@/app/actions/voting";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ScoringFormProps {
  candidateId: string;
  cohortId: string;
  questions: { id: string; text: string }[];
  initialScores: Record<string, number>;
  isVotingOpen?: boolean;
}

export function ApplicationScoringForm({ candidateId, cohortId, questions, initialScores, isVotingOpen = true }: ScoringFormProps) {
  const [scores, setScores] = useState<Record<string, number>>(initialScores);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleScoreChange = (qId: string, val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setScores(prev => ({ ...prev, [qId]: Math.min(Math.max(num, 1), 10) }));
    } else if (val === "") {
      const newScores = { ...scores };
      delete newScores[qId];
      setScores(newScores);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !isVotingOpen) return;

    // Validate all have scores
    const missing = questions.filter(q => scores[q.id] === undefined);
    if (missing.length > 0) {
      setResult({ type: "error", msg: `Missing score for question ${questions.findIndex(q => q.id === missing[0].id) + 1}` });
      return;
    }

    setSaving(true);
    setResult(null);

    try {
      const scoreArr = Object.entries(scores).map(([id, score]) => ({ id, score }));
      await submitScores(candidateId, cohortId, "application", scoreArr, false);
      setResult({ type: "success", msg: "Scores saved successfully!" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save scores.";
      setResult({ type: "error", msg });
    } finally {
      setSaving(false);
    }
  };

  if (questions.length === 0) return null;

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-lg bg-card p-5 space-y-6 shadow-sm">
      <h3 className="font-semibold text-lg border-b border-border pb-3">Your Scores</h3>
      
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="space-y-2">
            <Label htmlFor={`score-${q.id}`} className="text-sm font-medium text-muted-foreground flex justify-between">
              <span>Question {idx + 1}</span>
              <span className="text-xs font-normal truncate ml-4 w-32 text-right">{q.text}</span>
            </Label>
            <div className="flex items-center gap-3">
              <input 
                id={`score-${q.id}`}
                type="number"
                min={1}
                max={10}
                required
                value={scores[q.id] || ""}
                onChange={(e) => handleScoreChange(q.id, e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="1-10"
                disabled={saving || !isVotingOpen}
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">/ 10</span>
            </div>
          </div>
        ))}
      </div>

      {result && (
        <div className={`p-3 rounded-md text-sm ${result.type === "success" ? "bg-green-500/10 text-green-600 dark:text-green-500" : "bg-destructive/10 text-destructive"}`}>
          {result.msg}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Saving..." : "Save Scores"}
      </Button>
    </form>
  );
}
