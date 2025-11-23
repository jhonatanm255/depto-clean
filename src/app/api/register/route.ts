import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validar variables de entorno al iniciar el módulo
// Esto causará un error claro durante el build si faltan las variables
if (!supabaseUrl) {
  const error = 'NEXT_PUBLIC_SUPABASE_URL no está definido. Configúrala en Vercel (Settings → Environment Variables)';
  console.error('❌', error);
  // No lanzar error aquí para permitir que el build continúe
  // El error se manejará en la función POST
}

if (!serviceKey) {
  const error = 'SUPABASE_SERVICE_ROLE_KEY no está definido. Configúrala en Vercel (Settings → Environment Variables)';
  console.error('❌', error);
  // No lanzar error aquí para permitir que el build continúe
  // El error se manejará en la función POST
}

// Crear cliente solo si tenemos las variables
// Si no, se manejará el error en la función POST
const adminClient = supabaseUrl && serviceKey
  ? createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
      },
    })
  : null;

interface RegisterPayload {
  companyName: string;
  companySlug?: string | null;
  fullName: string;
  email: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    // Validar variables de entorno al inicio de la función
    if (!supabaseUrl) {
      console.error('❌ NEXT_PUBLIC_SUPABASE_URL no está configurada');
      return NextResponse.json(
        { 
          error: 'Error de configuración del servidor. Por favor, contacta al administrador.',
          details: 'NEXT_PUBLIC_SUPABASE_URL no está configurada en Vercel'
        },
        { status: 500 }
      );
    }

    if (!serviceKey || !adminClient) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurada');
      return NextResponse.json(
        { 
          error: 'Error de configuración del servidor. Por favor, contacta al administrador.',
          details: 'SUPABASE_SERVICE_ROLE_KEY no está configurada en Vercel'
        },
        { status: 500 }
      );
    }

    const body: RegisterPayload = await request.json();
    const { companyName, companySlug, fullName, email, password } = body;

    if (!companyName || !fullName || !email || !password) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: createdUser, error: createUserError } =
      await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

    if (createUserError || !createdUser?.user) {
      const alreadyExistsMessage =
        createUserError?.message?.toLowerCase().includes('already registered');

      return NextResponse.json(
        {
          error:
            createUserError?.message ??
            'No se pudo crear la cuenta de usuario.',
        },
        { status: alreadyExistsMessage ? 409 : 500 }
      );
    }

    const userId = createdUser.user.id;

    const { error: rpcError } = await adminClient.rpc(
      'register_company_owner',
      {
        company_name: companyName,
        company_slug: companySlug ?? null,
        user_id: userId,
        user_email: normalizedEmail,
        user_full_name: fullName,
      }
    );

    if (rpcError) {
      await adminClient.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: rpcError.message ?? 'No se pudo crear la empresa.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        userId,
        email: normalizedEmail,
        message: 'Cuenta creada con éxito.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en /api/register:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error inesperado al crear la cuenta.' },
      { status: 500 }
    );
  }
}

