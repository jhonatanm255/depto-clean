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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: employeeId } = await params;

    if (!employeeId) {
      return NextResponse.json(
        { error: 'ID de empleada requerido.' },
        { status: 400 }
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

    // No permitir eliminar a uno mismo
    if (currentUserId === employeeId) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta.' },
        { status: 403 }
      );
    }

    // Usar admin client para verificar perfiles (bypassa RLS)
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
        { error: 'No tienes permisos para eliminar empleadas.' },
        { status: 403 }
      );
    }

    // Verificar que la empleada pertenece a la misma compañía usando admin client
    const { data: employeeProfile, error: employeeError } = await adminClient
      .from('profiles')
      .select('id, company_id, full_name, email')
      .eq('id', employeeId)
      .single();

    if (employeeError || !employeeProfile) {
      console.error('Error obteniendo perfil de la empleada:', employeeError);
      return NextResponse.json(
        { error: 'Empleada no encontrada.' },
        { status: 404 }
      );
    }

    if (employeeProfile.company_id !== currentProfile.company_id) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta empleada.' },
        { status: 403 }
      );
    }

    // Eliminar el perfil primero usando el admin client (bypassa RLS)
    // Luego intentar eliminar el usuario de auth.users
    console.log(`[API] Intentando eliminar empleada: ${employeeId}`);
    
    // Verificar que el admin client está disponible
    if (!adminClient) {
      console.error('[API] Admin client no está disponible');
      return NextResponse.json(
        { 
          error: 'Error de configuración: Admin client no disponible.',
          details: 'Verifica que SUPABASE_SERVICE_ROLE_KEY esté configurada correctamente.'
        },
        { status: 500 }
      );
    }

    // Paso 1: Eliminar o actualizar datos asociados primero
    console.log('[API] Eliminando tareas asociadas...');
    const { error: tasksDeleteError } = await adminClient
      .from('tasks')
      .delete()
      .eq('employee_id', employeeId)
      .eq('company_id', currentProfile.company_id);

    if (tasksDeleteError) {
      console.error('[API] Error eliminando tareas:', tasksDeleteError);
      // Continuar de todas formas, puede que no haya tareas
    } else {
      console.log('[API] Tareas eliminadas exitosamente');
    }

    // Actualizar departamentos asignados a esta empleada
    console.log('[API] Actualizando departamentos asignados...');
    const { error: deptUpdateError } = await adminClient
      .from('departments')
      .update({ assigned_to: null })
      .eq('assigned_to', employeeId)
      .eq('company_id', currentProfile.company_id);

    if (deptUpdateError) {
      console.error('[API] Error actualizando departamentos:', deptUpdateError);
      // Continuar de todas formas
    } else {
      console.log('[API] Departamentos actualizados exitosamente');
    }

    // Actualizar media_reports (poner employee_id en null en lugar de eliminar)
    console.log('[API] Actualizando media reports...');
    const { error: mediaUpdateError } = await adminClient
      .from('media_reports')
      .update({ employee_id: null })
      .eq('employee_id', employeeId)
      .eq('company_id', currentProfile.company_id);

    if (mediaUpdateError) {
      console.error('[API] Error actualizando media reports:', mediaUpdateError);
      // Continuar de todas formas
    } else {
      console.log('[API] Media reports actualizados exitosamente');
    }

    // Paso 2: Eliminar el perfil
    console.log('[API] Eliminando perfil...');
    const { error: profileDeleteError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', employeeId)
      .eq('company_id', currentProfile.company_id);

    if (profileDeleteError) {
      console.error('[API] Error eliminando perfil:', {
        message: profileDeleteError.message,
        code: profileDeleteError.code,
        details: profileDeleteError.details,
        hint: profileDeleteError.hint,
      });
      return NextResponse.json(
        { 
          error: 'No se pudo eliminar el perfil de la empleada.',
          details: profileDeleteError.message || profileDeleteError.details || 'Error desconocido',
        },
        { status: 500 }
      );
    }

    console.log('[API] Perfil eliminado exitosamente');

    // Paso 2: Intentar eliminar el usuario de auth.users
    // Si falla, el perfil ya está eliminado así que el usuario no podrá acceder
    console.log('[API] Intentando eliminar usuario de auth.users...');
    const { data: deleteData, error: deleteError } = await adminClient.auth.admin.deleteUser(employeeId);

    if (deleteError) {
      console.warn('[API] Advertencia: No se pudo eliminar el usuario de auth.users, pero el perfil ya fue eliminado:', {
        message: deleteError.message,
        status: deleteError.status,
        name: deleteError.name,
      });
      // No retornamos error aquí porque el perfil ya fue eliminado
      // El usuario no podrá acceder aunque quede en auth.users
    } else {
      console.log('[API] Usuario eliminado exitosamente de auth.users:', deleteData);
    }

    return NextResponse.json(
      {
        message: 'Empleada eliminada correctamente.',
        employeeName: employeeProfile.full_name || employeeProfile.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Error inesperado en /api/employees/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado al eliminar la empleada.';
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}

