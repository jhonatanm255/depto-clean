-- 0003_add_profiles_delete_policy.sql
-- Agregar política RLS para DELETE en la tabla profiles
-- Solo owners y admins pueden eliminar empleadas de su compañía

drop policy if exists "profiles_delete_admin_owner" on public.profiles;
create policy "profiles_delete_admin_owner"
  on public.profiles
  for delete
  using (
    profiles.company_id = public.get_company_id_for_user(auth.uid())
    and public.get_role_for_user(auth.uid()) in ('owner', 'admin')
    and profiles.id != auth.uid() -- No se puede eliminar a uno mismo
  );






