import { createFileRoute } from '@tanstack/react-router';
import { AuthGuard } from '@/components/auth/auth-guard';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/hooks/use-auth';
import {
  Trophy,
  Users,
  Calendar,
  TrendingUp,
  ClipboardList,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <AuthGuard requireTeam>
      <DashboardLayout>
        <DashboardContent />
      </DashboardLayout>
    </AuthGuard>
  );
}

function DashboardContent() {
  const { currentTeam, currentCoach, isHeadCoach } = useAuth();

  // Mock data - will be replaced with real data from API
  const stats = {
    totalPlayers: 22,
    activeGames: 2,
    practiceAttendance: 85,
    winRate: 75,
    upcomingGames: 3,
    recentPractices: 5,
  };

  const quickActions = [
    {
      label: 'Start Game',
      icon: Trophy,
      href: '/games/new',
      color: 'bg-green-500',
      description: 'Track a new game',
    },
    {
      label: 'Take Attendance',
      icon: ClipboardList,
      href: '/practice/attendance',
      color: 'bg-blue-500',
      description: 'Practice attendance',
    },
    {
      label: 'View Roster',
      icon: Users,
      href: '/roster',
      color: 'bg-purple-500',
      description: 'Manage players',
    },
    {
      label: 'View Schedule',
      icon: Calendar,
      href: '/schedule',
      color: 'bg-orange-500',
      description: 'Games & practices',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {currentCoach?.name || 'Coach'}!
        </h1>
        <p className="text-gray-600 mt-1">
          {currentTeam?.name} Dashboard
          {isHeadCoach && ' • Head Coach'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlayers}</div>
            <p className="text-xs text-muted-foreground">Active roster</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Games</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeGames}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Practice Attendance</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.practiceAttendance}%</div>
            <p className="text-xs text-muted-foreground">Last 5 practices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate}%</div>
            <p className="text-xs text-muted-foreground">This season</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} to={action.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`p-3 rounded-full ${action.color}`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{action.label}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity / Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Games</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcomingGames > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">vs. Tigers</p>
                    <p className="text-sm text-muted-foreground">Saturday, 10:00 AM</p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/games/new">Start</Link>
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">vs. Lions</p>
                    <p className="text-sm text-muted-foreground">Next Saturday, 2:00 PM</p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/schedule">View</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No upcoming games scheduled</p>
                <Button className="mt-4" variant="outline" asChild>
                  <Link to="/schedule">Add Game</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Low Practice Attendance</p>
                  <p className="text-sm text-muted-foreground">
                    3 players missed last practice
                  </p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">MPR Reminder</p>
                  <p className="text-sm text-muted-foreground">
                    Track participation for all players
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Invite Code (for head coaches) */}
      {isHeadCoach && currentTeam?.invite_code && (
        <Card>
          <CardHeader>
            <CardTitle>Team Invite Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">
                  Share this code with assistant coaches to join your team
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-4 py-2 bg-gray-100 rounded-lg font-mono text-lg text-center">
                    {currentTeam.invite_code}
                  </code>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(currentTeam.invite_code);
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}