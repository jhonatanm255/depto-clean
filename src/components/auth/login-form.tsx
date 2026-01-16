
"use client";
// import type { UserRole } from '@/lib/types'; // No longer needed here
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect, type FormEvent } from 'react';
import { TriangleAlert, KeyRound, Eye, EyeOff } from 'lucide-react';
// import { toast } from '@/hooks/use-toast'; // Errors handled in AuthContext
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import Image from 'next/image';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, loading: authLoading } = useAuth();

  // Resetear isSubmitting cuando authLoading cambie a false
  useEffect(() => {
    if (!authLoading && isSubmitting) {
      // Pequeño delay para asegurar que el estado se actualice correctamente
      const timer = setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [authLoading, isSubmitting]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (isSubmitting || authLoading) return; // Prevenir múltiples envíos

    setIsSubmitting(true);

    // Timeout de seguridad: 30 segundos para dar tiempo a la hidratación
    const timeoutId = setTimeout(() => {
      console.warn('[LoginForm] ⚠️ Timeout en handleSubmit (30s), reseteando estado');
      setIsSubmitting(false);
    }, 30000);

    // Timeout de seguridad adicional: si authLoading no cambia en 5 segundos, forzar reset
    const safetyTimeout = setTimeout(() => {
      if (isSubmitting) {
        console.warn('[LoginForm] ⚠️ Reseteo de seguridad: isSubmitting aún en true después de 5s');
        setIsSubmitting(false);
      }
    }, 5000);

    try {
      await login(email, password);
      // No resetear aquí, el useEffect se encargará cuando authLoading cambie
    } catch (error) {
      console.error('[LoginForm] Error en handleSubmit:', error);
      setIsSubmitting(false);
    } finally {
      clearTimeout(timeoutId);
      clearTimeout(safetyTimeout);
    }
  };

  if (authLoading && !email) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Verificando...</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center bg-primary p-4 rounded-md">
          <Image
            src="/logo.png"
            alt="Logo de la aplicación"
            width={64}
            height={64}
            priority
            className="object-contain"
          />
        </div>
        <CardTitle className="font-headline text-3xl">¡Bienvenido/a!</CardTitle>
        <CardDescription>Inicia sesión para gestionar tus tareas de limpieza.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* <Alert variant="destructive" className="mb-6 bg-red-50 border-red-300 text-red-800">
            <TriangleAlert className="h-5 w-5 text-red-600" />
            <AlertTitle className="font-bold text-red-900">Importante para administradores</AlertTitle>
            <AlertDescription className="text-red-700 text-xs space-y-1">
              <p>
                Inicia sesión con el correo y contraseña configurados en Supabase Auth para tu empresa.
                Si eres propietario y aún no tienes cuenta, crea la empresa y tu usuario desde el panel de administración (o solicita a un propietario existente que te invite).
              </p>
              <p className="mt-2">
                <strong>Empleadas:</strong><br />
                Usa el email y contraseña que tu administrador registró para ti. Si no recuerdas la contraseña, pídele que te envíe una invitación nueva o que la restablezca.
              </p>
            </AlertDescription>
        </Alert> */}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Dirección de Correo Electrónico"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="Contraseña"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isSubmitting || authLoading}
          >
            {isSubmitting || authLoading ? (
              <>
                <LoadingSpinner className="mr-2" size={16} />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <div className="flex justify-center text-sm text-muted-foreground">
          ¿Aún no tienes cuenta? Regístra tu Empresa{" "}
          <Link href="/register" className="ml-1 text-primary underline">
            Aquí
          </Link>
        </div>
        <div className="flex items-center justify-center text-xs text-muted-foreground gap-1 flex-wrap">
          <Link href="/terms" className="text-primary underline hover:text-primary/80">
            Términos y condiciones
          </Link>
          <span>•</span>
          <Link href="/privacy" className="text-primary underline hover:text-primary/80">
            Política de privacidad
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
