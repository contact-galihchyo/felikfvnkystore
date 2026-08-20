-- FELIK FVNKY STORE - PATCH SUPABASE V2
-- Untuk database dasar yang SUDAH dibuat dari supabase.sql sebelumnya.
-- Jalankan file ini SEKALI.
-- Jangan jalankan supabase.sql lagi.

create extension if not exists pgcrypto;

-- =========================================================
-- 1. Pastikan RLS aktif
-- =========================================================
alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;

-- =========================================================
-- 2. Cek admin
-- =========================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- =========================================================
-- 3. Buat pesanan
-- Harga diambil langsung dari products.
-- Pesanan awal: waiting_payment / pending.
-- =========================================================
drop function if exists public.create_order(bigint,text,text,text,text,text,text);

create or replace function public.create_order(
  p_product_id bigint,
  p_customer_name text,
  p_customer_phone text,
  p_song_title text,
  p_initials text default null,
  p_payment_method text default 'DANA',
  p_note text default null
)
returns table (
  order_id bigint,
  order_code text,
  total bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_order_id bigint;
  v_order_code text;
begin
  if nullif(trim(p_customer_name), '') is null then
    raise exception 'Nama wajib diisi.';
  end if;

  if nullif(trim(p_customer_phone), '') is null then
    raise exception 'Nomor WhatsApp wajib diisi.';
  end if;

  if nullif(trim(p_song_title), '') is null then
    raise exception 'Judul lagu wajib diisi.';
  end if;

  select *
  into v_product
  from public.products
  where id = p_product_id
    and active = true
    and type = 'remix';

  if not found then
    raise exception 'Produk tidak ditemukan atau tidak aktif.';
  end if;

  insert into public.orders (
    customer_name,
    customer_phone,
    song_title,
    initials,
    payment_method,
    subtotal,
    total,
    payment_status,
    order_status,
    note
  )
  values (
    trim(p_customer_name),
    trim(p_customer_phone),
    trim(p_song_title),
    nullif(trim(p_initials), ''),
    coalesce(nullif(trim(p_payment_method), ''), 'DANA'),
    v_product.price,
    v_product.price,
    'pending',
    'waiting_payment',
    nullif(trim(p_note), '')
  )
  returning id, orders.order_code
  into v_order_id, v_order_code;

  insert into public.order_items (
    order_id,
    product_id,
    product_title,
    product_price
  )
  values (
    v_order_id,
    v_product.id,
    v_product.title,
    v_product.price
  );

  return query
  select v_order_id, v_order_code, v_product.price;
end;
$$;

grant execute on function public.create_order(bigint,text,text,text,text,text,text)
to anon, authenticated;

-- =========================================================
-- 4. Cek pesanan berdasarkan kode
-- Tidak menampilkan nomor WhatsApp ke user.
-- =================================================
drop function if exists public.get_order_status(text);

create or replace function public.get_order_status(
  p_order_code text
)
returns table (
  order_code text,
  product_title text,
  song_title text,
  initials text,
  total bigint,
  payment_status text,
  order_status text,
  created_at timestamptz,
  updated_at timestamptz,
  has_review boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    o.order_code,
    oi.product_title,
    o.song_title,
    o.initials,
    o.total,
    o.payment_status,
    o.order_status,
    o.created_at,
    o.updated_at,
    exists (
      select 1
      from public.reviews r
      where r.order_id = o.id
    ) as has_review
  from public.orders o
  left join lateral (
    select product_title
    from public.order_items
    where order_id = o.id
    order by id
    limit 1
  ) oi on true
  where upper(o.order_code) = upper(trim(p_order_code))
  limit 1;
$$;

grant execute on function public.get_order_status(text)
to anon, authenticated;

-- =========================================================
-- 5. Jumlah terjual per produk
-- HANYA payment_status = paid yang dihitung.
-- =================================================
drop function if exists public.get_product_sales();

create or replace function public.get_product_sales()
returns table (
  product_id bigint,
  sold_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    oi.product_id,
    count(*)::bigint as sold_count
  from public.order_items oi
  join public.orders o
    on o.id = oi.order_id
  where oi.product_id is not null
    and o.payment_status = 'paid'
  group by oi.product_id;
$$;

grant execute on function public.get_product_sales()
to anon, authenticated;

-- =========================================================
-- 6. Statistik toko untuk halaman utama
-- Produk = produk aktif
-- Creator = creator unik dari produk aktif
-- Orders = seluruh pesanan yang tercatat
-- Rating = rata-rata semua rating yang masuk
-- =========================================================
drop function if exists public.get_store_stats();

create or replace function public.get_store_stats()
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
    (select count(*)::bigint
       from public.products
      where active = true) as product_count,
    (select count(distinct nullif(trim(creator), ''))::bigint
       from public.products
      where active = true) as creator_count,
    (select count(*)::bigint
       from public.orders) as order_count,
    coalesce((select round(avg(rating)::numeric, 1)
                from public.reviews), 0)::numeric as average_rating;
$$;

grant execute on function public.get_store_stats()
to anon, authenticated;

-- =========================================================
-- 7. Rating hanya setelah order selesai, satu kali per order
-- =========================================================
drop function if exists public.submit_review(text,integer,text);

create or replace function public.submit_review(
  p_order_code text,
  p_rating integer,
  p_review text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_product_id bigint;
  v_review_id bigint;
begin
  if p_rating < 1 or p_rating > 5 then
    raise exception 'Rating harus antara 1 sampai 5.';
  end if;

  select *
  into v_order
  from public.orders
  where upper(order_code) = upper(trim(p_order_code))
  limit 1;

  if not found then
    raise exception 'Pesanan tidak ditemukan.';
  end if;

  if v_order.order_status <> 'completed' then
    raise exception 'Rating hanya bisa diberikan setelah pesanan selesai.';
  end if;

  if exists (
    select 1
    from public.reviews
    where order_id = v_order.id
  ) then
    raise exception 'Pesanan ini sudah diberi rating.';
  end if;

  select product_id
  into v_product_id
  from public.order_items
  where order_id = v_order.id
  order by id
  limit 1;

  insert into public.reviews (
    order_id,
    product_id,
    rating,
    review
  )
  values (
    v_order.id,
    v_product_id,
    p_rating,
    nullif(trim(p_review), '')
  )
  returning id into v_review_id;

  return v_review_id;
end;
$$;

grant execute on function public.submit_review(text,integer,text)
to anon, authenticated;

-- =========================================================
-- 7. Policy publik untuk produk aktif & rating approved
-- =========================================================
drop policy if exists "Public read active products" on public.products;
create policy "Public read active products"
on public.products
for select
to anon, authenticated
using (active = true or public.is_admin());

drop policy if exists "Public read approved reviews" on public.reviews;
create policy "Public read approved reviews"
on public.reviews
for select
to anon, authenticated
using (approved = true or public.is_admin());

-- =========================================================
-- SELESAI
-- =========================================================
