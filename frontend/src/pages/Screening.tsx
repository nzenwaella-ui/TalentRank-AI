import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { rankResumes } from "@/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Job } from "@/lib/mock-data";

export default function Screening() {
  const [step, setStep] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [realJobs, setRealJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchJobs() {
      const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
      if (data) setRealJobs(data as any);
    }
    fetchJobs();
  }, []);

  const selectedJob = realJobs.find(j => j.id === selectedJobId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setRawFiles(Array.from(e.target.files));
      setError(null);
    }
  };

  const handleRunScreening = async () => {
    if (!selectedJobId || rawFiles.length === 0) return;
    setIsProcessing(true);
    setError(null);
    
    try {
      if (!selectedJob?.description) throw new Error("Job description missing");

      // 1. Create batch record
      const { data: batch, error: batchError } = await supabase
        .from('screening_batches')
        .insert({ job_id: selectedJobId })
        .select()
        .single();

      if (batchError) throw batchError;

      // 2. Call AI
      const results = await rankResumes(rawFiles, selectedJob.description);

      // 3. Map Results (FIXED SCORE AND FIELDS)
      const candidateInserts = results.map((res: any) => ({
        job_id: selectedJobId,
        batch_id: batch.id,
        candidate_id: res.candidate_id,
        name: res.candidate_id, // Important for Results UI
        resume_hash: res.resume_hash,
        score: res.score, // No more * 100 here
        experience_years: res.experience_years,
        role: res.role,
        ai_feedback: {
          explanation: res.explanation,
          skills: res.details?.skills || [],
          soft_skills: res.details?.soft_skills || [],
          missing: res.details?.missingSkills || [],
          education: res.details?.education || "N/A",
          experience: res.details?.experience || "N/A"
        },
        status: res.score === 0 ? "rejected" : "new",
        skills: res.details?.skills || [],
        missing_skills: res.details?.missingSkills || [],
        soft_skills: res.details?.soft_skills || []
      }));

      // 4. Save
      const { error: insertError } = await supabase.from('candidates').insert(candidateInserts);
      if (insertError) throw insertError;

      await supabase.rpc('increment_applicants', { job_id: selectedJobId });
      
      navigate("/screening-results", { state: { batchId: batch.id } }); 

    } catch (err: any) {
      console.error("Screening failed:", err);
      setError(err.message || "Connection to AI backend failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in p-6">
      <div className="space-y-2 text-center md:text-left">
        <h1 className="font-display text-3xl font-bold">AI Resume Screening</h1>
        <p className="text-muted-foreground">Select a job and upload resumes to rank them using TalentRank AI.</p>
      </div>

      <div className="flex items-center justify-center md:justify-start gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step >= i ? 'bg-primary border-primary text-primary-foreground' : 'border-muted text-muted-foreground'}`}>
              {step > i ? <CheckCircle2 className="h-5 w-5" /> : i}
            </div>
            <span className={`text-sm font-medium ${step >= i ? 'text-foreground' : 'text-muted-foreground'}`}>{i === 1 ? 'Upload & Select' : 'Confirm & Run'}</span>
            {i === 1 && <div className="h-px w-12 bg-muted mx-2" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p>{error} - Check if <code>uvicorn main:app</code> is running.</p>
        </div>
      )}

      {step === 1 ? (
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Target Job Position</label>
            <Select onValueChange={setSelectedJobId} value={selectedJobId}>
              <SelectTrigger className="w-full md:w-[400px]"><SelectValue placeholder="Select a job position" /></SelectTrigger>
              <SelectContent>
                {realJobs.map(job => (<SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-2 border-dashed border-muted rounded-2xl p-16 text-center space-y-4 hover:border-primary/50 transition-all bg-card/50">
            <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center"><Upload className="h-8 w-8 text-muted-foreground" /></div>
            <div>
              <p className="text-base font-semibold">Click to upload resumes or drag and drop</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT, or Scanned Images</p>
            </div>
            <input type="file" multiple className="hidden" id="resume-upload" accept=".pdf,.docx,.txt,image/*" onChange={handleFileChange} />
            <Button variant="outline" className="px-8" onClick={() => document.getElementById('resume-upload')?.click()}>Select Files</Button>
          </div>

          {rawFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-bold">{rawFiles.length} file(s) selected:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {rawFiles.map((f, i) => (<div key={i} className="flex items-center gap-2 text-sm text-muted-foreground bg-card border p-3 rounded-xl shadow-sm"><FileText className="h-4 w-4 text-primary" /> <span className="truncate">{f.name}</span></div>))}
              </div>
            </div>
          )}
          <div className="flex justify-end pt-4"><Button className="w-full md:w-auto" disabled={!selectedJobId || rawFiles.length === 0} onClick={() => setStep(2)}>Review & Start</Button></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-card p-8 rounded-2xl space-y-6 border shadow-sm">
            <h3 className="font-bold text-xl">Confirm Screening Details</h3>
            <div className="grid grid-cols-2 gap-y-4 text-sm border-b pb-6">
              <div className="text-muted-foreground font-medium">Position:</div><div className="font-bold text-primary">{selectedJob?.title}</div>
              <div className="text-muted-foreground font-medium">Total Resumes:</div><div className="font-bold">{rawFiles.length} candidates</div>
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-muted-foreground mb-3 tracking-widest">Active Job Description</p>
               <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg italic line-clamp-4">{(selectedJob as any)?.description}</div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between gap-4 pt-4">
            <Button variant="ghost" className="w-full md:w-auto" onClick={() => setStep(1)} disabled={isProcessing}>Back to Selection</Button>
            <Button className="w-full md:px-12 h-12 text-lg" onClick={handleRunScreening} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing {rawFiles.length} Resumes...
                </>
              ) : (
                "Launch AI Ranking"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}