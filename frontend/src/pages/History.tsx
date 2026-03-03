import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { 
  Clock, 
  ChevronRight, 
  Search, 
  Calendar, 
  Users, 
  Loader2,
  FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function History() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      try {
        // Fetch batches joined with job titles and candidate counts
        const { data, error } = await supabase
          .from('screening_batches')
          .select(`
            id,
            created_at,
            jobs (title),
            candidates (id)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBatches(data || []);
      } catch (err) {
        console.error("Error loading history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const filteredBatches = batches.filter(batch => 
    batch.jobs?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-display">Retrieving screening archives...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Screening History</h1>
          <p className="text-muted-foreground">Review and manage your past AI ranking sessions.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by job title..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredBatches.length === 0 ? (
          <div className="text-center p-20 border-2 border-dashed rounded-xl bg-card">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium">No sessions found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm ? "Try a different search term." : "Start your first screening to see it here!"}
            </p>
          </div>
        ) : (
          filteredBatches.map((batch) => (
            <div 
              key={batch.id}
              className="group bg-card border rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
              onClick={() => navigate("/screening-results", { state: { batchId: batch.id } })}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                      {batch.jobs?.title || "Untitled Position"}
                    </h3>
                    <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(batch.created_at).toLocaleDateString(undefined, { 
                          month: 'short', day: 'numeric', year: 'numeric' 
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {batch.candidates?.length || 0} Candidates
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="hidden md:block text-right">
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">
                      ID: {batch.id.split('-')[0]}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}