-- 0004_add_get_my_profile_function.sql
-- Crear función RPC optimizada para obtener el perfil del usuario actual
-- Esta función usa SECURITY DEFINER para evitar problemas con RLS y hacer la consulta más rápida

drop function if exists public.get_my_profile();

create or replace function public.get_my_profile()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  user_profile json;
begin
  -- Consulta directa sin RLS, pero solo para el usuario autenticado actual
  select to_json(p.*) into user_profile
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
  
  return user_profile;
end;
$$;

-- Dar permisos de ejecución a usuarios autenticados
grant execute on function public.get_my_profile() to authenticated;

