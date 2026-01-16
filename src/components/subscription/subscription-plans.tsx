'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';
import { SubscriptionPlan } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface SubscriptionPlansProps {
  currentPlanId?: string;
  onPlanSelected?: (planId: string) => void;
}

export function SubscriptionPlans({ currentPlanId, onPlanSelected }: SubscriptionPlansProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans');
      if (!response.ok) {
        throw new Error('Error cargando planes');
      }
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error cargando planes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los planes de suscripción.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (plan.id === currentPlanId) {
      toast({
        title: 'Plan actual',
        description: 'Este es tu plan actual.',
      });
      return;
    }

    setCreating(plan.id);

    try {
      // Obtener token de autenticación
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ planId: plan.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error creando suscripción');
      }

      // Si es plan de pago, redirigir a PayPal
      if (plan.planType === 'paid' && data.approvalUrl) {
        window.location.href = data.approvalUrl;
        return;
      }

      // Si es plan free, mostrar éxito
      toast({
        title: '¡Éxito!',
        description: 'Suscripción creada exitosamente.',
      });

      if (onPlanSelected) {
        onPlanSelected(plan.id);
      }

      // Recargar la página después de un momento
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error seleccionando plan:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo crear la suscripción.',
        variant: 'destructive',
      });
    } finally {
      setCreating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
      {plans.map((plan) => {
        const isCurrent = plan.id === currentPlanId;
        const isCreating = creating === plan.id;

        return (
          <Card
            key={plan.id}
            className={`relative ${
              isCurrent ? 'border-primary ring-2 ring-primary' : ''
            }`}
          >
            {isCurrent && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Plan Actual
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  {plan.planType === 'free' ? 'Gratis' : `$${plan.priceUsd.toFixed(2)}`}
                </span>
                {plan.planType === 'paid' && (
                  <span className="text-muted-foreground">/mes</span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={isCurrent ? 'outline' : 'default'}
                onClick={() => handleSelectPlan(plan)}
                disabled={isCurrent || isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : isCurrent ? (
                  'Plan Actual'
                ) : (
                  plan.planType === 'free' ? 'Seleccionar Plan' : 'Suscribirse'
                )}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}






