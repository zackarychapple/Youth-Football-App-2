import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { 
  X, 
  Search, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Users
} from 'lucide-react';
import useGameStore from '../../stores/game.store';
import { useRosterStore } from '../../stores/roster.store';
import { cn } from '../../lib/utils';

export default function SubstitutionPanel() {
  const { activeGame, toggleSubstitutionPanel, getPlayerParticipation } = useGameStore();
  const { players: allPlayers } = useRosterStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnBench, setShowOnBench] = useState(false);

  if (!activeGame) return null;

  // Get list of players currently on field (in the active game)
  const activePlayers = activeGame.players;
  const activePlayerIds = new Set(activePlayers.map(p => p.id));
  
  // Get bench players (in roster but not in active game)
  const benchPlayers = allPlayers.filter(p => 
    !activePlayerIds.has(p.id) && !p.archived_at
  );

  // Filter players based on search
  const filteredActivePlayers = activePlayers.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.jersey_number.toString().includes(searchQuery)
  );

  const filteredBenchPlayers = benchPlayers.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.jersey_number.toString().includes(searchQuery)
  );

  // Calculate play statistics
  const offensivePlays = activeGame.playHistory.filter(p => p.mode === 'offense').length;
  const avgPlaysPerPlayer = activePlayers.length > 0 
    ? offensivePlays / activePlayers.filter(p => !p.is_striped).length
    : 0;


  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Substitutions</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSubstitutionPanel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-600">Active</span>
            </div>
            <p className="text-lg font-bold">{activePlayers.length}</p>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-600">Avg Plays</span>
            </div>
            <p className="text-lg font-bold">{avgPlaysPerPlayer.toFixed(1)}</p>
          </div>
        </div>
      </div>

      {/* Toggle View */}
      <div className="flex p-2 gap-2 bg-gray-50 border-b">
        <Button
          variant={!showOnBench ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => setShowOnBench(false)}
        >
          On Field ({filteredActivePlayers.length})
        </Button>
        <Button
          variant={showOnBench ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => setShowOnBench(true)}
        >
          On Bench ({filteredBenchPlayers.length})
        </Button>
      </div>

      {/* Player Lists */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {!showOnBench ? (
            // Active Players
            <>
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                Players on Field
              </h3>
              {filteredActivePlayers
                .sort((a, b) => {
                  const aPlays = getPlayerParticipation(a.id);
                  const bPlays = getPlayerParticipation(b.id);
                  return aPlays - bPlays; // Sort by least plays first
                })
                .map(player => {
                  const plays = getPlayerParticipation(player.id);
                  const playDiff = plays - avgPlaysPerPlayer;
                  const isUnderPlayed = playDiff < -2;
                  const isOverPlayed = playDiff > 2;

                  return (
                    <div
                      key={player.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border',
                        isUnderPlayed && 'border-red-200 bg-red-50',
                        isOverPlayed && 'border-yellow-200 bg-yellow-50',
                        !isUnderPlayed && !isOverPlayed && 'border-gray-200'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center font-bold',
                          player.is_striped ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100'
                        )}>
                          {player.jersey_number}
                        </div>
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-600">
                              {plays} plays
                            </span>
                            {isUnderPlayed && (
                              <Badge variant="destructive" className="text-xs px-1 py-0">
                                <TrendingDown className="h-3 w-3 mr-1" />
                                Needs time
                              </Badge>
                            )}
                            {isOverPlayed && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Rest
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {player.is_striped && (
                        <Badge variant="outline" className="bg-yellow-50">
                          Striped
                        </Badge>
                      )}
                    </div>
                  );
                })}
            </>
          ) : (
            // Bench Players
            <>
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                Available on Bench
              </h3>
              {filteredBenchPlayers.length > 0 ? (
                filteredBenchPlayers.map(player => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center font-bold',
                        player.is_striped ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100'
                      )}>
                        {player.jersey_number}
                      </div>
                      <div>
                        <p className="font-medium">{player.name}</p>
                        {player.position && (
                          <span className="text-xs text-gray-600">
                            {player.position}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Add player to active game
                        console.log('Adding player to game:', player.id);
                      }}
                    >
                      Add to Game
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No players on bench</p>
                  <p className="text-sm mt-1">All roster players are active</p>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Quick Sub Suggestions */}
      {!showOnBench && offensivePlays > 10 && (
        <div className="p-4 border-t bg-gray-50">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Suggested Substitutions
          </h3>
          <div className="space-y-2">
            {filteredActivePlayers
              .filter(p => !p.is_striped)
              .sort((a, b) => getPlayerParticipation(a.id) - getPlayerParticipation(b.id))
              .slice(0, 2)
              .map(player => {
                const plays = getPlayerParticipation(player.id);
                return (
                  <div key={player.id} className="flex items-center justify-between text-sm">
                    <span>
                      #{player.jersey_number} needs more plays ({plays})
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      Sub In
                    </Badge>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}