import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Loader2, UserPlus, ShieldCheck } from "lucide-react"; // Added Icons

export default function SignIn() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;
      navigate("/dashboard");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-lg">T</div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Sign In</h1>
          <p className="text-muted-foreground text-sm">Welcome back to TalentRank AI</p>
        </div>
        
        <form onSubmit={handleSignIn} className="rounded-xl border bg-card p-8 shadow-elevated space-y-5">
          <div className="space-y-2">
            <Label>Corporate Email</Label>
            <Input type="email" placeholder="you@company.com" required 
              onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" placeholder="••••••••" required 
              onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <Button className="w-full h-11" variant="hero" disabled={loading}>
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Sign In"}
          </Button>
        </form>

        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            New here? <Link to="/create-workspace" className="text-primary font-semibold hover:underline">Create a Workspace</Link>
          </p>

          {/* --- ADDED THIS SECTION --- */}
          <div className="pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Joining a team?</p>
            <Link 
              to="/onboarding" 
              className="inline-flex items-center justify-center gap-2 text-sm text-primary bg-primary/5 hover:bg-primary/10 px-4 py-2.5 rounded-lg w-full transition-all border border-primary/10 font-semibold"
            >
              <ShieldCheck className="h-4 w-4" />
              Have an invite key? Activate here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}