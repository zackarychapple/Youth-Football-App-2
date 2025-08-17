import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth.store';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Trophy } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const { user, session } = useAuthStore();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (user && session) {
      navigate({ to: '/dashboard' });
    }
  }, [user, session, navigate]);
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-8">
          <Trophy className="h-12 w-12 text-green-600 mr-3" />
          <h1 className="text-5xl font-bold text-gray-900">
            Football Tracker
          </h1>
        </div>
        
        <p className="text-xl text-center text-gray-600 mb-8">
          CFL Game Tracker - Built for coaches, optimized for the sideline
        </p>
        
        <div className="flex gap-4 justify-center mb-12">
          <Link to="/auth/sign-in">
            <Button size="lg" className="h-14 px-8 text-lg">
              Sign In
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/auth/sign-up">
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
              Create Team
            </Button>
          </Link>
        </div>
        
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          <div className="rounded-xl border-2 border-green-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h2 className="text-2xl font-bold mb-3">Quick Start</h2>
            <p className="text-gray-600 text-lg">
              Add 20 players in under 2 minutes. Start tracking immediately.
            </p>
          </div>
          
          <div className="rounded-xl border-2 border-blue-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              <span className="text-2xl">📱</span>
            </div>
            <h2 className="text-2xl font-bold mb-3">Works Offline</h2>
            <p className="text-gray-600 text-lg">
              No internet? No problem. Full functionality on the field.
            </p>
          </div>
          
          <div className="rounded-xl border-2 border-purple-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
              <span className="text-2xl">🧤</span>
            </div>
            <h2 className="text-2xl font-bold mb-3">Glove Friendly</h2>
            <p className="text-gray-600 text-lg">
              56px touch targets. Perfect for wet gloves and muddy hands.
            </p>
          </div>
        </div>
        
        <div className="mt-12 text-center text-gray-500">
          <p className="text-sm">Test Account Available:</p>
          <p className="text-sm font-mono">zackarychapple30+mock1@gmail.com / GameDay2025!</p>
        </div>
      </div>
    </div>
  );
}