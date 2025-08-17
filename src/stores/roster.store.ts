import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { Player, PlayerInsert, PlayerUpdate } from '@/types/database.types'
import { toast } from 'sonner'

// Football positions
export const POSITIONS = {
  OFFENSE: ['QB', 'RB', 'WR', 'TE', 'OL'],
  DEFENSE: ['DL', 'LB', 'DB', 'S'],
  SPECIAL: ['K', 'P', 'LS']
} as const

export type Position = typeof POSITIONS[keyof typeof POSITIONS][number]

interface RosterState {
  players: Player[]
  loading: boolean
  error: string | null
  filter: {
    position: Position | 'ALL'
    showStriped: boolean
    searchQuery: string
  }
  
  // Actions
  fetchPlayers: (teamId: string) => Promise<void>
  addPlayer: (teamId: string, player: Omit<PlayerInsert, 'team_id'>) => Promise<Player | null>
  updatePlayer: (playerId: string, updates: PlayerUpdate) => Promise<void>
  deletePlayer: (playerId: string) => Promise<void>
  bulkImportPlayers: (teamId: string, playersData: string) => Promise<void>
  toggleStriped: (playerId: string) => Promise<void>
  archivePlayer: (playerId: string) => Promise<void>
  
  // Filter actions
  setPositionFilter: (position: Position | 'ALL') => void
  setStripedFilter: (show: boolean) => void
  setSearchQuery: (query: string) => void
  
  // Utility
  getFilteredPlayers: () => Player[]
  getPlayersByPosition: (position: Position) => Player[]
}

export const useRosterStore = create<RosterState>()(
  persist(
    (set, get) => ({
      players: [],
      loading: false,
      error: null,
      filter: {
        position: 'ALL',
        showStriped: true,
        searchQuery: ''
      },

      fetchPlayers: async (teamId: string) => {
        set({ loading: true, error: null })
        
        try {
          const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('team_id', teamId)
            .is('archived_at', null)
            .order('jersey_number', { ascending: true })

          if (error) throw error
          
          set({ players: data || [], loading: false })
        } catch (error) {
          console.error('Error fetching players:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch players',
            loading: false 
          })
          toast.error('Failed to load roster')
        }
      },

      addPlayer: async (teamId: string, playerData) => {
        set({ loading: true, error: null })
        
        try {
          const { data, error } = await supabase
            .from('players')
            .insert({
              ...playerData,
              team_id: teamId
            })
            .select()
            .single()

          if (error) throw error
          
          set(state => ({
            players: [...state.players, data],
            loading: false
          }))
          
          toast.success(`Added ${data.name} (#${data.jersey_number})`)
          return data
        } catch (error) {
          console.error('Error adding player:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add player',
            loading: false 
          })
          toast.error('Failed to add player')
          return null
        }
      },

      updatePlayer: async (playerId: string, updates) => {
        try {
          const { error } = await supabase
            .from('players')
            .update(updates)
            .eq('id', playerId)

          if (error) throw error
          
          set(state => ({
            players: state.players.map(p => 
              p.id === playerId ? { ...p, ...updates } : p
            )
          }))
          
          toast.success('Player updated')
        } catch (error) {
          console.error('Error updating player:', error)
          toast.error('Failed to update player')
        }
      },

      deletePlayer: async (playerId: string) => {
        try {
          const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', playerId)

          if (error) throw error
          
          set(state => ({
            players: state.players.filter(p => p.id !== playerId)
          }))
          
          toast.success('Player removed')
        } catch (error) {
          console.error('Error deleting player:', error)
          toast.error('Failed to remove player')
        }
      },

      bulkImportPlayers: async (teamId: string, playersData: string) => {
        set({ loading: true, error: null })
        
        try {
          // Parse the pasted data
          // Expected format: "Number Name Position" per line
          const lines = playersData.trim().split('\n')
          const players: PlayerInsert[] = []
          
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue
            
            // Match patterns like "12 John Smith QB" or "12 John Smith"
            const match = trimmed.match(/^(\d+)\s+(.+?)(?:\s+(QB|RB|WR|TE|OL|DL|LB|DB|S|K|P|LS))?$/i)
            
            if (match) {
              const [_, number, name, position] = match
              players.push({
                team_id: teamId,
                jersey_number: parseInt(number),
                name: name.trim(),
                position: position?.toUpperCase() || null,
                is_striped: false
              })
            }
          }
          
          if (players.length === 0) {
            throw new Error('No valid players found in the pasted data')
          }
          
          // Insert all players
          const { data, error } = await supabase
            .from('players')
            .insert(players)
            .select()

          if (error) throw error
          
          set(state => ({
            players: [...state.players, ...(data || [])],
            loading: false
          }))
          
          toast.success(`Added ${data?.length || 0} players`)
        } catch (error) {
          console.error('Error importing players:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to import players',
            loading: false 
          })
          toast.error('Failed to import roster. Check the format and try again.')
        }
      },

      toggleStriped: async (playerId: string) => {
        const player = get().players.find(p => p.id === playerId)
        if (!player) return
        
        const newStripedStatus = !player.is_striped
        
        try {
          const { error } = await supabase
            .from('players')
            .update({ is_striped: newStripedStatus })
            .eq('id', playerId)

          if (error) throw error
          
          set(state => ({
            players: state.players.map(p => 
              p.id === playerId ? { ...p, is_striped: newStripedStatus } : p
            )
          }))
          
          toast.success(newStripedStatus ? 'Player marked as striped' : 'Striped status removed')
        } catch (error) {
          console.error('Error toggling striped status:', error)
          toast.error('Failed to update striped status')
        }
      },

      archivePlayer: async (playerId: string) => {
        try {
          const { error } = await supabase
            .from('players')
            .update({ archived_at: new Date().toISOString() })
            .eq('id', playerId)

          if (error) throw error
          
          set(state => ({
            players: state.players.filter(p => p.id !== playerId)
          }))
          
          toast.success('Player archived')
        } catch (error) {
          console.error('Error archiving player:', error)
          toast.error('Failed to archive player')
        }
      },

      setPositionFilter: (position) => {
        set(state => ({
          filter: { ...state.filter, position }
        }))
      },

      setStripedFilter: (show) => {
        set(state => ({
          filter: { ...state.filter, showStriped: show }
        }))
      },

      setSearchQuery: (query) => {
        set(state => ({
          filter: { ...state.filter, searchQuery: query }
        }))
      },

      getFilteredPlayers: () => {
        const { players, filter } = get()
        
        return players.filter(player => {
          // Position filter
          if (filter.position !== 'ALL' && player.position !== filter.position) {
            return false
          }
          
          // Striped filter
          if (!filter.showStriped && player.is_striped) {
            return false
          }
          
          // Search filter
          if (filter.searchQuery) {
            const query = filter.searchQuery.toLowerCase()
            const matchesName = player.name.toLowerCase().includes(query)
            const matchesNumber = player.jersey_number.toString().includes(query)
            if (!matchesName && !matchesNumber) {
              return false
            }
          }
          
          return true
        })
      },

      getPlayersByPosition: (position) => {
        const { players } = get()
        return players
          .filter(p => p.position === position && !p.archived_at)
          .sort((a, b) => a.jersey_number - b.jersey_number)
      }
    }),
    {
      name: 'roster-storage',
      partialize: (state) => ({
        filter: state.filter
      })
    }
  )
)