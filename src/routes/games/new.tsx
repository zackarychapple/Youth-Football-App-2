import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { ArrowLeft, Play, Users } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { useRosterStore } from '../../stores/roster.store';
import useGameStore from '../../stores/game.store';
import { startGame as createGame } from '../../lib/api/games';
import { Game, FieldSize } from '../../types/database.types';
import { cn } from '../../lib/utils';

export const Route = createFileRoute('/games/new')({
  component: NewGame,
});

function NewGame() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { players, fetchPlayers } = useRosterStore();
  const { startGame } = useGameStore();
  const [selectedFieldSize, setSelectedFieldSize] = useState<FieldSize>('40');
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (user?.currentTeamId) {
      fetchPlayers(user.currentTeamId);
    }
  }, [user?.currentTeamId, fetchPlayers]);

  const handleQuickStart = async () => {
    if (!user?.currentTeamId) return;
    
    setIsStarting(true);
    try {
      // Create game with minimal info - can be edited later
      const game: Game = await createGame({
        team_id: user.currentTeamId,
        opponent_name: 'Game ' + new Date().toLocaleDateString(),
        game_date: new Date().toISOString().split('T')[0],
        field_size: selectedFieldSize,
        status: 'active',
      });
      
      // Start the game in the store
      startGame(game, players);
      
      // Navigate to the active game
      navigate({ to: `/games/${game.id}` });
    } catch (error) {
      console.error('Failed to start game:', error);
      setIsStarting(false);
    }
  };

  const presentPlayers = players.filter(p => !p.archived_at);
  const eligiblePlayers = presentPlayers.filter(p => !p.is_striped);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/dashboard' })}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Start New Game</h1>
        </div>

        {/* Field Size Selection */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Field Size</h2>
          <div className="grid grid-cols-3 gap-3">
            {(['40', '80', '100'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setSelectedFieldSize(size)}
                className={cn(
                  'py-4 px-3 rounded-lg border-2 font-semibold text-lg transition-all',
                  selectedFieldSize === size
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                {size} yards
              </button>
            ))}
          </div>
        </Card>

        {/* Roster Status */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Roster Status</h2>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Total Players</span>
              <span className="font-semibold text-lg">{presentPlayers.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Eligible (Non-striped)</span>
              <span className="font-semibold text-lg text-green-600">
                {eligiblePlayers.length}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Striped Players</span>
              <span className="font-semibold text-lg text-yellow-600">
                {presentPlayers.length - eligiblePlayers.length}
              </span>
            </div>
          </div>

          {eligiblePlayers.length < 5 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Warning: You have fewer than 5 eligible players. 
                You may not meet minimum play requirements.
              </p>
            </div>
          )}
        </Card>

        {/* Quick Start Button */}
        <Button
          onClick={handleQuickStart}
          disabled={isStarting || presentPlayers.length === 0}
          className="w-full h-16 text-lg font-semibold"
          size="lg"
        >
          {isStarting ? (
            <>Starting Game...</>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              START GAME NOW
            </>
          )}
        </Button>

        <p className="text-center text-sm text-gray-500 mt-4">
          You can add game details (opponent, location) later
        </p>
      </div>
    </div>
  );
}