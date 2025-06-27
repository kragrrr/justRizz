import React, { useState } from 'react';
import { Instagram, Eye, EyeOff, Loader2, Shield } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col justify-center items-center bg-black">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-2">justRizz</h1>
        <p className="text-gray-400">AI-powered Instagram dating coach</p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto w-full bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-lg">
        <div className="relative">
          <Input
            type="text"
            placeholder="Instagram username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-black border-gray-800 text-white placeholder-gray-500 focus:border-white"
            required
          />
        </div>

        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-12 bg-black border-gray-800 text-white placeholder-gray-500 focus:border-white"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
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
          className="w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-gray-200 transition-colors border border-gray-800"
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
      <div className="flex items-center justify-center mt-8 text-sm text-gray-500">
        <Shield className="w-4 h-4 mr-2" />
        <span>Credentials encrypted end-to-end</span>
      </div>

      {/* Footer */}
      <div className="text-center mt-12 text-xs text-gray-600">
        <p>By connecting, you agree to our Terms of Service</p>
        <p className="mt-1">Your data is processed securely and privately</p>
      </div>
    </div>
  );
};

export default LoginScreen;
