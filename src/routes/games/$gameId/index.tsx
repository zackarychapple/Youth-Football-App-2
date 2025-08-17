import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '../../../components/ui/sheet';
import { 
  ArrowLeft, 
  Users, 
  Undo2, 
  Menu,
  Shield,
  Zap,
  Trophy
} from 'lucide-react';
import useGameStore, { GameMode } from '../../../stores/game.store';
import PlayTracker from '../../../components/game/play-tracker';
import MPRDashboard from '../../../components/game/mpr-dashboard';
import SubstitutionPanel from '../../../components/game/substitution-panel';
import FieldPosition from '../../../components/game/field-position';
import { cn } from '../../../lib/utils';

export const Route = createFileRoute('/games/$gameId/')({
  component: ActiveGame,
});

function ActiveGame() {
  const navigate = useNavigate();
  const { gameId } = Route.useParams();
  const { 
    activeGame, 
    setMode, 
    undoLastPlay,
    setQuarter,
    isSubstitutionPanelOpen,
    toggleSubstitutionPanel,
    endGame
  } = useGameStore();
  
  const [showEndGameConfirm, setShowEndGameConfirm] = useState(false);

  // Redirect if no active game
  useEffect(() => {
    if (!activeGame || activeGame.gameId !== gameId) {
      navigate({ to: '/dashboard' });
    }
  }, [activeGame, gameId, navigate]);

  if (!activeGame) {
    return null;
  }

  const handleEndGame = () => {
    endGame();
    navigate({ to: '/dashboard' });
  };

  const modeConfig = {
    offense: {
      label: 'OFFENSE',
      icon: Trophy,
      color: 'bg-blue-500 hover:bg-blue-600',
      borderColor: 'border-blue-500',
    },
    defense: {
      label: 'DEFENSE',
      icon: Shield,
      color: 'bg-red-500 hover:bg-red-600',
      borderColor: 'border-red-500',
    },
    special: {
      label: 'SPECIAL',
      icon: Zap,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      borderColor: 'border-yellow-500',
    },
  };

  const currentModeConfig = modeConfig[activeGame.currentMode];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEndGameConfirm(true)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-bold text-lg">{activeGame.game.opponent_name}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Q{activeGame.currentQuarter}</span>
                  <span>•</span>
                  <span>Play #{activeGame.currentPlayNumber}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={undoLastPlay}
                disabled={activeGame.playHistory.length === 0}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              
              <Sheet open={isSubstitutionPanelOpen} onOpenChange={toggleSubstitutionPanel}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Users className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-lg p-0">
                  <SubstitutionPanel />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Mode Selector - Full Width */}
        <div className="grid grid-cols-3 border-t">
          {Object.entries(modeConfig).map(([mode, config]) => {
            const Icon = config.icon;
            const isActive = activeGame.currentMode === mode;
            
            return (
              <button
                key={mode}
                onClick={() => setMode(mode as GameMode)}
                className={cn(
                  'relative py-4 font-bold text-sm transition-all',
                  isActive ? 'text-white' : 'text-gray-600 bg-gray-50',
                  isActive && config.color
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icon className="h-5 w-5" />
                  <span>{config.label}</span>
                </div>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="pt-32 pb-4 px-4">
        {/* Quarter Selector */}
        <Card className="mb-4 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Quarter</span>
            <Badge variant="outline">{activeGame.game.field_size} yard field</Badge>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(q => (
              <Button
                key={q}
                variant={activeGame.currentQuarter === q ? 'default' : 'outline'}
                onClick={() => setQuarter(q)}
                className="font-bold"
              >
                Q{q}
              </Button>
            ))}
          </div>
        </Card>

        {/* MPR Dashboard */}
        <MPRDashboard />

        {/* Field Position */}
        <Card className="mb-4 p-4">
          <FieldPosition />
        </Card>

        {/* Play Tracker - Main Interface */}
        <PlayTracker />
      </div>

      {/* End Game Confirmation */}
      {showEndGameConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-4">End Game?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to end this game? 
              You can resume it later from the dashboard.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowEndGameConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleEndGame}
              >
                End Game
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}