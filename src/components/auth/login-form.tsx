
"use client";
import type { UserRole } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, type FormEvent } from 'react';
import { Building, UserCog, Users, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const { login, loading } = useAuth();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (role === 'admin' && email === 'admin@cleansweep.com' && password === 'admin123') {
        login(email, role);
    } else if (role === 'employee' && email === 'employee@cleansweep.com' && password === 'emp123') {
        login(email, role);
    } else {
        toast({
          variant: "destructive",
          title: "Error de inicio de sesión",
          description: "Credenciales inválidas. Por favor, verifica tu email, contraseña y rol.",
        });
    }
  };

  if (loading) {
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
        <CardTitle className="font-headline text-3xl">¡Bienvenido de Nuevo!</CardTitle>
        <CardDescription>Inicia sesión para gestionar tus tareas de limpieza.</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4 bg-accent/10 border-accent/30">
          <Info className="h-5 w-5 text-accent" />
          <AlertTitle className="text-accent font-semibold">Credenciales de Prueba</AlertTitle>
          <AlertDescription className="text-accent/90 text-xs space-y-1">
            <p><strong>Administrador:</strong><br />
            Usuario: <code className="font-mono text-xs p-0.5 bg-accent/20 rounded">admin@cleansweep.com</code><br />
            Clave: <code className="font-mono text-xs p-0.5 bg-accent/20 rounded">admin123</code></p>
            <p><strong>Empleado (General):</strong><br />
            Usuario: <code className="font-mono text-xs p-0.5 bg-accent/20 rounded">employee@cleansweep.com</code><br />
            Clave: <code className="font-mono text-xs p-0.5 bg-accent/20 rounded">emp123</code></p>
            <p className="mt-1">
              Los perfiles de empleado creados por el administrador son para asignación y seguimiento de tareas. El inicio de sesión para el rol "Empleado" es compartido.
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
          <div className="space-y-3">
            <Label>Ingresar como</Label>
            <RadioGroup
              defaultValue="employee"
              onValueChange={(value: string) => setRole(value as UserRole)}
              className="flex gap-4"
              aria-label="Selecciona tu rol"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="role-admin" />
                <Label htmlFor="role-admin" className="flex items-center gap-2 cursor-pointer">
                  <UserCog className="h-5 w-5 text-muted-foreground" /> Administrador
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="employee" id="role-employee" />
                <Label htmlFor="role-employee" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-5 w-5 text-muted-foreground" /> Empleado
                </Label>
              </div>
            </RadioGroup>
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
