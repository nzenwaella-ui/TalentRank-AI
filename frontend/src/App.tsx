import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Candidates from "./pages/Candidates";
import Screening from "./pages/Screening";
import ScreeningResults from "./pages/ScreeningResults";
import Shortlist from "./pages/Shortlist";
import TeamAdmin from "./pages/TeamAdmin";
import SettingsPage from "./pages/SettingsPage";
import SignIn from "./pages/SignIn";
import CreateWorkspace from "./pages/CreateWorkspace";
import AcceptInvite from "./pages/AcceptInvite";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding"; 

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!initialized) return null; 

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* --- PUBLIC AUTH ROUTES --- */}
            <Route 
              path="/sign-in" 
              element={!session ? <SignIn /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/create-workspace" 
              element={!session ? <CreateWorkspace /> : <Navigate to="/dashboard" />} 
            />
            
            {/* MOVED OUTSIDE: So users can verify keys without being logged in */}
            <Route path="/onboarding" element={<Onboarding />} />
            
            <Route path="/accept-invite" element={<AcceptInvite />} />

            {/* --- PROTECTED APP ROUTES --- */}
            <Route element={session ? <AppLayout /> : <Navigate to="/sign-in" />}>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/candidates" element={<Candidates />} />
              <Route path="/screening" element={<Screening />} />
              <Route path="/screening-results" element={<ScreeningResults />} />
              <Route path="/shortlist" element={<Shortlist />} />
              <Route path="/team-admin" element={<TeamAdmin />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;