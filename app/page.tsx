import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Users, ClipboardCheck, ArrowRight } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If already logged in, take them straight to the dashboard
  if (user) {
    redirect("/protected");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center selection:bg-primary/20">
      
      {/* Navigation Bar */}
      <nav className="w-full flex justify-center border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="w-full max-w-6xl flex justify-between items-center h-16 px-4 md:px-6">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            🌸 TASA Bloom
          </div>
          <div className="flex gap-4 items-center">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Sign up</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 w-full flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4 pt-20 pb-24 md:pt-32 md:pb-32 text-center">
        <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles size={14} />
            <span>Internal Board Evaluation Platform</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
            Streamline the <span className="text-primary">Junior Officer</span> Selection Process
          </h1>
          
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Review applications, evaluate interviews, and rate character traits in one centralized, secure dashboard. Discard the spreadsheets.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="/auth/login">
                Access Dashboard <ArrowRight size={16} className="ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-background" asChild>
              <Link href="/auth/sign-up">
                Request Board Access
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Features Showcase */}
      <section className="w-full border-t border-border bg-card py-24 px-4 md:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Users size={32} />
            </div>
            <h3 className="text-xl font-bold">Consolidated Data</h3>
            <p className="text-muted-foreground leading-relaxed">
              Import Google Forms applications via CSV. Keep candidate profiles, responses, and interview video links in one secure location.
            </p>
          </div>
          
          <div className="flex flex-col items-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <ClipboardCheck size={32} />
            </div>
            <h3 className="text-xl font-bold">Standardized Voting</h3>
            <p className="text-muted-foreground leading-relaxed">
              Rate candidates systematically from 1-10 on applications, interviews, and customized character traits like &quot;Logistical Ability.&quot;
            </p>
          </div>
          
          <div className="flex flex-col items-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles size={32} />
            </div>
            <h3 className="text-xl font-bold">Blind Evaluation</h3>
            <p className="text-muted-foreground leading-relaxed">
              Board members cannot see each others&apos; scores until finalized. Admins retain full visibility to aggregate results.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-sm text-muted-foreground border-t border-border">
        <p>Built for the Taiwanese American Student Association.</p>
      </footer>
    </div>
  );
}
