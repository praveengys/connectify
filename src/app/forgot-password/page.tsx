import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import Header from '@/components/Header';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <ForgotPasswordForm />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
