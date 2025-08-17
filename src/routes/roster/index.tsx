import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { 
  Search, 
  Users, 
  Plus, 
  Upload,
  AlertCircle,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { useRosterStore } from '@/stores/roster.store'
import { useAuth } from '@/hooks/use-auth'
import { AuthGuard } from '@/components/auth/auth-guard'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PlayerCard } from '@/components/roster/player-card'
import { AddPlayerForm } from '@/components/roster/add-player-form'
import { EditPlayerForm } from '@/components/roster/edit-player-form'
import { BulkImportDialog } from '@/components/roster/bulk-import-dialog'
import { AllPlayersGroup } from '@/components/roster/position-group'
import type { Player } from '@/types/database.types'

export const Route = createFileRoute('/roster/')({
  component: RosterPage,
})

function RosterPage() {
  return (
    <AuthGuard requireTeam>
      <DashboardLayout>
        <RosterContent />
      </DashboardLayout>
    </AuthGuard>
  )
}

function RosterContent() {
  const { currentTeam } = useAuth()
  const {
    players,
    filter,
    fetchPlayers,
    addPlayer,
    updatePlayer,
    deletePlayer,
    bulkImportPlayers,
    toggleStriped,
    setPositionFilter,
    setStripedFilter,
    setSearchQuery,
    getFilteredPlayers
  } = useRosterStore()
  
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'position'>('position')
  
  // Fetch players when component mounts or team changes
  useEffect(() => {
    if (currentTeam?.id) {
      fetchPlayers(currentTeam.id)
    }
  }, [currentTeam?.id, fetchPlayers])
  
  const filteredPlayers = getFilteredPlayers()
  
  // Stats
  const totalPlayers = players.length
  const stripedPlayers = players.filter(p => p.is_striped).length
  const activeFilters = filter.position !== 'ALL' || !filter.showStriped || filter.searchQuery
  
  const handleAddPlayer = async (playerData: Parameters<typeof addPlayer>[1]) => {
    if (!currentTeam?.id) {
      toast.error('No team selected')
      return
    }
    await addPlayer(currentTeam.id, playerData)
  }
  
  const handleBulkImport = async (data: string) => {
    if (!currentTeam?.id) {
      toast.error('No team selected')
      return
    }
    await bulkImportPlayers(currentTeam.id, data)
  }
  
  if (!currentTeam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No Team Selected</h2>
        <p className="text-muted-foreground text-center">
          Please select or create a team to manage your roster
        </p>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-background">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold">Roster</h1>
            <p className="text-sm text-muted-foreground">
              {currentTeam.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {totalPlayers} players
            </Badge>
            {stripedPlayers > 0 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                {stripedPlayers} striped
              </Badge>
            )}
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or number..."
            value={filter.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-12"
          />
          {activeFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={() => {
                setSearchQuery('')
                setPositionFilter('ALL')
                setStripedFilter(true)
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
      
      {/* Filter Bar */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="show-striped"
                checked={filter.showStriped}
                onCheckedChange={setStripedFilter}
              />
              <Label htmlFor="show-striped" className="text-sm">
                Show Striped
              </Label>
            </div>
          </div>
        </div>
      </div>
      
      {/* View Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-3">
          <TabsTrigger value="position" className="flex-1">By Position</TabsTrigger>
          <TabsTrigger value="all" className="flex-1">All Players</TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1">
          <div className="p-4">
            <TabsContent value="position" className="mt-0 space-y-4">
              {filteredPlayers.length === 0 ? (
                <EmptyState 
                  searchQuery={filter.searchQuery}
                  hasPlayers={players.length > 0}
                />
              ) : (
                <AllPlayersGroup
                  players={filteredPlayers}
                  onEditPlayer={setEditingPlayer}
                  onDeletePlayer={deletePlayer}
                  onToggleStriped={toggleStriped}
                />
              )}
            </TabsContent>
            
            <TabsContent value="all" className="mt-0 space-y-2">
              {filteredPlayers.length === 0 ? (
                <EmptyState 
                  searchQuery={filter.searchQuery}
                  hasPlayers={players.length > 0}
                />
              ) : (
                filteredPlayers.map(player => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    onEdit={setEditingPlayer}
                    onDelete={deletePlayer}
                    onToggleStriped={toggleStriped}
                  />
                ))
              )}
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
      
      {/* Action Buttons */}
      <div className="p-4 border-t bg-background space-y-2">
        <AddPlayerForm 
          onAddPlayer={handleAddPlayer}
        />
        <BulkImportDialog 
          onImport={handleBulkImport}
        />
      </div>
      
      {/* Edit Player Sheet */}
      <EditPlayerForm
        player={editingPlayer}
        open={!!editingPlayer}
        onOpenChange={(open) => !open && setEditingPlayer(null)}
        onSave={updatePlayer}
      />
    </div>
  )
}

function EmptyState({ searchQuery, hasPlayers }: { searchQuery: string; hasPlayers: boolean }) {
  if (searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Search className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No players found</h3>
        <p className="text-sm text-muted-foreground text-center">
          No players match "{searchQuery}"
        </p>
      </div>
    )
  }
  
  if (!hasPlayers) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No players yet</h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Add players individually or bulk import your roster
        </p>
        <div className="flex gap-2">
          <AddPlayerForm
            onAddPlayer={async () => {}}
            trigger={
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            }
          />
          <BulkImportDialog
            onImport={async () => {}}
            trigger={
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Import Roster
              </Button>
            }
          />
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">No players match filters</h3>
      <p className="text-sm text-muted-foreground text-center">
        Try adjusting your filters to see more players
      </p>
    </div>
  )
}