import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  AlertCircle,
  Flag,
  TrendingUp
} from 'lucide-react';
import useGameStore from '../../stores/game.store';
import { PlayResult } from '../../types/database.types';
import { cn } from '../../lib/utils';

export default function PlayTracker() {
  const { 
    activeGame, 
    selectPlayer, 
    deselectPlayer, 
    clearSelectedPlayers,
    recordPlay,
    getPlayerParticipation 
  } = useGameStore();

  const [showResultButtons, setShowResultButtons] = useState(false);

  if (!activeGame) return null;

  const handlePlayerToggle = (playerId: string) => {
    if (activeGame.selectedPlayers.includes(playerId)) {
      deselectPlayer(playerId);
    } else {
      selectPlayer(playerId);
    }
  };

  const handleRecordPlay = (result: PlayResult) => {
    recordPlay(result);
    setShowResultButtons(false);
    clearSelectedPlayers();
  };

  const resultButtons = [
    { 
      result: 'completion' as PlayResult, 
      label: 'COMPLETE', 
      icon: CheckCircle2,
      color: 'bg-green-500 hover:bg-green-600 text-white'
    },
    { 
      result: 'incomplete' as PlayResult, 
      label: 'INCOMPLETE', 
      icon: XCircle,
      color: 'bg-gray-500 hover:bg-gray-600 text-white'
    },
    { 
      result: 'touchdown' as PlayResult, 
      label: 'TOUCHDOWN', 
      icon: Trophy,
      color: 'bg-yellow-500 hover:bg-yellow-600 text-white'
    },
    { 
      result: 'interception' as PlayResult, 
      label: 'INTERCEPTION', 
      icon: AlertCircle,
      color: 'bg-red-500 hover:bg-red-600 text-white'
    },
    { 
      result: 'sack' as PlayResult, 
      label: 'SACK', 
      icon: TrendingUp,
      color: 'bg-purple-500 hover:bg-purple-600 text-white'
    },
    { 
      result: 'penalty' as PlayResult, 
      label: 'PENALTY', 
      icon: Flag,
      color: 'bg-orange-500 hover:bg-orange-600 text-white'
    },
  ];

  // Sort players by jersey number for easy selection
  const sortedPlayers = [...activeGame.players].sort((a, b) => a.jersey_number - b.jersey_number);

  // Group players for better organization (optional)
  const stripedPlayers = sortedPlayers.filter(p => p.is_striped);
  const eligiblePlayers = sortedPlayers.filter(p => !p.is_striped);

  return (
    <div className="space-y-4">
      {/* Player Selection Grid */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Select Players</h3>
          {activeGame.selectedPlayers.length > 0 && (
            <Badge variant="default" className="text-lg px-3 py-1">
              {activeGame.selectedPlayers.length} selected
            </Badge>
          )}
        </div>

        {/* Eligible Players */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Eligible Players</p>
          <div className="grid grid-cols-5 gap-2">
            {eligiblePlayers.map(player => {
              const isSelected = activeGame.selectedPlayers.includes(player.id);
              const participation = getPlayerParticipation(player.id);
              const offensivePlays = activeGame.playHistory.filter(p => p.mode === 'offense').length;
              const mprPercentage = offensivePlays > 0 ? (participation / offensivePlays) * 100 : 0;
              
              return (
                <button
                  key={player.id}
                  onClick={() => handlePlayerToggle(player.id)}
                  className={cn(
                    'relative aspect-square rounded-lg border-2 font-bold text-lg transition-all',
                    'flex flex-col items-center justify-center',
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700 scale-105'
                      : 'border-gray-200 hover:border-gray-300',
                    mprPercentage < 10 && offensivePlays > 5 && 'ring-2 ring-red-400'
                  )}
                >
                  <span className="text-2xl">{player.jersey_number}</span>
                  <span className="text-xs opacity-70">{participation}</span>
                  {mprPercentage < 10 && offensivePlays > 5 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Striped Players (if any) */}
        {stripedPlayers.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Striped Players</p>
            <div className="grid grid-cols-5 gap-2">
              {stripedPlayers.map(player => {
                const isSelected = activeGame.selectedPlayers.includes(player.id);
                
                return (
                  <button
                    key={player.id}
                    onClick={() => handlePlayerToggle(player.id)}
                    className={cn(
                      'relative aspect-square rounded-lg border-2 font-bold text-lg transition-all',
                      'flex flex-col items-center justify-center',
                      'bg-yellow-50 border-yellow-300',
                      isSelected
                        ? 'border-yellow-500 bg-yellow-100 text-yellow-700 scale-105'
                        : 'hover:border-yellow-400'
                    )}
                  >
                    <span className="text-2xl">{player.jersey_number}</span>
                    <div className="absolute top-1 right-1">
                      <Badge variant="outline" className="text-xs px-1 py-0 bg-yellow-100">
                        S
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {activeGame.selectedPlayers.length > 0 && (
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelectedPlayers}
            >
              Clear Selection
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => setShowResultButtons(true)}
            >
              Next: Choose Result
            </Button>
          </div>
        )}
      </Card>

      {/* Result Selection */}
      {showResultButtons && activeGame.selectedPlayers.length > 0 && (
        <Card className="p-4 border-2 border-blue-500">
          <h3 className="font-semibold text-lg mb-4">Play Result</h3>
          <div className="grid grid-cols-2 gap-3">
            {resultButtons.map(({ result, label, icon: Icon, color }) => (
              <Button
                key={result}
                onClick={() => handleRecordPlay(result)}
                className={cn('h-20 text-base font-bold', color)}
                size="lg"
              >
                <Icon className="mr-2 h-5 w-5" />
                {label}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            className="w-full mt-3"
            onClick={() => setShowResultButtons(false)}
          >
            Cancel
          </Button>
        </Card>
      )}

      {/* Recent Plays */}
      {activeGame.playHistory.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-lg mb-3">Recent Plays</h3>
          <div className="space-y-2">
            {activeGame.playHistory.slice(-3).reverse().map((play, index) => (
              <div 
                key={activeGame.playHistory.length - index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Badge variant={play.mode === 'offense' ? 'default' : 'secondary'}>
                    {play.mode}
                  </Badge>
                  <span className="text-sm">
                    Play #{activeGame.currentPlayNumber - index - 1}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {play.players.length} players
                  </span>
                  <Badge variant="outline">
                    {play.result}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}