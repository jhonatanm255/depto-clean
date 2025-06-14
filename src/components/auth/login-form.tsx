
"use client";
import type { UserRole } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, type FormEvent } from 'react';
import { Building, UserCog, Users, Info, KeyRound, ShieldAlert } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ADMIN_EMAIL_CHECK = "admin@cleansweep.com";

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await login(email, password, 'employee', password); 
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
        <Alert className="mb-6 bg-blue-50 border-blue-200 text-blue-700">
            <ShieldAlert className="h-5 w-5 text-blue-500" />
            <AlertTitle className="font-semibold text-blue-800">Acceso al Sistema</AlertTitle>
            <AlertDescription className="text-blue-700 text-xs space-y-1">
              <p><strong>Administrador:</strong><br />
              Usuario: <code className="font-mono text-xs p-0.5 bg-blue-100 rounded">{ADMIN_EMAIL_CHECK}</code><br />
              Clave: <code className="font-mono text-xs p-0.5 bg-blue-100 rounded">admin123</code><br />
              <strong className="text-red-600">Importante:</strong> Asegúrate de que este usuario administrador exista en tu panel de <code className="font-mono text-xs p-0.5 bg-blue-100 rounded">Firebase Authentication</code> con esta contraseña. Si no existe, créalo manualmente en la consola de Firebase.
              </p>
              <p><strong>Empleados/as:</strong><br />
              Utiliza el correo electrónico y la contraseña que te asignó el administrador al crear tu perfil en el sistema.
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
    </Card>
  );
}
