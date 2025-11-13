create or replace function public.register_company_owner (
  company_name text,
  company_slug text,
  user_id uuid,
  user_email text,
  user_full_name text
)
returns void
language plpgsql
security definer
as $$
declare
  base_slug text := lower(regexp_replace(coalesce(company_slug, ''), '[^a-z0-9]+', '-', 'g'));
  slug_candidate text;
  slug_in_use text;
  counter integer := 1;
  new_company_id uuid;
begin
  perform set_config('jwt.claims.role', 'service_role', true);

  if base_slug is null or base_slug = '' then
    base_slug := lower(regexp_replace(company_name, '[^a-z0-9]+', '-', 'g'));
  end if;

  if base_slug = '' then
    base_slug := 'company';
  end if;

  slug_candidate := base_slug;
  select slug into slug_in_use from public.companies where slug = slug_candidate;
  while slug_in_use is not null loop
    counter := counter + 1;
    slug_candidate := base_slug || '-' || counter::text;
    select slug into slug_in_use from public.companies where slug = slug_candidate;
  end loop;

  insert into public.companies (id, name, slug, metadata, display_name)
  values (
    gen_random_uuid(),
    company_name,
    slug_candidate,
    jsonb_build_object('created_via', 'self_service'),
    company_name
  )
  returning id into new_company_id;

  insert into public.profiles (id, company_id, role, full_name, email)
  values (
    user_id,
    new_company_id,
    'owner',
    user_full_name,
    user_email
  )
  on conflict (id) do update set
    company_id = excluded.company_id,
    role = excluded.role,
    full_name = excluded.full_name,
    email = excluded.email,
    updated_at = now();
end;
$$;
