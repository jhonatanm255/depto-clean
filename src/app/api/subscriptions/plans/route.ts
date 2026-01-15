import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
}

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
  : null;

/**
 * GET /api/subscriptions/plans
 * Obtener todos los planes de suscripción disponibles
 */
export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor.' },
        { status: 500 }
      );
    }

    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_usd', { ascending: true });

    if (error) {
      console.error('Error obteniendo planes:', error);
      return NextResponse.json(
        { error: 'No se pudieron obtener los planes.' },
        { status: 500 }
      );
    }

    // Transformar datos para el frontend
    const formattedPlans = plans?.map(plan => ({
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      planType: plan.plan_type,
      priceUsd: parseFloat(plan.price_usd),
      durationDays: plan.duration_days,
      features: plan.features || [],
      isActive: plan.is_active,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at,
    })) || [];

    return NextResponse.json({ plans: formattedPlans });
  } catch (error) {
    console.error('Error en GET /api/subscriptions/plans:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}






