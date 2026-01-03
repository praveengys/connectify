
import SignUpForm from '@/components/auth/SignUpForm';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="w-full max-w-md">
        <SignUpForm />
        <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign In
        </Link>
        </p>
    </div>
  );
}
