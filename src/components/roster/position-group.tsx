import { useState } from 'react'
import { ChevronDown, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { PlayerCard } from './player-card'
import type { Player } from '@/types/database.types'
import type { Position } from '@/stores/roster.store'

interface PositionGroupProps {
  title: string
  position?: Position
  players: Player[]
  onEditPlayer: (player: Player) => void
  onDeletePlayer: (playerId: string) => void
  onToggleStriped: (playerId: string) => void
  defaultExpanded?: boolean
}

export function PositionGroup({
  title,
  position,
  players,
  onEditPlayer,
  onDeletePlayer,
  onToggleStriped,
  defaultExpanded = true
}: PositionGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  
  const stripedCount = players.filter(p => p.is_striped).length
  
  return (
    <div className="space-y-2">
      {/* Group Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ChevronDown 
            className={cn(
              "h-5 w-5 transition-transform",
              !expanded && "-rotate-90"
            )}
          />
          <div className="flex items-center gap-2">
            <span className="font-semibold">{title}</span>
            {position && (
              <Badge variant="secondary" className="text-xs">
                {position}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {stripedCount > 0 && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
              {stripedCount} striped
            </Badge>
          )}
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {players.length}
          </Badge>
        </div>
      </button>
      
      {/* Players List */}
      {expanded && (
        <div className="space-y-2 pl-2">
          {players.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground bg-muted/30 rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No players in this group</p>
            </div>
          ) : (
            players.map(player => (
              <PlayerCard
                key={player.id}
                player={player}
                onEdit={onEditPlayer}
                onDelete={onDeletePlayer}
                onToggleStriped={onToggleStriped}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

interface AllPlayersGroupProps {
  players: Player[]
  onEditPlayer: (player: Player) => void
  onDeletePlayer: (playerId: string) => void
  onToggleStriped: (playerId: string) => void
}

export function AllPlayersGroup({
  players,
  onEditPlayer,
  onDeletePlayer,
  onToggleStriped
}: AllPlayersGroupProps) {
  // Group players by position
  const grouped: Record<string, Player[]> = {
    'No Position': []
  }
  
  // Initialize position groups
  const allPositions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'S', 'K', 'P', 'LS']
  allPositions.forEach(pos => {
    grouped[pos] = []
  })
  
  // Group players
  players.forEach(player => {
    if (player.position && grouped[player.position]) {
      grouped[player.position].push(player)
    } else {
      grouped['No Position'].push(player)
    }
  })
  
  // Sort players within each group by jersey number
  Object.keys(grouped).forEach(key => {
    grouped[key].sort((a, b) => a.jersey_number - b.jersey_number)
  })
  
  return (
    <div className="space-y-4">
      {/* Offense */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">
          Offense
        </h3>
        {['QB', 'RB', 'WR', 'TE', 'OL'].map(pos => (
          grouped[pos].length > 0 && (
            <PositionGroup
              key={pos}
              title={getPositionName(pos)}
              position={pos as Position}
              players={grouped[pos]}
              onEditPlayer={onEditPlayer}
              onDeletePlayer={onDeletePlayer}
              onToggleStriped={onToggleStriped}
            />
          )
        ))}
      </div>
      
      {/* Defense */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">
          Defense
        </h3>
        {['DL', 'LB', 'DB', 'S'].map(pos => (
          grouped[pos].length > 0 && (
            <PositionGroup
              key={pos}
              title={getPositionName(pos)}
              position={pos as Position}
              players={grouped[pos]}
              onEditPlayer={onEditPlayer}
              onDeletePlayer={onDeletePlayer}
              onToggleStriped={onToggleStriped}
            />
          )
        ))}
      </div>
      
      {/* Special Teams */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">
          Special Teams
        </h3>
        {['K', 'P', 'LS'].map(pos => (
          grouped[pos].length > 0 && (
            <PositionGroup
              key={pos}
              title={getPositionName(pos)}
              position={pos as Position}
              players={grouped[pos]}
              onEditPlayer={onEditPlayer}
              onDeletePlayer={onDeletePlayer}
              onToggleStriped={onToggleStriped}
            />
          )
        ))}
      </div>
      
      {/* No Position */}
      {grouped['No Position'].length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">
            Unassigned
          </h3>
          <PositionGroup
            title="No Position"
            players={grouped['No Position']}
            onEditPlayer={onEditPlayer}
            onDeletePlayer={onDeletePlayer}
            onToggleStriped={onToggleStriped}
          />
        </div>
      )}
    </div>
  )
}

function getPositionName(position: string): string {
  const names: Record<string, string> = {
    QB: 'Quarterbacks',
    RB: 'Running Backs',
    WR: 'Wide Receivers',
    TE: 'Tight Ends',
    OL: 'Offensive Line',
    DL: 'Defensive Line',
    LB: 'Linebackers',
    DB: 'Defensive Backs',
    S: 'Safeties',
    K: 'Kickers',
    P: 'Punters',
    LS: 'Long Snappers'
  }
  return names[position] || position
}