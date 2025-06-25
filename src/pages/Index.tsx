
import React, { useState } from 'react';
import LoginScreen from '../components/LoginScreen';
import ContactList from '../components/ContactList';
import AnalysisScreen from '../components/AnalysisScreen';
import ResultsScreen from '../components/ResultsScreen';

type Screen = 'login' | 'contacts' | 'analysis' | 'results';

interface SelectedContact {
  id: string;
  username: string;
  avatar: string;
  lastChat: string;
  rizzScore: number;
}

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [selectedContact, setSelectedContact] = useState<SelectedContact | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);

  const handleLogin = () => {
    setCurrentScreen('contacts');
  };

  const handleContactSelect = (contact: SelectedContact) => {
    setSelectedContact(contact);
    setCurrentScreen('analysis');
  };

  const handleAnalysisComplete = (data: any) => {
    setAnalysisData(data);
    setCurrentScreen('results');
  };

  const handleBack = () => {
    switch (currentScreen) {
      case 'contacts':
        setCurrentScreen('login');
        break;
      case 'analysis':
        setCurrentScreen('contacts');
        break;
      case 'results':
        setCurrentScreen('contacts');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {currentScreen === 'login' && <LoginScreen onLogin={handleLogin} />}
      {currentScreen === 'contacts' && (
        <ContactList onContactSelect={handleContactSelect} onBack={handleBack} />
      )}
      {currentScreen === 'analysis' && selectedContact && (
        <AnalysisScreen
          contact={selectedContact}
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
    </div>
  );
};

export default Index;
