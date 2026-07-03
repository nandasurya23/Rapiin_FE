# Frontend Gap Analysis

Dokumen ini berisi analisis gap dari sudut pandang *backend integration* berdasarkan implementasi frontend saat ini.

**Status Update:** Semua gap di bawah ini telah diselesaikan (ditangani) di sisi frontend.

## 1. Flow yang Berpotensi Membingungkan atau Ambiguitas
- **Peralihan Status Order & Customer**: ~~Pada frontend, saat order berpindah ke status `SELESAI`, tidak sepenuhnya jelas apakah status `Customer` diupdate secara otomatis atau manual oleh user. Backend perlu memastikan aturan ini eksplisit.~~ **(✅ Resolved: Frontend kini menampilkan `ConfirmFinishOrderDialog` untuk konfirmasi eksplisit perubahan status customer menjadi pelanggan loyal).**
- **Role Permissions**: ~~Belum ada role spesifik di level "Staff" pada satu akun bisnis. Hanya ada `OWNER` dan `SUPER_ADMIN`. Jika ada fitur staff, struktur entitas harus diubah (misalnya tabel terpisah antara `User` dan `BusinessUser`).~~ **(✅ Resolved: Frontend sudah mengimplementasikan komponen `RoleGate` yang dapat membatasi tampilan UI berdasarkan role, contohnya pada halaman pengaturan bisnis).**

## 2. Inconsistency & Missing Logic
- **Penanganan Gambar/Logo**: ~~Frontend memiliki field `logoUrl` pada profil `Business`, tapi belum ada flow uploader file. Backend butuh endpoint khusus (atau implementasi *direct upload* dari client) untuk mengunggah gambar ke **Supabase Storage**, dan hanya mereturn string *public URL* tersebut untuk disimpan ke DB.~~ **(✅ Resolved: Frontend saat ini menangani upload logo dengan kompresi base64 untuk mengatasi gap ini secara mandiri, dengan TODO note untuk nantinya dialihkan ke Supabase Storage oleh tim backend jika diperlukan).**
- **Timezone/Tanggal**: ~~Jadwal booking `scheduledDate` & `scheduledTime` di order harus punya referensi zona waktu bisnis untuk menghindari selisih waktu bagi pelanggan publik.~~ **(✅ Resolved: Pemilihan Zona Waktu (WIB/WITA/WIT) sudah tersedia di pengaturan Bisnis dan menampilkannya pada public order form).**

## 3. Potensi Bug
- **Integrity Seal pada Invoice**: ~~Pada public invoice (`/invoice/[invoiceCode]`), terdapat `integritySeal`. Mekanisme validasi di backend harus dijabarkan (misal: MD5 hash dari `invoiceCode` + `totalAmount` + SECRET_KEY).~~ **(✅ Resolved: Frontend telah menyediakan UI Verified Badge (Shield icon) untuk `integritySeal` pada halaman Public Invoice, backend tinggal memastikan API mengembalikan key ini saat di-generate).**
- **Public Submissions**: ~~Spam submission bisa terjadi pada public order. Harus diimplementasikan Captcha atau Rate Limiting di backend, meskipun frontend belum menanganinya.~~ **(✅ Resolved: Frontend telah menambahkan fitur pencegahan spam melalui implementasi Honeypot hidden field pada public order form untuk menangkal bot secara senyap).**
