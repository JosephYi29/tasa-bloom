"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload, GripVertical, Shuffle, SortAsc, Save, Loader2 } from "lucide-react";
import { updateCandidateOrderAction, deleteCandidateAction, updateCandidateAction } from "./actions";
import { toast } from "sonner";
import { EditCandidateDialog } from "./edit-candidate-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type CandidateType = {
  id: string;
  candidate_number: number | null;
  first_name: string;
  last_name: string;
  email: string | null;
  year: string | null;
  custom_order: number | null;
};

// Sub-component for individual sortable row
function SortableCandidateRow({ 
  candidate, 
  onEdit,
  onDelete
}: { 
  candidate: CandidateType; 
  onEdit: (candidate: CandidateType) => void;
  onDelete: (candidate: CandidateType) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    boxShadow: isDragging ? "0 5px 15px rgba(0,0,0,0.15)" : "none",
    position: isDragging ? "relative" as const : "static" as const,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors bg-card ${isDragging ? "bg-accent/50" : ""}`}
    >
      <td className="px-4 py-3 w-10">
        <button
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing p-1 rounded"
          {...attributes}
          {...listeners}
          title="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>
      </td>
      <td className="px-4 py-3 tabular-nums text-muted-foreground">
        {candidate.candidate_number}
      </td>
      <td className="px-4 py-3 font-medium">
        {candidate.first_name} {candidate.last_name}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {candidate.email ?? "—"}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {candidate.year ?? "—"}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-3 items-center">
          <Link
            href={`/protected/admin/candidates/${candidate.id}`}
            className="text-sm text-primary hover:underline"
          >
            View
          </Link>
          <button 
            onClick={() => onEdit(candidate)}
            className="text-sm text-foreground hover:underline" 
            title="Edit Candidate"
          >
            Edit
          </button>
          <button 
            onClick={() => onDelete(candidate)}
            className="text-sm text-destructive hover:underline" 
            title="Delete Candidate"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export function CandidatesClient({ 
  initialCandidates, 
  activeCohort 
}: { 
  initialCandidates: CandidateType[], 
  activeCohort: { term: string, year: number } | null 
}) {
  const [candidates, setCandidates] = useState<CandidateType[]>(initialCandidates);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [editingCandidate, setEditingCandidate] = useState<CandidateType | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditSaving, setIsEditSaving] = useState(false);

  const [deletingCandidate, setDeletingCandidate] = useState<CandidateType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteSaving, setIsDeleteSaving] = useState(false);

  // Sync if initial props change (e.g. on navigation)
  useEffect(() => {
    setCandidates(initialCandidates);
    setHasChanges(false);
  }, [initialCandidates]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCandidates((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
      setHasChanges(true);
    }
  }

  const handleEditCandidate = (candidate: CandidateType) => {
    setEditingCandidate(candidate);
    setIsEditModalOpen(true);
  };

  const handleDeleteCandidate = (candidate: CandidateType) => {
    setDeletingCandidate(candidate);
    setIsDeleteDialogOpen(true);
  };

  const onSaveEdit = async (id: string, data: Partial<CandidateType>) => {
    setIsEditSaving(true);
    try {
      const result = await updateCandidateAction(id, data);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Candidate updated successfully!");
        setCandidates(current => current.map(c => c.id === id ? { ...c, ...data } : c));
        setIsEditModalOpen(false);
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsEditSaving(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!deletingCandidate) return;
    setIsDeleteSaving(true);
    try {
      const result = await deleteCandidateAction(deletingCandidate.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Candidate deleted successfully!");
        setCandidates(current => current.filter(c => c.id !== deletingCandidate.id));
        setIsDeleteDialogOpen(false);
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsDeleteSaving(false);
      setDeletingCandidate(null);
    }
  };

  const handleSortAlphabetical = () => {
    const sorted = [...candidates].sort((a, b) => {
      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
    setCandidates(sorted);
    setHasChanges(true);
    toast("Sorted Alphabetically", { description: "Click Save Order to persist changes." });
  };

  const handleRandomize = () => {
    const shuffled = [...candidates];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setCandidates(shuffled);
    setHasChanges(true);
    toast("Order Randomized", { description: "Click Save Order to persist changes." });
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    try {
      const orderedIds = candidates.map(c => c.id);
      const result = await updateCandidateOrderAction(orderedIds);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Candidate display order saved!");
        setHasChanges(false);
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Candidates</h1>
          <p className="text-muted-foreground mt-1">
            {activeCohort
              ? `${activeCohort.term} ${activeCohort.year} · ${candidates.length} candidates`
              : "No active cohort"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {candidates.length > 0 && (
            <>
              <Button onClick={handleSortAlphabetical} variant="secondary" size="sm">
                <SortAsc size={16} className="mr-2" />
                Alphabetical
              </Button>
              <Button onClick={handleRandomize} variant="secondary" size="sm">
                <Shuffle size={16} className="mr-2" />
                Randomize
              </Button>
            </>
          )}

          <Button asChild variant="outline" size="sm">
            <Link href="/protected/admin/import">
              <Upload size={16} className="mr-2" />
              Import CSV
            </Link>
          </Button>

          {hasChanges && (
            <Button onClick={handleSaveOrder} disabled={isSaving} size="sm" className="bg-primary text-primary-foreground animate-in fade-in zoom-in duration-200">
              {isSaving ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Save size={16} className="mr-2" />
              )}
              Save Order
            </Button>
          )}
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">No candidates yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Import candidates from a Google Sheets CSV export.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/protected/admin/import">
              <Upload size={16} className="mr-2" />
              Import from CSV
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-10 px-4 py-3"></th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  #
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Email
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Year
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <tbody className="bg-card">
                <SortableContext 
                  items={candidates.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {candidates.map((c) => (
                    <SortableCandidateRow 
                      key={c.id} 
                      candidate={c} 
                      onEdit={handleEditCandidate} 
                      onDelete={handleDeleteCandidate} 
                    />
                  ))}
                </SortableContext>
              </tbody>
            </DndContext>
            
          </table>
          <div className="bg-muted/30 p-2 text-xs text-muted-foreground text-center border-t">
            Drag rows by the handles to create a custom ordering. You must click Save Order for it to take effect for voters.
          </div>
        </div>
      )}

      {/* Modals outside of table flow */}
      <EditCandidateDialog 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        candidate={editingCandidate}
        onSave={onSaveEdit}
        isSaving={isEditSaving}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete candidate
              {" "} <span className="font-semibold text-foreground">{deletingCandidate?.first_name} {deletingCandidate?.last_name}</span>{" "}
              and remove all of their application responses, interview links, and submitted votes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleteSaving} onClick={() => setDeletingCandidate(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                onConfirmDelete();
              }}
              disabled={isDeleteSaving} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleteSaving ? "Deleting..." : "Delete Candidate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
