import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AcceptInvite() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-xl font-bold text-primary-foreground">T</span>
          </div>
          <h1 className="font-display text-2xl font-bold">Accept Invitation</h1>
          <p className="text-muted-foreground mt-1">You've been invited to join a TalentRank AI workspace</p>
        </div>
        <div className="rounded-xl border bg-card p-8 shadow-elevated space-y-4">
          <div><Label>Invite Token</Label><Input placeholder="Paste your invite token" /></div>
          <div><Label>Set Password</Label><Input type="password" placeholder="••••••••" /></div>
          <div><Label>Confirm Password</Label><Input type="password" placeholder="••••••••" /></div>
          <Button className="w-full" variant="hero">Join Workspace</Button>
        </div>
      </div>
    </div>
  );
}
