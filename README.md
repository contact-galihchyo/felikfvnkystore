# Felik Fvnky Store Music Marketplace

Frontend marketplace untuk menjual:
- Remix
- FL Studio Project / FLP

## Cara menjalankan
1. Ekstrak folder.
2. Buka `index.html` di browser.
3. Tidak membutuhkan build tool untuk demo frontend ini.

## Fitur demo
- Search realtime
- Kategori
- Filter jenis dan harga
- Sorting
- Preview style dengan Web Audio API
- Product detail tanpa metadata BPM/Key/genre/lisensi
- Wishlist/favorite dengan localStorage
- Cart dengan localStorage
- Checkout modal
- Responsive desktop/mobile
- Mobile bottom navigation
- Seller CTA
- Footer informasi pemilik + Instagram/TikTok/WhatsApp/Email
- Empty state
- Toast notification
- Shortcut `/` untuk fokus pencarian

## Yang perlu dihubungkan untuk production
Frontend ini sengaja dibuat tanpa backend/payment agar mudah dikembangkan.

Rekomendasi arsitektur:
- Auth: Supabase Auth / Firebase Auth
- Database: PostgreSQL via Supabase
- Storage file audio/project: Supabase Storage atau S3/R2
- Payment Indonesia: Midtrans / Xendit
- Backend: Node.js/Express, Laravel, atau Supabase Edge Functions
- Email order: Resend / SMTP
- Anti-pembajakan: signed download URL + expiry
- Admin: dashboard untuk upload produk, harga, kategori, file, preview, lisensi, dan order

## Audio preview asli
Sekarang tombol preview membuat demo tone menggunakan Web Audio API. Untuk produksi, ubah data produk di `app.js` dan tambahkan:
`previewUrl: "https://domain-kamu.com/audio/preview.mp3"`

Lalu ganti fungsi `preview()` dengan elemen `<audio>` atau player custom yang membaca `previewUrl`.

## Data produk
Semua contoh produk ada di array `products` pada `app.js`.
Setiap produk memiliki:
id, title, creator, type, genre, price, rating, sales, bpm, key, date, featured, desc, license.

## Catatan pembayaran
Jangan pernah menyimpan status pembayaran hanya berdasarkan JavaScript frontend.
Di production:
1. Frontend membuat order ke backend.
2. Backend membuat transaction/payment.
3. Payment gateway mengirim webhook.
4. Backend memvalidasi signature/status.
5. Hanya order PAID yang diberi signed download URL.

### Social media placeholder
Link sosial di footer saat ini memakai contoh `@felix-store`. Ganti URL Instagram, TikTok, WhatsApp, dan email di `index.html` dengan akun asli kamu.

## Theme
Felik Fvnky Store memakai tema orange editorial/dark yang berbeda dari referensi awal.


## Flow Pesan Sekarang + WhatsApp

Tombol produk sekarang membuka halaman pembayaran terlebih dahulu. Setelah data pelanggan dan metode pembayaran diisi, tombol **Konfirmasi via WhatsApp** membuka WhatsApp dengan pesan otomatis berisi produk, harga, biaya layanan, total, dan data pelanggan.

Sebelum digunakan, ubah `PAYMENT_DETAILS.whatsapp` di `app.js` menjadi nomor WhatsApp toko yang sebenarnya. Detail rekening/e-wallet/QRIS juga dapat diubah di objek `PAYMENT_DETAILS`.
