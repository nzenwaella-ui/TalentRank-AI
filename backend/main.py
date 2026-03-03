from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
import re
import io
import hashlib
import PyPDF2
from docx import Document
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Optional
import pytesseract
from pdf2image import convert_from_bytes
from PIL import Image
from supabase import create_client, Client
from pydantic import BaseModel
import random
from datetime import datetime

app = FastAPI(title="TalentRank AI Backend")

# --- SUPABASE ADMIN CONFIG ---
SUPABASE_URL = "https://boqzwocetonugsltajnr.supabase.co" 
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcXp3b2NldG9udWdzbHRham5yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM2NDM5NCwiZXhwIjoyMDg3OTQwMzk0fQ.BN0dzt9_O4_rriHCGoalyv2n8EXjbTciqfd_7PqxzzE" 
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- EXPANDED GLOBAL CONFIGURATION ---
TECH_BANK = [
    'python', 'java', 'sql', 'aws', 'docker', 'machine learning', 'react', 'git', 'javascript', 'typescript', 'node', 'fastapi', 
    'rest api', 'mongodb', 'postgresql', 'c++', 'c#', 'php', 'html', 'css', 'kubernetes', 'azure', 'gcp', 'terraform', 'graphql', 
    'next.js', 'vue', 'angular', 'django', 'flask', 'spring boot', 'redux', 'tailwind', 'pytorch', 'tensorflow', 'pandas', 'numpy', 
    'scikit-learn', 'jenkins', 'ci/cd', 'linux', 'bash', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'flutter'
]
SOFT_BANK = [
    'leadership', 'communication', 'problem solving', 'teamwork', 'agile', 'management', 'creativity', 'critical thinking', 
    'time management', 'adaptability', 'conflict resolution', 'emotional intelligence', 'public speaking', 'negotiation', 
    'collaboration', 'work ethic', 'attention to detail', 'mentoring', 'decision making', 'presentation skills'
]

print("🧠 Loading AI Model...")
model = SentenceTransformer('all-MiniLM-L6-v2')

# --- DATA MODELS ---
class VerifyInviteRequest(BaseModel):
    email: str
    invite_code: str

# --- HELPER FUNCTIONS ---
def extract_text_from_bytes(file_bytes: bytes, filename: str):
    ext = os.path.splitext(filename)[1].lower()
    text = ""
    try:
        if ext == ".pdf":
            reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                text += page.extract_text() or ""
            if len(text.strip()) < 100:
                images = convert_from_bytes(file_bytes)
                for image in images:
                    text += pytesseract.image_to_string(image)
        elif ext == ".docx":
            doc = Document(io.BytesIO(file_bytes))
            text = "\n".join([para.text for para in doc.paragraphs])
        elif ext == ".txt":
            text = file_bytes.decode('utf-8', errors='ignore')
        elif ext in [".jpg", ".jpeg", ".png"]:
            text = pytesseract.image_to_string(Image.open(io.BytesIO(file_bytes)))
    except Exception as e:
        print(f"Error extracting from {filename}: {e}")
    return text

def clean_text(text):
    return re.sub(r'\s+', ' ', text.lower()).strip()

def get_insights(resume_text, job_desc):
    resume_low = resume_text.lower()
    job_low = job_desc.lower()
    required_in_job = list(set([s for s in TECH_BANK if re.search(r'\b' + re.escape(s) + r'\b', job_low)]))
    found_in_resume = list(set([s for s in TECH_BANK if re.search(r'\b' + re.escape(s) + r'\b', resume_low)]))
    missing = [s for s in required_in_job if s not in found_in_resume]
    found_soft = [s for s in SOFT_BANK if re.search(r'\b' + re.escape(s) + r'\b', resume_low)]
    gate_failed = len(required_in_job) > 0 and len(found_in_resume) == 0
    degree_match = re.search(r"(bsc|msc|phd|bachelor|master|engineering|computer science)", resume_low)
    education = degree_match.group(0).upper() if degree_match else "N/A"
    exp_match = re.search(r"(\d+)\s*(years|yrs|year)", resume_low)
    experience_val = int(exp_match.group(1)) if exp_match else 0
    return found_in_resume, missing, found_soft, education, experience_val, gate_failed, required_in_job

# --- ENDPOINTS ---

@app.post("/rank")
async def rank_resumes(job_description: str = Form(...), files: List[UploadFile] = File(...)):
    results = []
    job_clean = clean_text(job_description)
    job_emb = model.encode([job_clean])
    
    for file in files:
        try:
            content = await file.read()
            file_hash = hashlib.md5(content).hexdigest()
            raw_text = extract_text_from_bytes(content, file.filename)
            if not raw_text.strip(): continue
            
            found, missing, soft, edu, exp_yrs, gate_failed, req_in_job = get_insights(raw_text, job_description)
            
            skill_ratio = len(found) / len(req_in_job) if req_in_job else 1.0
            skill_score = skill_ratio * 0.70
            resume_emb = model.encode([clean_text(raw_text)])
            semantic_raw = float(cosine_similarity(job_emb, resume_emb)[0][0])
            semantic_score = semantic_raw * 0.10
            exp_bonus = min(0.20, (exp_yrs * 0.02))
            
            final_score_raw = skill_score + exp_bonus + semantic_score
            if gate_failed: final_score_raw = 0.0
            
            final_score_pct = int(round(min(1.0, final_score_raw) * 100))
            blind_id = f"CAN-{random.randint(1000, 9999)}"

            result_item = {
                "candidate_id": blind_id,
                "name": blind_id,
                "filename": file.filename,
                "resume_hash": file_hash,
                "score": final_score_pct,
                "role": "Junior Software Developer", 
                "experience_years": exp_yrs,
                "status": "shortlisted" if final_score_pct > 80 else "new",
                "skills": found, 
                "missing_skills": missing, 
                "soft_skills": soft,
                "details": {
                    "skills": found, 
                    "soft_skills": soft, 
                    "missingSkills": missing, 
                    "education": edu, 
                    "experience": f"{exp_yrs} Years"
                },
                "explanation": f"Candidate matches {len(found)} core skills with {exp_yrs} years experience."
            }
            results.append(result_item)
            
        except Exception as e:
            print(f"Error processing {file.filename}: {e}")
            continue
            
    return sorted(results, key=lambda x: x['score'], reverse=True)

@app.post("/invite")
async def generate_invite(
    email: str = Query(...), 
    role: str = Query(...), 
    is_admin: bool = Query(False)
):
    try:
        invite_code = f"TR-{str(uuid.uuid4())[:6].upper()}"
        new_user_id = None
        
        # 1. Create Auth User and capture their REAL ID
        try:
            auth_response = supabase_admin.auth.admin.create_user({
                "email": email,
                "password": "Password123!", 
                "user_metadata": {
                    "role": role, 
                    "invite_code": invite_code, 
                    "is_admin": is_admin,
                    "onboarded": False
                },
                "email_confirm": True
            })
            new_user_id = auth_response.user.id
        except Exception as auth_err:
            # If user exists, try to find their existing ID
            print(f"Auth system notice: {auth_err}")
            existing_users = supabase_admin.auth.admin.list_users()
            user_found = next((u for u in existing_users if u.email == email), None)
            if user_found:
                new_user_id = user_found.id

        if not new_user_id:
            raise HTTPException(status_code=500, detail="Could not create or locate user ID")

        # 2. Sync into profiles table using the CORRECT ID from Auth
        supabase_admin.from_("profiles").upsert({
            "id": new_user_id, 
            "email": email,
            "role": role,
            "is_admin": is_admin,
            "status": "pending",
            "last_login": datetime.now().isoformat()
        }, on_conflict="email").execute()

        return {
            "email": email, 
            "role": role, 
            "invite_code": invite_code, 
            "status": "success"
        }

    except Exception as e:
        print(f"Invite Logic Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    try:
        # Generate the code
        invite_code = f"TR-{str(uuid.uuid4())[:6].upper()}"
        
        # 1. Create Auth User
        try:
            supabase_admin.auth.admin.create_user({
                "email": email,
                "password": "Password123!", 
                "user_metadata": {
                    "role": role, 
                    "invite_code": invite_code, 
                    "is_admin": is_admin,
                    "onboarded": False
                },
                "email_confirm": True
            })
        except Exception as auth_err:
            print(f"Auth system notice: {auth_err}")

        # 2. Sync into profiles table
        # We manually pass a new UUID for 'id' to fix the not-null constraint error
        supabase_admin.from_("profiles").upsert({
            "id": str(uuid.uuid4()), 
            "email": email,
            "role": role,
            "is_admin": is_admin,
            "status": "pending",
            "last_login": datetime.now().isoformat()
        }, on_conflict="email").execute()

        # SUCCESS: Return the JSON response containing the invite_code
        return {
            "email": email, 
            "role": role, 
            "invite_code": invite_code, 
            "status": "success"
        }

    except Exception as e:
        print(f"Invite Logic Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/update-activity")
async def update_activity(email: str = Query(...)):
    try:
        supabase_admin.from_("profiles").update({
            "last_login": datetime.now().isoformat(),
            "status": "active"
        }).eq("email", email).execute()
        return {"status": "updated"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

@app.post("/verify-invite")
def verify_invite(req: VerifyInviteRequest):
    try:
        users_resp = supabase_admin.auth.admin.list_users()
        target_user = next((u for u in users_resp if u.email == req.email), None)
        if not target_user:
            raise HTTPException(status_code=404, detail="Email not found.")
        stored_code = target_user.user_metadata.get("invite_code")
        if stored_code == req.invite_code:
            return {"status": "verified"}
        else:
            raise HTTPException(status_code=401, detail="Invalid invite key.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))