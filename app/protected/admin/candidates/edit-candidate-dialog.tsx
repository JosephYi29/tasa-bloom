"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CandidateType = {
  id: string;
  candidate_number: number | null;
  first_name: string;
  last_name: string;
  email: string | null;
  year: string | null;
  custom_order: number | null;
};

interface EditCandidateDialogProps {
  candidate: CandidateType | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<CandidateType>) => Promise<void>;
  isSaving: boolean;
}

export function EditCandidateDialog({
  candidate,
  isOpen,
  onClose,
  onSave,
  isSaving,
}: EditCandidateDialogProps) {
  const [formData, setFormData] = useState<Partial<CandidateType>>({});

  useEffect(() => {
    if (candidate) {
      setFormData({
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        candidate_number: candidate.candidate_number,
        email: candidate.email,
        year: candidate.year,
      });
    }
  }, [candidate]);

  if (!candidate) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "candidate_number" ? (value === "" ? null : parseInt(value, 10)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(candidate.id, formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Candidate</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="candidate_number" className="text-right">
                Number
              </Label>
              <Input
                id="candidate_number"
                name="candidate_number"
                type="number"
                value={formData.candidate_number === null ? "" : formData.candidate_number}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="first_name" className="text-right">
                First Name
              </Label>
              <Input
                id="first_name"
                name="first_name"
                value={formData.first_name || ""}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="last_name" className="text-right">
                Last Name
              </Label>
              <Input
                id="last_name"
                name="last_name"
                value={formData.last_name || ""}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right">
                Year
              </Label>
              <Input
                id="year"
                name="year"
                value={formData.year || ""}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
