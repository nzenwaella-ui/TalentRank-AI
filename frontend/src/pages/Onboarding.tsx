import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { verifyInvite } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, CheckCircle2, Lock, ArrowLeft } from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ email: "", key: "", password: "" });

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await verifyInvite(formData.email, formData.key);
      setStep(2); 
    } catch (err: any) {
      setError(err.message || "Invalid email or invite key.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Silent login with bridge password
      const { error: loginError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: "Password123!" 
      });

      if (loginError) throw loginError;

      // 2. Overwrite with user's personal choice
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (updateError) throw updateError;

      // 3. Clear session and redirect to login or dashboard
      navigate("/dashboard");
    } catch (err: any) {
      setError("Activation failed. Make sure your password is secure.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl border shadow-xl animate-fade-in">
        
        <Link to="/sign-in" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Sign In
        </Link>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold font-display">Workspace Activation</h2>
          <p className="text-muted-foreground text-sm mt-1">Join your team's workspace</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label>Corporate Email</Label>
              <Input type="email" placeholder="name@company.com" required 
                onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Invite Key</Label>
              <Input placeholder="TR-XXXXXX" required className="font-mono"
                onChange={e => setFormData({...formData, key: e.target.value})} />
            </div>
            <Button className="w-full h-11" variant="hero" type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Verify Invite"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleCompleteActivation} className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-xs text-green-700 font-medium font-sans">Verified! Create your password below.</p>
            </div>
            <div className="space-y-2">
              <Label>Your Personal Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input type="password" placeholder="••••••••" className="pl-10" required 
                  onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
            </div>
            <Button className="w-full h-11" variant="hero" type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Finalize Account"}
            </Button>
          </form>
        )}
        
        {error && <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs text-center">{error}</div>}
      </div>
    </div>
  );
}