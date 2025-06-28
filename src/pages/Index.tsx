import React, { useState } from 'react';
import LoginScreen from '../components/LoginScreen';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Search } from 'lucide-react';
import { fetchContacts } from '../lib/utils';
import type { Contact, AnalysisResult } from '../lib/utils';
import AnalysisScreen from '../components/AnalysisScreen';
import ResultsScreen from '../components/ResultsScreen';

type Screen = 'login' | 'search' | 'analysis' | 'results';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Login handler
  const handleLogin = async (token: string) => {
    setSessionToken(token);
    setCurrentScreen('search');
    setIsLoadingContacts(true);
    try {
      const data = await fetchContacts(token);
      setContacts(data);
    } catch {
      setContacts([]);
    }
    setIsLoadingContacts(false);
  };

  // Search handler
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    // Simple local search for demo; can be replaced with API search
    const results = contacts.filter((c) =>
      c.username.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
    setIsSearching(false);
  };

  // Analysis complete handler (pass-through)
  const handleAnalysisComplete = (data: AnalysisResult) => {
    setAnalysisData(data);
    setCurrentScreen('results');
  };

  // Back handler
  const handleBack = () => {
    switch (currentScreen) {
      case 'search':
        setSessionToken(null);
        setContacts([]);
        setSelectedContact(null);
        setSearchQuery('');
        setSearchResults([]);
        setCurrentScreen('login');
        break;
      case 'analysis':
        setCurrentScreen('search');
        break;
      case 'results':
        setCurrentScreen('search');
        setAnalysisData(null);
        break;
    }
  };

  // Render
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-black/80 sticky top-0 z-20">
        <h1 className="text-2xl font-bold tracking-tight">justRizz</h1>
        <div className="flex items-center space-x-4">
          {/* Placeholder for right-side actions (future) */}
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center">
        {currentScreen === 'login' && <LoginScreen onLogin={handleLogin} />}
        {currentScreen === 'search' && sessionToken && (
          <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center">
            <div className="w-full flex flex-col items-center justify-center mt-12">
              <div className="w-full flex flex-col items-center">
                <Input
                  type="text"
                  placeholder="Search your following..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full text-lg px-6 py-4 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-500 focus:border-white shadow-none"
                  autoFocus
                />
                {isLoadingContacts && (
                  <div className="mt-4 text-gray-400 text-sm">Loading contacts...</div>
                )}
                {searchQuery && !isSearching && searchResults.length === 0 && (
                  <div className="mt-4 text-gray-400 text-sm">No users found.</div>
                )}
                <div className="w-full mt-6 space-y-2">
                  {searchResults.map((contact) => (
                    <Card
                      key={contact.id || contact.username}
                      className={`w-full cursor-pointer bg-gray-900 border border-gray-800 hover:border-white transition-all ${selectedContact?.username === contact.username ? 'ring-2 ring-white' : ''}`}
                      onClick={() => setSelectedContact(contact)}
                    >
                      <CardContent className="flex items-center space-x-4 py-4">
                        <Avatar>
                          <AvatarImage src={contact.avatar} alt={contact.username} />
                          <AvatarFallback>{contact.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-bold text-lg text-white px-2 py-1 rounded-md">@{contact.username}</div>
                          <div className="text-xs text-gray-500">Last chat: {contact.lastChat ? new Date(contact.lastChat).toLocaleString() : 'N/A'}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            {/* Restore Analyse Button */}
            {selectedContact && (
              <div className="fixed bottom-0 left-0 w-full flex flex-col items-center pb-8 bg-black z-10">
                <div className="w-full max-w-md flex justify-center">
                  <Button
                    className="flex-1 py-4 text-lg bg-gray-900 border border-gray-800 text-white hover:bg-gray-800 hover:border-white transition-colors rounded-lg"
                    onClick={() => setCurrentScreen('analysis')}
                  >
                    Analyse
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        {currentScreen === 'analysis' && selectedContact && sessionToken && (
          <AnalysisScreen
            contact={selectedContact}
            sessionToken={sessionToken}
            onAnalysisComplete={handleAnalysisComplete}
            onBack={handleBack}
          />
        )}
        {currentScreen === 'results' && selectedContact && analysisData && (
          <ResultsScreen
            contact={selectedContact}
            data={analysisData}
            onBack={handleBack}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
