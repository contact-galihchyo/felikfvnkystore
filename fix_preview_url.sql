-- Felik Fvnky Store - fix audio preview column
-- Jalankan SEKALI di Supabase SQL Editor.

alter table public.products
  add column if not exists preview_url text;

-- Pastikan kolom bisa menyimpan link MP3 tanpa mengubah data produk lain.
comment on column public.products.preview_url is 'URL preview audio MP3 untuk player website';
