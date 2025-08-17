import { useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { animated, useSpring } from '@react-spring/web'
import { Edit2, Trash2, AlertCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Player } from '@/types/database.types'

interface PlayerCardProps {
  player: Player
  onEdit: (player: Player) => void
  onDelete: (playerId: string) => void
  onToggleStriped: (playerId: string) => void
}

export function PlayerCard({ player, onEdit, onDelete, onToggleStriped }: PlayerCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Spring animation for swipe
  const [{ x }, api] = useSpring(() => ({ x: 0 }))
  
  // Swipe gesture handler
  const bind = useDrag(
    ({ down, movement: [mx], velocity: [vx], direction: [dx] }) => {
      const trigger = vx > 0.2 // Velocity threshold
      
      if (!down) {
        // Released
        if (trigger && dx > 0 && mx > 100) {
          // Swiped right - Edit
          api.start({ x: 0 })
          onEdit(player)
        } else if (trigger && dx < 0 && mx < -100) {
          // Swiped left - Delete
          setIsDeleting(true)
          api.start({ x: 0 })
        } else {
          // Snap back
          api.start({ x: 0 })
        }
      } else {
        // Dragging
        api.start({ x: mx, immediate: true })
      }
    },
    {
      axis: 'x',
      bounds: { left: -150, right: 150 },
      rubberband: true
    }
  )
  
  const handleDelete = () => {
    onDelete(player.id)
    setIsDeleting(false)
  }
  
  return (
    <>
      <div className="relative overflow-hidden rounded-lg">
        {/* Background action indicators */}
        <div className="absolute inset-0 flex">
          <div className="flex-1 bg-blue-500 flex items-center px-4">
            <Edit2 className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 bg-red-500 flex items-center justify-end px-4">
            <Trash2 className="h-5 w-5 text-white" />
          </div>
        </div>
        
        {/* Swipeable card */}
        <animated.div
          {...bind()}
          style={{ x }}
          className="relative bg-background border rounded-lg touch-pan-y"
        >
          <div 
            className={cn(
              "flex items-center gap-3 p-4 min-h-[56px]", // 56px touch target
              player.is_striped && "opacity-75"
            )}
            onClick={() => onToggleStriped(player.id)}
          >
            {/* Jersey number */}
            <div className="flex-shrink-0">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg",
                player.is_striped 
                  ? "bg-yellow-100 text-yellow-800 ring-2 ring-yellow-500" 
                  : "bg-primary/10 text-primary"
              )}>
                {player.jersey_number}
              </div>
            </div>
            
            {/* Player info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{player.name}</p>
                {player.is_striped && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Striped
                  </Badge>
                )}
              </div>
              {player.position && (
                <p className="text-sm text-muted-foreground">{player.position}</p>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex-shrink-0 flex items-center gap-2">
              {!player.position && (
                <Badge variant="outline" className="text-xs">
                  No Position
                </Badge>
              )}
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </animated.div>
      </div>
      
      {/* Delete confirmation dialog */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-[50%] top-[50%] z-50 w-[90%] max-w-sm translate-x-[-50%] translate-y-[-50%] bg-background p-6 shadow-lg rounded-lg border">
            <h3 className="text-lg font-semibold">Remove Player?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Remove {player.name} (#{player.jersey_number}) from the roster? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsDeleting(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}