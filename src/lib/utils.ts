import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface Contact {
  id: string;
  username: string;
  avatar: string;
  lastChat: string;
  rizzScore: number;
  messageCount: number;
}

export interface AnalysisResult {
  messages: { sender: string; text: string; time: string; sentiment: string }[];
  profile: { bio: string; interests: string[]; dominantColors: string[] };
  rizzScore: number;
  insights: string[];
  pickupLines: string[];
}

const API_BASE = 'http://localhost:5050/api';

/**
 * Logs in to the backend and returns a session token.
 */
export async function login(username: string, password: string): Promise<string> {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!response.ok) throw new Error('Login failed');
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'Login failed');
  return data.session_token;
}

/**
 * Calls the backend analyze_contact endpoint for a given Instagram username and session token.
 * @param sessionToken Session token
 * @param username Instagram username to analyze
 * @returns Analysis result from backend
 */
export async function analyzeContact(sessionToken: string, username: string, thread_id?: string): Promise<any> {
  const response = await fetch(`${API_BASE}/analyze_contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_token: sessionToken, username, thread_id })
  });
  if (!response.ok) throw new Error('Failed to analyze contact');
  return response.json();
}

/**
 * Fetches the user's DM contacts from the backend using a session token.
 * @param sessionToken Session token
 * @returns List of contacts for ContactList
 */
export async function fetchContacts(sessionToken: string): Promise<Contact[]> {
  const response = await fetch(`${API_BASE}/list_contacts?session_token=${encodeURIComponent(sessionToken)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to fetch contacts');
  const data = await response.json();
  return data.contacts || [];
}

export async function sendMessage(
  ig_username: string,
  ig_password: string,
  username: string,
  message: string
): Promise<any> {
  const response = await fetch(`${API_BASE}/send_message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ig_username, ig_password, username, message })
  });
  if (!response.ok) throw new Error('Failed to send message');
  return response.json();
}

export async function listChats(params: { amount?: number; selected_filter?: string; thread_message_limit?: number; full?: boolean; fields?: string[] } = {}): Promise<any> {
  const query = new URLSearchParams();
  if (params.amount) query.append('amount', params.amount.toString());
  if (params.selected_filter) query.append('selected_filter', params.selected_filter);
  if (params.thread_message_limit) query.append('thread_message_limit', params.thread_message_limit.toString());
  if (params.full) query.append('full', params.full.toString());
  if (params.fields) query.append('fields', params.fields.join(','));
  const response = await fetch(`${API_BASE}/list_chats?${query.toString()}`);
  if (!response.ok) throw new Error('Failed to list chats');
  return response.json();
}

export async function listMessages(thread_id: string, amount: number = 20): Promise<any> {
  const response = await fetch(`${API_BASE}/list_messages?thread_id=${encodeURIComponent(thread_id)}&amount=${amount}`);
  if (!response.ok) throw new Error('Failed to list messages');
  return response.json();
}

export async function listPendingChats(amount: number = 20): Promise<any> {
  const response = await fetch(`${API_BASE}/list_pending_chats?amount=${amount}`);
  if (!response.ok) throw new Error('Failed to list pending chats');
  return response.json();
}

export async function searchThreads(query: string): Promise<any> {
  const response = await fetch(`${API_BASE}/search_threads?query=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Failed to search threads');
  return response.json();
}

export async function getThreadByParticipants(user_ids: number[]): Promise<any> {
  const response = await fetch(`${API_BASE}/get_thread_by_participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_ids })
  });
  if (!response.ok) throw new Error('Failed to get thread by participants');
  return response.json();
}

export async function getThreadDetails(thread_id: string, amount: number = 20): Promise<any> {
  const response = await fetch(`${API_BASE}/get_thread_details?thread_id=${encodeURIComponent(thread_id)}&amount=${amount}`);
  if (!response.ok) throw new Error('Failed to get thread details');
  return response.json();
}

export async function getUserIdFromUsername(username: string): Promise<any> {
  const response = await fetch(`${API_BASE}/get_user_id_from_username?username=${encodeURIComponent(username)}`);
  if (!response.ok) throw new Error('Failed to get user id from username');
  return response.json();
}

export async function getUsernameFromUserId(user_id: string): Promise<any> {
  const response = await fetch(`${API_BASE}/get_username_from_user_id?user_id=${encodeURIComponent(user_id)}`);
  if (!response.ok) throw new Error('Failed to get username from user id');
  return response.json();
}

export async function analyzeMessages(thread_id: string): Promise<any> {
  const response = await fetch(`${API_BASE}/analyze_messages?thread_id=${encodeURIComponent(thread_id)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to analyze messages');
  return response.json();
}
