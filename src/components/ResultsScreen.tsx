
import React, { useState } from 'react';
import { ArrowLeft, Copy, RefreshCw, TrendingUp, Lightbulb, Heart, Coffee, Mountain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Contact {
  id: string;
  username: string;
  avatar: string;
  rizzScore: number;
}

interface AnalysisData {
  rizzScore: number;
  insights: string[];
  pickupLines: string[];
  profile: {
    interests: string[];
  };
}

interface ResultsScreenProps {
  contact: Contact;
  data: AnalysisData;
  onBack: () => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ contact, data, onBack }) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Pickup line copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const regenerateLine = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setCurrentLineIndex((prev) => (prev + 1) % data.pickupLines.length);
      setIsRegenerating(false);
    }, 1500);
  };

  const getRizzGrade = (score: number) => {
    if (score >= 90) return { grade: 'S', color: 'text-purple-400', bg: 'bg-purple-500/20' };
    if (score >= 80) return { grade: 'A', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (score >= 60) return { grade: 'C', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { grade: 'D', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const rizzGrade = getRizzGrade(data.rizzScore);

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
              <p className="text-xs text-gray-400">Analysis complete</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Rizz Score Display */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${rizzGrade.bg} border-4 border-current ${rizzGrade.color} mb-4`}>
            <div className="text-center">
              <div className="text-3xl font-bold">{data.rizzScore}%</div>
              <div className="text-sm opacity-80">Rizz</div>
            </div>
          </div>
          
          <div className={`inline-block px-4 py-2 rounded-full ${rizzGrade.bg} ${rizzGrade.color} font-medium`}>
            Grade: {rizzGrade.grade}
          </div>
        </div>

        {/* Pickup Line Section */}
        <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-lg p-6">
          <h3 className="font-medium mb-4 flex items-center text-pink-400">
            <Heart className="w-5 h-5 mr-2" />
            AI-Generated Pickup Line
          </h3>
          
          <div className="bg-black/30 rounded-lg p-4 mb-4">
            <p className="text-lg leading-relaxed">
              {isRegenerating ? (
                <span className="flex items-center text-gray-400">
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating new line...
                </span>
              ) : (
                data.pickupLines[currentLineIndex]
              )}
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={() => copyToClipboard(data.pickupLines[currentLineIndex])}
              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
              disabled={isRegenerating}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </Button>
            <Button
              onClick={regenerateLine}
              variant="outline"
              className="px-4 border-gray-600 text-gray-300 hover:bg-gray-800"
              disabled={isRegenerating}
            >
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Insights Section */}
        <div className="bg-gray-900/30 rounded-lg p-6">
          <h3 className="font-medium mb-4 flex items-center text-blue-400">
            <Lightbulb className="w-5 h-5 mr-2" />
            Conversation Insights
          </h3>
          
          <div className="space-y-3">
            {data.insights.map((insight, idx) => (
              <div key={idx} className="flex items-start space-x-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-3 h-3 text-blue-400" />
                </div>
                <p className="text-sm text-gray-300">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-900/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">92%</div>
            <div className="text-xs text-gray-400">Response Rate</div>
          </div>
          <div className="bg-gray-900/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">2.5x</div>
            <div className="text-xs text-gray-400">Faster than Avg</div>
          </div>
          <div className="bg-gray-900/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">15</div>
            <div className="text-xs text-gray-400">Common Interests</div>
          </div>
          <div className="bg-gray-900/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-pink-400 mb-1">High</div>
            <div className="text-xs text-gray-400">Compatibility</div>
          </div>
        </div>

        {/* Interest Tags */}
        <div className="bg-gray-900/30 rounded-lg p-4">
          <h4 className="font-medium mb-3 text-gray-300">Shared Interests</h4>
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
              <Mountain className="w-3 h-3 mr-1" />
              Hiking
            </span>
            <span className="flex items-center px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-sm">
              <Coffee className="w-3 h-3 mr-1" />
              Coffee
            </span>
            {data.profile.interests.slice(2).map((interest, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm"
              >
                #{interest}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
