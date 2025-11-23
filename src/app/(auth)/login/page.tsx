
import { LoginForm } from '@/components/auth/login-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iniciar Sesión - CleanSweep Manager',
};

export default function LoginPage() {
  return (
    <div className="flex w-full items-center justify-center">
      <LoginForm />
    </div>
  );
}
