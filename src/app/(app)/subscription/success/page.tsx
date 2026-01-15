'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar el estado de la suscripción después de la aprobación
    const verifySubscription = async () => {
      try {
        // Esperar un momento para que PayPal procese el webhook
        await new Promise(resolve => setTimeout(resolve, 2000));

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('No hay sesión activa');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/subscriptions/current', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          setLoading(false);
        } else {
          setError('No se pudo verificar la suscripción');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error verificando suscripción:', err);
        setError('Error verificando la suscripción');
        setLoading(false);
      }
    };

    verifySubscription();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Verificando tu suscripción...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">¡Suscripción Exitosa!</CardTitle>
          <CardDescription>
            {error
              ? 'Hubo un problema verificando tu suscripción, pero el pago fue procesado. Por favor, verifica tu suscripción en la página de gestión.'
              : 'Tu suscripción ha sido activada exitosamente. Ya puedes disfrutar de todas las características premium.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            onClick={() => router.push('/subscription')}
          >
            Ver Mi Suscripción
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/dashboard')}
          >
            Ir al Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}






