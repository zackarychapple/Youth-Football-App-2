import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import useGameStore from '../../stores/game.store';
import { cn } from '../../lib/utils';

export default function FieldPosition() {
  const { fieldPosition, updateFieldPosition, activeGame } = useGameStore();
  const [isDragging, setIsDragging] = useState(false);

  if (!activeGame) return null;

  const handleDrag = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    
    let clientX: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }

    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    updateFieldPosition(percentage);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const movePosition = (yards: number) => {
    const fieldSize = parseInt(activeGame.game.field_size);
    const yardPercentage = (yards / fieldSize) * 100;
    const newPosition = Math.max(0, Math.min(100, fieldPosition + yardPercentage));
    updateFieldPosition(newPosition);
  };

  // Calculate yard line based on field size
  const fieldSize = parseInt(activeGame.game.field_size);
  const currentYardLine = Math.round((fieldPosition / 100) * fieldSize);
  
  // Determine which side of field
  const isOwnTerritory = fieldPosition < 50;
  const displayYardLine = isOwnTerritory 
    ? currentYardLine 
    : fieldSize - currentYardLine;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Field Position</h3>
        <Badge variant="outline">
          {isOwnTerritory ? 'Own' : 'Opp'} {displayYardLine}
        </Badge>
      </div>

      {/* Visual Field */}
      <div className="relative">
        {/* Field Background */}
        <div 
          className="relative h-24 bg-gradient-to-r from-blue-100 via-green-100 to-red-100 rounded-lg overflow-hidden cursor-pointer select-none"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleDrag}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          onTouchMove={handleDrag}
        >
          {/* Field Lines */}
          <div className="absolute inset-0 flex">
            {[...Array(11)].map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-white/50 relative"
              >
                {i % 2 === 0 && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-gray-600 font-medium">
                    {i === 0 ? 'Own 0' : i === 5 ? '50' : i === 10 ? 'Opp 0' : ''}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* End Zones */}
          <div className="absolute left-0 top-0 bottom-0 w-[10%] bg-blue-200/50 border-r-2 border-blue-400 flex items-center justify-center">
            <span className="text-xs font-bold text-blue-700 -rotate-90">OWN</span>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-[10%] bg-red-200/50 border-l-2 border-red-400 flex items-center justify-center">
            <span className="text-xs font-bold text-red-700 rotate-90">OPP</span>
          </div>

          {/* Ball Position */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all"
            style={{ left: `${fieldPosition}%` }}
          >
            <div className="relative">
              <div className="w-8 h-8 bg-yellow-500 rounded-full shadow-lg animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-2 bg-white rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Position Buttons */}
      <div className="grid grid-cols-5 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateFieldPosition(10)}
          className={cn(fieldPosition === 10 && 'ring-2 ring-blue-500')}
        >
          Own 10
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateFieldPosition(25)}
          className={cn(fieldPosition === 25 && 'ring-2 ring-blue-500')}
        >
          Own 25
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateFieldPosition(50)}
          className={cn(fieldPosition === 50 && 'ring-2 ring-blue-500')}
        >
          50
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateFieldPosition(75)}
          className={cn(fieldPosition === 75 && 'ring-2 ring-blue-500')}
        >
          Opp 25
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateFieldPosition(90)}
          className={cn(fieldPosition === 90 && 'ring-2 ring-blue-500')}
        >
          Opp 10
        </Button>
      </div>

      {/* Yard Adjustment Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => movePosition(-10)}
          className="flex-1"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          -10 yards
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => movePosition(-5)}
          className="flex-1"
        >
          -5
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => updateFieldPosition(50)}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => movePosition(5)}
          className="flex-1"
        >
          +5
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => movePosition(10)}
          className="flex-1"
        >
          +10 yards
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Recent Drive Summary */}
      {activeGame.playHistory.length > 0 && (
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Current Drive</span>
            <span className="font-medium">
              {activeGame.playHistory.filter(p => p.quarter === activeGame.currentQuarter).length} plays
            </span>
          </div>
        </div>
      )}
    </div>
  );
}