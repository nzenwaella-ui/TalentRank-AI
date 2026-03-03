import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertCircle } from "lucide-react";

export default function CreateWorkspace() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent double submission

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Attempt Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          // This tells Supabase NOT to wait for email confirmation 
          // (Works if you toggled the setting in Dashboard)
          emailRedirectTo: window.location.origin,
        }
      });

      if (authError) {
        // If Rate Limited, give the user a clear instruction
        if (authError.status === 429) {
          throw new Error("Supabase is rate-limiting requests. Please wait 5 minutes or use a different test email.");
        }
        throw authError;
      }

      if (authData.user) {
        // 2. Create Workspace
        const { error: wsError } = await supabase.from('workspaces').insert([
          { name: formData.name, admin_id: authData.user.id }
        ]);
        
        if (wsError) throw wsError;

        // 3. Success
        navigate("/dashboard");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">T</div>
          <h1 className="text-2xl font-bold font-display">Get Started</h1>
          <p className="text-muted-foreground text-sm">Create your workspace and start hiring</p>
        </div>

        {errorMsg && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-start gap-2 animate-in fade-in zoom-in-95">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="rounded-xl border bg-card p-8 shadow-sm space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Company Name</Label>
            <Input id="name" placeholder="Acme Corp" required value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Admin Email</Label>
            <Input id="email" type="email" placeholder="admin@company.com" required value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" required value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <Button className="w-full h-11" variant="hero" disabled={loading}>
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Create Workspace"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/sign-in" className="text-primary hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}