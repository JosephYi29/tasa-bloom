"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import { importCandidates } from "@/app/actions/cohorts";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Check, AlertCircle } from "lucide-react";

type MappingTarget =
  | "skip"
  | "candidate_number"
  | "first_name"
  | "last_name"
  | "full_name"
  | "email"
  | "phone_number"
  | "year"
  | "interview_link"
  | "question";

interface ColumnMapping {
  header: string;
  target: MappingTarget;
}

interface CsvImporterProps {
  cohortId: string;
  cohortLabel: string;
}

const TARGET_OPTIONS: { value: MappingTarget; label: string }[] = [
  { value: "skip", label: "— Skip this column —" },
  { value: "candidate_number", label: "Candidate #" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "full_name", label: "Full Name (will split)" },
  { value: "email", label: "Email" },
  { value: "phone_number", label: "Phone Number" },
  { value: "year", label: "Year" },
  { value: "interview_link", label: "Interview Video Link" },
  { value: "question", label: "Application Question" },
];

function guessMapping(header: string): MappingTarget {
  const h = header.toLowerCase().trim();
  if (h.includes("number") && !h.includes("phone") || h === "#" || h === "no" || h === "no.")
    return "candidate_number";
  if (h === "first name" || h === "first_name" || h === "firstname")
    return "first_name";
  if (h === "last name" || h === "last_name" || h === "lastname")
    return "last_name";
  if (h === "name" || h === "full name" || h === "full_name")
    return "full_name";
  if (h.includes("email")) return "email";
  if (h.includes("phone")) return "phone_number";
  if (h === "year" || h.includes("grad year") || h === "class") return "year";
  if (h.includes("interview") || h.includes("video") || h.includes("drive link")) return "interview_link";
  if (h === "timestamp" || h === "date" || h === "submitted") return "skip";
  // Default: treat as an application question
  return "question";
}

function cleanName(name: string): string {
  if (!name) return "";
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function CsvImporter({ cohortId, cohortLabel }: CsvImporterProps) {
  const [step, setStep] = useState<"upload" | "map" | "preview" | "done">(
    "upload"
  );
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".csv")) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const updateMapping = (index: number, target: MappingTarget) => {
    setMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, target } : m))
    );
  };

  const handleImport = async () => {
    setImporting(true);
    setResult(null);

    try {
      // Determine column indices
      const columnIndices = {
        numIdx: mappings.findIndex((m) => m.target === "candidate_number"),
        fnIdx: mappings.findIndex((m) => m.target === "first_name"),
        lnIdx: mappings.findIndex((m) => m.target === "last_name"),
        fullIdx: mappings.findIndex((m) => m.target === "full_name"),
        emailIdx: mappings.findIndex((m) => m.target === "email"),
        phoneIdx: mappings.findIndex((m) => m.target === "phone_number"),
        yearIdx: mappings.findIndex((m) => m.target === "year"),
        interviewLinkIdx: mappings.findIndex((m) => m.target === "interview_link"),
      };

      // Get question columns
      const questionCols = mappings
        .map((m, i) => ({ header: m.header, colIndex: i }))
        .filter((_, i) => mappings[i].target === "question");

      const res = await importCandidates(cohortId, questionCols, rows, columnIndices);

      setResult({
        success: true,
        message: `Imported ${res.imported} candidates with ${res.questions} questions each.`,
      });
      setStep("done");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Import failed";
      setResult({ success: false, message });
    } finally {
      setImporting(false);
    }
  };

  // --- UPLOAD STEP ---
  if (step === "upload") {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors p-12 text-center cursor-pointer"
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
          id="csv-upload"
        />
        <label htmlFor="csv-upload" className="cursor-pointer space-y-3">
          <Upload
            size={32}
            className="mx-auto text-muted-foreground"
          />
          <p className="text-sm font-medium">
            Drop a CSV file here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Importing into: {cohortLabel}
          </p>
        </label>
      </div>
    );
  }

  // --- MAP STEP ---
  if (step === "map") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileSpreadsheet size={20} className="text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {rows.length} rows detected · {headers.length} columns
            </p>
            <p className="text-xs text-muted-foreground">
              Map each CSV column to a database field
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  CSV Column
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Sample Data
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Map To
                </th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m, i) => (
                <tr
                  key={i}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 font-medium">{m.header}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                    {rows[0]?.[i] ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={m.target}
                      onChange={(e) =>
                        updateMapping(i, e.target.value as MappingTarget)
                      }
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
          <Button variant="outline" onClick={() => setStep("upload")}>
            Back
          </Button>
          <Button onClick={() => setStep("preview")}>
            Preview Import
          </Button>
        </div>
      </div>
    );
  }

  // --- PREVIEW STEP ---
  if (step === "preview") {
    const previewRows = rows.slice(0, 5);
    const fnIdx = mappings.findIndex((m) => m.target === "first_name");
    const lnIdx = mappings.findIndex((m) => m.target === "last_name");
    const fullIdx = mappings.findIndex((m) => m.target === "full_name");
    const numIdx = mappings.findIndex((m) => m.target === "candidate_number");

    return (
      <div className="space-y-6">
        <p className="text-sm font-medium">
          Preview — first {previewRows.length} of {rows.length} candidates
        </p>

        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  #
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Questions Mapped
                </th>
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
                const num =
                  numIdx >= 0 ? parseInt(row[numIdx], 10) || ri + 1 : ri + 1;

                return (
                  <tr
                    key={ri}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {num}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {name || "(no name)"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {mappings.filter((m) => m.target === "question").length}
                    </td>
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

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep("map")}>
            Back
          </Button>
          <Button onClick={handleImport} disabled={importing}>
            {importing
              ? "Importing…"
              : `Import ${rows.length} Candidates`}
          </Button>
        </div>
      </div>
    );
  }

  // --- DONE STEP ---
  return (
    <div className="rounded-lg border border-border p-8 text-center space-y-4">
      <Check
        size={40}
        className="mx-auto text-green-600 dark:text-green-400"
      />
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
          <a href="/protected/admin/candidates">View Candidates</a>
        </Button>
      </div>
    </div>
  );
}
