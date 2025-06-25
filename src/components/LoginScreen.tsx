
import React, { useState } from 'react';
import { User, Eye, EyeOff, Loader2, Shield } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col justify-center px-6 bg-gradient-to-br from-purple-900 via-pink-900 to-orange-800">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <img 
            src="/lovable-uploads/539d1779-6800-4152-b968-e4e6f4ef03b1.png" 
            alt="justRizz Logo" 
            className="w-32 h-auto"
          />
        </div>
        <p className="text-gray-300 mt-2">AI-powered Instagram dating coach</p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto w-full">
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Instagram username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="pl-12 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500"
            required
          />
        </div>

        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-12 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-sm text-center">{error}</div>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-3"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect Instagram'
          )}
        </Button>
      </form>

      {/* Security Disclaimer */}
      <div className="flex items-center justify-center mt-8 text-sm text-gray-400">
        <Shield className="w-4 h-4 mr-2" />
        <span>Credentials encrypted end-to-end</span>
      </div>

      {/* Footer */}
      <div className="text-center mt-12 text-xs text-gray-500">
        <p>By connecting, you agree to our Terms of Service</p>
        <p className="mt-1">Your data is processed securely and privately</p>
      </div>
    </div>
  );
};

export default LoginScreen;
