"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ScoredCandidate } from "@/lib/scoring";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search, AlertTriangle, ArrowUp, ArrowDown, ArrowUpDown, Filter, FilterX } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Trait {
  id: string;
  trait_name: string;
  trait_order: number;
}

type SortKey = 'composite' | 'application' | 'interview' | 'character' | 'consistency' | 'candidate' | 'candidateNumber' | `trait_${string}` | null;
type SortDir = 'asc' | 'desc';

export function ResultsClient({ 
  data, 
  topN, 
  activeCohort,
  traits 
}: { 
  data: ScoredCandidate[], 
  topN: number,
  activeCohort: { term: string, year: number },
  traits: Trait[]
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [includeOutliers, setIncludeOutliers] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDir === 'desc') setSortDir('asc');
      else { setSortKey(null); setSortDir('desc'); } // third click resets
    } else {
      setSortKey(key);
      // Text columns default to ascending, numeric to descending
      setSortDir(key === 'candidate' ? 'asc' : 'desc');
    }
  };

  const getConsistency = (c: ScoredCandidate) => {
    const totalScores = c.application.rawScores.length + c.interview.rawScores.length + c.character.rawScores.length;
    const totalOutliers = c.application.outliers.length + c.interview.outliers.length + c.character.outliers.length;
    return totalScores > 0 ? Math.round(((totalScores - totalOutliers) / totalScores) * 100) : null;
  };

  const rawMean = (scores: number[]) => scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

  const getCategoryAvg = (cat: ScoredCandidate['application']) => {
    if (includeOutliers) {
      return rawMean(cat.rawScores);
    }
    return cat.average;
  };

  const getTraitAverage = (c: ScoredCandidate, traitId: string): number | null => {
    const traitScore = c.characterTraits.find(t => t.trait_id === traitId);
    if (!traitScore) return null;
    if (includeOutliers) {
      return rawMean(traitScore.rawScores);
    }
    return traitScore.average;
  };

  // Compute per-column min/max for color gradient
  const columnRanges = useMemo(() => {
    const ranges: Record<string, { min: number; max: number }> = {};
    const cols = ['application', 'interview', 'character', ...traits.map(t => `trait_${t.id}`)];
    cols.forEach(col => {
      const values: number[] = [];
      data.forEach(c => {
        let v: number | null = null;
        if (col === 'application') v = getCategoryAvg(c.application);
        else if (col === 'interview') v = getCategoryAvg(c.interview);
        else if (col === 'character') v = getCategoryAvg(c.character);
        else if (col.startsWith('trait_')) {
          const traitId = col.replace('trait_', '');
          v = getTraitAverage(c, traitId);
        }
        if (v !== null) values.push(v);
      });
      if (values.length > 0) {
        ranges[col] = { min: Math.min(...values), max: Math.max(...values) };
      }
    });
    return ranges;
  }, [data, includeOutliers, traits]);

  // Red (0°) → Yellow (45°) → Green (140°) via HSL — mini bar
  const ScoreBar = ({ value, column, formatted }: { value: number | null; column: string; formatted: string }) => {
    if (value === null) return <span>-</span>;
    const range = columnRanges[column];
    const hasRange = range && range.max !== range.min;
    const ratio = hasRange ? (value - range.min) / (range.max - range.min) : 0.5;
    const hue = ratio * 140;
    const widthPct = Math.max(15, ratio * 100); // min 15% so lowest isn't invisible
    return (
      <div className="inline-flex flex-col items-end gap-0.5">
        <span>{formatted}</span>
        {hasRange && (
          <div className="w-10 h-[3px] rounded-full bg-muted/40">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${widthPct}%`,
                backgroundColor: `hsl(${hue}, 75%, 45%)`,
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const getComposite = (c: ScoredCandidate): number | null => {
    // When including outliers, we don't have a pre-computed value, so return the stored one
    // (the toggle primarily affects the per-column averages display)
    if (!includeOutliers) return c.composite_score;
    // Recompute from raw averages - but we don't have weights client-side,
    // so just return the stored composite (it's always outlier-filtered from server)
    return c.composite_score;
  };

  const filteredData = useMemo(() => {
    let result = data.filter(c => 
      c.first_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.last_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortKey) {
      result = [...result].sort((a, b) => {
        // String-based sorts
        if (sortKey === 'candidate') {
          const aName = a.first_name.toLowerCase();
          const bName = b.first_name.toLowerCase();
          const cmp = aName.localeCompare(bName);
          return sortDir === 'asc' ? cmp : -cmp;
        }

        // Numeric sorts
        let aVal: number | null = null;
        let bVal: number | null = null;

        if (sortKey.startsWith('trait_')) {
          const traitId = sortKey.replace('trait_', '');
          aVal = getTraitAverage(a, traitId);
          bVal = getTraitAverage(b, traitId);
        } else {
          switch (sortKey) {
            case 'candidateNumber': aVal = a.candidate_number ?? null; bVal = b.candidate_number ?? null; break;
            case 'application': aVal = getCategoryAvg(a.application); bVal = getCategoryAvg(b.application); break;
            case 'interview': aVal = getCategoryAvg(a.interview); bVal = getCategoryAvg(b.interview); break;
            case 'character': aVal = getCategoryAvg(a.character); bVal = getCategoryAvg(b.character); break;
            case 'composite': aVal = getComposite(a); bVal = getComposite(b); break;
            case 'consistency': aVal = getConsistency(a); bVal = getConsistency(b); break;
          }
        }

        // Nulls always go to the bottom
        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return 1;
        if (bVal === null) return -1;
        return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
      });
    }
    return result;
  }, [data, searchQuery, sortKey, sortDir, includeOutliers]);

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === 'desc' 
      ? <ArrowDown className="w-3 h-3 ml-1" /> 
      : <ArrowUp className="w-3 h-3 ml-1" />;
  };

  const hasTraits = traits.length > 0;

  // Total number of columns for empty state colspan
  // Base: # + Candidate + Application + Interview + Character(Avg) + Composite = 6
  // Plus one per trait, plus Consistency (only when not including outliers)
  const totalCols = 6 + traits.length + (includeOutliers ? 0 : 1);

  const handleExportCSV = () => {
    if (!data.length) return;

    const headers = [
      "Rank", "Candidate ID", "First Name", "Last Name", "Email", 
      "Application Avg", "Interview Avg",
      ...traits.map(t => `${t.trait_name} Avg`),
      "Character Avg", "Composite Score", "Consistency %"
    ];

    const rows = data.map((c, index) => {
      const totalScores = c.application.rawScores.length + c.interview.rawScores.length + c.character.rawScores.length;
      const totalOutliers = c.application.outliers.length + c.interview.outliers.length + c.character.outliers.length;
      const consistency = totalScores > 0 ? Math.round(((totalScores - totalOutliers) / totalScores) * 100) : "N/A";
      
      const appAvg = getCategoryAvg(c.application);
      const intAvg = getCategoryAvg(c.interview);
      const charAvg = getCategoryAvg(c.character);

      return [
        index + 1,
        c.candidate_number || c.candidate_id,
        c.first_name,
        c.last_name,
        c.email || "",
        appAvg !== null ? appAvg.toFixed(2) : "N/A",
        intAvg !== null ? intAvg.toFixed(2) : "N/A",
        ...traits.map(t => {
          const avg = getTraitAverage(c, t.id);
          return avg !== null ? avg.toFixed(2) : "N/A";
        }),
        charAvg !== null ? charAvg.toFixed(2) : "N/A",
        getComposite(c)?.toFixed(2) || "N/A",
        consistency
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${activeCohort.term}_${activeCohort.year}_Results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            type="search" 
            placeholder="Search candidates..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setIncludeOutliers(!includeOutliers)}
                variant={includeOutliers ? "default" : "outline"}
                className="shrink-0 gap-2"
              >
                {includeOutliers ? <FilterX className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
                {includeOutliers ? "Outliers Included" : "Outliers Excluded"}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{includeOutliers ? "Currently showing raw averages (outliers included). Click to exclude outliers." : "Currently showing filtered averages (outliers excluded). Click to include outliers."}</p>
            </TooltipContent>
          </Tooltip>
          <Button onClick={handleExportCSV} variant="outline" className="shrink-0 gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] text-center cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('candidateNumber')}>
                <span className="inline-flex items-center">#<SortIcon column="candidateNumber" /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors min-w-[140px]" onClick={() => handleSort('candidate')}>
                <span className="inline-flex items-center">Candidate<SortIcon column="candidate" /></span>
              </TableHead>
              <TableHead className="text-right cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('application')}>
                <span className="inline-flex items-center">Application<SortIcon column="application" /></span>
              </TableHead>
              <TableHead className="text-right cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('interview')}>
                <span className="inline-flex items-center">Interview<SortIcon column="interview" /></span>
              </TableHead>
              {hasTraits ? (
                <>
                  {traits.map(trait => (
                    <TableHead 
                      key={trait.id}
                      className="text-right cursor-pointer select-none hover:text-foreground transition-colors"
                      onClick={() => handleSort(`trait_${trait.id}`)}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center cursor-help">
                            {trait.trait_name}
                            <SortIcon column={`trait_${trait.id}`} />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Character trait: {trait.trait_name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                  ))}
                  <TableHead className="text-right cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('character')}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center cursor-help">
                          Char Avg
                          <SortIcon column="character" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Overall character average across all traits</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                </>
              ) : (
                <TableHead className="text-right cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('character')}>
                  <span className="inline-flex items-center">Character<SortIcon column="character" /></span>
                </TableHead>
              )}
              <TableHead className="text-right font-bold cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('composite')}>
                <span className="inline-flex items-center">Composite<SortIcon column="composite" /></span>
              </TableHead>
              {!includeOutliers && (
                <TableHead className="text-center w-[100px] cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('consistency')}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center cursor-help">Consistency<SortIcon column="consistency" /></span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Percentage of scores within the normal range (not flagged as outliers)</p>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={totalCols} className="text-center py-8 text-muted-foreground">
                  No candidates found for this cohort or matching search.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((candidate, index) => {
                const isTopN = !sortKey && index < topN && candidate.composite_score !== null;
                
                const consistency = getConsistency(candidate);
                const totalScores = candidate.application.rawScores.length + 
                                    candidate.interview.rawScores.length + 
                                    candidate.character.rawScores.length;
                const totalOutliers = candidate.application.outliers.length + 
                                      candidate.interview.outliers.length + 
                                      candidate.character.outliers.length;
                const isLowConsistency = consistency !== null && consistency < 80;

                return (
                  <TableRow 
                    key={candidate.candidate_id}
                    className={isTopN ? "bg-primary/5 hover:bg-primary/10" : ""}
                  >
                    <TableCell className="text-center font-medium">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Link 
                        href={`/protected/admin/results/${candidate.candidate_id}`}
                        className="font-medium hover:underline text-primary"
                      >
                        {candidate.first_name} {candidate.last_name}
                      </Link>
                      {candidate.candidate_number && (
                        <div className="text-xs text-muted-foreground">
                          #{candidate.candidate_number}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(() => { const v = getCategoryAvg(candidate.application); return <ScoreBar value={v} column="application" formatted={v !== null ? v.toFixed(2) : "-"} />; })()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(() => { const v = getCategoryAvg(candidate.interview); return <ScoreBar value={v} column="interview" formatted={v !== null ? v.toFixed(2) : "-"} />; })()}
                    </TableCell>
                    {hasTraits ? (
                      <>
                        {traits.map(trait => {
                          const avg = getTraitAverage(candidate, trait.id);
                          return (
                            <TableCell key={trait.id} className="text-right tabular-nums">
                              <ScoreBar value={avg} column={`trait_${trait.id}`} formatted={avg !== null ? avg.toFixed(2) : "-"} />
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {(() => { const v = getCategoryAvg(candidate.character); return <ScoreBar value={v} column="character" formatted={v !== null ? v.toFixed(2) : "-"} />; })()}
                        </TableCell>
                      </>
                    ) : (
                      <TableCell className="text-right tabular-nums">
                        {(() => { const v = getCategoryAvg(candidate.character); return <ScoreBar value={v} column="character" formatted={v !== null ? v.toFixed(2) : "-"} />; })()}
                      </TableCell>
                    )}
                    <TableCell className="text-right font-bold">
                      {(() => { const v = getComposite(candidate); return v !== null ? v.toFixed(2) : (<span className="text-muted-foreground font-normal text-sm">Pending</span>); })()}
                    </TableCell>
                    {!includeOutliers && (
                      <TableCell className="text-center">
                        {consistency !== null ? (
                          <div className="flex items-center justify-center gap-1">
                            {isLowConsistency && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p>{totalOutliers} of {totalScores} scores flagged as outliers</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <span className={`text-sm tabular-nums ${
                              isLowConsistency 
                                ? "text-amber-600 dark:text-amber-400 font-medium" 
                                : "text-muted-foreground"
                            }`}>
                              {consistency}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      {topN > 0 && data.length > 0 && (
        <div className="text-sm text-muted-foreground text-right mt-2">
          Highlighting the top {topN} candidates. Adjust in the Scoring Configuration section above.
        </div>
      )}
    </div>
  );
}
