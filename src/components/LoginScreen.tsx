
import React, { useState } from 'react';
import { User, Eye, EyeOff, Loader2, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login } from '@/lib/utils';

interface LoginScreenProps {
  onLogin: (sessionToken: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const sessionToken = await login(username, password);
      setIsLoading(false);
      onLogin(sessionToken);
    } catch (err: unknown) {
      setIsLoading(false);
      if (err instanceof Error) {
        setError(err.message || 'Login failed');
      } else {
        setError('Login failed');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-pink-500/10 rounded-full blur-xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-blue-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <img 
              src="/lovable-uploads/539d1779-6800-4152-b968-e4e6f4ef03b1.png" 
              alt="justRizz Logo" 
              className="w-40 h-auto drop-shadow-2xl"
            />
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
            </div>
          </div>
        </div>
        <p className="text-slate-300 text-lg font-light tracking-wide">AI-powered Instagram dating coach</p>
        <p className="text-slate-400 text-sm mt-2">Level up your conversation game</p>
      </div>

      {/* Login Form */}
      <div className="relative z-10 max-w-sm mx-auto w-full">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Instagram username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-12 h-12 bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-purple-400 focus:ring-purple-400/20 rounded-xl"
                required
              />
            </div>

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-12 h-12 bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-purple-400 focus:ring-purple-400/20 rounded-xl"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Connect Instagram
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Security Disclaimer */}
      <div className="relative z-10 flex items-center justify-center mt-8 text-sm text-slate-400">
        <Shield className="w-4 h-4 mr-2" />
        <span>End-to-end encrypted • Your data stays private</span>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center mt-8 text-xs text-slate-500 space-y-1">
        <p>By connecting, you agree to our Terms of Service</p>
        <p>Secure authentication powered by advanced AI</p>
      </div>
    </div>
  );
};

export default LoginScreen;
