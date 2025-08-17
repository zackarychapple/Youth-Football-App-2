import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, ArrowRight, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Team, Coach } from '@/types/database.types';

export const Route = createFileRoute('/onboarding/team')({
  component: TeamOnboardingPage,
});

function TeamOnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [coachName, setCoachName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [createdTeam, setCreatedTeam] = useState<{ id: string; name: string; invite_code: string } | null>(null);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be signed in to create a team');
      return;
    }

    setIsLoading(true);
    try {
      // For now, create a simple team in local storage since database isn't set up
      const team: Team = {
        id: crypto.randomUUID(),
        name: teamName,
        invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        settings: {},
      };

      const coach: Coach = {
        id: crypto.randomUUID(),
        user_id: user.id,
        team_id: team.id,
        name: coachName || user.email?.split('@')[0] || 'Coach',
        email: user.email || '',
        is_head_coach: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Store in localStorage as a temporary solution
      localStorage.setItem('current_team', JSON.stringify(team));
      localStorage.setItem('current_coach', JSON.stringify(coach));
      
      // Update the auth store with the new team and coach
      useAuthStore.setState({
        currentTeam: team,
        currentCoach: coach,
        teams: [team],
      });
      
      setCreatedTeam(team);
      toast.success('Team created successfully!');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate({ to: '/dashboard' });
      }, 2000);
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be signed in to join a team');
      return;
    }

    setIsLoading(true);
    try {
      // For now, just validate the code format and create a mock team
      if (inviteCode.length !== 6) {
        toast.error('Invalid invite code. Please check and try again.');
        return;
      }

      // Create a mock team for joining
      const team: Team = {
        id: crypto.randomUUID(),
        name: `Team ${inviteCode}`,
        invite_code: inviteCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        settings: {},
      };

      const coach: Coach = {
        id: crypto.randomUUID(),
        user_id: user.id,
        team_id: team.id,
        name: coachName || user.email?.split('@')[0] || 'Coach',
        email: user.email || '',
        is_head_coach: false, // Assistant coach when joining
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Store in localStorage
      localStorage.setItem('current_team', JSON.stringify(team));
      localStorage.setItem('current_coach', JSON.stringify(coach));
      
      // Update the auth store
      useAuthStore.setState({
        currentTeam: team,
        currentCoach: coach,
        teams: [team],
      });

      toast.success('Joined team successfully!');
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate({ to: '/dashboard' });
      }, 1500);
    } catch (error) {
      console.error('Error joining team:', error);
      toast.error('Failed to join team. Please check the invite code.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (createdTeam?.invite_code) {
      navigator.clipboard.writeText(createdTeam.invite_code);
      setCopiedCode(true);
      toast.success('Invite code copied to clipboard!');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (createdTeam) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Team Created!</CardTitle>
            <CardDescription>
              Your team "{createdTeam.name}" has been created successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-gray-50 p-4">
              <Label className="text-sm text-muted-foreground">Invite Code</Label>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 font-mono text-2xl font-bold text-center">
                  {createdTeam.invite_code}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyInviteCode}
                  className="h-10"
                >
                  {copiedCode ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              Share this code with assistant coaches to invite them to your team.
            </p>
            
            <Button
              className="w-full h-12"
              onClick={() => navigate({ to: '/dashboard' })}
            >
              Continue to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Trophy className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl">Team Setup</CardTitle>
          <CardDescription>
            Create a new team or join an existing one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="create" className="text-base">
                Create Team
              </TabsTrigger>
              <TabsTrigger value="join" className="text-base">
                Join Team
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="mt-6">
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    placeholder="e.g., Riverside Ravens"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                    className="h-12 text-base"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="coach-name">Your Name</Label>
                  <Input
                    id="coach-name"
                    placeholder="e.g., Coach Smith"
                    value={coachName}
                    onChange={(e) => setCoachName(e.target.value)}
                    required
                    className="h-12 text-base"
                    disabled={isLoading}
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={isLoading || !teamName || !coachName}
                >
                  {isLoading ? 'Creating Team...' : 'Create Team'}
                  <Users className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="join" className="mt-6">
              <form onSubmit={handleJoinTeam} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-code">Invite Code</Label>
                  <Input
                    id="invite-code"
                    placeholder="Enter 6-character code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    required
                    className="h-12 text-base font-mono text-center text-2xl"
                    disabled={isLoading}
                  />
                  <p className="text-sm text-muted-foreground">
                    Ask your head coach for the team invite code
                  </p>
                </div>
                
                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={isLoading || inviteCode.length !== 6}
                >
                  {isLoading ? 'Joining Team...' : 'Join Team'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => navigate({ to: '/dashboard' })}
              className="text-muted-foreground"
            >
              Skip for now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}