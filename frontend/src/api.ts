const API_BASE_URL = "http://127.0.0.1:8000";

export interface RankingResult {
  filename: string;
  resume_hash: string; 
  score: number;
  explanation: string;
  details: {
    skills: string[];
    soft_skills: string[]; 
    missingSkills: string[]; 
    experience: string;
    education: string; 
  };
}

export const rankResumes = async (files: File[], jobDescription: string): Promise<RankingResult[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  formData.append("job_description", jobDescription);

  const response = await fetch(`${API_BASE_URL}/rank`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("The AI Engine encountered an error ranking these resumes.");
  return await response.json();
};

export const generateInvite = async (email: string, role: string, isAdmin: boolean = false) => {
  // Updated: Correctly mapping the TS 'isAdmin' to the FastAPI 'is_admin' query parameter
  const url = `${API_BASE_URL}/invite?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}&is_admin=${isAdmin}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to generate invite code");
  }
  
  // This returns the JSON containing { email, role, invite_code, status }
  return response.json();
};

export const verifyInvite = async (email: string, invite_code: string) => {
  const response = await fetch("http://127.0.0.1:8000/verify-invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, invite_code }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Verification failed");
  }
  return response.json();
};