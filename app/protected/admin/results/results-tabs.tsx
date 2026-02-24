"use client";

import { useState } from "react";
import { ResultsClient } from "./results-client";
import { WeightsForm } from "@/app/protected/admin/settings/weights/weights-form";
import { ScoredCandidate } from "@/lib/scoring";
import { ChevronDown, ChevronUp, Settings2 } from "lucide-react";

interface Trait {
  id: string;
  trait_name: string;
  trait_order: number;
  weight: number;
}

interface ResultsTabsProps {
  data: ScoredCandidate[];
  topN: number;
  activeCohort: { id: string; term: string; year: number };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  weightsSettings: any;
  traits: Trait[];
}

export function ResultsTabs({ data, topN, activeCohort, weightsSettings, traits }: ResultsTabsProps) {
  const [configOpen, setConfigOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Scoring Config Section - Collapsible */}
      <div className="rounded-lg border bg-card">
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-lg"
          onClick={() => setConfigOpen(!configOpen)}
        >
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-muted-foreground" />
            <span className="font-semibold text-lg">Scoring Configuration</span>
          </div>
          {configOpen ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        {configOpen && (
          <div className="px-4 pb-4">
            <WeightsForm initialSettings={weightsSettings} activeCohortId={activeCohort.id} traits={traits} />
          </div>
        )}
      </div>

      {/* Results Table */}
      <ResultsClient data={data} topN={topN} activeCohort={activeCohort} traits={traits} />
    </div>
  );
}
