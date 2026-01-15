'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Calendar, CreditCard, X } from 'lucide-react';
import { Subscription } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function CurrentSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/subscriptions/current', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error cargando suscripción');
      }

      const data = await response.json();
      setSubscription(data.subscription);
    } catch (error) {
      console.error('Error cargando suscripción:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información de la suscripción.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!subscription) return;

    setCancelling(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          reason: 'Cancelado por el usuario',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error cancelando suscripción');
      }

      toast({
        title: 'Suscripción cancelada',
        description: 'Tu suscripción se cancelará al final del período actual.',
      });

      // Recargar información
      await loadSubscription();
    } catch (error) {
      console.error('Error cancelando suscripción:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo cancelar la suscripción.',
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      trialing: 'secondary',
      cancelled: 'destructive',
      expired: 'destructive',
      past_due: 'destructive',
    };

    const labels: Record<string, string> = {
      active: 'Activa',
      trialing: 'Prueba',
      cancelled: 'Cancelada',
      expired: 'Expirada',
      past_due: 'Pago Pendiente',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Suscripción</CardTitle>
          <CardDescription>No tienes una suscripción activa.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const periodEnd = new Date(subscription.currentPeriodEnd);
  const isExpired = periodEnd < new Date();
  const daysRemaining = Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Suscripción Actual</CardTitle>
            <CardDescription>
              {subscription.plan?.name || 'Plan no disponible'}
            </CardDescription>
          </div>
          {getStatusBadge(subscription.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription.plan && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Plan:</span>
              <span>{subscription.plan.name}</span>
            </div>
            {subscription.plan.priceUsd > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Precio:</span>
                <span>${subscription.plan.priceUsd.toFixed(2)} USD/mes</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Período actual:</span>
            <span>
              {format(new Date(subscription.currentPeriodStart), 'dd MMM yyyy', { locale: es })} -{' '}
              {format(periodEnd, 'dd MMM yyyy', { locale: es })}
            </span>
          </div>
          {!isExpired && (
            <div className="text-sm text-muted-foreground">
              {daysRemaining > 0
                ? `${daysRemaining} días restantes`
                : 'Expira hoy'}
            </div>
          )}
        </div>

        {subscription.cancelAtPeriodEnd && (
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-800 dark:text-yellow-200">
            Tu suscripción se cancelará al final del período actual.
          </div>
        )}

        {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <X className="mr-2 h-4 w-4" />
                Cancelar Suscripción
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Cancelar suscripción?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tu suscripción seguirá activa hasta el final del período actual ({format(periodEnd, 'dd MMM yyyy', { locale: es })}).
                  Después de esa fecha, perderás el acceso a las características premium.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Mantener Suscripción</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    'Sí, Cancelar'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}






