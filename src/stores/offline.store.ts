import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'player' | 'team' | 'game' | 'play';
  data: any;
  timestamp: number;
  retries: number;
}

export interface FailedAction extends OfflineAction {
  error: string;
  lastAttempt: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

interface OfflineStore {
  isOnline: boolean;
  queue: OfflineAction[];
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  failedActions: FailedAction[];
  
  // Actions
  setOnline: (online: boolean) => void;
  addToQueue: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retries'>) => void;
  removeFromQueue: (actionId: string) => void;
  processQueue: () => Promise<void>;
  retryFailed: (actionId: string) => Promise<void>;
  clearQueue: () => void;
  clearFailed: () => void;
  setSyncStatus: (status: SyncStatus) => void;
  updateLastSyncTime: () => void;
}

export const useOfflineStore = create<OfflineStore>()(
  persist(
    (set, get) => ({
      isOnline: navigator.onLine,
      queue: [],
      syncStatus: 'idle',
      lastSyncTime: null,
      failedActions: [],
      
      setOnline: (online) => {
        set({ isOnline: online });
        if (online && get().queue.length > 0) {
          get().processQueue();
        }
      },
      
      addToQueue: (action) => {
        const newAction: OfflineAction = {
          ...action,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          retries: 0,
        };
        
        set((state) => ({
          queue: [...state.queue, newAction],
        }));
        
        // Try to process immediately if online
        if (get().isOnline) {
          get().processQueue();
        }
      },
      
      removeFromQueue: (actionId) => {
        set((state) => ({
          queue: state.queue.filter((a) => a.id !== actionId),
        }));
      },
      
      processQueue: async () => {
        const { queue, isOnline } = get();
        
        if (!isOnline || queue.length === 0) {
          return;
        }
        
        set({ syncStatus: 'syncing' });
        
        for (const action of queue) {
          try {
            // Process action based on type
            await processOfflineAction(action);
            
            // Remove from queue on success
            get().removeFromQueue(action.id);
          } catch (error) {
            // Move to failed actions after max retries
            if (action.retries >= 3) {
              set((state) => ({
                queue: state.queue.filter((a) => a.id !== action.id),
                failedActions: [
                  ...state.failedActions,
                  {
                    ...action,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    lastAttempt: Date.now(),
                  },
                ],
              }));
            } else {
              // Increment retry count
              set((state) => ({
                queue: state.queue.map((a) =>
                  a.id === action.id ? { ...a, retries: a.retries + 1 } : a
                ),
              }));
            }
          }
        }
        
        set({ syncStatus: 'success' });
        get().updateLastSyncTime();
      },
      
      retryFailed: async (actionId) => {
        const failedAction = get().failedActions.find((a) => a.id === actionId);
        
        if (!failedAction) return;
        
        // Move back to queue for retry
        set((state) => ({
          failedActions: state.failedActions.filter((a) => a.id !== actionId),
          queue: [...state.queue, { ...failedAction, retries: 0 }],
        }));
        
        await get().processQueue();
      },
      
      clearQueue: () => set({ queue: [] }),
      
      clearFailed: () => set({ failedActions: [] }),
      
      setSyncStatus: (status) => set({ syncStatus: status }),
      
      updateLastSyncTime: () => set({ lastSyncTime: new Date() }),
    }),
    {
      name: 'offline-queue',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

// Helper function to process offline actions
async function processOfflineAction(action: OfflineAction): Promise<void> {
  const { supabase } = await import('@/lib/supabase');
  
  switch (action.entity) {
    case 'player':
      if (action.type === 'CREATE') {
        const { error } = await supabase.from('players').insert(action.data);
        if (error) throw error;
      } else if (action.type === 'UPDATE') {
        const { error } = await supabase
          .from('players')
          .update(action.data)
          .eq('id', action.data.id);
        if (error) throw error;
      } else if (action.type === 'DELETE') {
        const { error } = await supabase
          .from('players')
          .delete()
          .eq('id', action.data.id);
        if (error) throw error;
      }
      break;
      
    // Add other entity types as needed
    default:
      throw new Error(`Unknown entity type: ${action.entity}`);
  }
}

// Set up online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useOfflineStore.getState().setOnline(true);
  });
  
  window.addEventListener('offline', () => {
    useOfflineStore.getState().setOnline(false);
  });
}