"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2 } from "lucide-react";
import { createPosition, togglePosition } from "./actions";

type Position = {
  id: string;
  name: string;
  is_admin: boolean;
  is_active: boolean;
};

export function PositionManager({ initialPositions }: { initialPositions: Position[] }) {
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setLoading(true);
    try {
      await createPosition(newName.trim());
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert(`Failed to create position: ${(error as Error).message}`);
    } finally {
      setLoading(false);
      setNewName("");
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    setTogglingId(id);
    try {
      await togglePosition(id, !currentActive);
      setPositions(positions.map(p => p.id === id ? { ...p, is_active: !currentActive } : p));
    } catch (error) {
      console.error(error);
      alert("Failed to toggle position.");
    } finally {
      setTogglingId(null);
    }
  };

  const activePositions = positions.filter(p => p.is_active);
  const inactivePositions = positions.filter(p => !p.is_active);

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <h2 className="font-semibold">Active Positions</h2>
          <p className="text-sm text-muted-foreground">These positions are available when assigning board members.</p>
        </div>

        <div className="divide-y">
          {activePositions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No active positions.
            </div>
          ) : (
            activePositions.map((pos) => (
              <div key={pos.id} className="flex items-center gap-3 p-4 hover:bg-muted/10 transition-colors">
                <div className="flex-1 flex items-center gap-2">
                  <span className="font-medium">{pos.name}</span>
                  {pos.is_admin && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                      Admin
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Active</span>
                  <Switch
                    checked={pos.is_active}
                    onCheckedChange={() => handleToggle(pos.id, pos.is_active)}
                    disabled={togglingId === pos.id}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-muted/10 border-t">
          <form onSubmit={handleCreate} className="flex gap-2">
            <Input
              placeholder="New position name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={!newName.trim() || loading} className="shrink-0 gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Position
            </Button>
          </form>
        </div>
      </div>

      {inactivePositions.length > 0 && (
        <div className="bg-card border rounded-lg overflow-hidden opacity-75">
          <div className="p-4 border-b bg-muted/30">
            <h2 className="font-semibold text-muted-foreground">Inactive Positions</h2>
            <p className="text-sm text-muted-foreground">These positions are hidden from assignment dropdowns but preserved for historical records.</p>
          </div>

          <div className="divide-y">
            {inactivePositions.map((pos) => (
              <div key={pos.id} className="flex items-center gap-3 p-4 hover:bg-muted/10 transition-colors">
                <div className="flex-1 flex items-center gap-2">
                  <span className="font-medium text-muted-foreground">{pos.name}</span>
                  {pos.is_admin && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                      Admin
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Inactive</span>
                  <Switch
                    checked={pos.is_active}
                    onCheckedChange={() => handleToggle(pos.id, pos.is_active)}
                    disabled={togglingId === pos.id}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
