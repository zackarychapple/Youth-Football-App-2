import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Session } from '@supabase/supabase-js';

interface Credentials {
  email: string;
  password: string;
}

interface AuthStore {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  signIn: (credentials: Credentials) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (credentials: Credentials & { name?: string }) => Promise<void>;
  refreshSession: () => Promise<void>;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      signIn: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          // Will be implemented with Supabase client
          const { supabase } = await import('@/lib/supabase');
          const { data, error } = await supabase.auth.signInWithPassword(credentials);
          
          if (error) throw error;
          
          set({
            user: data.user,
            session: data.session,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Sign in failed',
            isLoading: false,
          });
          throw error;
        }
      },
      
      signOut: async () => {
        set({ isLoading: true });
        try {
          const { supabase } = await import('@/lib/supabase');
          const { error } = await supabase.auth.signOut();
          
          if (error) throw error;
          
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Sign out failed',
            isLoading: false,
          });
          throw error;
        }
      },
      
      signUp: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const { supabase } = await import('@/lib/supabase');
          const { data, error } = await supabase.auth.signUp({
            email: credentials.email,
            password: credentials.password,
            options: {
              data: {
                name: credentials.name,
              },
            },
          });
          
          if (error) throw error;
          
          set({
            user: data.user,
            session: data.session,
            isAuthenticated: !!data.session,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Sign up failed',
            isLoading: false,
          });
          throw error;
        }
      },
      
      refreshSession: async () => {
        try {
          const { supabase } = await import('@/lib/supabase');
          const { data, error } = await supabase.auth.refreshSession();
          
          if (error) throw error;
          
          set({
            user: data.user,
            session: data.session,
            isAuthenticated: !!data.session,
          });
        } catch (error) {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
          });
        }
      },
      
      setSession: (session) => set({ session, isAuthenticated: !!session }),
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);