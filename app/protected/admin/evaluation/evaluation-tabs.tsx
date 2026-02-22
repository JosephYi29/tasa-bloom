"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TraitManager } from "@/app/protected/admin/settings/traits/trait-manager";
import { QuestionManager } from "@/app/protected/admin/settings/questions/question-manager";
import { Users, FileQuestion, MessageSquare } from "lucide-react";

type Trait = {
  id: string;
  trait_name: string;
  trait_order: number;
};

type Question = {
  id: string;
  question_text: string;
  question_order: number;
  category: 'application' | 'interview';
  is_scorable: boolean;
};

interface EvaluationTabsProps {
  cohortId: string;
  traits: Trait[];
  questions: Question[];
}

export function EvaluationTabs({ cohortId, traits, questions }: EvaluationTabsProps) {
  const applicationQuestions = questions.filter(q => q.category === 'application');
  const interviewQuestions = questions.filter(q => q.category === 'interview');

  return (
    <Tabs defaultValue="application">
      <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
        <TabsTrigger value="application" className="gap-2">
          <FileQuestion className="w-4 h-4" />
          Application
        </TabsTrigger>
        <TabsTrigger value="interview" className="gap-2">
          <MessageSquare className="w-4 h-4" />
          Interview
        </TabsTrigger>
        <TabsTrigger value="traits" className="gap-2">
          <Users className="w-4 h-4" />
          Character Traits
        </TabsTrigger>
      </TabsList>
      <TabsContent value="application" className="mt-6">
        <QuestionManager cohortId={cohortId} initialQuestions={applicationQuestions} category="application" />
      </TabsContent>
      <TabsContent value="interview" className="mt-6">
        <QuestionManager cohortId={cohortId} initialQuestions={interviewQuestions} category="interview" />
      </TabsContent>
      <TabsContent value="traits" className="mt-6">
        <TraitManager cohortId={cohortId} initialTraits={traits} />
      </TabsContent>
    </Tabs>
  );
}
