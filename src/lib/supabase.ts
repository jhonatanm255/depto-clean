
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validar que las variables estén configuradas
// En Vercel, estas variables deben estar en Settings → Environment Variables
if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  const errorMessage = `Faltan variables de entorno: ${missing.join(', ')}. ` +
    `Por favor, configura estas variables en Vercel (Settings → Environment Variables). ` +
    `Ver VERCEL_DEPLOY.md para más detalles.`;
  
  // Lanzar error solo en tiempo de ejecución, no durante el build
  // En Vercel, las variables están disponibles durante el build
  if (typeof window !== 'undefined') {
    console.error('❌', errorMessage);
  } else {
    // En el servidor, lanzar error para que falle claramente
    throw new Error(errorMessage);
  }
}

// Validar formato de URL antes de crear el cliente
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida (debe empezar con http:// o https://)');
  console.error('   Valor actual:', supabaseUrl);
}

// Crear el cliente de Supabase con configuración optimizada
// Si las variables no están disponibles, se creará un cliente que fallará claramente
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true, // SIEMPRE true, Supabase maneja el check de window
      autoRefreshToken: true,
      detectSessionInUrl: false, // Desactivar para evitar problemas
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-auth-token',
      flowType: 'pkce',
    },
    db: {
      schema: 'public',
    },
  }
);

// Logging para debug (solo en desarrollo)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Verificar que la sesión se guarda correctamente
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('[Supabase Client] Auth state changed:', event);
    if (session) {
      console.log('[Supabase Client] Sesión activa, usuario:', session.user.email);
      // Verificar que se guardó en localStorage
      const stored = localStorage.getItem('sb-auth-token');
      console.log('[Supabase Client] Sesión en localStorage:', stored ? 'SÍ' : 'NO');
    } else {
      console.log('[Supabase Client] Sin sesión');
    }
  });
}

export const SUPABASE_MEDIA_BUCKET = 'media-files';

