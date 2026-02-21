"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, GripVertical, Trash2, Edit2, Check, X, Loader2 } from "lucide-react";
import { createTrait, updateTrait, deleteTrait } from "@/app/actions/traits";

type Trait = {
  id: string;
  trait_name: string;
  trait_order: number;
};

export function TraitManager({ cohortId, initialTraits }: { cohortId: string, initialTraits: Trait[] }) {
  const [traits, setTraits] = useState<Trait[]>(initialTraits);
  const [newTraitName, setNewTraitName] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTraitName.trim()) return;
    
    setLoading(true);
    try {
      const order = traits.length > 0 ? Math.max(...traits.map(t => t.trait_order)) + 1 : 1;
      await createTrait(cohortId, newTraitName.trim(), order);
      window.location.reload(); // Quick refresh to get new ID from server
    } catch (error) {
      console.error(error);
      alert("Failed to create trait.");
    } finally {
      setLoading(false);
      setNewTraitName("");
    }
  };

  const handleUpdate = async (id: string, currentOrder: number) => {
    if (!editValue.trim()) return;
    setLoading(true);
    try {
      await updateTrait(id, editValue.trim(), currentOrder);
      setTraits(traits.map(t => t.id === id ? { ...t, trait_name: editValue.trim() } : t));
      setEditingId(null);
    } catch (error) {
      console.error(error);
      alert("Failed to update trait.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this trait? This will delete all associated scores!")) return;
    setLoading(true);
    try {
      await deleteTrait(id);
      setTraits(traits.filter(t => t.id !== id));
    } catch (error) {
      console.error(error);
      alert("Failed to delete trait.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <h2 className="font-semibold">Active Character Traits</h2>
          <p className="text-sm text-muted-foreground">These traits will appear on the voting ballots for the character evaluation phase.</p>
        </div>
        
        <div className="divide-y">
          {traits.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No character traits defined for this cohort yet.
            </div>
          ) : (
            traits.sort((a, b) => a.trait_order - b.trait_order).map((trait) => (
              <div key={trait.id} className="flex items-center gap-3 p-4 hover:bg-muted/10 transition-colors">
                <GripVertical className="text-muted-foreground/30 w-5 h-5 flex-shrink-0 cursor-move" />
                
                {editingId === trait.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input 
                      value={editValue} 
                      onChange={(e) => setEditValue(e.target.value)} 
                      className="h-8 shadow-none"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleUpdate(trait.id, trait.trait_order)} disabled={loading}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={() => setEditingId(null)} disabled={loading}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 font-medium">{trait.trait_name}</div>
                    <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity focus-within:opacity-100">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setEditingId(trait.id); setEditValue(trait.trait_name); }} disabled={loading}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(trait.id)} disabled={loading}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 bg-muted/10 border-t">
          <form onSubmit={handleCreate} className="flex gap-2">
            <Input
              placeholder="E.g., Leadership, Teamwork, Commitment..."
              value={newTraitName}
              onChange={(e) => setNewTraitName(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={!newTraitName.trim() || loading} className="shrink-0 gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Trait
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
