import { useState, useEffect } from "react";
import { Briefcase, Users, ScanSearch, Clock, ArrowRight, Plus, Upload, Loader2, ShieldCheck, UserPlus, LogOut } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox"; 
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { generateInvite } from "@/api";
import { chartData } from "@/lib/mock-data";

const HR_ROLES = [
  "Talent Acquisition Manager",
  "Technical Recruiter",
  "HR Business Partner",
  "Head of People & Culture",
  "Recruiting Coordinator",
  "HR Operations Specialist",
  "Chief People Officer"
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Recruiter");
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeScreenings: 0,
    candidatesRanked: 0,
    recentBatches: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  // Invite Form State 
  const [inviteData, setInviteData] = useState({ email: "", fullName: "", role: "", isAdmin: false });
  const [isInviting, setIsInviting] = useState(false);
  const [generatedKey, setGeneratedKey] = useState("");

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      navigate("/signin");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/signin");
    }
  };

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const namePart = user.email?.split('@')[0] || "Recruiter";
          setUserName(namePart);

          // Heartbeat: Update Last Login Activity in Backend
          fetch(`http://localhost:8000/update-activity?email=${user.email}`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }).catch(e => console.error("Activity sync failed", e));
        }

        const { count: jobsCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
        const { count: candidatesCount } = await supabase.from('candidates').select('*', { count: 'exact', head: true });
        const { data: batches } = await supabase
          .from('screening_batches')
          .select('*, jobs(title)')
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          totalJobs: jobsCount || 0,
          activeScreenings: batches?.length || 0,
          candidatesRanked: candidatesCount || 0,
          recentBatches: batches || [],
        });
      } catch (error) {
        console.error("Dashboard load error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const handleInviteHR = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setGeneratedKey("");
    try {
      // Logic: Now passing email, role, and the isAdmin boolean to the API
      const result = await generateInvite(inviteData.email, inviteData.role, inviteData.isAdmin);
      
      // Capture the invite_code from the backend response
      if (result && result.invite_code) {
        setGeneratedKey(result.invite_code);
      }
    } catch (error) {
      console.error("Invite Error:", error);
      alert("Failed to generate invite. Check console for details.");
    } finally {
      setIsInviting(false);
    }
  };

  const kpis = [
    { label: "Active Jobs", value: stats.totalJobs, icon: Briefcase, change: "Live from DB" },
    { label: "Active Screenings", value: stats.activeScreenings, icon: ScanSearch, change: "Recent sessions" },
    { label: "Candidates Ranked", value: stats.candidatesRanked, icon: Users, change: "Across all jobs" },
    { label: "Avg. Match Score", value: `74%`, icon: Clock, change: "AI Performance" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-display">Syncing workspace data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="rounded-2xl gradient-hero p-8 text-primary-foreground relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-2">
            <h1 className="font-display text-3xl font-bold mb-2 capitalize">Welcome back, {userName} 👋</h1>
            <Button variant="ghost" className="text-primary-foreground hover:bg-white/10" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
          <p className="text-primary-foreground/80 text-lg max-w-xl">
            You have {stats.activeScreenings} recent screenings and {stats.candidatesRanked} total candidates ranked.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Button variant="hero" className="bg-card/20 backdrop-blur-sm border border-primary-foreground/20 hover:bg-card/30" asChild>
              <Link to="/screening"><Upload className="mr-2 h-4 w-4" />Start Screening</Link>
            </Button>
            <Button variant="hero" className="bg-card/15 backdrop-blur-sm border border-primary-foreground/20 hover:bg-card/25" asChild>
              <Link to="/jobs"><Plus className="mr-2 h-4 w-4" />Create Job</Link>
            </Button>
            <Button variant="hero" className="bg-card/10 backdrop-blur-sm border border-primary-foreground/20 hover:bg-card/20" asChild>
              <Link to="/settings"><ShieldCheck className="mr-2 h-4 w-4" />Workspace Settings</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2 mb-6">
          <UserPlus className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">Invite Associate Recruiter</h3>
        </div>
        <form onSubmit={handleInviteHR} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Full Legal Name</Label>
              <Input 
                placeholder="e.g. Alexander Pierce" 
                value={inviteData.fullName} 
                onChange={e => setInviteData({...inviteData, fullName: e.target.value})} 
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Corporate Email</Label>
              <Input 
                type="email" 
                placeholder="pierce@company.com" 
                value={inviteData.email} 
                onChange={e => setInviteData({...inviteData, email: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Functional HR Role</Label>
              <Select onValueChange={(val) => setInviteData({...inviteData, role: val})}>
                <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                <SelectContent>
                  {HR_ROLES.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="admin-toggle" 
                checked={inviteData.isAdmin} 
                onCheckedChange={(checked) => setInviteData({...inviteData, isAdmin: checked as boolean})}
              />
              <label htmlFor="admin-toggle" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Grant Administrative Privileges
              </label>
            </div>
            <Button className="md:w-64" variant="hero" disabled={isInviting}>
              {isInviting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Generate Invite Key"}
            </Button>
          </div>
        </form>
        
        {generatedKey && (
          <div className="mt-4 p-4 bg-secondary/10 border border-secondary/20 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div>
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Access Key Generated</p>
              <p className="font-mono text-lg font-bold">{generatedKey}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => {
              navigator.clipboard.writeText(generatedKey);
              alert("Key copied to clipboard!");
            }}>Copy Key</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="kpi-card border bg-card p-5 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-4">
              <kpi.icon className="h-5 w-5 text-accent-foreground" />
            </div>
            <p className="text-2xl font-display font-bold">{kpi.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{kpi.label}</p>
            <p className="text-xs text-secondary mt-2 font-medium">{kpi.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card p-6 shadow-card">
          <h3 className="font-display font-semibold text-lg mb-4">Applications Over Time</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 90%)" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="applications" stroke="hsl(238 75% 55%)" fillOpacity={0.1} fill="hsl(238 75% 55%)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-card">
          <h3 className="font-display font-semibold text-lg mb-4">Hires by Month</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 90%)" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hires" fill="hsl(172 66% 40%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-lg">Recent Screening Sessions</h3>
          <Button variant="ghost" size="sm" asChild><Link to="/screening-results">View All <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>
        <div className="space-y-3">
          {stats.recentBatches.map((batch) => (
            <div key={batch.id} className="flex items-center justify-between py-3 border-b last:border-b-0 hover:bg-accent/50 px-2 rounded-lg cursor-pointer transition-all" onClick={() => navigate("/screening-results", { state: { batchId: batch.id } })}>
              <div className="flex flex-col">
                <p className="text-sm font-medium">{batch.jobs?.title || 'System Position'}</p>
                <p className="text-[10px] font-mono text-muted-foreground">ID: {batch.id.split('-')[0]}</p>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(batch.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}