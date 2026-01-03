
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md">
        <ForgotPasswordForm />
        <p className="mt-4 text-center text-sm text-muted-foreground">
        Remember your password?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign In
        </Link>
        </p>
    </div>
  );
}
