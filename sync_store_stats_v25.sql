-- Felik Fvnky Store v25 - sinkron statistik toko + creator produk
-- Jalankan SEKALI di Supabase SQL Editor.

drop function if exists public.get_store_stats_v2();

create or replace function public.get_store_stats_v2()
returns table (
  product_count bigint,
  creator_count bigint,
  order_count bigint,
  average_rating numeric
)
language sql
security definer
set search_path = public
stable
as $$
  select
    (select count(*)::bigint from public.products where active = true) as product_count,
    (select count(distinct nullif(trim(creator), ''))::bigint from public.products where active = true) as creator_count,
    (select count(*)::bigint from public.orders) as order_count,
    coalesce((select round(avg(rating)::numeric, 1) from public.reviews), 0)::numeric as average_rating;
$$;

grant execute on function public.get_store_stats_v2() to anon, authenticated;
