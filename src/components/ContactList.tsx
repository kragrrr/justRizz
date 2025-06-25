import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, MessageCircle, TrendingUp, RefreshCw, Inbox, UserPlus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  fetchContacts,
  listPendingChats,
  searchThreads,
  listMessages,
  getThreadByParticipants,
} from '@/lib/utils';

interface Contact {
  id?: string;
  username: string;
  avatar: string;
  lastChat: string;
  rizzScore: number;
  messageCount: number;
}

interface ContactListProps {
  sessionToken: string;
  onContactSelect: (contact: Contact, messages?: any[]) => void;
  onBack: () => void;
}

const ContactList: React.FC<ContactListProps> = ({ sessionToken, onContactSelect, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPending, setShowPending] = useState(false);
  const [pendingChats, setPendingChats] = useState<Contact[]>([]);
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatQuery, setNewChatQuery] = useState('');
  const [newChatResults, setNewChatResults] = useState<any[]>([]);
  const [isNewChatSearching, setIsNewChatSearching] = useState(false);

  // Fetch inbox or pending chats
  const loadContacts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (showPending) {
        const data = await listPendingChats();
        // Map pending threads to Contact[]
        const mapped = (data.threads || []).map((t: any) => ({
          id: t.id,
          username: t.users?.[0]?.username || '',
          avatar: t.users?.[0]?.profile_pic_url || '',
          lastChat: t.last_activity_at || '',
          rizzScore: 50,
          messageCount: t.items_count || t.thread_size || (t.messages?.length ?? 0),
        }));
        setPendingChats(mapped);
        setFilteredContacts(mapped);
      } else {
        const data = await fetchContacts(sessionToken);
        setContacts(data);
        setFilteredContacts(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load contacts');
      setContacts([]);
      setFilteredContacts([]);
      setPendingChats([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadContacts();
    // eslint-disable-next-line
  }, [sessionToken, showPending]);

  // Search bar: live search via API if query, else local filter
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      setFilteredContacts(showPending ? pendingChats : contacts);
      return;
    }
    setIsSearching(true);
    searchThreads(searchQuery)
      .then((res) => {
        // Map search results to Contact[]
        const mapped = (res.results || []).map((t: any) => ({
          id: t.id,
          username: t.users?.[0]?.username || '',
          avatar: t.users?.[0]?.profile_pic_url || '',
          lastChat: t.last_activity_at || '',
          rizzScore: 60,
          messageCount: t.items_count || t.thread_size || (t.messages?.length ?? 0),
        }));
        setSearchResults(mapped);
        setFilteredContacts(mapped);
        setIsSearching(false);
      })
      .catch(() => {
        setIsSearching(false);
        setSearchResults([]);
        setFilteredContacts([]);
      });
  }, [searchQuery, showPending, contacts, pendingChats]);

  // Refresh button
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadContacts();
    setIsRefreshing(false);
  };

  // Click contact: fetch messages and pass to parent
  const handleContactClick = async (contact: Contact) => {
    try {
      const threadId = contact.id || '';
      const data = await listMessages(threadId, 30);
      onContactSelect(contact, data.messages || []);
    } catch {
      onContactSelect(contact, []);
    }
  };

  // New Chat: search users/threads
  const handleNewChatSearch = async () => {
    setIsNewChatSearching(true);
    try {
      const res = await searchThreads(newChatQuery);
      setNewChatResults(res.results || []);
    } catch {
      setNewChatResults([]);
    }
    setIsNewChatSearching(false);
  };

  // New Chat: start chat with selected user/thread
  const handleStartNewChat = async (thread: any) => {
    // Try to get thread by participants, then open
    try {
      const userIds = thread.users?.map((u: any) => u.pk) || [];
      const res = await getThreadByParticipants(userIds);
      const t = res.thread || thread;
      const contact: Contact = {
        id: t.id,
        username: t.users?.[0]?.username || '',
        avatar: t.users?.[0]?.profile_pic_url || '',
        lastChat: t.last_activity_at || '',
        rizzScore: 60,
        messageCount: t.items_count || t.thread_size || (t.messages?.length ?? 0),
      };
      const msgs = t.messages || [];
      onContactSelect(contact, msgs);
      setShowNewChat(false);
    } catch {
      setShowNewChat(false);
    }
  };

  const getRizzColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRizzBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/20';
    if (score >= 60) return 'bg-yellow-500/20';
    return 'bg-red-500/20';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="flex items-center p-4 space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mr-3 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold flex-1">DM Contacts</h1>
          <Button
            variant={showPending ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowPending(false)}
            className="mr-1"
          >
            <Inbox className="w-4 h-4 mr-1" /> Inbox
          </Button>
          <Button
            variant={showPending ? 'ghost' : 'secondary'}
            size="sm"
            onClick={() => setShowPending(true)}
            className="mr-1"
          >
            <MessageCircle className="w-4 h-4 mr-1" /> Pending
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="ml-2"
            style={{ opacity: 1, visibility: 'visible' }}
          >
            {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewChat(true)}
            className="ml-2"
            style={{ opacity: 1, visibility: 'visible' }}
          >
            <UserPlus className="w-4 h-4 mr-1" /> New Chat
          </Button>
        </div>
        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search contacts or threads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-center text-red-400 py-4">{error}</div>
      )}

      {/* Contact List */}
      <div className="px-4 py-2">
        {isLoading || isSearching ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-4 bg-gray-900/30 rounded-lg animate-pulse">
                <div className="w-14 h-14 bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-20"></div>
                </div>
                <div className="w-12 h-6 bg-gray-700 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No conversations found</h3>
            <p className="text-gray-500">Start chatting on Instagram to see your contacts here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id || contact.username}
                onClick={() => handleContactClick(contact)}
                className="flex items-center space-x-4 p-4 bg-gray-900/30 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer"
              >
                <img
                  src={contact.avatar}
                  alt={contact.username}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-white truncate">@{contact.username}</h3>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>Last chat: {contact.lastChat}</span>
                    <span>•</span>
                    <span>{contact.messageCount} messages</span>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getRizzBgColor(contact.rizzScore)}`}>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span className={getRizzColor(contact.rizzScore)}>{contact.rizzScore}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-auto">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <UserPlus className="w-5 h-5 mr-2" /> Start New Chat
            </h2>
            <Input
              placeholder="Search users or threads..."
              value={newChatQuery}
              onChange={(e) => setNewChatQuery(e.target.value)}
              className="mb-3"
            />
            <Button
              onClick={handleNewChatSearch}
              disabled={isNewChatSearching || !newChatQuery}
              className="w-full mb-3"
            >
              {isNewChatSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </Button>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {newChatResults.length === 0 && newChatQuery && !isNewChatSearching && (
                <div className="text-gray-400 text-center">No results found</div>
              )}
              {newChatResults.map((thread, idx) => (
                <div
                  key={thread.id || idx}
                  className="flex items-center space-x-3 p-3 bg-gray-800/60 rounded-lg hover:bg-gray-700/80 cursor-pointer"
                  onClick={() => handleStartNewChat(thread)}
                >
                  <img
                    src={thread.users?.[0]?.profile_pic_url || ''}
                    alt={thread.users?.[0]?.username || ''}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">@{thread.users?.[0]?.username || ''}</div>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setShowNewChat(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactList;
