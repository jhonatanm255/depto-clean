"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import Link from 'next/link';
import { Building2, Sparkles } from 'lucide-react';

const registerSchema = z.object({
  fullName: z.string().min(3, 'Ingresa tu nombre completo.'),
  email: z.string().email('Correo inválido.'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d).+$/,
      'Debe incluir letras y números.'
    ),
  companyName: z.string().min(3, 'Ingresa el nombre de tu empresa.'),
  companySlug: z
    .string()
    .regex(/^[a-z0-9-]*$/, 'Usa solo letras minúsculas, números o guiones.')
    .optional()
    .or(z.literal('')),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      companyName: '',
      companySlug: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: data.companyName.trim(),
          companySlug: data.companySlug?.trim() || null,
          fullName: data.fullName.trim(),
          email: data.email.trim().toLowerCase(),
          password: data.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        const message = error?.error ?? 'No se pudo crear la cuenta.';
        toast({
          variant: 'destructive',
          title: 'Error al registrar',
          description: message,
        });
        return;
      }

      const payload = await response.json();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      if (signInError) {
        toast({
          variant: 'destructive',
          title: 'Cuenta creada, pero...',
          description:
            'No se pudo iniciar sesión automáticamente. Intenta ingresar manualmente.',
        });
        router.push('/login');
        return;
      }

      toast({
        title: '¡Bienvenido!',
        description: 'Tu empresa fue creada correctamente.',
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Error al registrar:', error);
      toast({
        variant: 'destructive',
        title: 'Error inesperado',
        description: 'Algo salió mal al crear la cuenta.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-xl shadow-xl">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Building2 size={32} />
        </div>
        <CardTitle className="font-headline text-3xl">
          Registra tu empresa
        </CardTitle>
        <CardDescription>
          Crea una cuenta para gestionar tus departamentos y equipos de limpieza.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="companyName">Nombre de la empresa</Label>
            <Input
              id="companyName"
              placeholder="Ej: LimpiaPlus SpA"
              {...form.register('companyName')}
              disabled={isSubmitting}
            />
            {form.formState.errors.companyName && (
              <p className="text-sm text-destructive">
                {form.formState.errors.companyName.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="companySlug">
              URL personalizada (opcional)
            </Label>
            <Input
              id="companySlug"
              placeholder="ej: limpiaplus"
              {...form.register('companySlug')}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Usamos esto para identificar tu cuenta internamente. Se generará automáticamente si lo dejas vacío.
            </p>
            {form.formState.errors.companySlug && (
              <p className="text-sm text-destructive">
                {form.formState.errors.companySlug.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="fullName">Tu nombre completo</Label>
            <Input
              id="fullName"
              placeholder="Ej: Ana García"
              {...form.register('fullName')}
              disabled={isSubmitting}
            />
            {form.formState.errors.fullName && (
              <p className="text-sm text-destructive">
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="ej: ana@limpiaplus.com"
              {...form.register('email')}
              disabled={isSubmitting}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

           <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Crea una contraseña segura"
              {...form.register('password')}
              disabled={isSubmitting}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <LoadingSpinner className="mr-2" size={16} />
            )}
            Crear mi cuenta
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="ml-1 text-primary underline">
            Inicia sesión
          </Link>
        </div>
        <div className="flex items-center justify-center text-xs text-muted-foreground gap-1">
          <Sparkles className="h-3 w-3" />
          Al registrarte aceptas nuestros términos y políticas de uso.
        </div>
      </CardFooter>
    </Card>
  );
}

