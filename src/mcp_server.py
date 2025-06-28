from fastmcp import FastMCP
from instagrapi import Client
import argparse
from typing import Optional, List, Dict, Any
import os
import uuid
from threading import Lock
from fastapi import HTTPException
from pydantic import BaseModel
from json import JSONDecodeError
import requests

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

PERPLEXITY_API_KEY = os.environ.get("PERPLEXITY_API_KEY", "pplx-...")
PERPLEXITY_API_BASE = "https://api.perplexity.ai"

INSTRUCTIONS = """
This server is used to send messages to a user on Instagram.
"""

client = Client()

mcp_server = FastMCP(
   name="Instagram DMs",
   instructions=INSTRUCTIONS
)

# Session management
session_store = {}
session_lock = Lock()

def get_client_for_session(session_token: str):
    with session_lock:
        return session_store.get(session_token)

def send_message_with_client(ig_client, username: str, message: str) -> dict:
    """Send an Instagram direct message using a specific ig_client instance."""
    if not username or not message:
        return {"success": False, "message": "Username and message must be provided."}
    try:
        user_id = ig_client.user_id_from_username(username)
        if not user_id:
            return {"success": False, "message": f"User '{username}' not found."}
        dm = ig_client.direct_send(message, [user_id])
        if dm:
            return {"success": True, "message": "Message sent to user.", "direct_message_id": getattr(dm, 'id', None)}
        else:
            return {"success": False, "message": "Failed to send message."}
    except Exception as e:
        return {"success": False, "message": str(e)}

@mcp_server.tool()
def send_message(username: str, message: str) -> Dict[str, Any]:
    """Send an Instagram direct message to a user by username.

    Args:
        username: Instagram username of the recipient.
        message: The message text to send.
    Returns:
        A dictionary with success status and a status message.
    """
    return send_message_with_client(client, username, message)


@mcp_server.tool()
def list_chats(
    amount: int = 20,
    selected_filter: str = "",
    thread_message_limit: Optional[int] = None,
    full: bool = False,
    fields: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Get Instagram Direct Message threads (chats) from the user's account, with optional filters and limits.

    Args:
        amount: Number of threads to fetch (default 20).
        selected_filter: Filter for threads ("", "flagged", or "unread").
        thread_message_limit: Limit for messages per thread.
        full: If True, return the full thread object for each chat (default False).
        fields: If provided, return only these fields for each thread.
    Returns:
        A dictionary with success status and the list of threads or error message.
    """
    def thread_summary(thread):
        t = thread if isinstance(thread, dict) else thread.dict()
        users = t.get("users", [])
        user_summaries = [
            {
                "username": u.get("username"),
                "full_name": u.get("full_name"),
                "pk": u.get("pk")
            }
            for u in users
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
            return {"success": True, "threads": [filter_fields(t, fields) for t in threads]}
        else:
            return {"success": True, "threads": [thread_summary(t) for t in threads]}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp_server.tool()
def list_messages(thread_id: str, amount: int = 20) -> Dict[str, Any]:
    """Get messages from a specific Instagram Direct Message thread by thread ID, with an optional limit.

    Args:
        thread_id: The thread ID to fetch messages from.
        amount: Number of messages to fetch (default 20).
    Returns:
        A dictionary with success status and the list of messages or error message.
    """
    if not thread_id:
        return {"success": False, "message": "Thread ID must be provided."}
    try:
        messages = client.direct_messages(thread_id, amount)
        return {"success": True, "messages": [m.dict() if hasattr(m, 'dict') else str(m) for m in messages]}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp_server.tool()
def list_pending_chats(amount: int = 20) -> Dict[str, Any]:
    """Get Instagram Direct Message threads (chats) from the user's pending inbox.

    Args:
        amount: Number of pending threads to fetch (default 20).
    Returns:
        A dictionary with success status and the list of pending threads or error message.
    """
    try:
        threads = client.direct_pending_inbox(amount)
        return {"success": True, "threads": [t.dict() if hasattr(t, 'dict') else str(t) for t in threads]}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp_server.tool()
def search_threads(query: str) -> Dict[str, Any]:
    """Search Instagram Direct Message threads by username or keyword.

    Args:
        query: The search term (username or keyword).
    Returns:
        A dictionary with success status and the search results or error message.
    """
    if not query:
        return {"success": False, "message": "Query must be provided."}
    try:
        results = client.direct_search(query)
        return {"success": True, "results": [r.dict() if hasattr(r, 'dict') else str(r) for r in results]}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp_server.tool()
def get_thread_by_participants(user_ids: List[int]) -> Dict[str, Any]:
    """Get an Instagram Direct Message thread by participant user IDs.

    Args:
        user_ids: List of user IDs (ints).
    Returns:
        A dictionary with success status and the thread or error message.
    """
    if not user_ids or not isinstance(user_ids, list):
        return {"success": False, "message": "user_ids must be a non-empty list of user IDs."}
    try:
        thread = client.direct_thread_by_participants(user_ids)
        return {"success": True, "thread": thread.dict() if hasattr(thread, 'dict') else str(thread)}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp_server.tool()
def get_thread_details(thread_id: str, amount: int = 20) -> Dict[str, Any]:
    """Get details and messages for a specific Instagram Direct Message thread by thread ID, with an optional message limit.

    Args:
        thread_id: The thread ID to fetch details for.
        amount: Number of messages to fetch (default 20).
    Returns:
        A dictionary with success status and the thread details or error message.
    """
    if not thread_id:
        return {"success": False, "message": "Thread ID must be provided."}
    try:
        thread = client.direct_thread(thread_id, amount)
        return {"success": True, "thread": thread.dict() if hasattr(thread, 'dict') else str(thread)}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp_server.tool()
def get_user_id_from_username(username: str) -> Dict[str, Any]:
    """Get the Instagram user ID for a given username.

    Args:
        username: Instagram username.
    Returns:
        A dictionary with success status and the user ID or error message.
    """
    if not username:
        return {"success": False, "message": "Username must be provided."}
    try:
        user_id = client.user_id_from_username(username)
        if user_id:
            return {"success": True, "user_id": user_id}
        else:
            return {"success": False, "message": f"User '{username}' not found."}
    except Exception as e:
        return {"success": False, "message": str(e)}


@mcp_server.tool()
def get_username_from_user_id(user_id: str) -> Dict[str, Any]:
    """Get the Instagram username for a given user ID.

    Args:
        user_id: Instagram user ID.
    Returns:
        A dictionary with success status and the username or error message.
    """
    if not user_id:
        return {"success": False, "message": "User ID must be provided."}
    try:
        username = client.username_from_user_id(user_id)
        if username:
            return {"success": True, "username": username}
        else:
            return {"success": False, "message": f"User ID '{user_id}' not found."}
    except Exception as e:
        return {"success": False, "message": str(e)}


def _analyze_contact_impl(session_token: str, username: str = None, thread_id: str = None) -> Dict[str, Any]:
    print(f"[DEBUG] analyze_contact called with session_token={session_token}, username={username}")
    ig_client = get_client_for_session(session_token)
    print(f"[DEBUG] ig_client found: {ig_client is not None}")
    if not ig_client:
        print("[ERROR] Invalid or expired session token.")
        return {"success": False, "message": "Invalid or expired session token."}
    if not username:
        print("[ERROR] Username required.")
        return {"success": False, "message": "Username required"}
    try:
        # 1. Fetch profile info
        profile = ig_client.user_info_by_username(username)
        print(f"[DEBUG] Profile fetched for {username}: {profile}")
        bio = profile.biography
        links = getattr(profile, 'external_url', '') or ''
        bio_keywords = bio.split()[:5] if bio else []
        photo_captions = []
        photo_hashtags = []

        # Compose context for Perplexity
        profile_context = f"""
        Username: {username}
        Bio: {bio}
        Bio Keywords: {', '.join(bio_keywords)}
        Links: {links}
        """

        pickup_line_1 = generate_pickup_line_with_perplexity(profile_context)
        pickup_line_1 = clean_pickup_line(pickup_line_1)
        pickup_lines = [pickup_line_1]
        insights = [
            "Bio keywords: " + ', '.join(bio_keywords),
            "Links: " + str(links)
        ]
        print(f"[DEBUG] Analysis complete for {username}")

        # Send the pickup line as a DM using the session's ig_client
        send_result = send_message_with_client(ig_client, username, pickup_line_1)

        return {
            "success": True,
            "profile": {
                "bio": bio,
                "bio_keywords": bio_keywords,
                "links": links,
                "photo_captions": photo_captions,
                "photo_hashtags": photo_hashtags
            },
            "pickup_lines": pickup_lines,
            "insights": insights,
            "dm_send_status": send_result
        }
    except Exception as e:
        # If profile was fetched, still generate pickup line with what we have
        if 'profile' in locals():
            print(f"[WARN] Exception after profile fetch: {e}. Generating pickup line with available info.")
            bio = profile.biography
            links = getattr(profile, 'external_url', '') or ''
            bio_keywords = bio.split()[:5] if bio else []
            photo_captions = []
            photo_hashtags = []
            profile_context = f"""
            Username: {username}
            Bio: {bio}
            Bio Keywords: {', '.join(bio_keywords)}
            Links: {links}
            """
            pickup_line_1 = generate_pickup_line_with_perplexity(profile_context)
            pickup_line_1 = clean_pickup_line(pickup_line_1)
            pickup_lines = [pickup_line_1]
            insights = [
                "Bio keywords: " + ', '.join(bio_keywords),
                "Links: " + str(links)
            ]
            # Try to send the pickup line as a DM even if there was an error after profile fetch
            try:
                send_result = send_message_with_client(ig_client, username, pickup_line_1)
            except Exception as send_e:
                send_result = {"success": False, "message": f"Failed to send DM: {send_e}"}
            return {
                "success": True,
                "profile": {
                    "bio": bio,
                    "bio_keywords": bio_keywords,
                    "links": links,
                    "photo_captions": photo_captions,
                    "photo_hashtags": photo_hashtags
                },
                "pickup_lines": pickup_lines,
                "insights": insights,
                "dm_send_status": send_result,
                "warning": f"Analysis completed with partial data due to error: {str(e)}"
            }
        print(f"[ERROR] Exception during analysis: {e}")
        return {"success": False, "message": f"Instagram fetch error: {str(e)}"}

@mcp_server.tool()
def analyze_contact(session_token: str, username: str = None, thread_id: str = None) -> Dict[str, Any]:
    return _analyze_contact_impl(session_token, username, thread_id)

def analyze_contact_plain(session_token: str, username: str = None, thread_id: str = None):
    return _analyze_contact_impl(session_token, username, thread_id)

def generate_pickup_line_with_perplexity(profile_context: str) -> str:
    api_key = os.environ.get("PERPLEXITY_API_KEY")
    if not api_key:
        return "[Perplexity API key not set]"
    url = "https://api.perplexity.ai/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "sonar-pro",
        "messages": [
            {
                "role": "system",
                "content": "You are an AI dating coach. Generate a smart, funny, and personalized pickup line using the provided Instagram profile details. IMPORTANT: ONLY return the pickup line itself. Do NOT include any preamble, explanation, or extra text."
            },
            {
                "role": "user",
                "content": profile_context
            }
        ]
    }
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]
    except Exception as e:
        return f"[Perplexity API error: {e}]"

def clean_pickup_line(pickup_line: str) -> str:
    # Remove common AI preambles
    preambles = [
        "Sure! Here's a smart, funny, and personalized pickup line inspired by your profile details:",
        "Here's a smart, funny, and personalized pickup line inspired by your profile details:",
        "Here is a smart, funny, and personalized pickup line inspired by your profile details:",
        "Here is a pickup line inspired by your profile:",
        "Here's a pickup line inspired by your profile:",
        "Sure! ",
    ]
    for pre in preambles:
        if pickup_line.strip().startswith(pre):
            return pickup_line.strip()[len(pre):].lstrip(' :\n')
    return pickup_line.strip()

def _login_impl(username: str, password: str) -> Dict[str, Any]:
    ig_client = Client()
    try:
        ig_client.login(username, password)
        session_token = str(uuid.uuid4())
        with session_lock:
            session_store[session_token] = ig_client
        return {"success": True, "session_token": session_token}
    except Exception as e:
        return {"success": False, "message": str(e)}

@mcp_server.tool()
def login(username: str, password: str) -> Dict[str, Any]:
    return _login_impl(username, password)

def login_plain(username: str, password: str):
    return _login_impl(username, password)

def _list_contacts_impl(session_token: str, amount: int = 20) -> Dict[str, Any]:
    ig_client = get_client_for_session(session_token)
    if not ig_client:
        return {"success": False, "message": "Invalid or expired session token."}
    try:
        threads = ig_client.direct_threads(amount)
        contacts = []
        for t in threads:
            users = t.users if hasattr(t, 'users') else []
            # Try to get accurate message count from thread details if available
            message_count = getattr(t, 'items_count', None) or getattr(t, 'thread_size', None)
            if message_count is None:
                # Fallback: try to fetch thread details for count
                try:
                    thread_details = ig_client.direct_thread(t.id)
                    message_count = getattr(thread_details, 'items_count', None) or getattr(thread_details, 'thread_size', None)
                    if message_count is None and hasattr(thread_details, 'messages'):
                        message_count = len(thread_details.messages)
                except Exception:
                    message_count = len(t.messages) if hasattr(t, 'messages') else 0
            for u in users:
                contacts.append({
                    "username": u.username,
                    "full_name": u.full_name,
                    "avatar": getattr(u, 'profile_pic_url', ''),
                    "lastChat": str(t.last_activity_at) if hasattr(t, 'last_activity_at') else '',
                    "rizzScore": 70,
                    "messageCount": message_count or 0
                })
        seen = set()
        unique_contacts = []
        for c in contacts:
            if c['username'] not in seen:
                unique_contacts.append(c)
                seen.add(c['username'])
        # Sort by lastChat (descending, most recent first)
        unique_contacts.sort(key=lambda c: c['lastChat'], reverse=True)
        return {"success": True, "contacts": unique_contacts}
    except Exception as e:
        return {"success": False, "message": str(e)}

@mcp_server.tool()
def list_contacts(session_token: str, amount: int = 20) -> Dict[str, Any]:
    return _list_contacts_impl(session_token, amount)

def list_contacts_plain(session_token: str, amount: int = 20):
    return _list_contacts_impl(session_token, amount)

def list_messages_plain(thread_id: str):
    """Get all messages from a specific Instagram Direct Message thread by thread ID (no limit)."""
    if not thread_id:
        return {"success": False, "message": "Thread ID must be provided."}
    try:
        # Use a very high amount to fetch all messages, or implement proper pagination if needed
        messages = client.direct_messages(thread_id, amount=10000)
        return {"success": True, "messages": [m.dict() if hasattr(m, 'dict') else str(m) for m in messages]}
    except Exception as e:
        return {"success": False, "message": str(e)}

if __name__ == "__main__":
   parser = argparse.ArgumentParser()
   parser.add_argument("--username", type=str, required=True)
   parser.add_argument("--password", type=str, required=True)
   args = parser.parse_args()

   client.login(args.username, args.password)
   mcp_server.run(transport="stdio")
