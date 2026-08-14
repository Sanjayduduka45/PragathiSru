import json
import os
from typing import Dict, Any, List, Optional
import httpx
from app.config import settings

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DB_FILE = os.path.join(DATA_DIR, "db.json")

# Initial Seed Data for local store fallback
INITIAL_DATA: Dict[str, Any] = {
    "site_settings": {
        "event_name": "PRAGATHI 2K26",
        "full_title": "PRAGATHI 2K26 — National Level Project Expo",
        "tagline": "Innovate. Create. Inspire.",
        "event_date": "09 October 2026",
        "target_date_iso": "2026-10-09T09:00:00+05:30",
        "venue": "SR University Campus, Ananthasagar, Hasanparthy, Warangal, Telangana - 506371",
        "institution": "SR University",
        "location": "Warangal, Telangana",
        "prize_pool": "₹1,50,000",
        "contact_email": "pragathi2k26@sru.edu.in",
        "helpline": "+91 870 281 8333",
        "linkedin_url": "https://www.linkedin.com/in/sru-pragathi-73a876429/",
        "facebook_url": "https://www.facebook.com/share/19D3TK5Yae/",
        "instagram_url": "https://www.instagram.com/sru.pragathi2.0?igsh=dng0ZXR2Y2g2enU1"
    },
    "about_content": {
        "title": "About PRAGATHI 2K26",
        "description": "PRAGATHI 2K26 is SR University's flagship National Level Project Expo, designed to ignite youth innovation, foster interdisciplinary engineering solutions, and provide a stage for high-impact prototypes. Over 500 student teams from across India showcase hardware models, software applications, renewable energy solutions, and biotech inventions evaluated by senior academicians, scientists, and incubation mentors from the SRiX (SR Innovation Exchange) ecosystem.",
        "vision": "To create a nationally recognized platform that nurtures engineering talent, fosters innovation culture, and bridges the gap between academic learning and industry-ready solutions.",
        "objectives": "1. Provide a platform for student innovators to present working prototypes.\n2. Encourage interdisciplinary collaboration across engineering domains.\n3. Connect participants with industry mentors and incubation opportunities.\n4. Recognize outstanding innovations with merit awards and certificates."
    },
    "project_domains": [
        {
            "id": "ai-software",
            "title": "Software, AI & Data Science",
            "description": "Web & mobile applications, Machine Learning models, GenAI solutions, Cloud & Cybersecurity prototypes.",
            "icon_name": "Cpu",
            "color": "from-blue-600 to-indigo-600",
            "badge_text": "Software Track",
            "active": True,
            "display_order": 1
        },
        {
            "id": "hardware-iot",
            "title": "Hardware, IoT & Embedded Systems",
            "description": "Smart devices, sensor networks, robotics, drone tech, microcontrollers, and Industry 4.0 automation.",
            "icon_name": "Zap",
            "color": "from-cyan-600 to-blue-700",
            "badge_text": "Hardware Track",
            "active": True,
            "display_order": 2
        },
        {
            "id": "green-sustainability",
            "title": "Green Energy & Environmental Tech",
            "description": "Renewable energy systems, waste management, electric mobility, agricultural innovations, and eco-tech.",
            "icon_name": "Leaf",
            "color": "from-emerald-600 to-teal-700",
            "badge_text": "Sustainability Track",
            "active": True,
            "display_order": 3
        },
        {
            "id": "health-biotech",
            "title": "Healthcare, MedTech & BioTech",
            "description": "Diagnostic devices, biomedical instruments, health tracking software, and bio-inspired engineering.",
            "icon_name": "HeartPulse",
            "color": "from-rose-600 to-pink-700",
            "badge_text": "Health Tech Track",
            "active": True,
            "display_order": 4
        },
        {
            "id": "smart-automation",
            "title": "Smart Cities & Automation",
            "description": "Urban mobility, traffic management, smart grid systems, water management, and public safety tech.",
            "icon_name": "Building2",
            "color": "from-amber-600 to-orange-700",
            "badge_text": "Civic Tech Track",
            "active": True,
            "display_order": 5
        },
        {
            "id": "open-innovation",
            "title": "Open Innovation & Social Tech",
            "description": "Cross-disciplinary ideas, assistive tech for accessibility, educational tools, and high-impact social prototypes.",
            "icon_name": "Lightbulb",
            "color": "from-blue-700 to-sky-600",
            "badge_text": "Open Track",
            "active": True,
            "display_order": 6
        }
    ],
    "schedule_items": [
        {
            "id": "sch-1",
            "time": "08:30 AM – 09:30 AM",
            "event": "On-site Registration & Stall Setup",
            "location": "SR University Expo Pavilion",
            "description": "Teams report to check-in counters, receive stall badges, and set up project displays.",
            "badge": "Check-In",
            "active": True,
            "display_order": 1
        },
        {
            "id": "sch-2",
            "time": "09:30 AM – 10:15 AM",
            "event": "Grand Inauguration Ceremony",
            "location": "Main University Auditorium",
            "description": "Inaugural address by SR University Dignitaries, Chief Guests, and Industry Mentors.",
            "badge": "Inauguration",
            "active": True,
            "display_order": 2
        },
        {
            "id": "sch-3",
            "time": "10:30 AM – 01:30 PM",
            "event": "Jury Evaluation Phase I & Demonstration",
            "location": "Expo Halls A, B & C",
            "description": "Expert panel evaluates working prototypes, code bases, and technical poster presentations.",
            "badge": "Evaluation",
            "active": True,
            "display_order": 3
        },
        {
            "id": "sch-4",
            "time": "01:30 PM – 02:30 PM",
            "event": "Lunch & Networking Break",
            "location": "University Food Court & Student Center",
            "description": "Networking lunch for participants, judges, faculty mentors, and visiting delegates.",
            "badge": "Networking",
            "active": True,
            "display_order": 4
        },
        {
            "id": "sch-5",
            "time": "02:30 PM – 04:00 PM",
            "event": "Public Exhibition & Final Judging",
            "location": "Expo Pavilion",
            "description": "Open viewing for students, school delegations, industry representatives, and final round reviews.",
            "badge": "Open Expo",
            "active": True,
            "display_order": 5
        },
        {
            "id": "sch-6",
            "time": "04:15 PM – 05:30 PM",
            "event": "Valedictory & Award Ceremony",
            "location": "Main Auditorium",
            "description": "Announcement of category winners, prize distribution (₹1,50,000 pool), and closing remarks.",
            "badge": "Awards",
            "active": True,
            "display_order": 6
        }
    ],
    "rules_content": {
        "content": "PARTICIPATION RULES & GUIDELINES\n\n1. ELIGIBILITY\n• Open to School students (Classes 8–12) and College/University students (Diploma, B.Tech, M.Tech, Degree, B.Sc) from recognized institutions across India.\n• Each team must have 1 to 5 members.\n• Solo participation is permitted.\n• Cross-departmental and cross-institutional teams are encouraged.\n\n2. PROJECT STANDARDS\n• Projects must be original work created by the registered team.\n• Projects must include a working prototype or functional demonstration.\n• Projects must fall within one of the six official PRAGATHI 2K26 domains.\n• Plagiarized or previously awarded projects from other expos will be disqualified.\n\n3. EXPO DAY CONDUCT\n• All team members must carry valid ID proof on Expo Day (college/school ID or government ID).\n• Teams must report to the check-in desk by 09:00 AM on 09 October 2026.\n• Each team will be allocated a stall. Teams must set up within the designated setup window.\n• Disruptive or inappropriate conduct will result in immediate disqualification.\n\n4. EVALUATION CRITERIA\n• Technical Merit (40%)\n• Innovation & Originality (25%)\n• Presentation & Communication (20%)\n• Real-world Impact & Scalability (15%)\n\n5. AWARDS & PRIZES\n• Top teams from each domain will be eligible for category prizes.\n• A Grand Innovation Prize will be awarded across all domains.\n• Total Prize Pool: ₹1,50,000\n\n6. CERTIFICATES\n• All registered participants presenting their project will receive official Certificates of Participation.\n• Category winners will receive Merit Certificates."
    },
    "faqs": [
        {
            "id": "faq-1",
            "question": "Who is eligible to participate in PRAGATHI 2K26?",
            "answer": "PRAGATHI 2K26 is a National Level Expo open to both School students (Classes 8–12) and College/University students (Diploma, B.Tech, M.Tech, Degree, B.Sc) from recognized institutions across India.",
            "category": "Registration",
            "active": True,
            "order": 1
        },
        {
            "id": "faq-2",
            "question": "What is the team size requirement for registration?",
            "answer": "Teams can consist of 1 to 5 members. Solo participation is permitted, and cross-departmental teams are encouraged.",
            "category": "Registration",
            "active": True,
            "order": 2
        },
        {
            "id": "faq-3",
            "question": "How do I register my team for PRAGATHI 2K26?",
            "answer": "Visit the Register page, enter your primary email address, fill in your team and institution details, provide your project title and abstract, then review and confirm your registration.",
            "category": "Registration",
            "active": True,
            "order": 3
        },
        {
            "id": "faq-4",
            "question": "What happens after I submit my registration?",
            "answer": "After successful registration, you will receive a unique Registration ID (e.g., PRAGATHI26-XXXXXX). Shortlisted teams will be notified with stall allocation details before Expo Day.",
            "category": "Registration",
            "active": True,
            "order": 4
        },
        {
            "id": "faq-5",
            "question": "What facilities are provided at the stall on Expo Day?",
            "answer": "Each registered and shortlisted team receives an allocated display stall with standard power supply, poster backing board, Wi-Fi connectivity, and table display space.",
            "category": "Expo Rules",
            "active": True,
            "order": 5
        },
        {
            "id": "faq-6",
            "question": "Will participants receive certificates?",
            "answer": "Yes. Registered participants will receive participation certificates for PRAGATHI 2K26.",
            "category": "Expo Rules",
            "active": True,
            "order": 6
        },
        {
            "id": "faq-7",
            "question": "Will participants receive lunch?",
            "answer": "Yes. Lunch will be provided to registered participants during PRAGATHI 2K26 on the event day.",
            "category": "Expo Rules",
            "active": True,
            "order": 7
        }
    ],
    "sponsors": [
        {
            "id": "sponsor-1",
            "name": "SRiX Incubator",
            "type": "Incubation Partner",
            "role": "Startup Seed Grants & Mentorship",
            "logo_text": "SRiX",
            "website": "",
            "active": True,
            "order": 1
        },
        {
            "id": "sponsor-2",
            "name": "Institution's Innovation Council (IIC)",
            "type": "Government Partner",
            "role": "Ministry of Education Initiative",
            "logo_text": "MIC IIC",
            "website": "",
            "active": True,
            "order": 2
        },
        {
            "id": "sponsor-3",
            "name": "IEEE SRU Student Branch",
            "type": "Technical Partner",
            "role": "Technical Quality & Standards",
            "logo_text": "IEEE",
            "website": "",
            "active": True,
            "order": 3
        },
        {
            "id": "sponsor-4",
            "name": "SR University R&D Cell",
            "type": "Academic Sponsor",
            "role": "Research & Prototyping Support",
            "logo_text": "SRU R&D",
            "website": "",
            "active": True,
            "order": 4
        }
    ]
}


class Database:
    def __init__(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        if not os.path.exists(DB_FILE):
            self.save_local(INITIAL_DATA)

    def load_local(self) -> Dict[str, Any]:
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[DB] Error reading local file: {e}")
            return INITIAL_DATA

    def save_local(self, data: Dict[str, Any]) -> None:
        try:
            with open(DB_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[DB] Error writing local file: {e}")

    # --- SUPABASE REST CLIENT ---
    def get_headers(self) -> Dict[str, str]:
        key = (
            settings.supabase_key
            or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
            or os.getenv("SUPABASE_KEY", "")
        )
        if not key:
            print("[Database Warning] SUPABASE_SERVICE_ROLE_KEY is not configured! Privileged database operations may fail.")
        return {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    async def fetch_supabase(self, table: str, query_params: str = "") -> Optional[List[Dict[str, Any]]]:
        url = f"{settings.supabase_url}/rest/v1/{table}?{query_params}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, headers=self.get_headers())
                if res.status_code == 200:
                    return res.json()
        except Exception as e:
            print(f"[Supabase] Query error on {table}: {e}")
        return None

    async def delete_supabase(self, table: str, eq_column: str, eq_value: str) -> bool:
        url = f"{settings.supabase_url}/rest/v1/{table}?{eq_column}=eq.{eq_value}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = self.get_headers()
                headers["Prefer"] = "return=representation"
                res = await client.delete(url, headers=headers)
                if res.status_code in (200, 204):
                    try:
                        deleted = res.json()
                        if isinstance(deleted, list) and len(deleted) > 0:
                            print(f"[Supabase] Successfully deleted {len(deleted)} row(s) from {table}")
                            return True
                    except Exception:
                        pass

                    check_url = f"{settings.supabase_url}/rest/v1/{table}?{eq_column}=eq.{eq_value}"
                    check_res = await client.get(check_url, headers=self.get_headers())
                    if check_res.status_code == 200:
                        data = check_res.json()
                        return len(data) == 0
                    return True
                print(f"[Supabase] Delete failed on {table} HTTP {res.status_code}: {res.text}")
        except Exception as e:
            print(f"[Supabase] Delete error on {table}: {e}")
        return False

    async def update_supabase(self, table: str, eq_column: str, eq_value: str, payload: Dict[str, Any]) -> bool:
        url = f"{settings.supabase_url}/rest/v1/{table}?{eq_column}=eq.{eq_value}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.patch(url, headers=self.get_headers(), json=payload)
                if res.status_code in (200, 204):
                    return True
                print(f"[Supabase] Update failed on {table} HTTP {res.status_code}: {res.text}")
                return False
        except Exception as e:
            print(f"[Supabase] Update error on {table}: {e}")
            return False

    async def insert_supabase(self, table: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        url = f"{settings.supabase_url}/rest/v1/{table}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = self.get_headers()
                headers["Prefer"] = "return=representation"
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code in (200, 201):
                    data = res.json()
                    if isinstance(data, list) and len(data) > 0:
                        return data[0]
                    elif isinstance(data, dict):
                        return data
                print(f"[Supabase] Insert failed on {table} HTTP {res.status_code}: {res.text}")
        except Exception as e:
            print(f"[Supabase] Insert error on {table}: {e}")
        return None

    async def upsert_supabase(self, table: str, payload: Dict[str, Any], on_conflict: str = "id") -> Optional[Dict[str, Any]]:
        url = f"{settings.supabase_url}/rest/v1/{table}?on_conflict={on_conflict}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = self.get_headers()
                headers["Prefer"] = "resolution=merge-duplicates,return=representation"
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code in (200, 201):
                    data = res.json()
                    if isinstance(data, list) and len(data) > 0:
                        return data[0]
                    elif isinstance(data, dict):
                        return data
                # If resolution header fails, fallback to patch if on_conflict field is present
                if on_conflict in payload:
                    val = payload[on_conflict]
                    patch_url = f"{settings.supabase_url}/rest/v1/{table}?{on_conflict}=eq.{val}"
                    patch_res = await client.patch(patch_url, headers=self.get_headers(), json=payload)
                    if patch_res.status_code in (200, 204):
                        return payload
                print(f"[Supabase] Upsert failed on {table} HTTP {res.status_code}: {res.text}")
        except Exception as e:
            print(f"[Supabase] Upsert error on {table}: {e}")
        return None

    async def upload_supabase_storage(self, bucket: str, path: str, content: bytes, content_type: str) -> Optional[str]:
        if not settings.supabase_url or not settings.supabase_key:
            return None
        bucket_url = f"{settings.supabase_url}/storage/v1/bucket"
        upload_url = f"{settings.supabase_url}/storage/v1/object/{bucket}/{path}"
        headers = {
            "apikey": settings.supabase_key,
            "Authorization": f"Bearer {settings.supabase_key}",
        }
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                await client.post(
                    bucket_url,
                    headers={**headers, "Content-Type": "application/json"},
                    json={"id": bucket, "name": bucket, "public": True}
                )
                file_headers = {
                    **headers,
                    "Content-Type": content_type,
                    "x-upsert": "true"
                }
                res = await client.post(upload_url, headers=file_headers, content=content)
                if res.status_code in (200, 201):
                    return f"{settings.supabase_url}/storage/v1/object/public/{bucket}/{path}"
                else:
                    print(f"[Supabase Storage] Status {res.status_code}: {res.text}")
        except Exception as e:
            print(f"[Supabase Storage] Error uploading: {e}")
        return None

db = Database()
