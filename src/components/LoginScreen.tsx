
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
    <div className="min-h-screen flex flex-col justify-center px-6 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-float"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-float" style={{animationDelay: '4s'}}></div>
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 text-center mb-12">
        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-3xl opacity-75 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-black/20 backdrop-blur-xl p-8 rounded-3xl border border-white/10">
              <img 
                src="/lovable-uploads/539d1779-6800-4152-b968-e4e6f4ef03b1.png" 
                alt="justRizz Logo" 
                className="w-32 h-auto"
              />
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4 gradient-text">justRizz</h1>
        <p className="text-white/80 text-lg font-light tracking-wide mb-2">AI-powered Instagram dating coach</p>
        <div className="flex items-center justify-center gap-2 text-purple-300">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm">Level up your dating game</span>
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      {/* Login Form */}
      <div className="relative z-10 max-w-sm mx-auto w-full">
        <div className="glass-morphism rounded-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300 group-focus-within:text-white transition-colors" />
              <Input
                type="text"
                placeholder="Instagram username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-12 h-14 bg-white/5 border border-white/20 text-white placeholder-purple-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent rounded-xl backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
                required
              />
            </div>

            <div className="relative group">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-12 h-14 bg-white/5 border border-white/20 text-white placeholder-purple-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent rounded-xl backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-red-300 text-sm text-center">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 hover:from-purple-700 hover:via-pink-700 hover:to-purple-800 text-white font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 border-none transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Connecting to Instagram...
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
      <div className="relative z-10 flex items-center justify-center mt-8 text-sm text-purple-200/80">
        <Shield className="w-4 h-4 mr-2" />
        <span>End-to-end encrypted • Privacy protected</span>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center mt-6 text-xs text-purple-300/60 space-y-1">
        <p>By connecting, you agree to our Terms of Service</p>
        <p>Your data is processed securely and privately</p>
      </div>
    </div>
  );
};

export default LoginScreen;
