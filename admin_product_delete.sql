-- FELIK FVNKY STORE - HAPUS PRODUK DARI DASHBOARD ADMIN
-- Jalankan SEKALI di Supabase SQL Editor.
-- Tidak perlu menjalankan supabase.sql lagi.

create or replace function public.admin_delete_product(
  p_product_id bigint
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Akses admin diperlukan.';
  end if;

  delete from public.products
  where id = p_product_id;

  if not found then
    raise exception 'Produk tidak ditemukan.';
  end if;

  return true;
end;
$$;

grant execute on function public.admin_delete_product(bigint) to authenticated;
