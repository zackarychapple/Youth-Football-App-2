import { ReactNode, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  Menu,
  X,
  Home,
  Users,
  Trophy,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  ClipboardList,
  UserCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { user, currentTeam, currentCoach, teams, signOut, switchTeam, isHeadCoach } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Games', href: '/games', icon: Trophy },
    { label: 'Roster', href: '/roster', icon: Users },
    { label: 'Practice', href: '/practice', icon: ClipboardList },
    { label: 'Schedule', href: '/schedule', icon: Calendar },
    { label: 'Stats', href: '/stats', icon: BarChart3 },
  ];

  if (isHeadCoach) {
    navItems.push({ label: 'Settings', href: '/settings', icon: Settings });
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate({ to: '/auth/sign-in' });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleTeamSwitch = async (teamId: string) => {
    try {
      await switchTeam(teamId);
      navigate({ to: '/dashboard' });
    } catch (error) {
      console.error('Team switch error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-white border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">{currentTeam?.name || 'Football Tracker'}</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{currentCoach?.name || user?.email}</p>
                  <p className="text-xs text-muted-foreground">{currentCoach?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {teams.length > 1 && (
                <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Switch Team
                  </DropdownMenuLabel>
                  {teams.map((team) => (
                    <DropdownMenuItem
                      key={team.id}
                      onClick={() => handleTeamSwitch(team.id)}
                      className={cn(
                        'cursor-pointer',
                        currentTeam?.id === team.id && 'bg-accent'
                      )}
                    >
                      {team.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <nav className="border-t bg-white">
            <div className="px-2 py-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-100 text-gray-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white border-r">
          <div className="flex items-center gap-2 px-6 h-16 border-b">
            <Trophy className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">Football Tracker</span>
          </div>

          {/* Team Selector */}
          {teams.length > 0 && (
            <div className="px-4 py-4 border-b">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="truncate">{currentTeam?.name || 'Select Team'}</span>
                    <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {teams.map((team) => (
                    <DropdownMenuItem
                      key={team.id}
                      onClick={() => handleTeamSwitch(team.id)}
                      className={cn(
                        'cursor-pointer',
                        currentTeam?.id === team.id && 'bg-accent'
                      )}
                    >
                      {team.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </nav>

          {/* User Menu */}
          <div className="px-4 py-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <UserCircle className="h-5 w-5 mr-3" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {currentCoach?.name || user?.email}
                    </span>
                    {isHeadCoach && (
                      <span className="text-xs text-muted-foreground">Head Coach</span>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}