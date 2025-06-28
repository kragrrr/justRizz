import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, User, Zap, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { analyzeMessages, analyzeContact } from '@/lib/utils';

interface Contact {
  id: string;
  username: string;
  avatar: string;
  lastChat: string;
  rizzScore: number;
}

interface AnalysisResult {
  messages: { sender: string; text: string; time: string; sentiment: string }[];
  profile: { bio: string; interests: string[]; dominantColors: string[] };
  rizzScore: number;
  insights: string[];
  pickupLines: string[];
}

interface AnalysisScreenProps {
  contact: Contact;
  sessionToken: string;
  onAnalysisComplete: (data: AnalysisResult) => void;
  onBack: () => void;
}

const AnalysisScreen: React.FC<AnalysisScreenProps> = ({ contact, sessionToken, onAnalysisComplete, onBack }) => {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const runAnalysis = async () => {
      setProgress(10);
      try {
        const result = await analyzeContact(sessionToken, contact.username);
        if (!isMounted) return;
        setProgress(100);
        const analysis: AnalysisResult = {
          messages: (result.chat_history || []).map((text: string) => ({ sender: contact.username, text, time: '', sentiment: '' })),
          profile: {
            bio: result.profile?.bio || '',
            interests: result.profile?.top_hashtags || [],
            dominantColors: result.profile?.color_palette || []
          },
          rizzScore: result.rizz_score || 0,
          insights: result.insights || [],
          pickupLines: result.pickup_lines || []
        };
        onAnalysisComplete(analysis);
      } catch (err: any) {
        setProgress(100);
        setError('Analysis failed');
        onAnalysisComplete({
          messages: [],
          profile: { bio: '', interests: [], dominantColors: [] },
          rizzScore: 0,
          insights: ['Analysis failed'],
          pickupLines: []
        });
      }
    };
    runAnalysis();
    return () => { isMounted = false; };
  }, [contact, sessionToken, onAnalysisComplete]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
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
          <div className="flex items-center space-x-3">
            <img
              src={contact.avatar}
              alt={contact.username}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <h1 className="font-medium">@{contact.username}</h1>
              <p className="text-xs text-gray-400">Analysing profile...</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Analysis Progress</span>
              <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <div className="text-center mt-8">
            <p className="text-lg text-gray-300">Analysing profile and generating pickup line...</p>
            {error && <div className="text-red-400 mt-4">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisScreen;
