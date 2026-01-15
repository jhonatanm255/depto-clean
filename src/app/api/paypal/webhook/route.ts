/**
 * Webhook handler de PayPal
 * 
 * CRÍTICO PARA SEGURIDAD:
 * - Verifica la firma de cada webhook para asegurar que viene de PayPal
 * - Procesa eventos de forma segura
 * - Registra todos los eventos para auditoría
 * - Maneja errores de forma segura sin exponer información sensible
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature, hashSensitiveData, sanitizePayPalData } from '@/lib/paypal';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Variables de entorno no configuradas');
}

const adminClient = supabaseUrl && serviceKey
  ? createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
      },
    })
  : null;

/**
 * POST /api/paypal/webhook
 * Maneja eventos de webhook de PayPal
 */
export async function POST(request: Request) {
  try {
    if (!adminClient) {
      console.error('❌ Admin client no disponible');
      return NextResponse.json(
        { error: 'Error de configuración del servidor.' },
        { status: 500 }
      );
    }

    if (!PAYPAL_WEBHOOK_ID) {
      console.error('❌ PAYPAL_WEBHOOK_ID no configurado');
      return NextResponse.json(
        { error: 'Error de configuración del servidor.' },
        { status: 500 }
      );
    }

    // Obtener el body como texto para verificación de firma
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);

    // Obtener headers necesarios para verificación
    const headers: Record<string, string | string[] | undefined> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    // VERIFICACIÓN CRÍTICA DE SEGURIDAD: Verificar firma del webhook
    const signature = headers['paypal-transmission-sig'] as string | undefined;
    const verified = await verifyWebhookSignature(
      headers,
      bodyText,
      PAYPAL_WEBHOOK_ID
    );

    // Registrar evento en la base de datos (incluso si no está verificado, para auditoría)
    const { data: webhookEvent, error: webhookError } = await adminClient
      .from('webhook_events')
      .insert({
        event_type: body.event_type || 'unknown',
        paypal_event_id: body.id || null,
        paypal_resource_type: body.resource_type || null,
        paypal_resource_id: body.resource?.id || null,
        payload: sanitizePayPalData(body),
        signature: signature ? hashSensitiveData(signature) : null,
        verified: verified,
        processed: false,
      })
      .select()
      .single();

    if (webhookError) {
      console.error('Error guardando webhook event:', webhookError);
    }

    // Si no está verificado, rechazar el webhook
    if (!verified) {
      console.error('❌ Webhook no verificado. Posible ataque o configuración incorrecta.');
      
      if (webhookEvent) {
        await adminClient
          .from('webhook_events')
          .update({
            processing_error: 'Firma no verificada',
            processed: true,
          })
          .eq('id', webhookEvent.id);
      }

      return NextResponse.json(
        { error: 'Firma no verificada.' },
        { status: 401 }
      );
    }

    // Procesar el evento según su tipo
    const eventType = body.event_type;
    const resource = body.resource;

    try {
      switch (eventType) {
        case 'BILLING.SUBSCRIPTION.CREATED':
          await handleSubscriptionCreated(resource, adminClient);
          break;

        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          await handleSubscriptionActivated(resource, adminClient);
          break;

        case 'BILLING.SUBSCRIPTION.CANCELLED':
          await handleSubscriptionCancelled(resource, adminClient);
          break;

        case 'BILLING.SUBSCRIPTION.EXPIRED':
          await handleSubscriptionExpired(resource, adminClient);
          break;

        case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
          await handlePaymentFailed(resource, adminClient);
          break;

        case 'PAYMENT.SALE.COMPLETED':
          await handlePaymentCompleted(resource, adminClient);
          break;

        case 'PAYMENT.CAPTURE.COMPLETED':
          await handlePaymentCaptureCompleted(resource, adminClient);
          break;

        default:
          console.log(`Evento no manejado: ${eventType}`);
      }

      // Marcar como procesado
      if (webhookEvent) {
        await adminClient
          .from('webhook_events')
          .update({
            processed: true,
          })
          .eq('id', webhookEvent.id);
      }

      return NextResponse.json({ received: true });
    } catch (processingError) {
      console.error('Error procesando webhook:', processingError);
      
      if (webhookEvent) {
        await adminClient
          .from('webhook_events')
          .update({
            processing_error: processingError instanceof Error ? processingError.message : 'Error desconocido',
            processed: true,
          })
          .eq('id', webhookEvent.id);
      }

      // Retornar 200 para que PayPal no reintente inmediatamente
      // Pero registrar el error para revisión manual
      return NextResponse.json(
        { received: true, error: 'Error procesando evento' },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error en POST /api/paypal/webhook:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}

/**
 * Manejar creación de suscripción
 */
async function handleSubscriptionCreated(resource: any, adminClient: any) {
  if (!resource?.id) return;

  const { data: subscription } = await adminClient
    .from('subscriptions')
    .select('*')
    .eq('paypal_subscription_id', resource.id)
    .single();

  if (subscription) {
    await adminClient
      .from('subscriptions')
      .update({
        status: 'trialing',
        metadata: {
          ...subscription.metadata,
          paypal_subscription_data: hashSensitiveData(JSON.stringify(resource)),
        },
      })
      .eq('id', subscription.id);
  }
}

/**
 * Manejar activación de suscripción
 */
async function handleSubscriptionActivated(resource: any, adminClient: any) {
  if (!resource?.id) return;

  const { data: subscription } = await adminClient
    .from('subscriptions')
    .select('*')
    .eq('paypal_subscription_id', resource.id)
    .single();

  if (subscription) {
    const billingInfo = resource.billing_info;
    const periodEnd = billingInfo?.next_billing_time 
      ? new Date(billingInfo.next_billing_time)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días por defecto

    await adminClient
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        cancelled_at: null,
      })
      .eq('id', subscription.id);
  }
}

/**
 * Manejar cancelación de suscripción
 */
async function handleSubscriptionCancelled(resource: any, adminClient: any) {
  if (!resource?.id) return;

  const { data: subscription } = await adminClient
    .from('subscriptions')
    .select('*')
    .eq('paypal_subscription_id', resource.id)
    .single();

  if (subscription) {
    await adminClient
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);
  }
}

/**
 * Manejar expiración de suscripción
 */
async function handleSubscriptionExpired(resource: any, adminClient: any) {
  if (!resource?.id) return;

  const { data: subscription } = await adminClient
    .from('subscriptions')
    .select('*')
    .eq('paypal_subscription_id', resource.id)
    .single();

  if (subscription) {
    await adminClient
      .from('subscriptions')
      .update({
        status: 'expired',
      })
      .eq('id', subscription.id);
  }
}

/**
 * Manejar pago fallido
 */
async function handlePaymentFailed(resource: any, adminClient: any) {
  if (!resource?.id) return;

  const { data: subscription } = await adminClient
    .from('subscriptions')
    .select('*')
    .eq('paypal_subscription_id', resource.id)
    .single();

  if (subscription) {
    await adminClient
      .from('subscriptions')
      .update({
        status: 'past_due',
      })
      .eq('id', subscription.id);
  }
}

/**
 * Manejar pago completado
 */
async function handlePaymentCompleted(resource: any, adminClient: any) {
  if (!resource?.id) return;

  // Buscar suscripción relacionada
  const { data: subscription } = await adminClient
    .from('subscriptions')
    .select('*')
    .eq('paypal_subscription_id', resource.billing_agreement_id || resource.subscription_id)
    .single();

  if (subscription) {
    // Crear registro de pago
    await adminClient
      .from('payments')
      .insert({
        subscription_id: subscription.id,
        company_id: subscription.company_id,
        paypal_order_id: resource.id,
        paypal_transaction_id: resource.id,
        amount_usd: parseFloat(resource.amount?.total || '0'),
        currency: resource.amount?.currency || 'USD',
        status: 'completed',
        payment_method: 'paypal',
        paypal_payer_id: resource.payer?.payer_info?.payer_id,
        paypal_payer_email: resource.payer?.payer_info?.email,
        payment_data_hash: hashSensitiveData(JSON.stringify(resource)),
        metadata: sanitizePayPalData(resource),
      });

    // Actualizar suscripción
    await adminClient
      .from('subscriptions')
      .update({
        status: 'active',
      })
      .eq('id', subscription.id);
  }
}

/**
 * Manejar captura de pago completada
 */
async function handlePaymentCaptureCompleted(resource: any, adminClient: any) {
  if (!resource?.id) return;

  // Similar a handlePaymentCompleted pero para capturas
  await handlePaymentCompleted(resource, adminClient);
}






