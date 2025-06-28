# This file is now located in justRizz/instagram_dm_mcp/src/http_server.py
# Usage: uvicorn instagram_dm_mcp.src.http_server:app --reload
# Ensure your .env is in justRizz/instagram_dm_mcp or set environment variables for credentials.

import os
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from instagrapi import Client
from dotenv import load_dotenv
import requests
from uuid import uuid4

# Load .env from the parent directory of this file (justRizz/instagram_dm_mcp)
from pathlib import Path
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

app = FastAPI(title="Instagram DM HTTP Server")

# In-memory session store (for demo; use persistent store for production)
sessions = {}

class SendMessageRequest(BaseModel):
    username: str
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
    username: str
    profile_bio: Optional[str] = ""
    chat_history: Optional[list] = []

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/login")
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

@app.post("/send_message")
def send_message(req: SendMessageRequest, session_token: str = Query(...)):
    client = get_client(session_token)
    if not req.username or not req.message:
        raise HTTPException(status_code=400, detail="Username and message must be provided.")
    try:
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

@app.get("/list_chats")
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

@app.get("/list_messages")
def list_messages(session_token: str = Query(...), thread_id: str = Query(...), amount: int = 20):
    client = get_client(session_token)
    if not thread_id:
        raise HTTPException(status_code=400, detail="Thread ID must be provided.")
    try:
        messages = client.direct_messages(thread_id, amount)
        return {"success": True, "messages": [m.dict() if hasattr(m, 'dict') else str(m) for m in messages]}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.get("/list_pending_chats")
def list_pending_chats(session_token: str = Query(...), amount: int = 20):
    client = get_client(session_token)
    try:
        threads = client.direct_pending_inbox(amount)
        return {"success": True, "threads": [t.dict() if hasattr(t, 'dict') else str(t) for t in threads]}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.get("/search_threads")
def search_threads(session_token: str = Query(...), query: str = Query(...)):
    client = get_client(session_token)
    if not query:
        raise HTTPException(status_code=400, detail="Query must be provided.")
    try:
        results = client.direct_search(query)
        return {"success": True, "results": [r.dict() if hasattr(r, 'dict') else str(r) for r in results]}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.post("/get_thread_by_participants")
def get_thread_by_participants(session_token: str = Query(...), req: GetThreadByParticipantsRequest = None):
    client = get_client(session_token)
    if not req or not req.user_ids or not isinstance(req.user_ids, list):
        raise HTTPException(status_code=400, detail="user_ids must be a non-empty list of user IDs.")
    try:
        thread = client.direct_thread_by_participants(req.user_ids)
        return {"success": True, "thread": thread.dict() if hasattr(thread, 'dict') else str(thread)}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.get("/get_thread_details")
def get_thread_details(session_token: str = Query(...), thread_id: str = Query(...), amount: int = 20):
    client = get_client(session_token)
    if not thread_id:
        raise HTTPException(status_code=400, detail="Thread ID must be provided.")
    try:
        thread = client.direct_thread(thread_id, amount)
        return {"success": True, "thread": thread.dict() if hasattr(thread, 'dict') else str(thread)}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.get("/get_user_id_from_username")
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

@app.get("/get_username_from_user_id")
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

def generate_pickup_line_with_perplexity(username, profile_bio, chat_history):
    prompt = (
        f"Given the Instagram profile bio: '{profile_bio}' and recent chat history: {chat_history}, "
        f"generate a creative, friendly, and context-aware pickup line for the user to send to {username}. "
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
        raise Exception(f"Perplexity API error: {response.text}")
    result = response.json()
    return result["choices"][0]["message"]["content"]

@app.post("/analyze_contact")
def analyze_contact(req: AnalyzeContactRequest):
    try:
        pickup_line = generate_pickup_line_with_perplexity(
            req.username, req.profile_bio, req.chat_history
        )
        return {
            "success": True,
            "pickup_lines": [pickup_line],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 