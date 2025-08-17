import { createFileRoute } from '@tanstack/react-router';
import { SignUpForm } from '@/components/auth/sign-up-form';

export const Route = createFileRoute('/auth/sign-up')({
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Football Tracker
          </h1>
          <p className="text-gray-600">
            Start tracking your team's performance
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}