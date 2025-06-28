# This file is now located in justRizz/instagram_dm_mcp/src/http_server.py
# Usage: uvicorn instagram_dm_mcp.src.http_server:app --reload
# Ensure your .env is in justRizz/instagram_dm_mcp or set environment variables for credentials.

import os
from fastapi import FastAPI, HTTPException, Query, APIRouter
from pydantic import BaseModel
from typing import List, Optional
from instagrapi import Client
from dotenv import load_dotenv
import requests
from uuid import uuid4
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import json
from pathlib import Path

# Load .env from the parent directory of this file (justRizz/instagram_dm_mcp)
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

app = FastAPI(title="Instagram DM HTTP Server")

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter(prefix="/api")

# In-memory session store (for demo; use persistent store for production)
sessions = {}

class SendMessageRequest(BaseModel):
    ig_username: str  # Instagram login username
    ig_password: str  # Instagram login password
    username: str     # Recipient username
    message: str

class ListMessagesRequest(BaseModel):
    thread_id: str
    amount: Optional[int] = 20

class GetThreadByParticipantsRequest(BaseModel):
    user_ids: List[int]

class GetThreadDetailsRequest(BaseModel):
    thread_id: str
    amount: Optional[int] = 20

class AnalyzeContactRequest(BaseModel):
    session_token: str
    username: str

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(req: LoginRequest):
    client = Client()
    try:
        client.login(req.username, req.password)
        session_token = str(uuid4())
        sessions[session_token] = client
        return {"success": True, "session_token": session_token}
    except Exception as e:
        return {"success": False, "message": str(e)}

def get_client(session_token: str):
    client = sessions.get(session_token)
    if not client:
        raise HTTPException(status_code=401, detail="Invalid or expired session token. Please log in again.")
    return client

@router.post("/send_message")
def send_message(req: SendMessageRequest):
    client = Client()
    SESSION_FILE = Path(f"{req.ig_username}_session.json")
    try:
        if SESSION_FILE.exists():
            client.load_settings(SESSION_FILE)
        client.login(req.ig_username, req.ig_password)
        client.dump_settings(SESSION_FILE)
        user_id = client.user_id_from_username(req.username)
        if not user_id:
            return {"success": False, "message": f"User '{req.username}' not found."}
        dm = client.direct_send(req.message, [user_id])
        if dm:
            return {"success": True, "message": "Message sent to user.", "direct_message_id": getattr(dm, 'id', None)}
        else:
            return {"success": False, "message": "Failed to send message."}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.get("/list_chats")
def list_chats(session_token: str = Query(...), amount: int = 20, selected_filter: str = "", thread_message_limit: Optional[int] = None, full: bool = False, fields: Optional[str] = None):
    client = get_client(session_token)
    def thread_summary(thread):
        t = thread if isinstance(thread, dict) else thread.dict()
        users = t.get("users", [])
        user_summaries = [
            {"username": u.get("username"), "full_name": u.get("full_name"), "pk": u.get("pk")} for u in users
        ]
        return {
            "thread_id": t.get("id"),
            "thread_title": t.get("thread_title"),
            "users": user_summaries,
            "last_activity_at": t.get("last_activity_at"),
            "last_message": t.get("messages", [{}])[-1] if t.get("messages") else None
        }
    def filter_fields(thread, fields):
        t = thread if isinstance(thread, dict) else thread.dict()
        return {field: t.get(field) for field in fields}
    try:
        threads = client.direct_threads(amount, selected_filter, thread_message_limit)
        if full:
            return {"success": True, "threads": [t.dict() if hasattr(t, 'dict') else str(t) for t in threads]}
        elif fields:
            field_list = [f.strip() for f in fields.split(",") if f.strip()]
            return {"success": True, "threads": [filter_fields(t, field_list) for t in threads]}
        else:
            return {"success": True, "threads": [thread_summary(t) for t in threads]}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.get("/list_messages")
def list_messages(session_token: str = Query(...), thread_id: str = Query(...), amount: int = 20):
    client = get_client(session_token)
    if not thread_id:
        raise HTTPException(status_code=400, detail="Thread ID must be provided.")
    try:
        messages = client.direct_messages(thread_id, amount)
        return {"success": True, "messages": [m.dict() if hasattr(m, 'dict') else str(m) for m in messages]}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.get("/list_pending_chats")
def list_pending_chats(session_token: str = Query(...), amount: int = 20):
    client = get_client(session_token)
    try:
        threads = client.direct_pending_inbox(amount)
        return {"success": True, "threads": [t.dict() if hasattr(t, 'dict') else str(t) for t in threads]}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.get("/search_threads")
def search_threads(session_token: str = Query(...), query: str = Query(...)):
    client = get_client(session_token)
    if not query:
        raise HTTPException(status_code=400, detail="Query must be provided.")
    try:
        results = client.direct_search(query)
        return {"success": True, "results": [r.dict() if hasattr(r, 'dict') else str(r) for r in results]}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.post("/get_thread_by_participants")
def get_thread_by_participants(session_token: str = Query(...), req: GetThreadByParticipantsRequest = None):
    client = get_client(session_token)
    if not req or not req.user_ids or not isinstance(req.user_ids, list):
        raise HTTPException(status_code=400, detail="user_ids must be a non-empty list of user IDs.")
    try:
        thread = client.direct_thread_by_participants(req.user_ids)
        return {"success": True, "thread": thread.dict() if hasattr(thread, 'dict') else str(thread)}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.get("/get_thread_details")
def get_thread_details(session_token: str = Query(...), thread_id: str = Query(...), amount: int = 20):
    client = get_client(session_token)
    if not thread_id:
        raise HTTPException(status_code=400, detail="Thread ID must be provided.")
    try:
        thread = client.direct_thread(thread_id, amount)
        return {"success": True, "thread": thread.dict() if hasattr(thread, 'dict') else str(thread)}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.get("/get_user_id_from_username")
def get_user_id_from_username(session_token: str = Query(...), username: str = Query(...)):
    client = get_client(session_token)
    if not username:
        raise HTTPException(status_code=400, detail="Username must be provided.")
    try:
        user_id = client.user_id_from_username(username)
        if user_id:
            return {"success": True, "user_id": user_id}
        else:
            return {"success": False, "message": f"User '{username}' not found."}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.get("/get_username_from_user_id")
def get_username_from_user_id(session_token: str = Query(...), user_id: str = Query(...)):
    client = get_client(session_token)
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID must be provided.")
    try:
        username = client.username_from_user_id(user_id)
        if username:
            return {"success": True, "username": username}
        else:
            return {"success": False, "message": f"User ID '{user_id}' not found."}
    except Exception as e:
        return {"success": False, "message": str(e)}

PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")

@router.post("/analyze_contact")
def analyze_contact(req: AnalyzeContactRequest):
    client = get_client(req.session_token)
    try:
        # Fetch user profile details with safe defaults
        user_id = client.user_id_from_username(req.username)
        user_info = client.user_info(user_id)
        # Only include serializable fields
        def safe_val(val):
            if isinstance(val, (str, int, bool, float, type(None))):
                return val
            return str(val)
        profile_details = {
            "username": safe_val(getattr(user_info, "username", req.username)),
            "full_name": safe_val(getattr(user_info, "full_name", "")),
            "bio": safe_val(getattr(user_info, "biography", "")),
            "profile_pic_url": safe_val(getattr(user_info, "profile_pic_url", "")),
            "followers": safe_val(getattr(user_info, "follower_count", 0)),
            "following": safe_val(getattr(user_info, "following_count", 0)),
            "posts": safe_val(getattr(user_info, "media_count", 0)),
            "is_private": safe_val(getattr(user_info, "is_private", False)),
            "is_verified": safe_val(getattr(user_info, "is_verified", False)),
        }
        # Serialize details to JSON string (in memory)
        profile_text = json.dumps(profile_details, indent=2)
        # Prepare prompt for AI
        prompt = (
            f"Given the following Instagram profile details in JSON format:\n{profile_text}\n"
            f"Generate a creative, friendly, and context-aware pickup line for the user to send to {req.username}. "
            f"Only return the pickup line and nothing else. Do not include any explanation or extra text."
        )
        url = "https://api.perplexity.ai/chat/completions"
        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "Authorization": f"Bearer {PERPLEXITY_API_KEY}"
        }
        data = {
            "model": "sonar-pro",
            "messages": [
                {"role": "system", "content": "You are an assistant that ONLY returns the pickup line and nothing else. Do not include any explanation, greeting, or extra text."},
                {"role": "user", "content": prompt}
            ]
        }
        response = requests.post(url, headers=headers, json=data)
        if response.status_code != 200:
            print("Perplexity API error response:", response.text)
            raise Exception(f"Perplexity API error: {response.text}")
        result = response.json()
        print("Perplexity API response:", result)
        pickup_line = result.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        if not pickup_line:
            backend_response = {"success": False, "message": "AI did not return a pickup line.", "profile": profile_details}
            print("Backend response:", backend_response)
            return backend_response
        backend_response = {"success": True, "pickup_lines": [pickup_line], "profile": profile_details}
        print("Backend response:", backend_response)
        return backend_response
    except Exception as e:
        backend_response = {"success": False, "message": str(e)}
        print("Backend response:", backend_response)
        return backend_response

@router.get("/list_contacts")
def list_contacts(session_token: str = Query(...)):
    client = get_client(session_token)
    try:
        # Get DM threads (inbox)
        threads = client.direct_threads(amount=50)
        contacts = []
        for thread in threads:
            # Get the other user (not self)
            users = [u for u in thread.users if u.pk != client.user_id]
            if not users:
                continue
            user = users[0]
            contacts.append({
                "id": thread.id,
                "username": user.username,
                "avatar": user.profile_pic_url,
                "lastChat": thread.last_activity_at,
                "rizzScore": 0,
            })
        return {"success": True, "contacts": contacts}
    except Exception as e:
        return {"success": False, "message": str(e)}

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("http_server:app", host="0.0.0.0", port=port, reload=True) 