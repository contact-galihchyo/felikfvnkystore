-- FELIK FVNKY STORE - HAPUS KATEGORI
-- Jalankan SEKALI di Supabase SQL Editor.
-- Kategori hanya dapat dihapus jika belum dipakai oleh produk.

create or replace function public.admin_delete_category(
  p_category_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count bigint;
begin
  if not public.is_admin() then
    raise exception 'Akses admin diperlukan.';
  end if;

  select count(*) into v_count
  from public.products
  where category_id = p_category_id
    and active = true;

  if v_count > 0 then
    raise exception 'Kategori masih dipakai oleh % produk. Hapus atau pindahkan produk tersebut terlebih dahulu.', v_count;
  end if;

  delete from public.categories
  where id = p_category_id;

  if not found then
    raise exception 'Kategori tidak ditemukan.';
  end if;
end;
$$;

grant execute on function public.admin_delete_category(text) to authenticated;
