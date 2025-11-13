-- 0002_add_display_name_to_companies.sql
-- Agregar columna display_name a companies si no existe

-- Agregar la columna display_name si no existe
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'companies'
      and column_name = 'display_name'
  ) then
    alter table public.companies
    add column display_name text;
    
    -- Actualizar display_name con el valor de name para registros existentes
    update public.companies
    set display_name = name
    where display_name is null;
    
    raise notice 'Columna display_name agregada a companies';
  else
    raise notice 'Columna display_name ya existe en companies';
  end if;
end $$;

