import { createFileRoute } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth.store';
import { useState } from 'react';

export const Route = createFileRoute('/auth/sign-in')({
  component: SignInPage,
});

function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, isLoading, error } = useAuthStore();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn({ email, password });
    } catch (error) {
      // Error is handled in the store
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg border p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-error/10 text-error rounded-md p-3 text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full touch-target-large rounded-md border bg-background px-4 text-lg"
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full touch-target-large rounded-md border bg-background px-4 text-lg"
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full touch-target-large bg-primary text-primary-foreground rounded-md font-semibold text-lg disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-6 text-center space-y-2">
            <a href="/auth/forgot-password" className="text-sm text-muted-foreground hover:underline">
              Forgot password?
            </a>
            <div>
              <a href="/auth/sign-up" className="text-sm text-primary hover:underline">
                Create an account
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}