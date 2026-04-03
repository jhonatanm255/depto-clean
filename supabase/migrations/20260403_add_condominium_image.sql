-- Add image_url column to condominiums table
alter table public.condominiums
add column if not exists image_url text;
