V23 - PERBAIKAN KATALOG

Perbaikan:
1. Produk yang ditambahkan dari Dashboard Admin sekarang muncul di "Semua project".
2. Kategori tetap bisa dipilih walaupun category_id berupa UUID atau produk memakai type lama seperti remix.
3. Filter harga/jenis/genre lama tidak lagi bisa menyembunyikan produk.
4. Setiap kali sinkron dari Supabase, katalog kembali ke kategori "Semua" agar produk baru langsung terlihat.
5. preview_url tetap dipakai untuk audio dari Dashboard Admin.
6. Fitur hapus produk tetap tersedia.

Tidak perlu SQL tambahan untuk patch ini.
