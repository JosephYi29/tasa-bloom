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
import { Download, Search, AlertTriangle, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type SortKey = 'composite' | 'application' | 'interview' | 'character' | 'consistency' | 'candidate' | 'candidateNumber' | null;
type SortDir = 'asc' | 'desc';

export function ResultsClient({ 
  data, 
  topN, 
  activeCohort 
}: { 
  data: ScoredCandidate[], 
  topN: number,
  activeCohort: { term: string, year: number }
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');

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
        switch (sortKey) {
          case 'candidateNumber': aVal = a.candidate_number ?? null; bVal = b.candidate_number ?? null; break;
          case 'application': aVal = a.application.average; bVal = b.application.average; break;
          case 'interview': aVal = a.interview.average; bVal = b.interview.average; break;
          case 'character': aVal = a.character.average; bVal = b.character.average; break;
          case 'composite': aVal = a.composite_score; bVal = b.composite_score; break;
          case 'consistency': aVal = getConsistency(a); bVal = getConsistency(b); break;
        }
        // Nulls always go to the bottom
        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return 1;
        if (bVal === null) return -1;
        return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
      });
    }
    return result;
  }, [data, searchQuery, sortKey, sortDir]);

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === 'desc' 
      ? <ArrowDown className="w-3 h-3 ml-1" /> 
      : <ArrowUp className="w-3 h-3 ml-1" />;
  };

  const handleExportCSV = () => {
    if (!data.length) return;

    const headers = [
      "Rank", "Candidate ID", "First Name", "Last Name", "Email", 
      "Application Avg", "Interview Avg", "Character Avg", "Composite Score", "Consistency %"
    ];

    const rows = data.map((c, index) => {
      const totalScores = c.application.rawScores.length + c.interview.rawScores.length + c.character.rawScores.length;
      const totalOutliers = c.application.outliers.length + c.interview.outliers.length + c.character.outliers.length;
      const consistency = totalScores > 0 ? Math.round(((totalScores - totalOutliers) / totalScores) * 100) : "N/A";
      
      return [
        index + 1,
        c.candidate_number || c.candidate_id,
        c.first_name,
        c.last_name,
        c.email || "",
        c.application.average?.toFixed(2) || "N/A",
        c.interview.average?.toFixed(2) || "N/A",
        c.character.average?.toFixed(2) || "N/A",
        c.composite_score?.toFixed(2) || "N/A",
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
        <Button onClick={handleExportCSV} variant="outline" className="shrink-0 gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-center cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('candidateNumber')}>
                <span className="inline-flex items-center">#<SortIcon column="candidateNumber" /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('candidate')}>
                <span className="inline-flex items-center">Candidate<SortIcon column="candidate" /></span>
              </TableHead>
              <TableHead className="text-right cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('application')}>
                <span className="inline-flex items-center">Application<SortIcon column="application" /></span>
              </TableHead>
              <TableHead className="text-right cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('interview')}>
                <span className="inline-flex items-center">Interview<SortIcon column="interview" /></span>
              </TableHead>
              <TableHead className="text-right cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('character')}>
                <span className="inline-flex items-center">Character<SortIcon column="character" /></span>
              </TableHead>
              <TableHead className="text-right font-bold cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('composite')}>
                <span className="inline-flex items-center">Composite<SortIcon column="composite" /></span>
              </TableHead>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                    <TableCell className="text-right">
                      {candidate.application.average !== null ? candidate.application.average.toFixed(2) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {candidate.interview.average !== null ? candidate.interview.average.toFixed(2) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {candidate.character.average !== null ? candidate.character.average.toFixed(2) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {candidate.composite_score !== null ? candidate.composite_score.toFixed(2) : (
                        <span className="text-muted-foreground font-normal text-sm">Pending</span>
                      )}
                    </TableCell>
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
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      {topN > 0 && data.length > 0 && (
        <div className="text-sm text-muted-foreground text-right mt-2">
          Highlighting the top {topN} candidates. Adjust in the <span className="underline cursor-pointer" onClick={() => { const el = document.querySelector('[data-value="weights"]') as HTMLElement; el?.click(); }}>Scoring Config</span> tab.
        </div>
      )}
    </div>
  );
}
