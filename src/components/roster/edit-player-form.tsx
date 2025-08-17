import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, User, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
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
import { Textarea } from '@/components/ui/textarea'
import { POSITIONS } from '@/stores/roster.store'
import type { Player, PlayerUpdate } from '@/types/database.types'

const playerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  jersey_number: z.number().min(0).max(99, 'Jersey number must be 0-99'),
  position: z.string().optional().nullable(),
  is_striped: z.boolean(),
  notes: z.string().optional().nullable()
})

type PlayerFormData = z.infer<typeof playerSchema>

interface EditPlayerFormProps {
  player: Player | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (playerId: string, updates: PlayerUpdate) => Promise<void>
}

export function EditPlayerForm({ player, open, onOpenChange, onSave }: EditPlayerFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema)
  })
  
  const watchedStriped = watch('is_striped')
  
  useEffect(() => {
    if (player) {
      reset({
        name: player.name,
        jersey_number: player.jersey_number,
        position: player.position,
        is_striped: player.is_striped,
        notes: player.notes
      })
    }
  }, [player, reset])
  
  const onSubmit = async (data: PlayerFormData) => {
    if (!player) return
    
    await onSave(player.id, {
      name: data.name,
      jersey_number: data.jersey_number,
      position: data.position || null,
      is_striped: data.is_striped,
      notes: data.notes || null
    })
    
    onOpenChange(false)
  }
  
  if (!player) return null
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle>Edit Player</SheetTitle>
          <SheetDescription>
            Update player information and settings
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          {/* Jersey Number */}
          <div className="space-y-2">
            <Label htmlFor="jersey_number" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Jersey Number
            </Label>
            <Input
              id="jersey_number"
              type="number"
              min="0"
              max="99"
              {...register('jersey_number', { valueAsNumber: true })}
              className="h-14 text-2xl font-bold text-center"
            />
            {errors.jersey_number && (
              <p className="text-sm text-destructive">{errors.jersey_number.message}</p>
            )}
          </div>
          
          {/* Player Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Player Name
            </Label>
            <Input
              id="name"
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
            <Label htmlFor="position">Position</Label>
            <Select
              value={watch('position') || ''}
              onValueChange={(value) => setValue('position', value || null)}
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
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Add any notes about this player..."
              className="min-h-[100px]"
            />
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
              onClick={() => onOpenChange(false)}
              className="flex-1 h-14"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-14"
            >
              {isSubmitting ? 'Saving...' : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}