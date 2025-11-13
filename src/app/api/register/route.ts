import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL no está definido');
}

if (!serviceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY no está definido. Debe configurarse en el entorno del servidor.');
}

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
  },
});

interface RegisterPayload {
  companyName: string;
  companySlug?: string | null;
  fullName: string;
  email: string;
  password: string;
}

export async function POST(request: Request) {
  try {
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

