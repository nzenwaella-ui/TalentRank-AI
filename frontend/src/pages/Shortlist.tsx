import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserCheck } from "lucide-react";

export default function Shortlist() {
  const [shortlisted, setShortlisted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShortlist() {
      // Fetches candidates where status is 'shortlisted' across ALL batches
      const { data, error } = await supabase
        .from('candidates')
        .select('*, jobs(title)')
        .eq('status', 'shortlisted')
        .order('created_at', { ascending: false });

      if (error) console.error("Error fetching shortlist:", error);
      else if (data) setShortlisted(data);
      setLoading(false);
    }
    fetchShortlist();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <UserCheck className="h-8 w-8 text-secondary" />
        <h1 className="font-display text-2xl font-bold">Shortlisted Talent</h1>
      </div>

      <div className="grid gap-4">
        {shortlisted.length === 0 ? (
          <div className="text-center p-20 border-2 border-dashed rounded-xl text-muted-foreground">
            No candidates have been shortlisted yet.
          </div>
        ) : (
          shortlisted.map((candidate) => (
            <div key={candidate.id} className="bg-card border rounded-xl p-5 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <h3 className="font-bold text-lg">{candidate.name}</h3>
                <p className="text-sm text-muted-foreground">Position: {candidate.jobs?.title}</p>
                <div className="flex gap-2 pt-2">
                  <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">
                    Match: {candidate.score}%
                  </Badge>
                  <Badge variant="outline">{candidate.ai_feedback?.education}</Badge>
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                Added: {new Date(candidate.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}