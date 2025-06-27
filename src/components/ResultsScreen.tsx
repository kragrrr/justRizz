import React, { useState } from 'react';
import { ArrowLeft, Copy, RefreshCw, TrendingUp, Lightbulb, Heart, Coffee, Mountain, Send, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { sendMessage } from '@/lib/utils';

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
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
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

  const handleSendPickupLine = async () => {
    setIsSending(true);
    setSendSuccess(false);
    setSendError(null);
    try {
      await sendMessage(contact.username, data.pickupLines[currentLineIndex]);
      setIsSending(false);
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 2000);
    } catch (err: any) {
      setIsSending(false);
      setSendError(err.message || 'Failed to send message');
      setTimeout(() => setSendError(null), 3000);
    }
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
        <div className="text-center mb-6">
          <div className="w-32 h-32 rounded-full border border-gray-800 flex items-center justify-center mx-auto mb-2">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{data.rizzScore}%</div>
              <div className="text-sm text-gray-400">Rizz</div>
            </div>
          </div>
          <div className="text-white text-base font-medium">Grade: {rizzGrade.grade}</div>
        </div>

        {/* Pickup Line Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h3 className="font-medium mb-4 flex items-center text-white">
            <Heart className="w-5 h-5 mr-2 text-gray-400" />
            AI-Generated Pickup Line
          </h3>
          <div className="bg-black rounded-lg p-4 mb-4 text-white min-h-[40px] flex items-center">
            {isRegenerating ? (
              <span className="flex items-center text-gray-400">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin text-gray-400" />
                Generating new line...
              </span>
            ) : (
              data.pickupLines[currentLineIndex]
            )}
          </div>
          <div className="flex space-x-3 mb-2">
            <Button
              onClick={() => copyToClipboard(data.pickupLines[currentLineIndex])}
              className="flex-1 bg-gray-900 border border-gray-800 text-white hover:border-white"
              disabled={isRegenerating}
            >
              <Copy className="w-4 h-4 mr-2 text-gray-400" />
              Copy to Clipboard
            </Button>
            <Button
              onClick={regenerateLine}
              variant="outline"
              className="px-4 border border-gray-800 text-white hover:border-white"
              disabled={isRegenerating}
            >
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''} text-gray-400`} />
            </Button>
          </div>
          <Button
            onClick={handleSendPickupLine}
            className="w-full mt-2 bg-gray-900 border border-gray-800 text-white hover:border-white flex items-center justify-center"
            disabled={isSending || isRegenerating}
          >
            {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-gray-400" /> : <Send className="w-4 h-4 mr-2 text-gray-400" />}
            {isSending ? 'Sending...' : 'Send to Instagram'}
          </Button>
          {sendSuccess && (
            <div className="flex items-center justify-center text-white mt-2 text-sm">
              <CheckCircle className="w-4 h-4 mr-1 text-gray-400" /> Sent!
            </div>
          )}
          {sendError && (
            <div className="flex items-center justify-center text-red-400 mt-2 text-sm">
              {sendError}
            </div>
          )}
        </div>

        {/* Insights Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h3 className="font-medium mb-4 flex items-center text-white">
            <Lightbulb className="w-5 h-5 mr-2 text-gray-400" />
            Conversation Insights
          </h3>
          <div className="space-y-3">
            {data.insights.map((insight, idx) => (
              <div key={idx} className="flex items-start space-x-3 p-3 bg-black border border-gray-800 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-3 h-3 text-gray-400" />
                </div>
                <span className="text-white text-sm">{insight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-white">92%</div>
            <div className="text-xs text-gray-400 mt-1">Response Rate</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-white">2.5x</div>
            <div className="text-xs text-gray-400 mt-1">Faster than Avg</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-white">15</div>
            <div className="text-xs text-gray-400 mt-1">Common Interests</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-white">High</div>
            <div className="text-xs text-gray-400 mt-1">Compatibility</div>
          </div>
        </div>

        {/* Interest Tags */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h4 className="font-medium mb-3 text-white">Shared Interests</h4>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-gray-800 text-white text-xs flex items-center">Hiking</span>
            <span className="px-3 py-1 rounded-full bg-gray-800 text-white text-xs flex items-center">Coffee</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
