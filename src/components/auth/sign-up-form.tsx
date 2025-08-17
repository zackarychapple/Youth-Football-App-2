import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Mail, Lock, User, Users, Hash, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  teamName: z.string().optional(),
  joinCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const { signUp, error: authError, clearError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState<'create' | 'join'>('create');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      teamName: '',
      joinCode: '',
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    clearError();

    try {
      if (tab === 'create') {
        await signUp({
          email: data.email,
          password: data.password,
          name: data.name,
          teamName: data.teamName,
        });
      } else {
        await signUp({
          email: data.email,
          password: data.password,
          name: data.name,
          joinCode: data.joinCode,
        });
      }
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setTab(value as 'create' | 'join');
    reset();
    clearError();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Create Account
        </CardTitle>
        <CardDescription className="text-center">
          Get started with your team's football tracker
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="create" className="text-sm">
              <Users className="mr-2 h-4 w-4" />
              Create Team
            </TabsTrigger>
            <TabsTrigger value="join" className="text-sm">
              <Hash className="mr-2 h-4 w-4" />
              Join Team
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {authError && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Coach Smith"
                  className="pl-10 h-14 text-base"
                  autoComplete="name"
                  {...register('name')}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="coach@team.com"
                  className="pl-10 h-14 text-base"
                  autoComplete="email"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <TabsContent value="create" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="teamName"
                    type="text"
                    placeholder="Eagles U12"
                    className="pl-10 h-14 text-base"
                    {...register('teamName')}
                  />
                </div>
                {tab === 'create' && (
                  <p className="text-sm text-muted-foreground">
                    Enter your team's name
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="join" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="joinCode">Team Invite Code</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="joinCode"
                    type="text"
                    placeholder="ABC123"
                    className="pl-10 h-14 text-base uppercase"
                    {...register('joinCode')}
                  />
                </div>
                {tab === 'join' && (
                  <p className="text-sm text-muted-foreground">
                    Ask your head coach for the team's invite code
                  </p>
                )}
              </div>
            </TabsContent>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  className="pl-10 h-14 text-base"
                  autoComplete="new-password"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  className="pl-10 h-14 text-base"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  {tab === 'create' ? 'Create Account & Team' : 'Join Team'}
                </>
              )}
            </Button>
          </form>
        </Tabs>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-center w-full text-muted-foreground">
          Already have an account?{' '}
          <a
            href="/auth/sign-in"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}