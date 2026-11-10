# KEUDE BLANG — Website Kasir

Website kasir sederhana dengan tema Coffee Brown + Gold, autentikasi admin, transaksi, struk cetak, ringkasan penjualan, dan database Cloudflare D1.

## Isi
- Frontend: HTML, CSS, JavaScript (tanpa proses build).
- Backend: Cloudflare Pages Functions (`functions/api/[[path]].js`).
- Database: Cloudflare D1 (`migrations/0001_init.sql`).
- PWA: manifest dan service worker untuk opsi instalasi ke layar utama Android.

## 1. Buat database D1
Di Cloudflare Dashboard:
1. Workers & Pages → D1 SQL Database → Create database.
2. Nama database: `keude-blang-db`.
3. Salin Database ID.
4. Ganti `GANTI_DENGAN_DATABASE_ID` di `wrangler.toml` dengan ID tersebut.
5. Buka database → Console → jalankan isi `migrations/0001_init.sql`.

## 2. Atur rahasia
Cloudflare Dashboard → Workers & Pages → keude-blang → Settings → Variables and Secrets:
- `ADMIN_PASSWORD` (Secret): buat kata sandi admin yang kuat.
- `SESSION_SECRET` (Secret): isi string acak panjang minimal 32 karakter.

Jangan masukkan password atau secret ke file frontend, GitHub, atau chat. Jika secret berubah, sesi login lama akan tidak berlaku.

## 3. Upload ke GitHub
1. Buat repository bernama `keude-blang`.
2. Upload semua isi folder ini ke root repository (termasuk folder `functions` dan `migrations`).
3. Pastikan `wrangler.toml` sudah berisi Database ID yang benar.

## 4. Deploy Cloudflare Pages
1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
2. Pilih repository `keude-blang`.
3. Framework preset: None.
4. Build command: kosongkan.
5. Build output directory: `/` atau `.` sesuai tampilan dashboard.
6. Deploy.
7. Di pengaturan proyek, pastikan binding D1 bernama `DB` terhubung ke database `keude-blang-db`.
8. Tambahkan dua secrets `ADMIN_PASSWORD` dan `SESSION_SECRET` pada environment Production. Tambahkan juga ke Preview bila ingin menguji preview.
9. Redeploy setelah binding dan secrets ditambahkan.

> Cloudflare Pages Functions memerlukan folder `functions` pada root project. Jangan mengunggah hanya file `index.html`.

## 5. Jalankan lokal (opsional)
Install Node.js dan Wrangler pada komputer:
```bash
npm install -g wrangler
wrangler pages dev .
```
Untuk pengujian lokal dengan D1, ikuti dokumentasi Wrangler D1 dan gunakan database lokal. Jangan memakai data transaksi produksi untuk percobaan.

## 6. Cara pakai di Android
1. Buka URL `https://NAMA-PROYEK.pages.dev` di Chrome Android.
2. Login menggunakan kata sandi admin yang sudah dibuat.
3. Tambahkan menu ke keranjang, isi uang diterima, lalu tekan Proses pembayaran.
4. Tekan Cetak struk; dari dialog Android/Chrome, pilih printer atau simpan sebagai PDF.
5. Untuk ikon aplikasi: menu Chrome ⋮ → Tambahkan ke layar utama / Install app (jika tersedia).

## Fitur yang tersedia
- Menu awal dan harga sesuai permintaan.
- Pencarian dan kategori.
- Keranjang, kuantitas, subtotal, pembayaran tunai dan kembalian.
- Validasi harga dilakukan kembali oleh server dari database.
- Simpan transaksi ke D1.
- Ringkasan penjualan hari ini dan 20 transaksi terakhir.
- Login admin dengan cookie HttpOnly + HMAC session.

## Catatan penting / batasan versi ini
- Menu awal disimpan di database. Perubahan harga/menu saat ini dilakukan melalui Cloudflare D1 Console; UI manajemen menu belum disertakan.
- Teh panas dibuat sebagai dua pilihan: kecil Rp3.000 dan besar Rp4.000. Sesuaikan bila maksud harga berbeda.
- “Tambahan kopi +Rp1.000” dibuat sebagai item terpisah bernama Tambahan Kopi agar tidak otomatis ditambahkan ke setiap kopi.
- PWA membantu akses seperti aplikasi, tetapi fitur kasir dan transaksi membutuhkan koneksi internet.
- Buat backup D1 secara berkala. Tambahkan role kasir, audit log, pembatasan akses, dan pengujian keamanan sebelum dipakai untuk operasional dengan banyak pegawai.
