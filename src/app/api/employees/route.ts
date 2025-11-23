import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validar variables de entorno
if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL no está definido');
}

if (!serviceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está definido');
}

// Crear cliente admin solo si tenemos las variables
const adminClient = supabaseUrl && serviceKey
  ? createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
      },
    })
  : null;

interface CreateEmployeePayload {
  name: string;
  email: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    // Validar variables de entorno
    if (!supabaseUrl || !supabaseAnonKey || !serviceKey || !adminClient) {
      console.error('❌ Variables de entorno no configuradas');
      return NextResponse.json(
        {
          error: 'Error de configuración del servidor. Por favor, contacta al administrador.',
          details: 'Variables de entorno no configuradas'
        },
        { status: 500 }
      );
    }

    // Obtener el token de autenticación desde el header Authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Crear cliente para verificar el token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });

    // Verificar el token y obtener el usuario
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Error verificando token:', userError);
      return NextResponse.json(
        { error: 'Token inválido o expirado.' },
        { status: 401 }
      );
    }

    const currentUserId = user.id;

    // Verificar que el usuario actual tiene permisos (owner o admin)
    const { data: currentProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, company_id, role')
      .eq('id', currentUserId)
      .single();

    if (profileError || !currentProfile) {
      console.error('Error obteniendo perfil del usuario actual:', profileError);
      return NextResponse.json(
        { error: 'No se pudo verificar tu perfil.' },
        { status: 403 }
      );
    }

    if (!['owner', 'admin'].includes(currentProfile.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear empleadas.' },
        { status: 403 }
      );
    }

    // Obtener los datos del cuerpo de la petición
    const body: CreateEmployeePayload = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: name, email y password son obligatorios.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Paso 1: Verificar si ya existe un perfil con este email en nuestra base de datos
    console.log(`[API] Verificando si el usuario ya existe: ${normalizedEmail}`);
    const { data: existingProfile, error: profileCheckError } = await adminClient
      .from('profiles')
      .select('id, email, company_id, role, full_name')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('[API] Error verificando perfil existente:', profileCheckError);
      return NextResponse.json(
        {
          error: 'Error al verificar si el usuario ya existe.',
          details: profileCheckError.message,
        },
        { status: 500 }
      );
    }

    if (existingProfile) {
      // El perfil ya existe
      if (existingProfile.company_id === currentProfile.company_id) {
        // Ya está en esta compañía
        return NextResponse.json(
          {
            error: `Ya existe un usuario con este correo en tu empresa (${existingProfile.full_name || existingProfile.email}).`,
            details: `El usuario tiene el rol: ${existingProfile.role}`,
          },
          { status: 409 }
        );
      } else {
        // Está en otra compañía
        return NextResponse.json(
          {
            error: 'Este correo electrónico ya está registrado en otra empresa.',
            details: 'Cada usuario solo puede pertenecer a una empresa. Si este es un empleado que trabaja en múltiples empresas, considera usar un correo diferente o contacta al administrador.',
          },
          { status: 409 }
        );
      }
    }

    // Paso 2: Crear el usuario en auth.users usando Admin API
    console.log(`[API] Creando usuario para empleada: ${normalizedEmail}`);
    const { data: createdUser, error: createUserError } =
      await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true, // Confirmar email automáticamente
        user_metadata: {
          full_name: name,
          company_id: currentProfile.company_id,
        },
      });

    if (createUserError || !createdUser?.user) {
      const alreadyExistsMessage =
        createUserError?.message?.toLowerCase().includes('already registered') ||
        createUserError?.message?.toLowerCase().includes('already exists');

      if (alreadyExistsMessage) {
        // El usuario existe en auth.users pero no tiene perfil en nuestra BD
        // Esto puede pasar si se registró pero no completó el proceso
        return NextResponse.json(
          {
            error: 'Este correo electrónico ya está registrado en el sistema de autenticación, pero no tiene un perfil asignado.',
            details: 'Esto puede ocurrir si el usuario se registró previamente pero no completó el proceso. Contacta al administrador para resolver esto.',
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error:
            createUserError?.message ??
            'No se pudo crear la cuenta de usuario.',
        },
        { status: 500 }
      );
    }

    const newUserId = createdUser.user.id;
    console.log(`[API] Usuario creado exitosamente: ${newUserId}`);

    // Paso 3: Crear el perfil en la tabla profiles
    console.log(`[API] Creando perfil para empleada: ${newUserId}`);
    const { data: profileData, error: profileInsertError } = await adminClient
      .from('profiles')
      .insert({
        id: newUserId,
        company_id: currentProfile.company_id,
        role: 'employee',
        full_name: name,
        email: normalizedEmail,
      })
      .select('*')
      .single();

    if (profileInsertError) {
      console.error('[API] Error creando perfil:', profileInsertError);
      
      // Si falla la creación del perfil, intentar eliminar el usuario creado
      try {
        await adminClient.auth.admin.deleteUser(newUserId);
        console.log('[API] Usuario eliminado después de fallar la creación del perfil');
      } catch (deleteError) {
        console.error('[API] Error eliminando usuario después de fallar creación del perfil:', deleteError);
      }

      // Verificar si es un error de foreign key
      if (profileInsertError.code === '23503') {
        return NextResponse.json(
          {
            error: 'Error de integridad: El usuario no se creó correctamente en el sistema de autenticación.',
            details: profileInsertError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: 'No se pudo crear el perfil de la empleada.',
          details: profileInsertError.message || profileInsertError.details || 'Error desconocido',
        },
        { status: 500 }
      );
    }

    console.log(`[API] Empleada creada exitosamente: ${profileData?.full_name || profileData?.email}`);

    return NextResponse.json(
      {
        message: 'Empleada creada exitosamente.',
        employee: profileData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Error inesperado en /api/employees:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado al crear la empleada.';
    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}

