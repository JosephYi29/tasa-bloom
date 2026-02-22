"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, GripVertical, Trash2, Edit2, Check, X, Loader2 } from "lucide-react";
import { createQuestion, updateQuestion, deleteQuestion, toggleQuestionScorable } from "@/app/actions/questions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Question = {
  id: string;
  question_text: string;
  question_order: number;
  category: 'application' | 'interview';
  is_scorable: boolean;
};

export function QuestionManager({ cohortId, initialQuestions }: { cohortId: string, initialQuestions: Question[] }) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [activeTab, setActiveTab] = useState<'application' | 'interview'>('application');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggleScorable = async (id: string, currentScorable: boolean) => {
    setTogglingId(id);
    try {
      await toggleQuestionScorable(id, !currentScorable);
      setQuestions(questions.map(q => q.id === id ? { ...q, is_scorable: !currentScorable } : q));
    } catch (error) {
      console.error(error);
      alert("Failed to update question.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    
    setLoading(true);
    try {
      const categoryQuestions = questions.filter(q => q.category === activeTab);
      const order = categoryQuestions.length > 0 ? Math.max(...categoryQuestions.map(q => q.question_order)) + 1 : 1;
      await createQuestion(cohortId, newQuestionText.trim(), activeTab, order);
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      alert("Failed to create question.");
    } finally {
      setLoading(false);
      setNewQuestionText("");
    }
  };

  const handleUpdate = async (id: string, currentOrder: number) => {
    if (!editValue.trim()) return;
    setLoading(true);
    try {
      await updateQuestion(id, editValue.trim(), currentOrder);
      setQuestions(questions.map(q => q.id === id ? { ...q, question_text: editValue.trim() } : q));
      setEditingId(null);
    } catch (error) {
      console.error(error);
      alert("Failed to update question.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question? This will delete all associated candidate responses and scores!")) return;
    setLoading(true);
    try {
      await deleteQuestion(id);
      setQuestions(questions.filter(q => q.id !== id));
    } catch (error) {
      console.error(error);
      alert("Failed to delete question.");
    } finally {
      setLoading(false);
    }
  };

  const renderQuestionList = (category: 'application' | 'interview') => {
    const list = questions.filter(q => q.category === category).sort((a, b) => a.question_order - b.question_order);
    
    return (
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <h2 className="font-semibold capitalize">{category} Questions</h2>
          <p className="text-sm text-muted-foreground">These questions will appear on the voting ballots for the {category} evaluation phase.</p>
        </div>
        
        <div className="divide-y relative min-h-[100px]">
          {list.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No {category} questions defined for this cohort yet.
            </div>
          ) : (
            list.map((q) => (
              <div key={q.id} className={`flex items-center gap-3 p-4 hover:bg-muted/10 transition-colors ${!q.is_scorable ? 'opacity-50' : ''}`}>
                <GripVertical className="text-muted-foreground/30 w-5 h-5 flex-shrink-0 cursor-move" />
                
                {editingId === q.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input 
                      value={editValue} 
                      onChange={(e) => setEditValue(e.target.value)} 
                      className="h-8 shadow-none"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleUpdate(q.id, q.question_order)} disabled={loading}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={() => setEditingId(null)} disabled={loading}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <span className="font-medium">{q.question_text}</span>
                      {!q.is_scorable && (
                        <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Info Only</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5" title={q.is_scorable ? 'Scored by voters' : 'Info only — hidden from voting'}>
                        <span className="text-xs text-muted-foreground">Score</span>
                        <Switch
                          checked={q.is_scorable}
                          onCheckedChange={() => handleToggleScorable(q.id, q.is_scorable)}
                          disabled={togglingId === q.id}
                        />
                      </div>
                      <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity focus-within:opacity-100">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setEditingId(q.id); setEditValue(q.question_text); }} disabled={loading}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(q.id)} disabled={loading}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
              placeholder={`Add a new ${category} question...`}
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={!newQuestionText.trim() || loading} className="shrink-0 gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Question
            </Button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="application" value={activeTab} onValueChange={(val) => setActiveTab(val as 'application' | 'interview')}>
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="application">Application Questions</TabsTrigger>
          <TabsTrigger value="interview">Interview Questions</TabsTrigger>
        </TabsList>
        <TabsContent value="application" className="mt-6">
          {renderQuestionList('application')}
        </TabsContent>
        <TabsContent value="interview" className="mt-6">
          {renderQuestionList('interview')}
        </TabsContent>
      </Tabs>
    </div>
  );
}
