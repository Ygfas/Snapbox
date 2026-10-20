# PLAN.md — Snapbox (Photobooth Web untuk Laptop)

> Dokumen ini adalah instruksi kerja untuk code agent. Baca seluruhnya sebelum menulis kode.
> Kerjakan per fase (Bagian 11), centang checklist, jalankan `npm run check` di akhir tiap fase.
> Nama kerja aplikasi: **Snapbox** (boleh diganti, simpan di satu konstanta `APP_NAME`).

---

## 1. Ringkasan

Snapbox adalah aplikasi photobooth berbasis web yang dipakai di **laptop** (webcam bawaan/eksternal).
Pengguna memilih layout 1–4 foto, memotret dengan hitung mundur, hasilnya disusun otomatis menjadi satu gambar
(strip/grid), disimpan **sementara** di browser, dikelompokkan dalam **Section** (sesi), lalu bisa diunduh,
dihapus, atau **dikirim lewat email**. Tanpa login.

### Tujuan utama
- Alur cepat dan tidak ribet: dari buka aplikasi sampai foto jadi dalam < 30 detik.
- Bisa dipakai bergantian oleh banyak orang (acara/ulang tahun) tanpa foto bertumpuk, karena ada Section.
- **Keyboard-first**: seluruh alur utama bisa dijalankan tanpa mouse.
- Tampilan bersih, tegas, **tanpa gradient sama sekali**.

### Di luar cakupan (jangan dikerjakan)
- Login/akun/registrasi, database server, penyimpanan foto di server, pembayaran, aplikasi mobile native.

---

## 2. Aturan Keras (Non-negotiable)

1. **TIDAK ADA GRADIENT** di mana pun:
   - Tailwind: dilarang `bg-gradient-*`, `bg-linear-*`, `bg-radial-*`, `bg-conic-*`, `from-*`/`via-*`/`to-*` untuk gradient, `mask-linear/radial`.
   - CSS: dilarang `linear-gradient`, `radial-gradient`, `conic-gradient`, `repeating-*-gradient`.
   - Canvas: dilarang `createLinearGradient`, `createRadialGradient`, `createConicGradient`.
   - SVG: dilarang `<linearGradient>`, `<radialGradient>`.
   - Aset (logo, favicon, ilustrasi) dan **template email** juga harus solid color.
   - Efek filter **tidak boleh** memakai vignette/glow berbasis gradient. Hanya filter berbasis `filter` CSS/canvas (Bagian 5.7).
   - Wajib ada skrip pemeriksa otomatis (Bagian 12.3) yang membuat build gagal bila ada gradient.
2. **Tanpa login.** Tidak ada akun, tidak ada cookie pelacak.
3. **Foto tidak pernah disimpan di server.** Server hanya meneruskan lampiran ke email, lalu membuangnya dari memori.
4. **Laptop-first**: dioptimalkan untuk layar 1280×720 sampai 1920×1080. Lebar minimum yang didukung 1024 px.
5. **Keyboard-first** dengan pintasan terdokumentasi (Bagian 5.8).
6. **UI memakai ikon (lucide-react), bukan karakter emoji.** Emoji hanya muncul sebagai *stiker di atas foto* (fitur opsional, Bagian 5.6).
7. TypeScript `strict: true`, tanpa `any` kecuali dengan komentar alasan.
8. Jangan menambah dependency di luar daftar Bagian 3 tanpa alasan tertulis di README bagian "Keputusan teknis".

### Asumsi yang dipakai (koreksi jika keliru)
- "layout 1–4" = **jumlah foto per hasil** (1, 2, 3, atau 4), dengan beberapa varian susunan.
- "emot keyboard buat" diartikan: **buat pintasan keyboard** (dan UI tanpa karakter emoji). Emoji sebagai stiker foto tetap opsional.
- "Simpan sementara" = tersimpan di browser (IndexedDB) dengan opsi hapus otomatis, bukan di server.

---

## 3. Tech Stack

### Frontend (`/client`)
| Kebutuhan | Pilihan |
|---|---|
| Build | **Vite** + **React** (versi stabil terbaru) + **TypeScript** |
| Styling | **Tailwind CSS v4** (plugin `@tailwindcss/vite`), design tokens di `@theme` |
| State UI | **Zustand** (state kecil: section aktif, pengaturan, mode alur) |
| Penyimpanan | **IndexedDB** via **Dexie** (+ `dexie-react-hooks` untuk `useLiveQuery`) |
| Ikon | **lucide-react** |
| ZIP | **jszip** (unduh semua foto satu section) |
| Font | `@fontsource-variable/inter` (UI) + `@fontsource/space-mono` (angka hitung mundur). Self-host, tanpa CDN |
| Test | **Vitest** + Testing Library, **Playwright** untuk E2E |
| Lint | ESLint + Prettier |

Tidak memakai React Router (aplikasi satu halaman dengan tab internal). Jika perlu deep-link nanti, baru ditambah.

### Backend (`/server`) — bebas, dipilih: Node + Express
| Kebutuhan | Pilihan |
|---|---|
| Runtime | Node.js LTS + **Express** + TypeScript (`tsx` untuk dev) |
| Email | **Nodemailer** (SMTP) — fleksibel: Gmail App Password untuk dev, Brevo/Resend SMTP/Mailgun untuk produksi |
| Upload | **multer** (memory storage, tanpa menulis ke disk) |
| Validasi | **zod** |
| Keamanan | **helmet**, **cors** (whitelist origin), **express-rate-limit** |
| Logging | **pino** (jangan log alamat email penuh; mask `a***@domain.com`) |

Alternatif yang diperbolehkan jika deploy serverless: satu fungsi `api/send-email.ts` di Vercel/Netlify dengan logika yang sama.

### Struktur repo
```
snapbox/
├─ plan.md
├─ README.md
├─ package.json            # scripts root: dev, build, check (workspaces)
├─ scripts/
│  └─ check-no-gradient.mjs
├─ client/
│  ├─ index.html
│  ├─ vite.config.ts       # proxy /api -> http://localhost:3001
│  └─ src/
│     ├─ main.tsx
│     ├─ App.tsx
│     ├─ styles/index.css   # @import "tailwindcss"; @theme tokens
│     ├─ config/            # layouts.ts, filters.ts, hotkeys.ts, constants.ts
│     ├─ i18n/id.ts         # semua teks UI (Bahasa Indonesia); siap tambah en.ts
│     ├─ db/                # dexie.ts, sections.repo.ts, captures.repo.ts
│     ├─ store/             # ui.store.ts, settings.store.ts
│     ├─ hooks/             # useCamera, useHotkeys, useCaptureFlow, useObjectUrl
│     ├─ lib/               # compose.ts (canvas), image.ts, zip.ts, emailApi.ts, format.ts
│     ├─ components/
│     │  ├─ shell/          # AppShell, Sidebar, TopBar, ShortcutHelp
│     │  ├─ booth/          # CameraStage, LayoutPicker, Countdown, ShotStrip, ResultView
│     │  ├─ gallery/        # GalleryGrid, PhotoCard, Lightbox, SelectionBar
│     │  ├─ sections/       # SectionList, SectionDialog
│     │  ├─ email/          # EmailDialog
│     │  └─ ui/             # Button, IconButton, Dialog, Toast, Kbd, Switch, Segmented
│     └─ test/
└─ server/
   └─ src/
      ├─ index.ts
      ├─ routes/email.ts
      ├─ mail/transport.ts
      ├─ mail/template.ts   # HTML email, solid color
      ├─ middleware/        # limits.ts, error.ts
      └─ env.ts             # validasi env dengan zod
```

---

## 4. Alur Pengguna (User Flow)

```
Buka app ──> (Section "Sesi 1" otomatis dibuat bila kosong)
   │
   ▼
[BOOTH]  pilih jumlah foto (1–4) + varian ──> kamera siap
   │  Space/Enter
   ▼
Hitung mundur 3·2·1 ──> flash ──> jepret #1 ... #N (otomatis berurutan)
   │
   ▼
Review per-foto (opsional ulang foto tertentu) ──> Susun (canvas)
   │
   ▼
[HASIL] otomatis tersimpan di Section aktif
   ├─ Download (D)    ├─ Email (E)    ├─ Ulangi/buang (R)    └─ Selesai/foto lagi (Enter)
   │
   ▼
[GALERI] per Section: pilih, pratinjau, download, email, hapus
```

### State machine alur ambil foto
`idle → ready → countdown → capturing → reviewing → composing → result`
- Dari `result`: `Enter` kembali ke `ready` (foto baru), `R` membuang hasil lalu `ready`.
- `Esc` saat `countdown/capturing` membatalkan seluruh sesi tanpa menyimpan.
- Implementasi sebagai reducer/state machine eksplisit di `useCaptureFlow` (hindari boolean berserakan). Tulis unit test untuk transisinya.

---

## 5. Spesifikasi Fitur

### 5.1 Kamera
- `navigator.mediaDevices.getUserMedia` dengan `video: { width: {ideal: 1280}, height: {ideal: 720}, facingMode: 'user' }`, `audio: false`.
- Preview **mirror** (CSS `scaleX(-1)`) agar natural seperti cermin. Toggle mirror (`M`).
- Pilih kamera bila lebih dari satu (`C` untuk ganti, daftar dari `enumerateDevices`).
- Tangani semua kondisi: izin ditolak, tidak ada kamera, kamera dipakai aplikasi lain, tab disembunyikan (hentikan track saat tab tidak aktif lebih dari 60 detik, nyalakan lagi saat kembali).
- Selalu `track.stop()` saat unmount.
- Kamera butuh konteks aman: jalan di `localhost` atau HTTPS. Tulis di README.
- **Fallback**: tombol "Unggah foto" (file input) bila kamera tidak tersedia, supaya aplikasi tetap bisa dites.

### 5.2 Layout (jumlah foto 1–4, bebas dipilih)
Sel foto semua rasio **4:3** (640×480 px). Padding `p = 40`, jarak antar-foto `g = 20`, footer `F = 120` (untuk teks tanggal/caption).

| Kode | Nama | Susunan | Ukuran kanvas (px) |
|---|---|---|---|
| `1` | Satu Foto | 1 sel | 720 × 680 |
| `2v` | Dua Strip | 2 sel vertikal | 720 × 1180 |
| `2h` | Dua Berdampingan | 2 sel horizontal | 1380 × 680 |
| `3v` | Tiga Strip | 3 sel vertikal | 720 × 1680 |
| `4v` | Empat Strip (klasik) | 4 sel vertikal | 720 × 2180 |
| `4g` | Empat Grid 2×2 | 2 × 2 | 1380 × 1180 |

Rumus (jadikan fungsi murni `getLayoutMetrics(layout)` dan **uji dengan Vitest** terhadap tabel di atas):
- Lebar vertikal = `640 + 2p`; tinggi = `N*480 + (N-1)*g + 2p + F`.
- Horizontal/grid: lebar = `cols*640 + (cols-1)*g + 2p`; tinggi = `rows*480 + (rows-1)*g + 2p + F`.

Pemilihan: tekan `1`–`4` untuk jumlah foto; bila ada varian (2 dan 4), `←`/`→` atau `V` bergilir antar varian. Tampilkan preview mini tiap layout (digambar dengan div solid, bukan gradient).

Opsi tampilan hasil (semua **solid color**):
- Warna bingkai/latar: 8 swatch (putih krem, hitam, merah, kuning, hijau, biru, abu, pink pastel).
- Footer: teks kustom (default: tanggal + `APP_NAME`), bisa dimatikan.
- Sudut foto: tajam atau membulat (`rx` kecil).
- Ekspor: JPEG kualitas 0.92 (untuk email & simpan), PNG (opsi download).

### 5.3 Proses Pengambilan Foto
- Timer hitung mundur: **3 / 5 / 10 detik** (tombol `T` bergilir; default 3). Angka besar dengan Space Mono.
- Efek **flash**: overlay putih solid 150 ms (bukan gradient).
- Jeda antar-foto 1,5 detik, tampilkan thumbnail foto yang sudah diambil ("2 / 4").
- Frame diambil dari `<video>` ke `OffscreenCanvas`/`canvas`, di-crop **cover** ke 4:3 dari tengah.
- **Review**: sebelum disusun, tampilkan semua jepretan; tekan angka `1`–`4` (atau klik) untuk mengulang satu jepretan tertentu, `Enter` untuk lanjut.
- Opsional: bunyi "bip" hitung mundur dan "klik" jepret via Web Audio (toggle di pengaturan, default mati).

### 5.4 Penyimpanan Sementara & Section
**Section** = wadah/sesi untuk mengelompokkan foto agar tidak bertumpuk dan bisa dipakai ulang.

- Saat pertama dibuka dibuat otomatis "Sesi 1".
- Buat section baru (`N`): nama bebas (default "Sesi {n}" atau tanggal-jam), validasi nama tidak kosong dan tidak duplikat.
- Ganti nama, hapus section (dialog konfirmasi menyebut jumlah foto), pindah antar section (`[` dan `]`).
- Hasil foto otomatis masuk ke **section aktif**.
- Foto dapat **dipindahkan** ke section lain (aksi "Pindahkan ke…") — saran tambahan.
- Hapus 1 foto, hapus beberapa terpilih, atau "Kosongkan section". Semua aksi hapus memberi **toast Undo 6 detik** sebelum benar-benar dihapus dari IndexedDB.
- **Hapus otomatis**: pengaturan "Hapus foto otomatis setelah: Tidak pernah / 24 jam / 7 hari" (default **7 hari**). Jalankan pembersihan saat app dibuka.
- Tampilkan **indikator penyimpanan** (`navigator.storage.estimate()`) dan peringatan jelas: *"Foto tersimpan sementara di browser ini. Menghapus data situs/riwayat akan menghapus foto."*
- Tangani `QuotaExceededError` (beri tahu pengguna, sarankan unduh/hapus) dan IndexedDB yang tidak tersedia (mode private): tampilkan banner dan jalan dalam mode memori.

#### Skema data (Dexie)
```ts
interface Section {
  id: string;            // crypto.randomUUID()
  name: string;
  createdAt: number;
  updatedAt: number;
}

interface Capture {
  id: string;
  sectionId: string;     // index
  layout: LayoutCode;    // '1' | '2v' | '2h' | '3v' | '4v' | '4g'
  createdAt: number;     // index
  composite: Blob;       // hasil akhir (JPEG)
  thumb: Blob;           // 320px lebar, JPEG
  shots: Blob[];         // jepretan mentah 640x480, agar bisa disusun ulang (ganti bingkai/filter)
  style: { frameColor: string; footerText: string; filter: FilterId; stickers: Sticker[] };
  width: number; height: number; bytes: number;
}
// tabel: sections(id, name, createdAt), captures(id, sectionId, createdAt)
```
Gunakan `URL.createObjectURL` lewat hook `useObjectUrl` (revoke saat unmount) agar tidak bocor memori.

### 5.5 Galeri per Section
- Grid thumbnail responsif, urut terbaru. Header menampilkan nama section dan jumlah foto.
- Pilih: klik/`Space`, pilih semua `Ctrl/Cmd+A`, bar aksi muncul saat ada pilihan.
- **Lightbox** pratinjau (`Enter`), navigasi `←`/`→`, `Esc` menutup.
- Aksi: **Download** (JPEG/PNG), **Download semua (ZIP)**, **Email**, **Pindahkan**, **Hapus**.
- Empty state yang ramah dengan tombol "Ambil foto" (`B`).
- Nama file unduhan: `snapbox_{section}_{yyyyMMdd-HHmmss}.jpg` (sanitasi karakter).

### 5.6 Emoji / Stiker (OPSIONAL — Fase 5)
- Panel stiker berisi set emoji pilihan (±40: ❤️ ⭐ 😎 🎉 dsb. — karakter ini hanya ada di data stiker, bukan di UI).
- Tempelkan ke foto di layar hasil: seret, ubah ukuran, putar, hapus (`Delete`).
- Render ke kanvas dengan `ctx.fillText` memakai font emoji sistem. Catat di README bahwa tampilan emoji bergantung OS. Alternatif: set stiker SVG **solid color** buatan sendiri (tanpa gradient).
- Disimpan di `style.stickers` (posisi dalam koordinat kanvas, skala, rotasi) sehingga bisa diedit ulang.

### 5.7 Efek Filter (OPSIONAL — Fase 5)
Semua via `ctx.filter` / CSS `filter` (bukan gradient, bukan vignette):

| Filter | Nilai |
|---|---|
| Normal | — |
| Hitam Putih | `grayscale(1) contrast(1.1)` |
| Sepia | `sepia(0.8)` |
| Vintage | `sepia(0.35) contrast(0.9) saturate(1.2)` |
| Hangat | `sepia(0.2) saturate(1.3) hue-rotate(-10deg)` |
| Dingin | `saturate(1.1) hue-rotate(15deg) brightness(1.05)` |
| Kontras Tinggi | `contrast(1.35) saturate(1.1)` |
| Pudar | `contrast(0.85) brightness(1.1) saturate(0.8)` |

- Preview live di kamera dan diterapkan ulang saat render final. Tekan `L`/`Shift+L` untuk berganti filter.
- Cek dukungan `ctx.filter` (Safari lama belum mendukung). Jika tidak ada, sembunyikan fitur filter dan beri tahu.

### 5.8 Pintasan Keyboard
Satu sumber kebenaran di `config/hotkeys.ts` (daftar + deskripsi + konteks) yang dipakai oleh `useHotkeys` **dan** overlay bantuan (`?`) agar tidak pernah tidak sinkron.

**Global**
| Tombol | Aksi |
|---|---|
| `?` | Tampilkan/tutup daftar pintasan |
| `B` / `G` | Tab Booth / Galeri |
| `N` | Section baru |
| `[` / `]` | Section sebelumnya / berikutnya |
| `F` | Layar penuh |
| `Esc` | Tutup dialog / batalkan sesi foto |

**Booth**
| Tombol | Aksi |
|---|---|
| `1` `2` `3` `4` | Jumlah foto per hasil |
| `←` `→` / `V` | Ganti varian layout |
| `Space` / `Enter` | Mulai hitung mundur |
| `T` | Ganti durasi timer (3/5/10) |
| `M` | Mirror on/off |
| `C` | Ganti kamera |
| `L` / `Shift+L` | Filter berikutnya / sebelumnya (jika aktif) |

**Hasil**
| Tombol | Aksi |
|---|---|
| `Enter` | Selesai, foto baru |
| `R` | Buang dan ulangi |
| `D` | Download |
| `E` | Kirim email |

**Galeri**
| Tombol | Aksi |
|---|---|
| Panah | Pindah fokus antar foto |
| `Space` / `X` | Pilih/batal pilih |
| `Ctrl/Cmd+A` | Pilih semua |
| `Enter` | Buka pratinjau |
| `D` / `E` | Download / Email yang dipilih |
| `Delete` / `Backspace` | Hapus yang dipilih (dengan Undo) |

Aturan implementasi:
- Nonaktifkan pintasan huruf saat fokus di `input/textarea/select/[contenteditable]`.
- Abaikan bila ada modifier (`Ctrl/Alt/Meta`) kecuali yang didefinisikan (`Ctrl/Cmd+A`). Jangan menimpa pintasan browser (`Ctrl+S`, `Ctrl+P`, `F5`, dll.).
- `Space` pada tombol yang sedang fokus: `preventDefault` supaya tidak memicu klik ganda.
- Tampilkan petunjuk tombol di UI memakai komponen `<Kbd>` (mis. "Mulai `Space`").
- Semua elemen interaktif tetap bisa dijangkau `Tab`, dengan **focus ring jelas** (solid, 2–3 px).

### 5.9 Kirim Lewat Email
**UI (`EmailDialog`)**
- Input email (type `email`, validasi format di klien), opsional nama pengirim dan pesan singkat (maks 300 karakter).
- Pilih foto yang dikirim (default: foto yang sedang dibuka/terpilih; maks **5 foto per kirim**).
- Indikator ukuran total (maks **15 MB**; kompres ulang ke JPEG 0.85 bila lebih).
- Status: mengirim → berhasil → gagal (dengan tombol "Coba lagi"). `Enter` mengirim, `Esc` batal.
- Ingat alamat email terakhir **hanya di memori sesi** (tidak disimpan permanen), supaya tidak ada data pribadi menetap.
- Nonaktif dengan pesan jelas saat offline.

**API**
```
POST /api/email           multipart/form-data
  fields: to (string), senderName? (string), message? (string)
  files : photos[] (image/jpeg | image/png), 1..5 file
200 { ok: true }
4xx { ok: false, code: 'VALIDATION' | 'TOO_LARGE' | 'RATE_LIMITED' | 'UNSUPPORTED_TYPE', message }
5xx { ok: false, code: 'MAIL_FAILED', message }
GET /api/health           { ok: true }
```
- Validasi `zod`; cek tipe file lewat *magic bytes* (bukan hanya header).
- Batas: ukuran total 15 MB, 1 penerima per request.
- **Perlindungan penyalahgunaan** (penting karena tanpa login): rate limit per IP (mis. 5 request/menit, 30/jam), batas harian global `DAILY_EMAIL_LIMIT`, CORS hanya untuk `CLIENT_ORIGIN`, helmet. Opsional: Cloudflare Turnstile (catat sebagai saran, jangan wajib).
- Foto hanya ada di memori selama request; tidak ditulis ke disk, tidak di-log.
- Template email HTML **solid color** (tanpa gradient), responsif sederhana, teks alternatif plain-text, foto sebagai lampiran.

**`.env.example` (server)**
```
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
MAIL_FROM="Snapbox <no-reply@example.com>"
DAILY_EMAIL_LIMIT=200
```

### 5.10 Saran Tambahan (sudah masuk rencana)
- **Layar penuh** (`F`) untuk mode kiosk saat acara.
- **Unggah foto** sebagai fallback tanpa kamera.
- **Pindahkan foto antar section**, **Undo** untuk hapus, **ZIP** per section.
- **Bunyi hitung mundur** (opsional) dan **timer yang bisa diatur**.
- **Cetak** (`window.print`) dengan CSS `@media print` untuk ukuran strip, tanpa elemen UI.
- **Tema terang/gelap** (keduanya solid color), mengikuti sistem dan bisa diganti manual.
- **PWA ringan** (manifest + service worker cache aset) agar bisa dipasang dan jalan offline kecuali pengiriman email. *(Fase 6, opsional)*
- **Auto-reset idle** (opsional): bila tidak ada aktivitas 2 menit di layar hasil, kembali ke Booth.

---

## 6. Desain Visual (TANPA GRADIENT)

**Arah gaya:** photobooth klasik yang bersih — kertas krem, tinta hitam, aksen merah dan kuning, sudut sedikit membulat, border tegas, bayangan **keras tanpa blur** (offset solid), tipografi jelas. Terasa hangat dan playful tapi rapi.

### Design tokens (`@theme` di `styles/index.css`)
| Token | Terang | Gelap |
|---|---|---|
| `--color-bg` | `#F4EFE6` | `#121214` |
| `--color-surface` | `#FFFFFF` | `#1C1C20` |
| `--color-ink` | `#17171A` | `#F2F0EA` |
| `--color-muted` | `#5E5E66` | `#A4A4AD` |
| `--color-line` | `#D9D2C3` | `#2E2E34` |
| `--color-accent` | `#D93A2F` | `#F0564B` |
| `--color-accent-ink` | `#FFFFFF` | `#17171A` |
| `--color-highlight` | `#F2B705` | `#F2B705` |
| `--color-success` | `#2E7D4F` | `#4CB37A` |
| `--color-danger` | `#B3261E` | `#F2766E` |

- Kontras teks minimal **WCAG AA** (4.5:1). Verifikasi tiap pasangan warna; sesuaikan hex bila kurang.
- Bayangan: `box-shadow: 4px 4px 0 var(--color-ink)` (hard shadow). Tidak ada blur-gradient.
- Radius: 8 px (kartu/tombol), 999 px (chip).
- Tipografi: Inter untuk UI; Space Mono untuk hitung mundur dan label teknis. Skala: 12/14/16/20/28/48/160 (hitung mundur).
- Ikon: lucide-react, stroke 2 px, ukuran konsisten (16/20/24).
- Gerak: transisi singkat 120–200 ms; hormati `prefers-reduced-motion` (matikan animasi hitung mundur berskala, tetap tampilkan angka).

### Wireframe layar utama (≥ 1280 px)
```
┌────────────────────────────────────────────────────────────────────────┐
│ SNAPBOX            [ Booth B ] [ Galeri G ]            ⛶ F   ?   ◐ tema │
├──────────────┬─────────────────────────────────────────────────────────┤
│ SECTION      │                                                         │
│ + Baru  (N)  │        ┌───────────────────────────────┐                │
│ ───────────  │        │                               │   LAYOUT       │
│ ● Sesi 1  12 │        │        PREVIEW KAMERA 4:3     │   [1][2][3][4] │
│ ○ Ulang Tahun│        │            (mirror)           │   Varian ◀ ▶   │
│ ○ Sesi 3   4 │        │                               │   Timer  3s    │
│              │        └───────────────────────────────┘   Bingkai ■■■■ │
│ Penyimpanan  │             [  ◉ MULAI  Space  ]           Filter  ...  │
│ ▮▮▯▯▯ 18 MB  │         ▢ ▢ ▢ ▢  (jepretan 0/4)                         │
└──────────────┴─────────────────────────────────────────────────────────┘
```
Layar Hasil: preview strip di tengah, tombol Download / Email / Ulangi / Selesai di sisi kanan dengan label tombol keyboard.
Layar Galeri: grid kartu, bar aksi melayang di bawah saat ada pilihan.

### Komponen UI yang harus ada
Button, IconButton, Dialog (focus trap, `Esc`), Toast (dengan aksi Undo), Segmented, Switch, Kbd, Tooltip, EmptyState, ConfirmDialog, SwatchPicker, StorageMeter.

---

## 7. Arsitektur Frontend

- **Pemisahan tanggung jawab:** UI (komponen) ↔ hook (kamera, alur, hotkey) ↔ lib (komposisi kanvas, ekspor, API) ↔ db (Dexie). Komposisi kanvas harus murni dan bisa dites tanpa DOM penuh.
- **`lib/compose.ts`**: `composeCapture({ shots, layout, style }) => Promise<Blob>`
  - Pakai `OffscreenCanvas` bila tersedia, fallback `<canvas>`.
  - Urutan gambar: latar solid → tiap sel (cover-crop + filter + mirror sesuai setting) → stiker → footer teks.
  - Mirror hanya membalik **foto**, bukan teks footer.
- **`useCamera`**: kelola stream, daftar perangkat, error terpetakan ke pesan ramah (`NotAllowedError`, `NotFoundError`, `NotReadableError`).
- **`useCaptureFlow`**: state machine (Bagian 4), memakai timer yang bisa dibatalkan (`AbortController`).
- **`useHotkeys(context)`**: mendaftarkan pintasan menurut konteks aktif (global/booth/hasil/galeri/dialog); dialog yang terbuka menahan pintasan di bawahnya.
- **Performa:** thumbnail 320 px dibuat saat simpan; galeri memuat thumb, bukan composite; revoke object URL; hindari re-render preview video (isolasi `CameraStage`).
- **Teks UI**: semua string di `i18n/id.ts` (Bahasa Indonesia sebagai default). Tidak ada string hard-coded di komponen.

---

## 8. Arsitektur Backend

- `index.ts`: Express, `helmet`, `cors({ origin: CLIENT_ORIGIN })`, `express.json({ limit: '10kb' })`, rate limiter, route, error handler seragam (`{ ok:false, code, message }`).
- `routes/email.ts`: multer (`memoryStorage`, `limits: { files: 5, fileSize: 8MB }`) → validasi zod → cek magic bytes → `transport.sendMail` dengan lampiran dari buffer.
- `mail/transport.ts`: transport Nodemailer dari env; `verify()` saat start (log peringatan bila gagal, jangan crash di dev).
- `env.ts`: validasi env dengan zod, gagal cepat dengan pesan jelas bila ada yang kurang.
- Dev: Vite proxy `/api` → `http://localhost:3001`. Produksi: set `VITE_API_BASE` bila beda domain.
- Deploy yang disarankan: client statis (Vercel/Netlify/Cloudflare Pages), server di Render/Railway/Fly. Catat langkahnya di README.

---

## 9. Edge Case yang Wajib Ditangani

- Izin kamera ditolak / tidak ada kamera / kamera dipakai aplikasi lain → layar bantuan dengan langkah memperbaiki + tombol "Coba lagi" + opsi unggah foto.
- Tab pindah/diminimalkan saat hitung mundur → jeda atau batalkan dengan aman.
- Resize jendela dan layar kecil (< 1024 px): tampilkan pesan "paling nyaman di laptop" tanpa merusak layout.
- Kuota penyimpanan penuh, IndexedDB tidak tersedia, data rusak.
- Hapus section yang sedang aktif → pindah ke section lain, atau buat "Sesi 1" baru bila kosong.
- Dua tab terbuka sekaligus: `useLiveQuery` menjaga sinkron; tidak ada kunci eksklusif.
- Email: format salah, offline, timeout (batas 30 dtk), rate limited, lampiran terlalu besar, SMTP gagal → pesan jelas + coba lagi, tanpa menghapus foto.
- Nama section/file berisi karakter aneh → sanitasi.
- Refresh di tengah sesi foto → sesi dibatalkan, foto yang sudah tersimpan tetap aman.
- Browser: Chrome, Edge, Firefox, Safari terbaru. Fitur yang tidak didukung dimatikan dengan anggun.

---

## 10. Aksesibilitas

- Semua kontrol bisa dioperasikan keyboard; urutan `Tab` logis; dialog memakai focus trap dan mengembalikan fokus.
- `aria-live="polite"` untuk hitung mundur dan status email; `aria-label` pada tombol ikon.
- Jangan mengandalkan warna saja untuk status (tambah ikon/teks).
- Hormati `prefers-reduced-motion` dan `prefers-color-scheme`.

---

## 11. Fase Kerja (Checklist untuk Code Agent)

### Fase 0 — Scaffold
- [ ] Monorepo `client` (Vite React TS) + `server` (Express TS), skrip root `dev`, `build`, `check`.
- [ ] Tailwind v4 + design tokens + font self-host + tema terang/gelap solid.
- [ ] ESLint, Prettier, Vitest, `scripts/check-no-gradient.mjs` terpasang ke `npm run check`.
- [ ] Komponen UI dasar (Button, Dialog, Toast, Kbd, Segmented, Switch).
- **Selesai bila:** `npm run dev` menjalankan keduanya; `npm run check` hijau.

### Fase 1 — Kamera, Layout, Pengambilan Foto
- [ ] `useCamera` (izin, daftar perangkat, mirror, error ramah).
- [ ] `config/layouts.ts` + `getLayoutMetrics` + unit test terhadap tabel Bagian 5.2.
- [ ] `LayoutPicker` (1–4 + varian) dan preview mini.
- [ ] `useCaptureFlow` (state machine + test), hitung mundur, flash, jeda antar-foto, review/ulang satu jepretan.
- [ ] `compose.ts` menghasilkan strip/grid sesuai layout, footer, warna bingkai.
- **Selesai bila:** bisa memotret semua 6 varian layout dan hasilnya benar secara visual.

### Fase 2 — Penyimpanan, Section, Galeri
- [ ] Dexie schema, repo sections/captures, `useLiveQuery`.
- [ ] CRUD section (buat/ganti nama/hapus/pindah), section default.
- [ ] Simpan otomatis hasil ke section aktif (composite + thumb + shots).
- [ ] Galeri: grid, pilih, lightbox, download (JPEG/PNG), ZIP, hapus + Undo, pindah section.
- [ ] Hapus otomatis berdasarkan TTL, indikator kuota, penanganan error penyimpanan.
- **Selesai bila:** refresh halaman tidak menghilangkan foto; hapus bisa di-undo; section terpisah rapi.

### Fase 3 — Email
- [ ] Server: `/api/email`, `/api/health`, validasi, magic bytes, rate limit, CORS, template solid-color.
- [ ] Client: `EmailDialog`, `emailApi.ts`, kompres ulang bila perlu, status dan retry.
- [ ] Dokumentasi `.env.example` dan cara tes dengan Gmail App Password / SMTP lain.
- [ ] Test API (supertest) dengan transport palsu: sukses, validasi gagal, terlalu besar, rate limit.
- **Selesai bila:** email dengan lampiran benar-benar diterima di inbox uji; foto tidak tersimpan di server.

### Fase 4 — Keyboard & Polish
- [ ] `useHotkeys` + `config/hotkeys.ts` + overlay `?` yang dihasilkan dari konfigurasi.
- [ ] Semua pintasan Bagian 5.8 berfungsi dan tidak bentrok dengan input teks/dialog.
- [ ] Fullscreen, tema, pengaturan (timer, mirror, TTL, bunyi), empty/error state, microcopy Indonesia.
- [ ] Audit aksesibilitas dasar (Tab, fokus, kontras, reduced motion).
- **Selesai bila:** seluruh alur Booth → Hasil → Galeri → Email dapat dijalankan tanpa mouse.

### Fase 5 — Opsional: Filter & Stiker
- [ ] Filter Bagian 5.7 (preview live + render final + deteksi dukungan).
- [ ] Stiker emoji Bagian 5.6 (seret, ukuran, putar, hapus, simpan di `style`).
- [ ] Edit ulang hasil dari galeri (ganti bingkai/filter/stiker) memakai `shots` mentah.
- **Selesai bila:** filter/stiker tampil sama di preview dan hasil akhir; tetap lulus cek no-gradient.

### Fase 6 — Opsional: PWA, Cetak, Deploy
- [ ] `@media print` untuk cetak strip, PWA manifest + service worker.
- [ ] Panduan deploy client + server di README.

---

## 12. Pengujian & Kualitas

### 12.1 Unit/Komponen (Vitest)
- `getLayoutMetrics` untuk semua layout; fungsi crop-cover; sanitasi nama file.
- State machine `useCaptureFlow` (semua transisi, pembatalan `Esc`).
- `useHotkeys`: tidak aktif saat mengetik, menghormati modifier, prioritas dialog.
- Repo Dexie (pakai `fake-indexeddb`): CRUD, TTL cleanup, hapus section menghapus capture terkait.

### 12.2 E2E (Playwright)
- Jalankan Chromium dengan `--use-fake-device-for-media-stream --use-fake-ui-for-media-stream` agar kamera palsu tersedia di CI.
- Skenario: pilih layout 4 → ambil foto → muncul di galeri → buat section baru → pindahkan foto → hapus + undo → kirim email (server memakai transport palsu).
- Skenario keyboard-only untuk alur utama.

### 12.3 Pemeriksa No-Gradient (`scripts/check-no-gradient.mjs`)
- Pindai `client/src`, `client/index.html`, `server/src`, serta aset `.svg/.css/.html`.
- Gagal (exit 1) bila menemukan pola (case-insensitive):
  `gradient` · `\b(bg|mask)-(linear|radial|conic)` · `createLinearGradient|createRadialGradient|createConicGradient`
- Jalankan di `npm run check` dan di CI. Cetak file + baris yang melanggar.
- Verifikasi manual: tidak ada gradient pada logo/favicon dan template email.

### 12.4 Skrip root
```
npm run dev     # client + server paralel
npm run build   # build keduanya
npm run check   # typecheck + lint + test + no-gradient
npm run e2e     # Playwright
```

---

## 13. Aturan Kerja untuk Code Agent

- Kerjakan berurutan per fase; jangan loncat. Setelah tiap fase: `npm run check` harus hijau, lalu commit dengan pesan jelas (`feat: ...`, `fix: ...`).
- Bila ada hal ambigu yang mengubah arsitektur atau UX, **tanya dulu**; untuk detail kecil, pilih default wajar dan catat di README ("Keputusan teknis").
- Jangan menambah fitur di luar plan ini kecuali diminta. Jangan mengubah aturan keras Bagian 2.
- Pertahankan README yang selalu terbarui: cara install, env, jalankan dev, deploy, daftar pintasan, batasan browser.
- Setiap komponen baru: tipe jelas, tanpa string hard-coded, bisa dipakai keyboard.

---

## 14. Definition of Done (Keseluruhan)

- [ ] Layout 1–4 foto (6 varian) berfungsi dan hasilnya sesuai ukuran tabel.
- [ ] Foto tersimpan sementara di browser, terkelompok per Section, bisa dibuat/diganti nama/dihapus/dipindah.
- [ ] Simpan (download/ZIP) dan hapus (dengan Undo) di tiap section.
- [ ] Kirim foto lewat email dengan input alamat; server tidak menyimpan foto; ada rate limit.
- [ ] Tanpa login.
- [ ] Pintasan keyboard lengkap + overlay bantuan; alur utama bisa tanpa mouse.
- [ ] **Nol gradient** (lulus `check-no-gradient`), UI tanpa karakter emoji.
- [ ] (Opsional) filter dan stiker emoji berfungsi.
- [ ] Lulus `npm run check` dan E2E; README lengkap; berjalan baik di Chrome, Edge, Firefox, Safari terbaru pada layar laptop.
