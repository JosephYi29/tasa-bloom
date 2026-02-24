"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveWeightsAction } from "@/app/actions/weights";
import { saveTraitWeights } from "@/app/actions/traits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Trait {
  id: string;
  trait_name: string;
  trait_order: number;
  weight: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function WeightsForm({ initialSettings, activeCohortId, traits = [] }: { initialSettings: any, activeCohortId: string, traits?: Trait[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State in decimals
  const [appWeight, setAppWeight] = useState(initialSettings.application_weight);
  const [intWeight, setIntWeight] = useState(initialSettings.interview_weight);
  const [charWeight, setCharWeight] = useState(initialSettings.character_weight);
  
  const [outlier, setOutlier] = useState(initialSettings.outlier_std_devs);
  const [topN, setTopN] = useState(initialSettings.top_n_display);

  // Trait weights state: map of trait_id -> weight (decimal)
  const [traitWeights, setTraitWeights] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    traits.forEach(t => {
      map[t.id] = t.weight ?? 0;
    });
    return map;
  });

  const totalSum = Number((appWeight + intWeight + charWeight).toFixed(2));
  const isSumValid = totalSum === 1.0;

  // Character trait weights sum (should equal charWeight i.e. the character percentage)
  const traitWeightSum = Number(Object.values(traitWeights).reduce((a, b) => a + b, 0).toFixed(4));
  const charWeightPercent = Number((charWeight * 100).toFixed(1));
  const traitWeightSumPercent = Number((traitWeightSum * 100).toFixed(1));
  const isTraitSumValid = traits.length === 0 || Math.abs(traitWeightSum - charWeight) < 0.001;

  const canSubmit = isSumValid && isTraitSumValid;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) {
      if (!isSumValid) toast.error("Category weights must sum to 100%");
      else toast.error(`Character trait weights must sum to ${charWeightPercent}%`);
      return;
    }

    startTransition(async () => {
      const formData = new FormData(e.currentTarget);
      formData.append("cohort_id", activeCohortId);
      formData.set("application_weight", appWeight.toString());
      formData.set("interview_weight", intWeight.toString());
      formData.set("character_weight", charWeight.toString());

      const res = await saveWeightsAction(formData);
      if (res.error) {
        toast.error(res.error);
        return;
      }

      // Save trait weights if we have traits
      if (traits.length > 0) {
        try {
          const weights = Object.entries(traitWeights).map(([id, weight]) => ({ id, weight }));
          await saveTraitWeights(weights);
        } catch {
          toast.error("Failed to save trait weights.");
          return;
        }
      }

      toast.success("Scoring configuration updated successfully.");
      router.refresh();
    });
  }

  const handleTraitWeightChange = (traitId: string, percentValue: string) => {
    const parsed = parseFloat(percentValue);
    if (!isNaN(parsed)) {
      setTraitWeights(prev => ({ ...prev, [traitId]: parsed / 100 }));
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <div className={`grid gap-6 ${traits.length > 0 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {/* Category Weights */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Category Weights</CardTitle>
            <CardDescription className="text-xs">
              Weights for the composite score. Must sum to 100%.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="appWeight" className="text-sm">Application (%)</Label>
                <Input
                  id="appWeight"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={Number((appWeight * 100).toFixed(1))}
                  onChange={(e) => setAppWeight(parseFloat(e.target.value) / 100)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="intWeight" className="text-sm">Interview (%)</Label>
                <Input
                  id="intWeight"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={Number((intWeight * 100).toFixed(1))}
                  onChange={(e) => setIntWeight(parseFloat(e.target.value) / 100)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="charWeight" className="text-sm">Character (%)</Label>
                <Input
                  id="charWeight"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={Number((charWeight * 100).toFixed(1))}
                  onChange={(e) => setCharWeight(parseFloat(e.target.value) / 100)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
              <div className="flex-1">
                <div className="text-xs font-medium mb-1.5">Total Sum</div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${isSumValid ? "bg-green-500" : totalSum > 1.0 ? "bg-red-500" : "bg-yellow-500"}`}
                    style={{ width: `${Math.min(totalSum * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div className={`font-bold text-lg ${isSumValid ? "text-green-500" : "text-red-500"}`}>
                {Number((totalSum * 100).toFixed(1))}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Character Trait Weights - only shown when traits exist */}
        {traits.length > 0 && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Character Trait Weights</CardTitle>
              <CardDescription className="text-xs">
                Must sum to {charWeightPercent}% (the Character weight).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {traits
                  .sort((a, b) => a.trait_order - b.trait_order)
                  .map(trait => (
                    <div key={trait.id} className="space-y-1.5">
                      <Label htmlFor={`trait-${trait.id}`} className="text-sm">{trait.trait_name} (%)</Label>
                      <Input
                        id={`trait-${trait.id}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={Number((traitWeights[trait.id] * 100).toFixed(1))}
                        onChange={(e) => handleTraitWeightChange(trait.id, e.target.value)}
                        required
                      />
                    </div>
                  ))
                }
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                <div className="flex-1">
                  <div className="text-xs font-medium mb-1.5">Sum (target: {charWeightPercent}%)</div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${isTraitSumValid ? "bg-green-500" : traitWeightSum > charWeight ? "bg-red-500" : "bg-yellow-500"}`}
                      style={{ width: `${charWeight > 0 ? Math.min((traitWeightSum / charWeight) * 100, 100) : 0}%` }}
                    />
                  </div>
                </div>
                <div className={`font-bold text-lg ${isTraitSumValid ? "text-green-500" : "text-red-500"}`}>
                  {traitWeightSumPercent}%
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Settings */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Analytics Settings</CardTitle>
            <CardDescription className="text-xs">
              Configure outlier detection and display preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="outlier_std_devs" className="text-sm">Outlier Threshold (Std Devs)</Label>
                <Input
                  id="outlier_std_devs"
                  name="outlier_std_devs"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={outlier}
                  onChange={(e) => setOutlier(parseFloat(e.target.value))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Scores beyond this threshold from the mean are flagged as anomalies.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="top_n_display" className="text-sm">Top N Candidates Display</Label>
                <Input
                  id="top_n_display"
                  name="top_n_display"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={topN}
                  onChange={(e) => setTopN(parseInt(e.target.value, 10))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  How many top candidates to highlight on the leaderboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end mt-4">
        <Button type="submit" disabled={isPending || !canSubmit}>
          {isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}
