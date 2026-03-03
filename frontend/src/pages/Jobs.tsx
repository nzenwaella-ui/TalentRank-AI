import { useState, useEffect } from "react";
import { Plus, Search, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { Job } from "@/lib/mock-data";

const statusColors: Record<string, string> = {
  open: "bg-secondary/15 text-secondary border-secondary/30",
  closed: "bg-muted text-muted-foreground",
  draft: "bg-accent text-accent-foreground",
};

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [dept, setDept] = useState("");
  const [loc, setLoc] = useState("");
  const [status, setStatus] = useState("draft");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setJobs(data as any);
    setIsLoading(false);
  }

  const handleCreateJob = async () => {
    setIsSubmitting(true);
    const { data, error } = await supabase
      .from('jobs')
      .insert([{
        title,
        department: dept,
        location: loc,
        status,
        description,
        applicants: 0
      }])
      .select();

    if (!error) {
      setJobs([data[0] as any, ...jobs]);
      setCreateOpen(false);
      // Reset fields
      setTitle(""); setDept(""); setLoc(""); setDescription("");
    }
    setIsSubmitting(false);
  };

  const filtered = jobs.filter(j => j.title.toLowerCase().includes(search.toLowerCase()));
  const detail = jobs.find(j => j.id === selectedJob);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Jobs</h1>
        <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />Create Job</Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button variant="outline"><Filter className="mr-2 h-4 w-4" />Filters</Button>
      </div>

      <div className="rounded-xl border bg-card shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-semibold">Title</th>
              <th className="text-left p-4 font-semibold">Department</th>
              <th className="text-left p-4 font-semibold">Location</th>
              <th className="text-left p-4 font-semibold">Status</th>
              <th className="text-left p-4 font-semibold">Applicants</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(job => (
              <tr key={job.id} className="border-b hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelectedJob(job.id)}>
                <td className="p-4 font-medium">{job.title}</td>
                <td className="p-4 text-muted-foreground">{job.department}</td>
                <td className="p-4 text-muted-foreground">{job.location}</td>
                <td className="p-4"><Badge variant="outline" className={statusColors[job.status]}>{job.status}</Badge></td>
                <td className="p-4">{job.applicants || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Job Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
            <DialogDescription>Fill in the details to create a new job posting.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Job Title</Label><Input placeholder="e.g. Senior Software Engineer" value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div><Label>Department</Label><Input placeholder="e.g. Engineering" value={dept} onChange={e => setDept(e.target.value)} /></div>
            <div><Label>Location</Label><Input placeholder="e.g. San Francisco, CA" value={loc} onChange={e => setLoc(e.target.value)} /></div>
            {/* Added back the description per your instruction */}
            <div><Label>Job Description (Required for AI)</Label><Textarea placeholder="Paste details here..." value={description} onChange={e => setDescription(e.target.value)} /></div>
            <div><Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="open">Open</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateJob} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Create Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Detail Modal */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detail?.title}</DialogTitle>
            <DialogDescription>{detail?.department} · {detail?.location}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="italic text-muted-foreground">{detail?.description}</p>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="outline" className={statusColors[detail?.status || "draft"]}>{detail?.status}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Applicants</span><span className="font-medium">{detail?.applicants || 0}</span></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}