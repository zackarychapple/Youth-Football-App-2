import { createFileRoute } from '@tanstack/react-router';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Football Tracker
          </h1>
          <p className="text-gray-600">
            Reset your password
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}