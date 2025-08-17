import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Football Tracker
        </h1>
        <p className="text-lg text-muted-foreground">
          Welcome to the CFL Game Tracker - Built for coaches, optimized for the sideline.
        </p>
        
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-2">Quick Start</h2>
            <p className="text-muted-foreground">
              Create your team and start tracking players immediately.
            </p>
          </div>
          
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-2">Offline Ready</h2>
            <p className="text-muted-foreground">
              Works without internet - perfect for game day.
            </p>
          </div>
          
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-2">Touch Optimized</h2>
            <p className="text-muted-foreground">
              Large buttons and gestures designed for gloved hands.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}