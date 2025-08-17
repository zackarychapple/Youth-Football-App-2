import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
import useGameStore from '../../stores/game.store';
import { cn } from '../../lib/utils';

export default function MPRDashboard() {
  const { activeGame, calculateMPR } = useGameStore();

  if (!activeGame) return null;

  const mprData = calculateMPR();
  const offensivePlays = activeGame.playHistory.filter(p => p.mode === 'offense').length;
  const eligiblePlayers = activeGame.players.filter(p => !p.is_striped);
  
  // Calculate overall MPR health
  const playersNeedingPlays = mprData.filter(p => !p.meetsMinimum);
  const mprHealth = eligiblePlayers.length > 0
    ? ((eligiblePlayers.length - playersNeedingPlays.length) / eligiblePlayers.length) * 100
    : 100;

  // Get critical players (those falling behind)
  const criticalPlayers = mprData
    .filter(p => {
      const expectedPlays = Math.floor(offensivePlays * 0.1); // 10% minimum
      return p.plays < expectedPlays && offensivePlays > 5;
    })
    .sort((a, b) => a.plays - b.plays)
    .slice(0, 3);

  const getStatusColor = (meetsMinimum: boolean, mpr: number) => {
    if (meetsMinimum) return 'text-green-600 bg-green-50';
    if (mpr < 5) return 'text-red-600 bg-red-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  const getProgressColor = (meetsMinimum: boolean, mpr: number) => {
    if (meetsMinimum) return 'bg-green-500';
    if (mpr < 5) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  return (
    <Card className="mb-4 overflow-hidden">
      {/* Header with Overall Status */}
      <div className={cn(
        'p-4 border-b',
        mprHealth === 100 ? 'bg-green-50' : mprHealth > 70 ? 'bg-yellow-50' : 'bg-red-50'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">MPR Status</h3>
            {mprHealth === 100 ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : mprHealth > 70 ? (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {Math.round(mprHealth)}%
            </div>
            <div className="text-xs text-gray-600">
              {playersNeedingPlays.length} need plays
            </div>
          </div>
        </div>
      </div>

      {/* Critical Players Alert */}
      {criticalPlayers.length > 0 && offensivePlays > 5 && (
        <div className="p-3 bg-red-50 border-b border-red-100">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                Players Need Immediate Playing Time:
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                {criticalPlayers.map(player => {
                  const p = activeGame.players.find(pl => pl.id === player.playerId);
                  return (
                    <Badge 
                      key={player.playerId} 
                      variant="destructive"
                      className="text-xs"
                    >
                      #{p?.jersey_number} ({player.plays} plays)
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player MPR Grid */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">
            {offensivePlays} offensive plays
          </span>
          <span className="text-sm text-gray-600">
            Min: {Math.floor(offensivePlays * 0.1)} plays/player
          </span>
        </div>

        <div className="space-y-2">
          {mprData.map(({ playerId, plays, mpr, meetsMinimum }) => {
            const player = activeGame.players.find(p => p.id === playerId);
            if (!player) return null;

            return (
              <div key={playerId} className="flex items-center gap-3">
                <div className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg',
                  getStatusColor(meetsMinimum, mpr)
                )}>
                  {player.jersey_number}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {player.name.split(' ')[0]}
                    </span>
                    <span className="text-xs text-gray-600">
                      {plays} plays ({Math.round(mpr)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full transition-all', getProgressColor(meetsMinimum, mpr))}
                      style={{ width: `${Math.min(100, mpr)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {eligiblePlayers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No eligible players in roster</p>
          </div>
        )}
      </div>
    </Card>
  );
}

