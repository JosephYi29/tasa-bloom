"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveWeightsAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function WeightsForm({ initialSettings, activeCohortId }: { initialSettings: any, activeCohortId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State in decimals
  const [appWeight, setAppWeight] = useState(initialSettings.application_weight);
  const [intWeight, setIntWeight] = useState(initialSettings.interview_weight);
  const [charWeight, setCharWeight] = useState(initialSettings.character_weight);
  
  const [outlier, setOutlier] = useState(initialSettings.outlier_std_devs);
  const [topN, setTopN] = useState(initialSettings.top_n_display);

  const totalSum = Number((appWeight + intWeight + charWeight).toFixed(2));
  const isSumValid = totalSum === 1.0;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isSumValid) {
      toast.error("Weights must sum to 100%");
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
      } else {
        toast.success("Scoring weights updated successfully.");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Category Weights</CardTitle>
          <CardDescription>
            These weights are used to compute the final composite score for each candidate.
            The sum must be perfectly 100%. Note: Inputs are percentages (0-100).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="appWeight">Application (%)</Label>
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
            <div className="space-y-2">
              <Label htmlFor="intWeight">Interview (%)</Label>
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
            <div className="space-y-2">
              <Label htmlFor="charWeight">Character (%)</Label>
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

          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
            <div className="flex-1">
              <div className="text-sm font-medium mb-2">Total Sum</div>
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

          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Analytics Settings</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="outlier_std_devs">Outlier Threshold (Standard Deviations)</Label>
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
                  Scores further away from the mean than this threshold parameter will be flagged as anomalies.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="top_n_display">Top N Candidates Display</Label>
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
                  How many top candidates to visually highlight on the leaderboard.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end bg-muted/20 border-t py-4">
          <Button type="submit" disabled={isPending || !isSumValid}>
            {isPending ? "Saving..." : "Save Settings"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
