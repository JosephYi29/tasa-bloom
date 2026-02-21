"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Check, AlertCircle, Loader2 } from "lucide-react";
import { importLegacyRatings } from "@/app/protected/admin/import/legacy/actions";

type MappingTarget =
  | "skip"
  | "voter_name"
  | "first_name"
  | "last_name"
  | "full_name"
  | "question";

interface ColumnMapping {
  header: string;
  target: MappingTarget;
}

interface LegacyCsvImporterProps {
  cohortId: string;
  cohortLabel: string;
}

const TARGET_OPTIONS: { value: MappingTarget; label: string }[] = [
  { value: "skip", label: "— Skip this column —" },
  { value: "voter_name", label: "Voter Name" },
  { value: "first_name", label: "Candidate First Name" },
  { value: "last_name", label: "Candidate Last Name" },
  { value: "full_name", label: "Candidate Full Name" },
  { value: "question", label: "Score Question (1-10)" },
];

function guessMapping(header: string): MappingTarget {
  const h = header.toLowerCase().trim();
  if (h.includes("voter") || h.includes("board member") || h === "name" || h.includes("your name") || h.includes("reviewer"))
    return "voter_name"; // Risky but users can fix it
  if (h.includes("candidate") && h.includes("first"))
    return "first_name";
  if (h.includes("candidate") && h.includes("last"))
    return "last_name";
  if (h.includes("candidate") || h === "full name" || h === "candidate name")
    return "full_name";
  if (h === "timestamp" || h === "date") return "skip";
  
  // Default to question
  return "question";
}

function cleanName(name: string): string {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function LegacyCsvImporter({ cohortId, cohortLabel }: LegacyCsvImporterProps) {
  const [step, setStep] = useState<"upload" | "map" | "preview" | "done">("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [ratingType, setRatingType] = useState<"application" | "interview" | "character">("application");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; } | null>(null);

  const handleFile = useCallback((file: File) => {
    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as string[][];
        if (data.length < 2) return;

        const csvHeaders = data[0];
        const csvRows = data.slice(1).filter((row) => row.some((cell) => cell.trim()));

        setHeaders(csvHeaders);
        setRows(csvRows);
        setMappings(
          csvHeaders.map((h) => ({ header: h, target: guessMapping(h) }))
        );
        setStep("map");
      },
      skipEmptyLines: true,
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const updateMapping = (index: number, target: MappingTarget) => {
    setMappings((prev) => prev.map((m, i) => (i === index ? { ...m, target } : m)));
  };

  const handleImport = async () => {
    setImporting(true);
    setResult(null);

    try {
      const columnIndices = {
        voterIdx: mappings.findIndex((m) => m.target === "voter_name"),
        fnIdx: mappings.findIndex((m) => m.target === "first_name"),
        lnIdx: mappings.findIndex((m) => m.target === "last_name"),
        fullIdx: mappings.findIndex((m) => m.target === "full_name"),
      };

      const questionCols = mappings
        .map((m, i) => ({ header: m.header, colIndex: i }))
        .filter((_, i) => mappings[i].target === "question");

      const res = await importLegacyRatings(cohortId, questionCols, rows, columnIndices, ratingType);

      setResult({
        success: true,
        message: `Imported ${res.imported} ratings with ${res.questions} questions each.`,
      });
      setStep("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Import failed";
      setResult({ success: false, message: msg });
    } finally {
      setImporting(false);
    }
  };

  if (step === "upload") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2 mb-6">
          <label className="text-sm font-medium">Which phase are these scores for?</label>
          <select 
            value={ratingType}
            onChange={(e) => setRatingType(e.target.value as "application" | "interview" | "character")}
            className="w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="application">Application Phase</option>
            <option value="interview">Interview Phase</option>
            <option value="character">Character Phase</option>
          </select>
        </div>
        
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors p-12 text-center cursor-pointer"
        >
          <input type="file" accept=".csv" onChange={handleFileInput} className="hidden" id="csv-upload" />
          <label htmlFor="csv-upload" className="cursor-pointer space-y-3 block">
            <Upload size={32} className="mx-auto text-muted-foreground" />
            <p className="text-sm font-medium">Drop a Historical Scores CSV here, or click to browse</p>
            <p className="text-xs text-muted-foreground">Importing {ratingType} ratings for: {cohortLabel}</p>
          </label>
        </div>
      </div>
    );
  }

  if (step === "map") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileSpreadsheet size={20} className="text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{rows.length} votes detected · {headers.length} columns</p>
            <p className="text-xs text-muted-foreground">Map each CSV column to a database field</p>
          </div>
        </div>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">CSV Column</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sample Data</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Map To</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{m.header}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{rows[0]?.[i] ?? "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={m.target}
                      onChange={(e) => updateMapping(i, e.target.value as MappingTarget)}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    >
                      {TARGET_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
          <Button onClick={() => setStep("preview")}>Preview Import</Button>
        </div>
      </div>
    );
  }

  if (step === "preview") {
    const previewRows = rows.slice(0, 5);
    const fnIdx = mappings.findIndex((m) => m.target === "first_name");
    const lnIdx = mappings.findIndex((m) => m.target === "last_name");
    const fullIdx = mappings.findIndex((m) => m.target === "full_name");
    const voterIdx = mappings.findIndex((m) => m.target === "voter_name");

    return (
      <div className="space-y-6">
        <p className="text-sm font-medium">Preview — first {previewRows.length} of {rows.length} votes</p>
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Voter Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Candidate Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Questions Mapped</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, ri) => {
                let name = "";
                if (fullIdx >= 0) name = cleanName(row[fullIdx] ?? "");
                else {
                  const fn = fnIdx >= 0 ? row[fnIdx] ?? "" : "";
                  const ln = lnIdx >= 0 ? row[lnIdx] ?? "" : "";
                  name = cleanName(`${fn} ${ln}`);
                }
                const voterLabel = voterIdx >= 0 ? cleanName(row[voterIdx] ?? "") : "Unknown";

                return (
                  <tr key={ri} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 tabular-nums font-medium">{voterLabel || "(no voter)"}</td>
                    <td className="px-4 py-3 font-medium">{name || "(no name)"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{mappings.filter((m) => m.target === "question").length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {result && !result.success && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">{result.message}</p>
          </div>
        )}
        <div className="flex flex-col items-center gap-4 w-full pt-4">
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" onClick={() => setStep("map")} disabled={importing}>
              Back
            </Button>
            <Button onClick={handleImport} disabled={importing} className="min-w-[200px]">
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing Ratings…
                </>
              ) : (
                `Import ${rows.length} Ratings`
              )}
            </Button>
          </div>

          {importing && (
            <div className="text-amber-600 dark:text-amber-500 text-sm flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 py-2 px-4 rounded-md border border-amber-200 dark:border-amber-900 w-full max-w-fit mx-auto mt-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <p>This process may take a few minutes. Please do not close or reload this page.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border p-8 text-center space-y-4">
      <Check size={40} className="mx-auto text-green-600 dark:text-green-400" />
      <p className="text-lg font-medium">{result?.message}</p>
      <div className="flex gap-2 justify-center">
        <Button
          variant="outline"
          onClick={() => {
            setStep("upload");
            setHeaders([]);
            setRows([]);
            setMappings([]);
            setResult(null);
          }}
        >
          Import More
        </Button>
        <Button asChild>
          <Link href="/protected/admin/results">View Results</Link>
        </Button>
      </div>
    </div>
  );
}
