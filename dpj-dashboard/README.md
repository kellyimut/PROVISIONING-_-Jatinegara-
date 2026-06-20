# DASHBOARD PROVISIONING — Jatinegara

Dashboard pengawasan provisioning **LIVE** untuk STO Jatinegara. Data diambil langsung
dari Google Spreadsheet, kode dikelola di GitHub, dan dijalankan (hosting) di Vercel.

Dibangun dengan Next.js — auto-refresh setiap 30 detik, 4 pilihan tema (Dark / Light /
Terang / Gold), KPI RE/PS otomatis, produktivitas teknisi live, dan tabel detail order
lengkap dengan pencarian + ekspor CSV.

---

## 1. Siapkan Spreadsheet

Dashboard ini membaca data **tanpa API key**, sehingga spreadsheet sumber **wajib**
dibagikan dengan akses publik baca-saja:

1. Buka spreadsheet sumber → klik **Bagikan / Share** (kanan atas).
2. Ubah akses menjadi **"Anyone with the link" → Viewer** (Siapa pun yang memiliki
   tautan ini → Pelihat).
3. Pastikan baris pertama pada sheet berisi **nama header kolom** persis seperti data
   Anda (Tanggal Setting, Tanggal Order BIMA, Workorder PSB, dst).
4. Jika data ada di tab **selain tab pertama**, buka tab tersebut lalu lihat URL-nya:
   `...edit#gid=123456789` → catat angka `gid` itu untuk langkah konfigurasi env di
   bawah.

> Sheet ID pada link yang Anda berikan sudah saya pasang sebagai default:
> `1OrlF3MSls5P9IPRcx3yHgFgWRVlAQPMzkgDSlvlMpEk`

---

## 2. Coba jalankan di komputer (opsional)

```bash
npm install
cp .env.example .env.local
# (sunting .env.local jika perlu mengganti GOOGLE_SHEET_GID dll)
npm run dev
```

Buka `http://localhost:3000`.

---

## 3. Unggah ke GitHub

```bash
cd dpj-dashboard
git init
git add .
git commit -m "Dashboard Provisioning - Jatinegara"
```

Buat repository baru (kosong) di github.com, lalu:

```bash
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

---

## 4. Deploy ke Vercel

1. Login ke [vercel.com](https://vercel.com) → **Add New → Project**.
2. Pilih repository GitHub yang baru di-push.
3. Vercel otomatis mendeteksi Next.js — biarkan setting default (Build Command
   `next build`, Output otomatis).
4. Sebelum klik Deploy, buka **Environment Variables** dan isi (boleh salin dari
   `.env.example`):

   | Key                                 | Value contoh                                   |
   |--------------------------------------|------------------------------------------------|
   | `GOOGLE_SHEET_ID`                    | `1OrlF3MSls5P9IPRcx3yHgFgWRVlAQPMzkgDSlvlMpEk`  |
   | `GOOGLE_SHEET_GID`                   | `0` (atau gid tab Anda)                        |
   | `NEXT_PUBLIC_REFRESH_INTERVAL_MS`    | `30000`                                        |
   | `NEXT_PUBLIC_REPS_TARGET_PERCENT`    | `85`                                            |

5. Klik **Deploy**. Setelah selesai, dashboard langsung live di domain `*.vercel.app`
   yang diberikan Vercel (bisa dipasang custom domain belakangan).

Setiap kali Anda mengubah data di spreadsheet, dashboard akan ikut berubah otomatis
(refresh tiap 30 detik) — tidak perlu deploy ulang.

---

## 5. Menyesuaikan nama kolom (jika header sheet sedikit berbeda)

Buka `config/columns.js`. Setiap field punya daftar `aliases` — tambahkan variasi
penulisan header Anda di sana, **tidak perlu mengubah kode lain**.

```js
serviceNo: {
  label: "Service No.",
  aliases: ["Service No.", "Service No", "Service Number"],
  ...
}
```

Di file yang sama Anda juga bisa mengatur:

- `COMPWORK_VALUES` — nilai pada kolom **Status BIMA** yang dihitung sebagai
  pekerjaan selesai untuk KPI RE/PS (default: `COMPWORK`).
- `STO_FILTER` — isi jika spreadsheet berisi banyak STO dan dashboard ini hanya
  boleh menampilkan Jatinegara saja. Kosongkan `filterValue` jika sheet sumber
  memang sudah khusus Jatinegara (tidak perlu difilter lagi).

---

## 6. Catatan teknis

- **Sumber data**: endpoint publik Google Visualization API (`/gviz/tq`) — tanpa
  API key, tanpa service account. Konsekuensinya: sheet **harus** "Anyone with the
  link can view".
- **Zona waktu**: "Hari ini" dan "Bulan ini" selalu dihitung berdasarkan WIB
  (Asia/Jakarta), bukan zona waktu perangkat yang membuka dashboard.
- **KPI RE/PS** = (jumlah order dengan Status BIMA = COMPWORK) ÷ (total order) ×
  100%, dihitung untuk hari ini dan untuk bulan yang dipilih.
- **Asumsi tanggal acuan**: filter harian/bulanan memakai kolom **Tanggal Order
  BIMA** sebagai tanggal order. Jika Anda ingin memakai **Tanggal Setting**
  sebagai acuan, ganti referensi `orderDateISO`/`orderMonthKey` di `lib/sheet.js`.
- Tidak ada data yang disimpan di server — setiap refresh mengambil ulang langsung
  dari spreadsheet, sehingga selalu menampilkan data terbaru.

---

## 7. Mengatasi masalah umum

**"Gagal mengambil data dari spreadsheet"**
→ Sheet belum dibagikan ke "Anyone with the link". Ulangi langkah 1.

**Tabel tampil tapi sebagian kolom kosong / tanda "-"**
→ Nama header di sheet tidak cocok dengan `aliases` di `config/columns.js`. Tambahkan
penulisan header Anda yang sebenarnya ke daftar alias terkait.

**Data dari tab yang salah**
→ Periksa `GOOGLE_SHEET_GID` di Environment Variables, sesuaikan dengan gid tab yang
benar (lihat di URL spreadsheet saat tab tersebut dibuka).

**Baris tidak muncul di tampilan Harian/Bulanan**
→ Baris tersebut tidak punya tanggal yang berhasil terbaca pada kolom Tanggal Order
BIMA. Pastikan format tanggal di sheet konsisten (format tanggal Google Sheets asli,
atau teks `dd/mm/yyyy` / `yyyy-mm-dd`).

---

## 8. Catatan audit (penting dibaca sebelum live ke BOD)

Spreadsheet sumber Anda sudah saya periksa strukturnya secara langsung (bukan
asumsi), dan ditemukan beberapa hal nyata yang **sudah ditangani otomatis**
oleh kode di proyek ini:

- **Ada baris judul di atas baris header asli** (baris 1 berisi label seperti
  "UPDATE MANUAL" / "DATA AREA", header kolom sebenarnya ada di baris 2). Kode
  ini **mendeteksi baris header berdasarkan isinya**, bukan berdasarkan posisi
  baris — jadi tetap benar walau ada baris judul di atasnya, atau walau
  posisi baris judul berubah di kemudian hari.
- Ada **kolom tersembunyi** di antara kolom-kolom yang dipakai (mis. ada
  kolom kosong antara "Status BIMA" dan "Tanggal Manja"). Kode mencari kolom
  **berdasarkan nama header**, bukan berdasarkan urutan/posisi kolom, jadi
  tidak terganggu oleh kolom tersembunyi.
- Nilai status pada **Status BIMA** yang ditemukan: `COMPWORK`, `CANCLWORK`,
  `WAPPR`, `WORKFAIL` — sudah dipetakan warnanya (`CANCLWORK`/`WORKFAIL` =
  merah, `WAPPR` = kuning, `COMPWORK` = hijau).
- Kolom **Service No.** kadang tersimpan sebagai sel angka. Kode memastikan
  menampilkan angka asli tanpa pemisah ribuan (tidak akan tampil
  "122,101,280,048", tetap "122101280048").
- Kolom **Tanggal Setting** kadang berisi teks bebas yang bukan tanggal (mis.
  "masuk jtn"). Kode tidak akan error — teks itu ditampilkan apa adanya di
  tabel, dan baris tersebut tetap dihitung berdasarkan **Tanggal Order BIMA**
  untuk filter harian/bulanan.
- Jika suatu saat header kolom berubah drastis sehingga kurang dari 6 dari 11
  kolom wajib tidak terbaca, dashboard akan **menampilkan pesan error yang
  jelas** (bukan diam-diam menampilkan angka 0 / kosong yang menyesatkan).

Seluruh logika pembacaan & perhitungan (parsing tanggal, deteksi header,
breakdown status, KPI RE/PS, produktivitas teknisi) sudah diuji otomatis
dengan skenario yang meniru persis struktur asli spreadsheet ini.

---

## Struktur folder

```
dpj-dashboard/
├── components/        Komponen tampilan (header, kartu KPI, tabel, dst)
├── config/columns.js  Pemetaan nama kolom spreadsheet -> field dashboard
├── lib/                Pengambilan & pengolahan data (fetch sheet, agregasi, tema)
├── pages/
│   ├── api/sheet-data.js   Endpoint yang dipanggil dashboard untuk ambil data live
│   ├── _app.js, _document.js
│   └── index.js            Halaman dashboard utama
├── styles/globals.css  Token warna 4 tema + animasi sinyal fiber
└── .env.example
```
