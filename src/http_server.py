from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import sys
import os
from collections import Counter

# Import MCP logic and session store from mcp_server
from mcp_server import (
    login_plain as mcp_login,
    list_contacts_plain as mcp_list_contacts,
    analyze_contact_plain as mcp_analyze_contact,
    list_messages_plain as mcp_list_messages,
    session_store,
    session_lock,
    send_message,
    list_chats,
    list_messages,
    list_pending_chats,
    search_threads,
    get_thread_by_participants,
    get_thread_details,
    get_user_id_from_username,
    get_username_from_user_id,
    generate_pickup_line_with_perplexity,
)

# Add dotenv support
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
except ImportError:
    pass

app = FastAPI()

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request Models ---
class LoginRequest(BaseModel):
    username: str
    password: str

class AnalyzeRequest(BaseModel):
    session_token: str
    username: Optional[str] = None
    thread_id: Optional[str] = None

class SendMessageRequest(BaseModel):
    username: str
    message: str

class GetThreadByParticipantsRequest(BaseModel):
    user_ids: List[int]

# --- Endpoints ---
@app.post("/api/login")
async def login(req: LoginRequest):
    result = mcp_login(req.username, req.password)
    if not result.get("success"):
        raise HTTPException(status_code=401, detail=result.get("message", "Login failed"))
    return result

@app.get("/api/list_contacts")
async def list_contacts(session_token: str = Query(...), amount: int = 20):
    result = mcp_list_contacts(session_token, amount)
    if not result.get("success"):
        raise HTTPException(status_code=401, detail=result.get("message", "Invalid session"))
    return result

@app.post("/api/analyze_contact")
async def analyze_contact(req: AnalyzeRequest):
    result = mcp_analyze_contact(req.session_token, req.username, req.thread_id)
    if not result.get("success"):
        raise HTTPException(status_code=401, detail=result.get("message", "Invalid session or analysis failed"))
    return result

@app.post("/api/send_message")
async def send_message_api(req: SendMessageRequest):
    # For demo: generate a smart/funny pickup line using Perplexity or fallback
    username = req.username
    context = req.message
    prompt = f"Generate a smart, funny, and personalized Instagram DM pickup line for {username}. Context: {context}"
    try:
        pickup_line = generate_pickup_line_with_perplexity(prompt)
    except Exception:
        pickup_line = f"Hey {username}, are you made of copper and tellurium? Because you're Cu-Te!"
    return {"success": True, "message": pickup_line}

@app.get("/api/list_chats")
async def list_chats_api(
    amount: int = 20,
    selected_filter: str = "",
    thread_message_limit: Optional[int] = None,
    full: bool = False,
    fields: Optional[str] = None
):
    # fields is a comma-separated string
    fields_list = [f.strip() for f in fields.split(",")] if fields else None
    result = list_chats(amount, selected_filter, thread_message_limit, full, fields_list)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Failed to list chats"))
    return result

@app.get("/api/list_messages")
async def list_messages_api(thread_id: str = Query(...)):
    result = mcp_list_messages(thread_id)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Failed to list messages"))
    return result

@app.get("/api/list_pending_chats")
async def list_pending_chats_api(amount: int = 20):
    result = list_pending_chats(amount)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Failed to list pending chats"))
    return result

@app.get("/api/search_threads")
async def search_threads_api(query: str = Query(...)):
    result = search_threads(query)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Failed to search threads"))
    return result

@app.post("/api/get_thread_by_participants")
async def get_thread_by_participants_api(req: GetThreadByParticipantsRequest):
    result = get_thread_by_participants(req.user_ids)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Failed to get thread by participants"))
    return result

@app.get("/api/get_thread_details")
async def get_thread_details_api(thread_id: str = Query(...), amount: int = 20):
    result = get_thread_details(thread_id, amount)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Failed to get thread details"))
    return result

@app.get("/api/get_user_id_from_username")
async def get_user_id_from_username_api(username: str = Query(...)):
    result = get_user_id_from_username(username)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Failed to get user id from username"))
    return result

@app.get("/api/get_username_from_user_id")
async def get_username_from_user_id_api(user_id: str = Query(...)):
    result = get_username_from_user_id(user_id)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Failed to get username from user id"))
    return result

@app.post("/api/analyze_messages")
async def analyze_messages_api(thread_id: str = Query(...)):
    result = mcp_list_messages(thread_id)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Failed to list messages for analysis"))
    messages = result.get("messages", [])
    texts = [m.get("text", "") for m in messages if isinstance(m, dict) and m.get("text")]
    all_text = " ".join(texts)
    words = all_text.split()
    word_count = len(words)
    message_count = len(texts)
    most_common = Counter(words).most_common(10)
    # Placeholder for sentiment analysis
    sentiment = "neutral"  # TODO: Integrate real sentiment analysis
    return {
        "success": True,
        "message_count": message_count,
        "word_count": word_count,
        "most_common_words": most_common,
        "sentiment": sentiment,
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    uvicorn.run("http_server:app", host="0.0.0.0", port=port, reload=True) 