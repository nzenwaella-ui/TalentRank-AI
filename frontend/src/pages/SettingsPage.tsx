import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom"; // To redirect after deletion
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, UserCheck, Trash2, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        setFullName(profile?.full_name || user.email?.split('@')[0] || "");
      }
      setLoading(false);
    }
    loadUserData();
  }, []);

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingUser(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);

      if (profileError) throw profileError;

      if (newPassword) {
        const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
        if (authError) throw authError;
        setNewPassword("");
      }
      alert("Account updated!");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you absolutely sure? This will remove your profile and sign you out. This action cannot be undone."
    );
    
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Delete from our profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (profileError) throw profileError;

      // 2. Sign Out (The user record in Auth will remain unless deleted via Backend Admin API)
      await supabase.auth.signOut();
      
      alert("Account data removed. You have been signed out.");
      navigate("/signup");
    } catch (error: any) {
      alert("Error during deletion: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground italic">Fetching credentials...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8 animate-fade-in pb-20">
      <h1 className="font-display text-2xl font-bold">Settings</h1>

      {/* Organization Section */}
      <section className="rounded-xl border bg-card p-6 shadow-card space-y-4">
        <h2 className="font-display font-semibold text-lg">Organization</h2>
        <div className="space-y-1">
          <Label>Workspace Name</Label>
          <Input defaultValue="TalentRank AI" />
        </div>
        <div className="space-y-1">
          <Label>Company Domain</Label>
          <Input defaultValue="talentrank.ai" />
        </div>
        <Button variant="outline" className="gap-2">
          <Save className="h-4 w-4" /> Save Changes
        </Button>
      </section>

      {/* Account Section */}
      <section className="rounded-xl border bg-card p-6 shadow-card space-y-4">
        <h2 className="font-display font-semibold text-lg">Account Details</h2>
        <form onSubmit={handleUpdateAccount} className="space-y-4">
          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={email} disabled className="bg-muted/50 cursor-not-allowed" />
          </div>
          <div className="space-y-1">
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <Button type="submit" variant="hero" disabled={updatingUser}>
            {updatingUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
            Update Account
          </Button>
        </form>
      </section>

      {/* Danger Zone */}
      <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 space-y-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="font-display font-semibold text-lg">Danger Zone</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Deleting your account will remove your personal profile from the TalentRank database. 
          Workspace data may still be retained by your organization.
        </p>
        <Button 
          variant="destructive" 
          className="gap-2" 
          onClick={handleDeleteAccount}
          disabled={isDeleting}
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete My Account
        </Button>
      </section>
    </div>
  );
}