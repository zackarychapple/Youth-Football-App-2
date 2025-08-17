import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Game, Player, PlayResult } from '../types/database.types';

export type GameMode = 'offense' | 'defense' | 'special';

interface PlayEntry {
  mode: GameMode;
  players: string[]; // Player IDs involved
  result: PlayResult;
  quarter: number;
  yards?: number;
  notes?: string;
  timestamp: string;
}

interface ActiveGameState {
  gameId: string;
  game: Game;
  players: Player[];
  participation: Map<string, number>; // player_id -> play count
  currentQuarter: number;
  currentPlayNumber: number;
  currentMode: GameMode;
  playHistory: PlayEntry[];
  selectedPlayers: string[];
}

interface GameStore {
  // Active game state
  activeGame: ActiveGameState | null;
  
  // UI state
  isSubstitutionPanelOpen: boolean;
  fieldPosition: number; // 0-100 representing field position
  
  // Actions
  startGame: (game: Game, players: Player[]) => void;
  setMode: (mode: GameMode) => void;
  selectPlayer: (playerId: string) => void;
  deselectPlayer: (playerId: string) => void;
  clearSelectedPlayers: () => void;
  recordPlay: (result: PlayResult, additionalData?: Partial<PlayEntry>) => void;
  undoLastPlay: () => void;
  setQuarter: (quarter: number) => void;
  toggleSubstitutionPanel: () => void;
  updateFieldPosition: (position: number) => void;
  endGame: () => void;
  
  // MPR calculations
  calculateMPR: () => { playerId: string; plays: number; mpr: number; meetsMinimum: boolean }[];
  getPlayerParticipation: (playerId: string) => number;
}

const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      activeGame: null,
      isSubstitutionPanelOpen: false,
      fieldPosition: 50,
      
      startGame: (game, players) => {
        const participation = new Map<string, number>();
        players.forEach(player => {
          participation.set(player.id, 0);
        });
        
        set({
          activeGame: {
            gameId: game.id,
            game,
            players,
            participation,
            currentQuarter: 1,
            currentPlayNumber: 1,
            currentMode: 'offense',
            playHistory: [],
            selectedPlayers: [],
          },
          fieldPosition: 50,
        });
      },
      
      setMode: (mode) => {
        const { activeGame } = get();
        if (!activeGame) return;
        
        set({
          activeGame: {
            ...activeGame,
            currentMode: mode,
            selectedPlayers: [],
          },
        });
      },
      
      selectPlayer: (playerId) => {
        const { activeGame } = get();
        if (!activeGame) return;
        
        const selectedPlayers = [...activeGame.selectedPlayers];
        if (!selectedPlayers.includes(playerId)) {
          selectedPlayers.push(playerId);
        }
        
        set({
          activeGame: {
            ...activeGame,
            selectedPlayers,
          },
        });
      },
      
      deselectPlayer: (playerId) => {
        const { activeGame } = get();
        if (!activeGame) return;
        
        set({
          activeGame: {
            ...activeGame,
            selectedPlayers: activeGame.selectedPlayers.filter(id => id !== playerId),
          },
        });
      },
      
      clearSelectedPlayers: () => {
        const { activeGame } = get();
        if (!activeGame) return;
        
        set({
          activeGame: {
            ...activeGame,
            selectedPlayers: [],
          },
        });
      },
      
      recordPlay: (result, additionalData) => {
        const { activeGame } = get();
        if (!activeGame) return;
        
        const playEntry: PlayEntry = {
          mode: activeGame.currentMode,
          players: [...activeGame.selectedPlayers],
          result,
          quarter: activeGame.currentQuarter,
          timestamp: new Date().toISOString(),
          ...additionalData,
        };
        
        // Update participation counts for offensive plays
        if (activeGame.currentMode === 'offense') {
          const newParticipation = new Map(activeGame.participation);
          activeGame.selectedPlayers.forEach(playerId => {
            const current = newParticipation.get(playerId) || 0;
            newParticipation.set(playerId, current + 1);
          });
          
          set({
            activeGame: {
              ...activeGame,
              participation: newParticipation,
              playHistory: [...activeGame.playHistory, playEntry],
              currentPlayNumber: activeGame.currentPlayNumber + 1,
              selectedPlayers: [],
            },
          });
        } else {
          // For defense/special teams, just record the play
          set({
            activeGame: {
              ...activeGame,
              playHistory: [...activeGame.playHistory, playEntry],
              currentPlayNumber: activeGame.currentPlayNumber + 1,
              selectedPlayers: [],
            },
          });
        }
      },
      
      undoLastPlay: () => {
        const { activeGame } = get();
        if (!activeGame || activeGame.playHistory.length === 0) return;
        
        const playHistory = [...activeGame.playHistory];
        const lastPlay = playHistory.pop();
        
        if (!lastPlay) return;
        
        // Revert participation counts if it was an offensive play
        if (lastPlay.mode === 'offense') {
          const newParticipation = new Map(activeGame.participation);
          lastPlay.players.forEach(playerId => {
            const current = newParticipation.get(playerId) || 0;
            newParticipation.set(playerId, Math.max(0, current - 1));
          });
          
          set({
            activeGame: {
              ...activeGame,
              participation: newParticipation,
              playHistory,
              currentPlayNumber: Math.max(1, activeGame.currentPlayNumber - 1),
            },
          });
        } else {
          set({
            activeGame: {
              ...activeGame,
              playHistory,
              currentPlayNumber: Math.max(1, activeGame.currentPlayNumber - 1),
            },
          });
        }
      },
      
      setQuarter: (quarter) => {
        const { activeGame } = get();
        if (!activeGame) return;
        
        set({
          activeGame: {
            ...activeGame,
            currentQuarter: quarter,
          },
        });
      },
      
      toggleSubstitutionPanel: () => {
        set(state => ({
          isSubstitutionPanelOpen: !state.isSubstitutionPanelOpen,
        }));
      },
      
      updateFieldPosition: (position) => {
        set({ fieldPosition: position });
      },
      
      endGame: () => {
        set({
          activeGame: null,
          isSubstitutionPanelOpen: false,
          fieldPosition: 50,
        });
      },
      
      calculateMPR: () => {
        const { activeGame } = get();
        if (!activeGame) return [];
        
        // Count total offensive plays
        const offensivePlays = activeGame.playHistory.filter(p => p.mode === 'offense').length;
        
        // 5v5 flag requires 10 plays per half = 20 total
        // With 10 eligible players, minimum is 2 plays per player
        const minPlaysPerPlayer = Math.floor(offensivePlays * 0.1); // 10% minimum
        
        return activeGame.players
          .filter(p => !p.is_striped) // Only non-striped players count for MPR
          .map(player => {
            const plays = activeGame.participation.get(player.id) || 0;
            const mpr = offensivePlays > 0 ? (plays / offensivePlays) * 100 : 0;
            
            return {
              playerId: player.id,
              plays,
              mpr,
              meetsMinimum: plays >= minPlaysPerPlayer,
            };
          });
      },
      
      getPlayerParticipation: (playerId) => {
        const { activeGame } = get();
        if (!activeGame) return 0;
        
        return activeGame.participation.get(playerId) || 0;
      },
    }),
    {
      name: 'game-storage',
      partialize: (state) => ({
        activeGame: state.activeGame,
        fieldPosition: state.fieldPosition,
      }),
    }
  )
);

export default useGameStore;