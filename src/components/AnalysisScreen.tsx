import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, User, Zap, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { analyzeContact } from '@/lib/utils';

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

interface AnalysisStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'pending' | 'processing' | 'complete';
}

const AnalysisScreen: React.FC<AnalysisScreenProps> = ({ contact, sessionToken, onAnalysisComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const [steps, setSteps] = useState<AnalysisStep[]>([
    {
      id: 'chat',
      label: 'Chat history',
      icon: <MessageSquare className="w-4 h-4" />,
      status: 'pending'
    },
    {
      id: 'profile',
      label: 'Profile scan',
      icon: <User className="w-4 h-4" />,
      status: 'pending'
    },
    {
      id: 'ai',
      label: 'AI generation',
      icon: <Zap className="w-4 h-4" />,
      status: 'pending'
    }
  ]);

  useEffect(() => {
    let isMounted = true;
    const runAnalysis = async () => {
      setSteps(prev => prev.map((step, idx) => idx === 0 ? { ...step, status: 'processing' } : step));
      setProgress(10);
      try {
        const result = await analyzeContact(sessionToken, contact.username);
        if (!isMounted) return;
        setSteps(prev => prev.map((step, idx) => idx === 0 ? { ...step, status: 'complete' } : step));
        setProgress(33);
        setCurrentStep(1);
        setSteps(prev => prev.map((step, idx) => idx === 1 ? { ...step, status: 'processing' } : step));
        setProgress(66);
        setCurrentStep(2);
        setSteps(prev => prev.map((step, idx) => idx === 1 ? { ...step, status: 'complete' } : step));
        setSteps(prev => prev.map((step, idx) => idx === 2 ? { ...step, status: 'processing' } : step));
        setProgress(90);
        setSteps(prev => prev.map((step, idx) => idx === 2 ? { ...step, status: 'complete' } : step));
        setProgress(100);
        // Adapt backend result to expected frontend format
        const analysisResult = {
          messages: result.chat_history?.map((text: string) => ({ sender: 'them', text, time: '', sentiment: 'neutral' })) || [],
          profile: {
            bio: result.profile?.bio || '',
            interests: result.profile?.bio_keywords || [],
            dominantColors: result.profile?.color_palette || []
          },
          rizzScore: result.rizz_score || 0,
          insights: result.insights || [],
          pickupLines: result.pickup_lines || []
        };
        onAnalysisComplete(analysisResult);
      } catch (err) {
        // TODO: handle error UI
        setProgress(100);
        setSteps(prev => prev.map((step, idx) => idx === 2 ? { ...step, status: 'complete' } : step));
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

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500/20 border-green-500/50';
      case 'negative': return 'bg-red-500/20 border-red-500/50';
      default: return 'bg-gray-500/20 border-gray-500/50';
    }
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
          <div className="flex items-center space-x-3">
            <img
              src={contact.avatar}
              alt={contact.username}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <h1 className="font-medium">@{contact.username}</h1>
              <p className="text-xs text-gray-400">Analyzing profile...</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Analysis Progress</span>
            <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Desktop: Three-column layout, Mobile: Stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Preview */}
          <div className="bg-gray-900/30 rounded-lg p-4">
            <h3 className="font-medium mb-4 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat Preview
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`p-3 rounded-lg border ${getSentimentColor(step.id === 'chat' ? 'neutral' : 'positive')}`}
                >
                  <p className="text-sm">{step.id === 'chat' ? 'Loading chat history...' : 'Loading profile data...'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Profile Scanner */}
          <div className="bg-gray-900/30 rounded-lg p-4">
            <h3 className="font-medium mb-4 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Profile Scanner
            </h3>
            
            <div className="text-center mb-4">
              <img
                src={contact.avatar}
                alt={contact.username}
                className="w-20 h-20 rounded-full mx-auto mb-3"
              />
              <div className="flex justify-center space-x-2 mb-3">
                {steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: step.id === 'profile' ? '#4169E1' : '#8B4513' }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Bio Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {steps.map((step, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs"
                    >
                      {step.id === 'profile' ? '#' + step.label : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live Processing Panel */}
          <div className="bg-gray-900/30 rounded-lg p-4">
            <h3 className="font-medium mb-4 flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Processing Status
            </h3>
            
            <div className="space-y-4">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    step.status === 'complete' 
                      ? 'bg-green-500' 
                      : step.status === 'processing'
                      ? 'bg-blue-500'
                      : 'bg-gray-600'
                  }`}>
                    {step.status === 'complete' ? (
                      <Check className="w-3 h-3" />
                    ) : step.status === 'processing' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span className={`text-sm ${
                    step.status === 'complete' ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {currentStep >= 2 && (
              <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">AI Generating...</span>
                </div>
                <p className="text-xs text-gray-400">
                  Creating personalized pickup lines based on profile analysis
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisScreen;
