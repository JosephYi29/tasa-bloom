"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, UserPlus } from "lucide-react";
import { addBoardMember, removeBoardMember } from "@/app/actions/board";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface BoardMember {
  userId: string;
  name: string;
  positionId: string;
  positionName: string;
  isAdmin: boolean;
}

interface Position {
  id: string;
  name: string;
  is_admin: boolean;
}

interface ProfileOption {
  id: string;
  name: string;
}

export function BoardList({ 
  members, 
  positions,
  availableProfiles
}: { 
  members: BoardMember[],
  positions: Position[],
  availableProfiles: ProfileOption[]
}) {
  const [open, setOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [loading, setLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !selectedPosition) return;

    setLoading(true);
    try {
      await addBoardMember(selectedProfile, selectedPosition);
      setOpen(false);
      setSelectedProfile("");
      setSelectedPosition("");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member from the active cohort?")) return;
    
    setRemoveLoading(userId);
    try {
      await removeBoardMember(userId);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setRemoveLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Action Bar */}
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Board Member</DialogTitle>
              <DialogDescription>
                Select a registered user to add them to the current active cycle. Users must have signed up and completed their profile first.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="profile">User</Label>
                  <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                    <SelectTrigger id="profile">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProfiles.length === 0 ? (
                        <SelectItem value="none" disabled>No unregistered profiles available</SelectItem>
                      ) : (
                        availableProfiles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="position">Position</Label>
                  <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                    <SelectTrigger id="position">
                      <SelectValue placeholder="Select a position" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((pos) => (
                        <SelectItem key={pos.id} value={pos.id}>
                          {pos.name} {pos.is_admin && "(Admin)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !selectedProfile || selectedProfile === "none" || !selectedPosition}>
                  {loading ? "Adding..." : "Add Member"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Member List */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <div className="grid grid-cols-12 gap-4 p-4 font-semibold border-b border-border bg-muted/50 text-muted-foreground text-sm">
          <div className="col-span-5">Name</div>
          <div className="col-span-5">Position</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        
        <div className="divide-y divide-border">
          {members.map((member) => (
            <div key={member.userId} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/20 transition-colors">
              <div className="col-span-5 font-medium">
                {member.name}
              </div>
              <div className="col-span-5 flex items-center gap-2">
                {member.positionName}
                {member.isAdmin && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>
              <div className="col-span-2 text-right">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemove(member.userId)}
                  disabled={removeLoading === member.userId}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No board members added to this cycle yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
