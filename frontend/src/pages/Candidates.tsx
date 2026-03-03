import { useState, useEffect } from "react";
import { Search, Upload, X, Loader2, Briefcase, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase"; 
import { cn } from "@/lib/utils";

const statusStyle: Record<string, string> = {
  new: "bg-slate-100 text-slate-600",
  screening: "bg-blue-100 text-blue-600",
  shortlisted: "bg-green-100 text-green-600",
  rejected: "bg-red-100 text-red-600",
};

export default function Candidates() {
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState<any | null>(null);

  useEffect(() => {
    async function fetchCandidates() {
      try {
        const { data, error } = await supabase
          .from("candidates")
          .select("*")
          .order("score", { ascending: false });
        if (error) throw error;
        setCandidates(data || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCandidates();
  }, []);

  // Filter logic matches backend keys
  const filtered = candidates.filter(c => 
    c.candidate_id?.toLowerCase().includes(search.toLowerCase()) ||
    c.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">Candidate Database</h1>
          <p className="text-sm text-muted-foreground">Manage and review AI-ranked talent profiles.</p>
        </div>
        <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import Resumes</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search Candidate ID or Role..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="pl-10 h-11" 
        />
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-24 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">Syncing with candidate records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Candidate ID</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Applied Role</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Experience</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Status</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider text-right">Match Score</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(c => (
                  <tr 
                    key={c.id} 
                    className="hover:bg-muted/50 cursor-pointer transition-all active:scale-[0.99]" 
                    onClick={() => setDrawer(c)}
                  >
                    <td className="p-4 font-mono font-bold text-primary">{c.candidate_id}</td>
                    <td className="p-4 text-foreground font-medium">{c.role || "Not Specified"}</td>
                    <td className="p-4 text-muted-foreground">{c.experience_years} Years</td>
                    <td className="p-4">
                      <Badge variant="outline" className={cn("border-none capitalize", statusStyle[c.status] || "bg-slate-100")}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-black text-lg">{c.score}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-out Candidate Drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawer(null)} />
          <div className="relative w-full max-w-md bg-card border-l h-full overflow-y-auto p-8 shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-8 border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold font-display">{drawer.candidate_id}</h2>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Blind Profile View</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDrawer(null)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-8">
              {/* Score Section */}
              <div className="flex justify-between items-center p-5 bg-primary/5 rounded-2xl border border-primary/10">
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase mb-1">AI Recommendation</p>
                  <p className="text-4xl font-black text-foreground">{drawer.score}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Current Status</p>
                  <Badge className={cn("border-none", statusStyle[drawer.status])}>{drawer.status}</Badge>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-xl">
                  <Briefcase className="h-4 w-4 mb-2 text-muted-foreground" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Experience</p>
                  <p className="font-bold">{drawer.experience_years} Years</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl">
                  <GraduationCap className="h-4 w-4 mb-2 text-muted-foreground" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Education</p>
                  <p className="font-bold truncate">{drawer.ai_feedback?.education || "N/A"}</p>
                </div>
              </div>

              {/* Skills Section */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3">Identified Technical Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {drawer.skills?.map((s: string) => (
                      <Badge key={s} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3">Soft Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {drawer.soft_skills?.map((s: string) => (
                      <Badge key={s} variant="outline" className="border-slate-200 text-slate-600">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                {drawer.missing_skills?.length > 0 && (
                  <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl">
                    <h3 className="text-xs font-bold uppercase text-red-500 mb-3">Missing Requirements</h3>
                    <div className="flex flex-wrap gap-2">
                      {drawer.missing_skills.map((s: string) => (
                        <Badge key={s} variant="outline" className="text-red-600 border-red-200 bg-white">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Feedback Section */}
              <div className="pt-4 border-t">
                <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">AI Ranking Explanation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {drawer.ai_feedback?.explanation || "No explanation provided."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}