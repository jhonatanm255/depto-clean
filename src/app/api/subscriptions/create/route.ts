import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createPayPalClient, validateAmount, hashSensitiveData } from '@/lib/paypal';
import { core } from '@paypal/paypal-server-sdk';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

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

interface CreateSubscriptionPayload {
  planId: string;
}

/**
 * POST /api/subscriptions/create
 * Crear una nueva suscripción con PayPal
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

    // Obtener perfil y compañía
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
        { error: 'Solo owners y admins pueden crear suscripciones.' },
        { status: 403 }
      );
    }

    // Obtener datos del request
    const body: CreateSubscriptionPayload = await request.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'Se requiere un planId.' },
        { status: 400 }
      );
    }

    // Obtener información del plan
    const { data: plan, error: planError } = await adminClient
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Plan no encontrado o no disponible.' },
        { status: 404 }
      );
    }

    // Si es el plan free, crear suscripción directamente sin PayPal
    if (plan.plan_type === 'free') {
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + plan.duration_days);

      const { data: newSubscription, error: subError } = await adminClient
        .from('subscriptions')
        .insert({
          company_id: profile.company_id,
          plan_id: planId,
          status: 'trialing',
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          trial_end: periodEnd.toISOString(),
        })
        .select()
        .single();

      if (subError) {
        console.error('Error creando suscripción free:', subError);
        return NextResponse.json(
          { error: 'No se pudo crear la suscripción.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        subscription: newSubscription,
        message: 'Suscripción gratuita creada exitosamente.',
      });
    }

    // Para planes de pago, crear suscripción en PayPal
    if (!validateAmount(parseFloat(plan.price_usd))) {
      return NextResponse.json(
        { error: 'Monto del plan inválido.' },
        { status: 400 }
      );
    }

    const paypalClient = createPayPalClient();
    
    // Crear suscripción en PayPal
    // Nota: Necesitarás tener un plan creado previamente en PayPal
    // Por ahora, retornamos un error indicando que se necesita configuración
    if (!plan.paypal_plan_id) {
      return NextResponse.json(
        { 
          error: 'Este plan aún no está configurado para pagos. Por favor, contacta al administrador.',
          requiresPayPalSetup: true,
        },
        { status: 400 }
      );
    }

    // Crear suscripción en PayPal
    const paypalRequest = new core.SubscriptionsCreateRequest();
    const requestBody = {
      plan_id: plan.paypal_plan_id,
      start_time: new Date(Date.now() + 60000).toISOString(), // 1 minuto desde ahora
      subscriber: {
        email_address: user.email || undefined,
      },
      application_context: {
        brand_name: 'Depto Clean',
        locale: 'es-ES',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
        return_url: `${baseUrl}/subscription/success`,
        cancel_url: `${baseUrl}/subscription/cancel`,
      },
    };

    // Usar el método correcto según la versión del SDK
    if (typeof (paypalRequest as any).requestBody === 'function') {
      (paypalRequest as any).requestBody(requestBody);
    } else {
      (paypalRequest as any).body = requestBody;
    }

    const paypalResponse = await paypalClient.execute(paypalRequest);

    if (paypalResponse.statusCode !== 201 || !paypalResponse.result) {
      console.error('Error creando suscripción en PayPal:', paypalResponse);
      return NextResponse.json(
        { error: 'No se pudo crear la suscripción en PayPal.' },
        { status: 500 }
      );
    }

    const paypalSubscription = paypalResponse.result;

    // Crear suscripción en la base de datos
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + plan.duration_days);

    const { data: newSubscription, error: subError } = await adminClient
      .from('subscriptions')
      .insert({
        company_id: profile.company_id,
        plan_id: planId,
        status: 'trialing',
        paypal_subscription_id: paypalSubscription.id,
        paypal_plan_id: plan.paypal_plan_id,
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
        metadata: {
          paypal_subscription: hashSensitiveData(JSON.stringify(paypalSubscription)),
        },
      })
      .select()
      .single();

    if (subError) {
      console.error('Error guardando suscripción en BD:', subError);
      return NextResponse.json(
        { error: 'No se pudo guardar la suscripción.' },
        { status: 500 }
      );
    }

    // Retornar URL de aprobación de PayPal
    const approvalUrl = paypalSubscription.links?.find(
      (link: any) => link.rel === 'approve'
    )?.href;

    return NextResponse.json({
      subscription: newSubscription,
      approvalUrl: approvalUrl,
      message: 'Suscripción creada. Redirige al usuario a la URL de aprobación.',
    });
  } catch (error) {
    console.error('Error en POST /api/subscriptions/create:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}

