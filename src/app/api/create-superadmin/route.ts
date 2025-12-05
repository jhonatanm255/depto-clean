import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Variables de entorno no configuradas para crear superadmin');
}

const adminClient = supabaseUrl && serviceKey
  ? createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
      },
    })
  : null;

/**
 * Endpoint para crear el usuario superadmin
 * NOTA: En producción, deberías proteger este endpoint con autenticación adicional
 * o ejecutarlo manualmente desde el servidor
 */
export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !serviceKey || !adminClient) {
      return NextResponse.json(
        { 
          error: 'Error de configuración del servidor.',
          details: 'Variables de entorno no configuradas'
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, password, fullName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Se requieren email y contraseña.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Crear usuario en auth.users
    console.log(`[API] Creando usuario superadmin: ${normalizedEmail}`);
    const { data: createdUser, error: createUserError } =
      await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || 'Super Admin',
        },
      });

    if (createUserError || !createdUser?.user) {
      const alreadyExistsMessage =
        createUserError?.message?.toLowerCase().includes('already registered') ||
        createUserError?.message?.toLowerCase().includes('user already registered');

      return NextResponse.json(
        {
          error: createUserError?.message ?? 'No se pudo crear el usuario superadmin.',
          details: alreadyExistsMessage ? 'El usuario ya existe. Puedes actualizar su perfil a superadmin manualmente.' : undefined,
        },
        { status: alreadyExistsMessage ? 409 : 500 }
      );
    }

    const userId = createdUser.user.id;

    // 2. Crear perfil de superadmin usando la función RPC
    console.log(`[API] Creando perfil superadmin para usuario: ${userId}`);
    const { error: rpcError } = await adminClient.rpc('create_superadmin_profile', {
      auth_user_id: userId,
      user_full_name: fullName || 'Super Admin',
      user_email: normalizedEmail,
    });

    if (rpcError) {
      // Si falla la creación del perfil, eliminar el usuario de auth
      await adminClient.auth.admin.deleteUser(userId);
      console.error('[API] Error creando perfil superadmin:', rpcError);
      return NextResponse.json(
        { 
          error: 'No se pudo crear el perfil superadmin.',
          details: rpcError.message 
        },
        { status: 500 }
      );
    }

    console.log(`[API] ✓ Superadmin creado exitosamente: ${normalizedEmail}`);

    return NextResponse.json(
      {
        userId,
        email: normalizedEmail,
        message: 'Superadmin creado exitosamente.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en /api/create-superadmin:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error inesperado al crear el superadmin.' },
      { status: 500 }
    );
  }
}









