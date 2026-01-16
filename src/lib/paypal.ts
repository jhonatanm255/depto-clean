/**
 * Utilidades de PayPal
 * 
 * Funciones para interactuar con la API de PayPal:
 * - Crear cliente de PayPal
 * - Verificar firmas de webhooks
 * - Hashear datos sensibles
 * - Sanitizar datos de PayPal
 * - Validar montos
 * - Cancelar suscripciones
 */

import { Client, Environment } from '@paypal/paypal-server-sdk';
import crypto from 'crypto';

/**
 * Crea un cliente de PayPal configurado
 */
export function createPayPalClient(): Client {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const environment = process.env.PAYPAL_ENV || 'sandbox';

  if (!clientId || !clientSecret) {
    throw new Error('PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET deben estar configurados en las variables de entorno');
  }

  return new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: clientId,
      oAuthClientSecret: clientSecret,
    },
    environment: environment === 'live' ? Environment.Production : Environment.Sandbox,
  });
}

/**
 * Verifica la firma de un webhook de PayPal
 * 
 * Nota: El SDK v2.1.0 no incluye un método directo para verificar webhooks,
 * por lo que usamos la API REST directamente.
 * 
 * @param headers Headers del request
 * @param bodyText Body del request como texto (sin parsear)
 * @param webhookId ID del webhook configurado en PayPal
 * @returns true si la firma es válida, false en caso contrario
 */
export async function verifyWebhookSignature(
  headers: Record<string, string | string[] | undefined>,
  bodyText: string,
  webhookId: string
): Promise<boolean> {
  try {
    const transmissionId = headers['paypal-transmission-id'] as string | undefined;
    const transmissionTime = headers['paypal-transmission-time'] as string | undefined;
    const certUrl = headers['paypal-cert-url'] as string | undefined;
    const authAlgo = headers['paypal-auth-algo'] as string | undefined;
    const transmissionSig = headers['paypal-transmission-sig'] as string | undefined;

    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
      console.error('❌ Faltan headers necesarios para verificar webhook');
      return false;
    }

    // Parsear el body para obtener el webhook event
    let webhookEvent: any;
    try {
      webhookEvent = JSON.parse(bodyText);
    } catch (error) {
      console.error('❌ Error parseando body del webhook:', error);
      return false;
    }

    // Obtener token de acceso
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const environment = process.env.PAYPAL_ENV || 'sandbox';
    const apiUrl = environment === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    if (!clientId || !clientSecret) {
      console.error('❌ PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET deben estar configurados');
      return false;
    }

    // Obtener access token
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenResponse = await fetch(`${apiUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      console.error('❌ Error obteniendo access token de PayPal');
      return false;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Verificar firma del webhook
    const verifyResponse = await fetch(`${apiUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_event: webhookEvent,
      }),
    });

    if (!verifyResponse.ok) {
      console.error('❌ Error verificando firma del webhook');
      return false;
    }

    const verifyData = await verifyResponse.json();
    return verifyData.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('❌ Error verificando firma de webhook:', error);
    return false;
  }
}

/**
 * Hashea datos sensibles usando SHA-256
 * 
 * @param data Datos a hashear
 * @returns Hash hexadecimal de los datos
 */
export function hashSensitiveData(data: string): string {
  if (!data) return '';
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Sanitiza datos de PayPal removiendo información sensible
 * 
 * @param data Datos de PayPal a sanitizar
 * @returns Datos sanitizados
 */
export function sanitizePayPalData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizePayPalData(item));
  }

  const sanitized: any = {};
  const sensitiveKeys = [
    'access_token',
    'refresh_token',
    'client_secret',
    'payer_id',
    'payer_email',
    'email_address',
    'phone',
    'card_number',
    'cvv',
    'expiry',
    'billing_address',
    'shipping_address',
  ];

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    // Si es una clave sensible, hashearla
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = typeof value === 'string' 
        ? hashSensitiveData(value) 
        : hashSensitiveData(JSON.stringify(value));
    } else if (typeof value === 'object' && value !== null) {
      // Recursivamente sanitizar objetos anidados
      sanitized[key] = sanitizePayPalData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Valida que un monto sea válido para PayPal
 * 
 * @param amount Monto a validar
 * @returns true si el monto es válido
 */
export function validateAmount(amount: number): boolean {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return false;
  }

  // PayPal requiere montos positivos
  if (amount <= 0) {
    return false;
  }

  // PayPal tiene un límite máximo (ajustar según necesidad)
  if (amount > 1000000) {
    return false;
  }

  // PayPal permite hasta 2 decimales
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return false;
  }

  return true;
}

/**
 * Cancela una suscripción de PayPal
 * 
 * @param subscriptionId ID de la suscripción de PayPal
 * @param reason Razón de la cancelación
 * @returns true si se canceló exitosamente, false en caso contrario
 */
export async function cancelPayPalSubscription(
  subscriptionId: string,
  reason: string = 'Cancelado por el usuario'
): Promise<boolean> {
  try {
    if (!subscriptionId) {
      console.error('❌ subscriptionId es requerido');
      return false;
    }

    const paypalClient = createPayPalClient();

    // Cancelar suscripción usando el controlador
    const response = await paypalClient.subscriptionsController.cancelSubscription({
      id: subscriptionId,
      body: {
        reason: reason,
      },
    });

    // PayPal retorna 204 (No Content) en caso de éxito
    return response.statusCode === 204 || response.statusCode === 200;
  } catch (error) {
    console.error('❌ Error cancelando suscripción de PayPal:', error);
    return false;
  }
}
