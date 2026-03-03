// --- Types and Interfaces ---

export type UserRole = "admin" | "recruiter" | "sourcer" | "hrbp" | "talent_acquisition" | "hiring_manager" | "interviewer" | "viewer";

export interface User {
  id: string; name: string; email: string; role: UserRole; avatar?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string; 
  department: string;
  location: string;
  status: 'open' | 'closed' | 'draft';
  applicants: number;
  createdAt: string;
}

export interface Candidate {
  id: string; 
  name: string; 
  email: string; 
  role: string; 
  experience: string; 
  status: "new" | "screening" | "shortlisted" | "rejected"; 
  score?: number; 
  tags: string[];
  ai_feedback?: string; 
}

export interface ScreeningResult {
  candidateId: string; 
  candidateName: string; 
  score: number; 
  matchReasons: string[]; 
  missingRequirements: string[]; 
  tags: string[]; 
  details: {
    skills: string[];
    experience: string;
    education: string[];
  };
}

export interface TeamMember {
  id: string; name: string; email: string; role: UserRole; status: "active" | "pending";
}

// --- Data Exports (Restored to fix Dashboard/TeamAdmin errors) ---

export const currentUser: User = { id: "1", name: "Sarah Chen", email: "sarah@talentrank.ai", role: "admin" };

export const mockTeam: TeamMember[] = [
  { id: "t1", name: "Sarah Chen", email: "sarah@talentrank.ai", role: "admin", status: "active" },
  { id: "t2", name: "David Park", email: "david@talentrank.ai", role: "recruiter", status: "active" },
  { id: "t3", name: "Emily Johnson", email: "emily@talentrank.ai", role: "hiring_manager", status: "active" },
  { id: "t4", name: "Michael Brown", email: "michael@talentrank.ai", role: "pending" as UserRole, status: "pending" },
];

export const kpiData = {
  totalJobs: 5, activeScreenings: 3, candidatesRanked: 163, avgTimeToHire: 18,
};

export const chartData = [
  { month: "Sep", applications: 120, hires: 8 },
  { month: "Oct", applications: 145, hires: 12 },
  { month: "Nov", applications: 160, hires: 10 },
  { month: "Dec", applications: 130, hires: 9 },
  { month: "Jan", applications: 180, hires: 15 },
  { month: "Feb", applications: 200, hires: 14 },
];

export const recentActivity = [
  { id: "a1", text: "Alex Rivera shortlisted for Senior Frontend Engineer", time: "2 hours ago" },
  { id: "a2", text: "New screening completed for Data Scientist role", time: "4 hours ago" },
  { id: "a3", text: "Job posting created: Engineering Manager", time: "1 day ago" },
];

// --- Mock Entities (Used as fallback) ---

export const mockJobs: Job[] = [
  { 
    id: "j1", 
    title: "Senior Frontend Engineer", 
    department: "Engineering", 
    location: "San Francisco, CA", 
    status: "open", 
    applicants: 48, 
    createdAt: "2026-02-10",
    description: "Expert in React and TypeScript." 
  }
];

export const mockCandidates: Candidate[] = [
  { id: "c1", name: "Alex Rivera", email: "alex@email.com", role: "Senior Frontend Engineer", experience: "7 years", status: "shortlisted", score: 94, tags: ["React"] },
];

export const mockScreeningResults: ScreeningResult[] = [
  { 
    candidateId: "c1", 
    candidateName: "Alex Rivera", 
    score: 94, 
    matchReasons: ["High skill match"], 
    missingRequirements: [], 
    tags: ["Top Match"], 
    details: { skills: ["React"], experience: "7 years", education: ["BS CS"] }
  }
];

// --- Helper Functions ---
export const getJobs = () => Promise.resolve(mockJobs);
export const getCandidates = () => Promise.resolve(mockCandidates);
export const uploadResumes = (files: File[]) => Promise.resolve({ uploaded: files.length });
export const getScreeningResults = () => Promise.resolve(mockScreeningResults);