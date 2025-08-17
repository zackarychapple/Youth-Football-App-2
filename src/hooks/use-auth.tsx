import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth.store';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const navigate = useNavigate();
  const {
    user,
    session,
    currentTeam,
    currentCoach,
    teams,
    isAuthenticated,
    isLoading,
    error,
    signIn,
    signOut,
    signUp,
    signUpWithTeam,
    joinTeamWithCode,
    resetPassword,
    updatePassword,
    refreshSession,
    loadUserTeams,
    switchTeam,
    clearError,
  } = useAuthStore();

  useEffect(() => {
    // Check for existing session on mount
    refreshSession();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        useAuthStore.setState({
          user: session?.user || null,
          session,
          isAuthenticated: !!session,
        });
        await loadUserTeams();
      } else if (event === 'SIGNED_OUT') {
        useAuthStore.setState({
          user: null,
          session: null,
          currentTeam: null,
          currentCoach: null,
          teams: [],
          isAuthenticated: false,
        });
        navigate({ to: '/auth/sign-in' });
      } else if (event === 'TOKEN_REFRESHED') {
        useAuthStore.setState({
          session,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    session,
    currentTeam,
    currentCoach,
    teams,
    isAuthenticated,
    isLoading,
    error,
    signIn,
    signOut,
    signUp,
    signUpWithTeam,
    joinTeamWithCode,
    resetPassword,
    updatePassword,
    switchTeam,
    clearError,
    hasTeam: !!currentTeam,
    isHeadCoach: currentCoach?.is_head_coach || false,
  };
}

export function useRequireAuth(redirectTo = '/auth/sign-in') {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: redirectTo });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  return { isAuthenticated, isLoading };
}

export function useRequireTeam(redirectTo = '/onboarding/team') {
  const { currentTeam, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !currentTeam) {
      navigate({ to: redirectTo });
    }
  }, [currentTeam, isLoading, navigate, redirectTo]);

  return { hasTeam: !!currentTeam, isLoading };
}