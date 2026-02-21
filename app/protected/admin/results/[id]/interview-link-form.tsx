"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertInterviewLinkAction } from "../../candidates/actions";
import { toast } from "sonner";
import { Loader2, Link as LinkIcon } from "lucide-react";

export function InterviewLinkForm({ 
  candidateId, 
  initialUrl 
}: { 
  candidateId: string;
  initialUrl: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await upsertInterviewLinkAction(candidateId, url);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Interview link saved successfully!");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border rounded-lg bg-card p-4 space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <LinkIcon className="w-5 h-5" />
        Interview Recording
      </h3>
      <div className="flex items-end gap-3">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="video_url">Google Drive Link</Label>
          <Input 
            id="video_url" 
            placeholder="https://drive.google.com/file/d/..." 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <Button onClick={handleSave} disabled={isSaving || url === initialUrl}>
          {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Link
        </Button>
      </div>
      {url && (
        <p className="text-sm text-muted-foreground">
          This link will be embedded for voters during the Interview Rating phase.
        </p>
      )}
    </div>
  );
}
