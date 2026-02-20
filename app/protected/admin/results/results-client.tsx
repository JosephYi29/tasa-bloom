"use client";

import { useState } from "react";
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
import { Download, Search, AlertTriangle } from "lucide-react";

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

  const filteredData = data.filter(c => 
    c.first_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.last_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportCSV = () => {
    if (!data.length) return;

    const headers = [
      "Rank", "Candidate ID", "First Name", "Last Name", "Email", 
      "Application Avg", "Interview Avg", "Character Avg", "Composite Score"
    ];

    const rows = data.map((c, index) => [
      index + 1,
      c.candidate_number || c.candidate_id,
      c.first_name,
      c.last_name,
      c.email || "",
      c.application.average?.toFixed(2) || "N/A",
      c.interview.average?.toFixed(2) || "N/A",
      c.character.average?.toFixed(2) || "N/A",
      c.composite_score?.toFixed(2) || "N/A"
    ]);

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
              <TableHead className="w-[80px] text-center">Rank</TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead className="text-right">App Avg</TableHead>
              <TableHead className="text-right">Int Avg</TableHead>
              <TableHead className="text-right">Char Avg</TableHead>
              <TableHead className="text-right font-bold">Composite</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No candidates found for this cohort or matching search.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((candidate, index) => {
                const isTopN = index < topN && candidate.composite_score !== null;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const pendingScores = candidate.composite_score === null;
                const hasOutliers = candidate.application.outliers.length > 0 || 
                                    candidate.interview.outliers.length > 0 || 
                                    candidate.character.outliers.length > 0;

                return (
                  <TableRow 
                    key={candidate.candidate_id}
                    className={isTopN ? "bg-primary/5 hover:bg-primary/10" : ""}
                  >
                    <TableCell className="text-center font-medium">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/protected/admin/results/${candidate.candidate_id}`}
                          className="font-medium hover:underline text-primary"
                        >
                          {candidate.first_name} {candidate.last_name}
                        </Link>
                        {hasOutliers && (
                          <span title="Contains outlier scores flagged by standard deviation threshold">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          </span>
                        )}
                      </div>
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
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      {topN > 0 && data.length > 0 && (
        <div className="text-sm text-muted-foreground text-right mt-2">
          Highlighting the top {topN} candidates. <Link href="/protected/admin/settings/weights" className="underline">Change threshold</Link>.
        </div>
      )}
    </div>
  );
}
