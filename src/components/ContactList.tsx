
import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, MessageCircle, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Contact {
  id: string;
  username: string;
  avatar: string;
  lastChat: string;
  rizzScore: number;
  messageCount: number;
}

interface ContactListProps {
  onContactSelect: (contact: Contact) => void;
  onBack: () => void;
}

const ContactList: React.FC<ContactListProps> = ({ onContactSelect, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data generation
  useEffect(() => {
    const mockContacts: Contact[] = [
      {
        id: '1',
        username: 'sarah_adventures',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
        lastChat: '2d ago',
        rizzScore: 85,
        messageCount: 47
      },
      {
        id: '2',
        username: 'emma_coffee',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        lastChat: '5h ago',
        rizzScore: 72,
        messageCount: 23
      },
      {
        id: '3',
        username: 'jessica_travels',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
        lastChat: '1w ago',
        rizzScore: 91,
        messageCount: 89
      },
      {
        id: '4',
        username: 'alex_fitness',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        lastChat: '3d ago',
        rizzScore: 67,
        messageCount: 12
      },
      {
        id: '5',
        username: 'maya_artist',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        lastChat: '6h ago',
        rizzScore: 88,
        messageCount: 31
      }
    ];

    setTimeout(() => {
      setContacts(mockContacts);
      setFilteredContacts(mockContacts);
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    const filtered = contacts.filter(contact =>
      contact.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredContacts(filtered);
  }, [searchQuery, contacts]);

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
        <div className="flex items-center p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mr-3 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">DM Contacts</h1>
        </div>
        
        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500"
            />
          </div>
        </div>
      </div>

      {/* Contact List */}
      <div className="px-4 py-2">
        {isLoading ? (
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
                key={contact.id}
                onClick={() => onContactSelect(contact)}
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
    </div>
  );
};

export default ContactList;
