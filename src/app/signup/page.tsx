
import AuthLayout from '@/components/auth/AuthLayout';
import AuthRedirect from '@/components/auth/AuthRedirect';

export default function SignUpPage() {
  return (
    <AuthRedirect>
        <AuthLayout defaultTab="signup" />
    </AuthRedirect>
  );
}
