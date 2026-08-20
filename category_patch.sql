-- FELIK FVNKY STORE - DYNAMIC CATEGORIES
-- Jalankan SEKALI di Supabase SQL Editor setelah patch sebelumnya.

create table if not exists public.categories (
  id text primary key,
  name text not null unique,
  icon text not null default '◈',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists "Public read active categories" on public.categories;
create policy "Public read active categories"
on public.categories
for select
to anon, authenticated
using (active = true or public.is_admin());

insert into public.categories (id,name,icon)
values
  ('remix','Remix','↯'),
  ('flp','FL Studio Project','◈')
on conflict (id) do nothing;

alter table public.products add column if not exists category_id text;

update public.products
set category_id = coalesce(nullif(category_id,''), type, 'remix')
where category_id is null or category_id = '';

create or replace function public.admin_create_category(
  p_id text,
  p_name text,
  p_icon text default '◈'
)
returns public.categories
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.categories;
begin
  if not public.is_admin() then
    raise exception 'Akses admin diperlukan.';
  end if;

  insert into public.categories(id,name,icon)
  values (
    lower(regexp_replace(trim(p_id),'[^a-zA-Z0-9]+','-','g')),
    trim(p_name),
    coalesce(nullif(trim(p_icon),''),'◈')
  )
  returning * into v;

  return v;
exception
  when unique_violation then
    raise exception 'Kategori dengan nama atau ID tersebut sudah ada.';
end;
$$;

grant execute on function public.admin_create_category(text,text,text) to authenticated;
