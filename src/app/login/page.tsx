
import AuthLayout from '@/components/auth/AuthLayout';
import AuthRedirect from '@/components/auth/AuthRedirect';

export default function LoginPage() {
  return (
    <AuthRedirect>
        <AuthLayout defaultTab="login" />
    </AuthRedirect>
  );
}
