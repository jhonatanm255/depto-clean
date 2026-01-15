import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !serviceKey) {
  console.error('❌ Variables de entorno no configuradas');
}

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
  : null;

const adminClient = supabaseUrl && serviceKey
  ? createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
      },
    })
  : null;

/**
 * GET /api/subscriptions/current
 * Obtener la suscripción actual del usuario autenticado
 */
export async function GET(request: Request) {
  try {
    if (!supabase || !adminClient) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor.' },
        { status: 500 }
      );
    }

    // Obtener token de autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verificar token y obtener usuario
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Token inválido o expirado.' },
        { status: 401 }
      );
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.company_id) {
      return NextResponse.json(
        { error: 'No se pudo obtener el perfil del usuario.' },
        { status: 403 }
      );
    }

    // Obtener suscripción actual de la compañía
    const { data: subscription, error: subError } = await adminClient
      .from('subscriptions')
      .select(`
        *,
        subscription_plans (
          id,
          code,
          name,
          description,
          plan_type,
          price_usd,
          duration_days,
          features
        )
      `)
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, que es válido si no hay suscripción
      console.error('Error obteniendo suscripción:', subError);
      return NextResponse.json(
        { error: 'No se pudo obtener la suscripción.' },
        { status: 500 }
      );
    }

    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        message: 'No hay suscripción activa.',
      });
    }

    // Formatear respuesta
    const formattedSubscription = {
      id: subscription.id,
      companyId: subscription.company_id,
      planId: subscription.plan_id,
      status: subscription.status,
      paypalSubscriptionId: subscription.paypal_subscription_id,
      paypalPlanId: subscription.paypal_plan_id,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      cancelledAt: subscription.cancelled_at,
      trialEnd: subscription.trial_end,
      metadata: subscription.metadata,
      createdAt: subscription.created_at,
      updatedAt: subscription.updated_at,
      plan: subscription.subscription_plans ? {
        id: subscription.subscription_plans.id,
        code: subscription.subscription_plans.code,
        name: subscription.subscription_plans.name,
        description: subscription.subscription_plans.description,
        planType: subscription.subscription_plans.plan_type,
        priceUsd: parseFloat(subscription.subscription_plans.price_usd),
        durationDays: subscription.subscription_plans.duration_days,
        features: subscription.subscription_plans.features || [],
      } : null,
    };

    return NextResponse.json({ subscription: formattedSubscription });
  } catch (error) {
    console.error('Error en GET /api/subscriptions/current:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}






