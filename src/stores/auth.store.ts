import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Session } from '@supabase/supabase-js';
import { Team, Coach } from '@/types/database.types';

interface Credentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface SignUpData extends Credentials {
  name: string;
  teamName?: string;
  joinCode?: string;
}

interface AuthStore {
  user: User | null;
  session: Session | null;
  currentTeam: Team | null;
  currentCoach: Coach | null;
  teams: Team[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  rememberMe: boolean;
  
  // Actions
  signIn: (credentials: Credentials) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signUpWithTeam: (data: SignUpData & { teamName: string }) => Promise<void>;
  joinTeamWithCode: (code: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  loadUserTeams: () => Promise<void>;
  switchTeam: (teamId: string) => Promise<void>;
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
      currentTeam: null,
      currentCoach: null,
      teams: [],
      isAuthenticated: false,
      isLoading: false,
      error: null,
      rememberMe: false,
      
      signIn: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const { supabase } = await import('@/lib/supabase');
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });
          
          if (error) throw error;
          
          set({
            user: data.user,
            session: data.session,
            isAuthenticated: true,
            isLoading: false,
            rememberMe: credentials.rememberMe || false,
          });
          
          // Load user teams after successful sign in
          await get().loadUserTeams();
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
            currentTeam: null,
            currentCoach: null,
            teams: [],
            isAuthenticated: false,
            isLoading: false,
            rememberMe: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Sign out failed',
            isLoading: false,
          });
          throw error;
        }
      },
      
      signUp: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const { supabase } = await import('@/lib/supabase');
          
          // Sign up the user
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
              data: {
                name: data.name,
              },
            },
          });
          
          if (authError) throw authError;
          
          set({
            user: authData.user,
            session: authData.session,
            isAuthenticated: !!authData.session,
            isLoading: false,
            rememberMe: data.rememberMe || false,
          });
          
          // If a join code is provided, join existing team
          if (data.joinCode && authData.user) {
            await get().joinTeamWithCode(data.joinCode);
          }
          // If team name is provided, create new team
          else if (data.teamName && authData.user) {
            await get().signUpWithTeam({ ...data, teamName: data.teamName });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Sign up failed',
            isLoading: false,
          });
          throw error;
        }
      },
      
      signUpWithTeam: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const { supabase } = await import('@/lib/supabase');
          
          if (!get().user) throw new Error('User must be authenticated');
          
          // Use the create_team_with_coach RPC function
          const { data: result, error } = await supabase.rpc('create_team_with_coach', {
            p_team_name: data.teamName,
            p_user_id: get().user!.id,
            p_email: data.email,
            p_coach_name: data.name,
          });
          
          if (error) throw error;
          
          // Load user teams to update state
          await get().loadUserTeams();
          
          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create team',
            isLoading: false,
          });
          throw error;
        }
      },
      
      joinTeamWithCode: async (code) => {
        set({ isLoading: true, error: null });
        try {
          const { supabase } = await import('@/lib/supabase');
          const user = get().user;
          
          if (!user) throw new Error('User must be authenticated');
          
          const { error } = await supabase.rpc('join_team_with_code', {
            p_invite_code: code,
            p_user_id: user.id,
            p_email: user.email!,
            p_name: user.user_metadata.name || 'Coach',
          });
          
          if (error) throw error;
          
          // Reload teams
          await get().loadUserTeams();
          
          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to join team',
            isLoading: false,
          });
          throw error;
        }
      },
      
      resetPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          const { supabase } = await import('@/lib/supabase');
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
          });
          
          if (error) throw error;
          
          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to send reset email',
            isLoading: false,
          });
          throw error;
        }
      },
      
      updatePassword: async (newPassword) => {
        set({ isLoading: true, error: null });
        try {
          const { supabase } = await import('@/lib/supabase');
          const { error } = await supabase.auth.updateUser({
            password: newPassword,
          });
          
          if (error) throw error;
          
          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update password',
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
          
          // Load teams if authenticated
          if (data.session) {
            await get().loadUserTeams();
          }
        } catch (error) {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
          });
        }
      },
      
      loadUserTeams: async () => {
        try {
          const { supabase } = await import('@/lib/supabase');
          const user = get().user;
          
          if (!user) return;
          
          // Get user's teams
          const { data: teams, error } = await supabase
            .rpc('get_user_teams', { p_user_id: user.id });
          
          if (error) throw error;
          
          // Get coach info for current user
          const { data: coaches, error: coachError } = await supabase
            .from('coaches')
            .select('*')
            .eq('user_id', user.id);
          
          if (coachError) throw coachError;
          
          // Set first team as current if not set
          const currentTeam = get().currentTeam || (teams && teams[0] ? {
            id: teams[0].team_id,
            name: teams[0].team_name,
            invite_code: teams[0].invite_code,
            created_at: '',
            updated_at: '',
            settings: {},
          } as Team : null);
          
          const currentCoach = coaches && coaches[0] ? coaches[0] : null;
          
          set({
            teams: teams?.map((t: any) => ({
              id: t.team_id,
              name: t.team_name,
              invite_code: t.invite_code,
              created_at: '',
              updated_at: '',
              settings: {},
            } as Team)) || [],
            currentTeam,
            currentCoach,
          });
        } catch (error) {
          console.error('Failed to load teams:', error);
        }
      },
      
      switchTeam: async (teamId) => {
        const teams = get().teams;
        const team = teams.find(t => t.id === teamId);
        
        if (!team) throw new Error('Team not found');
        
        try {
          const { supabase } = await import('@/lib/supabase');
          const user = get().user;
          
          if (!user) throw new Error('User not authenticated');
          
          // Get coach info for this team
          const { data: coach, error } = await supabase
            .from('coaches')
            .select('*')
            .eq('user_id', user.id)
            .eq('team_id', teamId)
            .single();
          
          if (error) throw error;
          
          set({
            currentTeam: team,
            currentCoach: coach,
          });
        } catch (error) {
          console.error('Failed to switch team:', error);
          throw error;
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
        currentTeam: state.currentTeam,
        currentCoach: state.currentCoach,
        teams: state.teams,
        isAuthenticated: state.isAuthenticated,
        rememberMe: state.rememberMe,
      }),
    }
  )
);