import { useState, useEffect } from "react";
import { Plus, Loader2, Mail, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase"; 
import { cn } from "@/lib/utils";

// Valid roles for your system
const roles = ["admin", "recruiter", "sourcer", "hrbp", "talent_acquisition", "hiring_manager", "interviewer", "viewer"];

export default function TeamAdmin() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [team, setTeam] = useState<any[]>([]);
  
  // Form State
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("recruiter");

  // 1. Fetch live team members from Supabase
  const fetchTeam = async () => {
    setLoading(true);
    try {
      // Note: In a production app, you'd fetch from a 'profiles' table 
      // as the 'auth.users' table is protected.
      const { data, error } = await supabase
        .from("profiles") 
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTeam(data || []);
    } catch (err) {
      console.error("Error fetching team:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  // 2. Handle the Invite Action (Calls your FastAPI main.py)
  const handleInvite = async () => {
    if (!email) return;
    setInviting(true);
    try {
      const response = await fetch("http://localhost:8000/invite", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          email: email,
          role: selectedRole
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setInviteOpen(false);
        setEmail("");
        fetchTeam(); // Refresh the list
        alert(`Invite sent! Code: ${result.invite_code}`);
      } else {
        alert(result.detail || "Failed to send invite");
      }
    } catch (err) {
      console.error("Invite error:", err);
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Team Admin</h1>
          <p className="text-sm text-muted-foreground">Manage internal users and access permissions.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Invite User
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading team records...</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Name</th>
                <th className="text-left p-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Email</th>
                <th className="text-left p-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Role</th>
                <th className="text-left p-4 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {team.map((m) => (
                <tr key={m.id} className="hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-medium">{m.full_name || "New User"}</td>
                  <td className="p-4 text-muted-foreground">{m.email}</td>
                  <td className="p-4">
                    <Badge variant="secondary" className="capitalize font-normal">
                      {m.role?.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "border-none capitalize",
                        m.status === "active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      )}
                    >
                      {m.status || "pending"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-xl font-bold">Invite Team Member</DialogTitle>
            <DialogDescription>
              New users will receive an email to activate their account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email"
                  className="pl-10"
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Permission Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r} value={r} className="capitalize">
                      {r.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)} disabled={inviting}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviting}>
              {inviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}