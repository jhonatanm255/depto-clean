
"use client";
// import type { UserRole } from '@/lib/types'; // No longer needed here
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, type FormEvent } from 'react';
import { Building, TriangleAlert, KeyRound } from 'lucide-react';
// import { toast } from '@/hooks/use-toast'; // Errors handled in AuthContext
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    // Call the simplified login function from AuthContext
    await login(email, password); 
  };

  if (loading && !email) { 
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner size={32}/>
        <p className="mt-4 text-muted-foreground">Verificando...</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Building size={32} />
        </div>
        <CardTitle className="font-headline text-3xl">¡Bienvenido/a!</CardTitle>
        <CardDescription>Inicia sesión para gestionar tus tareas de limpieza.</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" className="mb-6 bg-red-50 border-red-300 text-red-800">
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
        </Alert>

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
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Contraseña"
            />
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
            {loading ? <LoadingSpinner className="mr-2" size={16} /> : null}
            Iniciar Sesión
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/register" className="ml-1 text-primary underline">
          Regístrate aquí
        </Link>
      </CardFooter>
    </Card>
  );
}
