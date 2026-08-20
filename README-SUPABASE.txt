FELIK FVNKY STORE - UPDATE SUPABASE

Yang sudah dipasang di versi ini:
- Supabase URL + publishable/anon key di supabase-config.js
- Login admin dari ikon profil memakai Supabase Auth
- Akun harus terdaftar di public.admin_users agar bisa masuk dashboard
- Dashboard admin memakai data Supabase
- Produk remix bisa ditambah dari dashboard
- Checkout membuat order melalui RPC create_order (bukan insert langsung)
- Kode pesanan dibuat oleh database
- Status order/pembayaran dipisahkan
- Rating hanya bisa dikirim lewat RPC submit_review setelah order completed
- Website mencoba membaca produk aktif dari Supabase
- Jumlah terjual dibaca dari RPC get_product_sales

LANGKAH SUPABASE YANG MASIH HARUS DILAKUKAN
1. Buka Supabase > SQL Editor.
2. Jalankan isi file patch_supabase.sql satu kali.
3. Pastikan tidak ada error.
4. Setelah itu upload seluruh isi folder website ini ke hosting/static hosting kamu.

CATATAN KEAMANAN
- Key di supabase-config.js adalah anon/publishable key dan memang boleh berada di frontend.
- Jangan pernah memasukkan service_role/secret key ke website.
- Password admin tetap hanya di Supabase Auth.


TROUBLESHOOTING LOGIN
If the login popup says "Supabase belum terhubung", the Supabase JavaScript library did not load.
Use this version with internet enabled and hard-refresh the page (Ctrl+Shift+R). The page now has a fallback CDN.
Do not open the old ZIP/folder by mistake; use this v4 folder.


## Jika muncul error preview_url
Jalankan file `fix_preview_url.sql` sekali di Supabase SQL Editor. Ini aman untuk database yang sudah ada karena memakai `ADD COLUMN IF NOT EXISTS`.
