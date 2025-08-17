import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Hash, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { POSITIONS } from '@/stores/roster.store'
import type { PlayerInsert } from '@/types/database.types'

const playerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  jersey_number: z.number().min(0).max(99, 'Jersey number must be 0-99'),
  position: z.string().optional().nullable(),
  is_striped: z.boolean().default(false)
})

type PlayerFormData = z.infer<typeof playerSchema>

interface AddPlayerFormProps {
  onAddPlayer: (player: Omit<PlayerInsert, 'team_id'>) => Promise<void>
  trigger?: React.ReactNode
}

export function AddPlayerForm({ onAddPlayer, trigger }: AddPlayerFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showNumberPad, setShowNumberPad] = useState(false)
  const [numberInput, setNumberInput] = useState('')
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch
  } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema) as any,
    defaultValues: {
      name: '',
      jersey_number: 0,
      position: null,
      is_striped: false
    }
  })
  
  const watchedNumber = watch('jersey_number')
  const watchedStriped = watch('is_striped')
  
  const handleNumberPadClick = (digit: string) => {
    if (digit === 'clear') {
      setNumberInput('')
      setValue('jersey_number', 0)
    } else if (digit === 'back') {
      const newValue = numberInput.slice(0, -1)
      setNumberInput(newValue)
      setValue('jersey_number', parseInt(newValue) || 0)
    } else {
      const newValue = numberInput + digit
      if (parseInt(newValue) <= 99) {
        setNumberInput(newValue)
        setValue('jersey_number', parseInt(newValue))
      }
    }
  }
  
  const onSubmit = async (data: PlayerFormData) => {
    setLoading(true)
    try {
      await onAddPlayer({
        name: data.name,
        jersey_number: data.jersey_number,
        position: data.position || null,
        is_striped: data.is_striped
      })
      reset()
      setNumberInput('')
      setOpen(false)
    } catch (error) {
      console.error('Error adding player:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button className="w-full h-14 text-lg">
            <Plus className="h-5 w-5 mr-2" />
            Add Player
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle>Add New Player</SheetTitle>
          <SheetDescription>
            Quick add a player to your roster. Jersey numbers must be 0-99.
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          {/* Jersey Number with Number Pad Toggle */}
          <div className="space-y-2">
            <Label htmlFor="jersey_number" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Jersey Number
            </Label>
            <div className="flex gap-2">
              <Input
                id="jersey_number"
                type="number"
                min="0"
                max="99"
                value={watchedNumber}
                {...register('jersey_number', { valueAsNumber: true })}
                className="flex-1 h-14 text-2xl font-bold text-center"
                onClick={() => setShowNumberPad(!showNumberPad)}
                readOnly={showNumberPad}
              />
              <Button
                type="button"
                variant={showNumberPad ? "default" : "outline"}
                className="h-14 px-4"
                onClick={() => setShowNumberPad(!showNumberPad)}
              >
                <Hash className="h-5 w-5" />
              </Button>
            </div>
            {errors.jersey_number && (
              <p className="text-sm text-destructive">{errors.jersey_number.message}</p>
            )}
          </div>
          
          {/* Number Pad */}
          {showNumberPad && (
            <div className="grid grid-cols-3 gap-2 p-4 bg-muted rounded-lg">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'].map(digit => (
                <Button
                  key={digit}
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-14 text-lg font-semibold",
                    digit === 'clear' && "text-red-600",
                    digit === 'back' && "text-blue-600"
                  )}
                  onClick={() => handleNumberPadClick(digit)}
                >
                  {digit === 'clear' ? 'Clear' : digit === 'back' ? '←' : digit}
                </Button>
              ))}
            </div>
          )}
          
          {/* Player Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Player Name
            </Label>
            <Input
              id="name"
              placeholder="John Smith"
              {...register('name')}
              className="h-14 text-lg"
              autoComplete="off"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          
          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="position">Position (Optional)</Label>
            <Select
              onValueChange={(value) => setValue('position', value)}
              defaultValue=""
            >
              <SelectTrigger className="h-14 text-lg">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Position</SelectItem>
                {Object.entries(POSITIONS).map(([category, positions]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      {category}
                    </div>
                    {positions.map(pos => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Striped Toggle */}
          <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
            <div className="space-y-0.5">
              <Label htmlFor="is_striped" className="text-base font-semibold">
                Striped Player
              </Label>
              <p className="text-sm text-muted-foreground">
                Player cannot carry the ball
              </p>
            </div>
            <Switch
              id="is_striped"
              checked={watchedStriped}
              onCheckedChange={(checked) => setValue('is_striped', checked)}
            />
          </div>
          
          <SheetFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                setNumberInput('')
                setOpen(false)
              }}
              className="flex-1 h-14"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-14"
            >
              {loading ? 'Adding...' : 'Add Player'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// Helper function for classNames
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}