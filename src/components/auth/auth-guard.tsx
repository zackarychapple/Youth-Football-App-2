import { ReactNode, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface AuthGuardProps {
  children: ReactNode;
  requireTeam?: boolean;
  requireHeadCoach?: boolean;
  fallbackPath?: string;
}

export function AuthGuard({
  children,
  requireTeam = false,
  requireHeadCoach = false,
  fallbackPath = '/auth/sign-in',
}: AuthGuardProps) {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, hasTeam, isHeadCoach } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate({ to: fallbackPath });
      } else if (requireTeam && !hasTeam) {
        navigate({ to: '/onboarding/team' });
      } else if (requireHeadCoach && !isHeadCoach) {
        navigate({ to: '/dashboard' });
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    hasTeam,
    isHeadCoach,
    requireTeam,
    requireHeadCoach,
    navigate,
    fallbackPath,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireTeam && !hasTeam) {
    return null;
  }

  if (requireHeadCoach && !isHeadCoach) {
    return null;
  }

  return <>{children}</>;
}

// HOC for route components
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<AuthGuardProps, 'children'>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}