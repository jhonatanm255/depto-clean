import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cancelPayPalSubscription } from '@/lib/paypal';

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

interface CancelSubscriptionPayload {
  subscriptionId: string;
  reason?: string;
}

/**
 * POST /api/subscriptions/cancel
 * Cancelar una suscripción
 */
export async function POST(request: Request) {
  try {
    if (!supabase || !adminClient) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor.' },
        { status: 500 }
      );
    }

    // Verificar autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Token inválido o expirado.' },
        { status: 401 }
      );
    }

    // Obtener perfil
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

    if (!['owner', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Solo owners y admins pueden cancelar suscripciones.' },
        { status: 403 }
      );
    }

    // Obtener datos del request
    const body: CancelSubscriptionPayload = await request.json();
    const { subscriptionId, reason } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Se requiere un subscriptionId.' },
        { status: 400 }
      );
    }

    // Obtener suscripción
    const { data: subscription, error: subError } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('company_id', profile.company_id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Suscripción no encontrada.' },
        { status: 404 }
      );
    }

    // Si tiene suscripción de PayPal, cancelarla allí también
    if (subscription.paypal_subscription_id) {
      const cancelled = await cancelPayPalSubscription(
        subscription.paypal_subscription_id,
        reason || 'Cancelado por el usuario'
      );

      if (!cancelled) {
        console.error('Error cancelando suscripción en PayPal');
        // Continuar con la cancelación local aunque falle en PayPal
      }
    }

    // Actualizar suscripción en la base de datos
    const { data: updatedSubscription, error: updateError } = await adminClient
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error actualizando suscripción:', updateError);
      return NextResponse.json(
        { error: 'No se pudo cancelar la suscripción.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscription: updatedSubscription,
      message: 'Suscripción cancelada exitosamente.',
    });
  } catch (error) {
    console.error('Error en POST /api/subscriptions/cancel:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}






