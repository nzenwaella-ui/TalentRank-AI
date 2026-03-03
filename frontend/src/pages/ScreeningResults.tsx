import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, X, Loader2 } from "lucide-react";

function scoreColor(score: number) {
  if (score >= 85) return "text-secondary";
  if (score >= 65) return "text-primary";
  return "text-destructive";
}

export default function ScreeningResults() {
  const location = useLocation();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const batchId = location.state?.batchId;

  // Toggle Logic: If clicking an already active status, it reverts to 'new'
  const handleStatusUpdate = async (id: string, currentStatus: string, clickedStatus: "shortlisted" | "rejected") => {
    const newStatus = currentStatus === clickedStatus ? 'new' : clickedStatus;
    
    try {
      // Get current user info to track who is taking action
      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.email?.split('@')[0] || "System";

      const { error } = await supabase
        .from('candidates')
        .update({ 
          status: newStatus,
          shortlisted_by_name: newStatus === 'shortlisted' ? userName : null 
        })
        .eq('id', id);

      if (error) throw error;
      
      setCandidates(prev => prev.map(c => 
        c.id === id ? { ...c, status: newStatus, shortlisted_by_name: newStatus === 'shortlisted' ? userName : null } : c
      ));
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  useEffect(() => {
    async function fetchResults() {
      if (!batchId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('candidates')
        .select('*, jobs(title)')
        .eq('batch_id', batchId) 
        .order('score', { ascending: false });

      if (error) console.error("Error fetching results:", error);
      else if (data) setCandidates(data);
      
      setLoading(false);
    }
    fetchResults();
  }, [batchId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-display">AI Brain is rank-ordering your candidates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold">Screening Results</h1>
      <p className="text-muted-foreground">
        AI-ranked candidates for <span className="font-semibold text-foreground">
          {candidates[0]?.jobs?.title || "Selected Position"}
        </span>
      </p>

      <div className="space-y-4">
        {candidates.length === 0 ? (
          <div className="text-center p-12 border rounded-xl bg-card text-muted-foreground">
            No results found for this session.
          </div>
        ) : (
          candidates.map((r, i) => (
            <div key={r.id} className={cn(
              "rounded-xl border bg-card p-6 shadow-card transition-all",
              r.status === "rejected" && "opacity-60 grayscale border-destructive/20 scale-[0.98]",
              r.status === "shortlisted" && "border-secondary/50 bg-secondary/5 ring-1 ring-secondary/20"
            )}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-lg",
                    i === 0 && r.score > 0 ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    #{i + 1}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg">{r.name}</h3>
                    <div className="flex gap-1.5 mt-1 flex-wrap items-center">
                      <Badge variant="outline" className="bg-background">
                        {r.ai_feedback?.education || "N/A"}
                      </Badge>
                      <Badge variant="outline" className="bg-accent/30 italic text-[10px]">
                        {r.ai_feedback?.experience || "N/A"}
                      </Badge>
                      {r.status !== "new" && (
                         <div className="flex flex-col items-start">
                           <Badge className={cn("text-[10px]", r.status === "shortlisted" ? "bg-secondary" : "bg-destructive")}>
                             {r.status.toUpperCase()}
                           </Badge>
                           {r.status === "shortlisted" && r.shortlisted_by_name && (
                             <span className="text-[9px] text-muted-foreground mt-0.5">by {r.shortlisted_by_name}</span>
                           )}
                         </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className={cn("text-3xl font-display font-bold", scoreColor(r.score))}>
                      {r.score}%
                    </p>
                    <p className="text-xs text-muted-foreground">AI Score</p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      size="sm" 
                      variant={r.status === "shortlisted" ? "secondary" : "outline"}
                      className="h-8"
                      onClick={() => handleStatusUpdate(r.id, r.status, "shortlisted")}
                    >
                      <Check className="w-4 h-4 mr-1" /> {r.status === "shortlisted" ? "Shortlisted" : "Shortlist"}
                    </Button>
                    <Button 
                      size="sm" 
                      variant={r.status === "rejected" ? "destructive" : "outline"}
                      className="h-8"
                      onClick={() => handleStatusUpdate(r.id, r.status, "rejected")}
                    >
                      <X className="w-4 h-4 mr-1" /> {r.status === "rejected" ? "Rejected" : "Reject"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <p className="font-medium text-secondary mb-1">✓ Parsed Tech Skills</p>
                  <ul className="space-y-0.5 text-muted-foreground">
                    {r.ai_feedback?.skills?.length > 0 
                      ? r.ai_feedback.skills.map((skill: string, j: number) => <li key={j}>• {skill}</li>)
                      : <li>• Skills not extracted</li>
                    }
                  </ul>
                  {r.ai_feedback?.soft_skills?.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium text-primary mb-1">✨ Soft Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {r.ai_feedback.soft_skills.map((ss: string, j: number) => (
                          <Badge key={j} variant="secondary" className="text-[10px] px-1 py-0">{ss}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {r.ai_feedback?.missing?.length > 0 && (
                  <div>
                    <p className="font-medium text-destructive mb-1">✗ Missing Requirements</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      {r.ai_feedback.missing.map((m: string, j: number) => <li key={j}>• {m}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 rounded-lg bg-accent text-sm">
                <span className="font-medium text-accent-foreground">💡 AI Insight: </span>
                <span className="text-accent-foreground">{r.ai_feedback?.explanation}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}