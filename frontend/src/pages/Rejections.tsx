import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { UserX, RefreshCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Rejections() {
  const [rejectedList, setRejectedList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRejections = async () => {
    const { data, error } = await supabase
      .from('candidates')
      .select('*, jobs(title)')
      .eq('status', 'rejected')
      .order('created_at', { ascending: false });

    if (!error && data) setRejectedList(data);
    setLoading(false);
  };

  useEffect(() => { fetchRejections(); }, []);

  const handleRestore = async (id: string) => {
    const { error } = await supabase
      .from('candidates')
      .update({ status: 'new' })
      .eq('id', id);

    if (!error) {
      setRejectedList(prev => prev.filter(c => c.id !== id));
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <UserX className="h-8 w-8 text-destructive" />
        <h1 className="font-display text-2xl font-bold">Rejected Candidates</h1>
      </div>

      <div className="grid gap-4">
        {rejectedList.length === 0 ? (
          <div className="text-center p-20 border-2 border-dashed rounded-xl text-muted-foreground">
            No candidates in the rejection pool.
          </div>
        ) : (
          rejectedList.map((candidate) => (
            <div key={candidate.id} className="bg-card border border-destructive/10 rounded-xl p-5 flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
              <div className="space-y-1">
                <h3 className="font-bold text-lg">{candidate.name}</h3>
                <p className="text-sm text-muted-foreground">Role: {candidate.jobs?.title}</p>
                <div className="flex gap-2 pt-2">
                  <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                    Match: {candidate.score}%
                  </Badge>
                  <Badge variant="outline">Missing Tech Skills</Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleRestore(candidate.id)}>
                <RefreshCcw className="w-4 h-4 mr-2" /> Restore
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}