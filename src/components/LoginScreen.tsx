
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
    <div className="min-h-screen flex flex-col justify-center px-6 bg-gradient-to-br from-purple-600 via-purple-700 to-orange-500 relative overflow-hidden">
      {/* Header */}
      <div className="relative z-10 text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="relative bg-gray-700 p-8 rounded-2xl">
            <img 
              src="/lovable-uploads/539d1779-6800-4152-b968-e4e6f4ef03b1.png" 
              alt="justRizz Logo" 
              className="w-32 h-auto"
            />
          </div>
        </div>
        <p className="text-white text-lg font-light tracking-wide">AI-powered Instagram dating coach</p>
      </div>

      {/* Login Form */}
      <div className="relative z-10 max-w-sm mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Instagram username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-12 h-14 bg-black/20 border-none text-white placeholder-gray-300 focus:ring-2 focus:ring-white/20 rounded-xl backdrop-blur-sm"
              required
            />
          </div>

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-12 h-14 bg-black/20 border-none text-white placeholder-gray-300 focus:ring-2 focus:ring-white/20 rounded-xl backdrop-blur-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-red-300 text-sm text-center">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Instagram'
            )}
          </Button>
        </form>
      </div>

      {/* Security Disclaimer */}
      <div className="relative z-10 flex items-center justify-center mt-8 text-sm text-gray-200">
        <Shield className="w-4 h-4 mr-2" />
        <span>Credentials encrypted end-to-end</span>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center mt-8 text-xs text-gray-300 space-y-1">
        <p>By connecting, you agree to our Terms of Service</p>
        <p>Your data is processed securely and privately</p>
      </div>
    </div>
  );
};

export default LoginScreen;
