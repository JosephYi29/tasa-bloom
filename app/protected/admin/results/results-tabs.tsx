"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResultsClient } from "./results-client";
import { WeightsForm } from "@/app/protected/admin/settings/weights/weights-form";
import { ScoredCandidate } from "@/lib/scoring";
import { BarChart3, Trophy } from "lucide-react";

interface ResultsTabsProps {
  data: ScoredCandidate[];
  topN: number;
  activeCohort: { id: string; term: string; year: number };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  weightsSettings: any;
}

export function ResultsTabs({ data, topN, activeCohort, weightsSettings }: ResultsTabsProps) {
  return (
    <Tabs defaultValue="leaderboard">
      <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
        <TabsTrigger value="leaderboard" className="gap-2">
          <Trophy className="w-4 h-4" />
          Leaderboard
        </TabsTrigger>
        <TabsTrigger value="weights" className="gap-2">
          <BarChart3 className="w-4 h-4" />
          Scoring Config
        </TabsTrigger>
      </TabsList>
      <TabsContent value="leaderboard" className="mt-6">
        <ResultsClient data={data} topN={topN} activeCohort={activeCohort} />
      </TabsContent>
      <TabsContent value="weights" className="mt-6">
        <div className="max-w-3xl">
          <WeightsForm initialSettings={weightsSettings} activeCohortId={activeCohort.id} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
