export interface HotkeyItem {
  key: string
  label: string
  category: "global" | "booth" | "result" | "gallery"
}

export const HOTKEYS: HotkeyItem[] = [
  { key: "?", label: "Tampilkan bantuan pintasan", category: "global" },
  { key: "B", label: "Pindah ke Booth", category: "global" },
  { key: "G", label: "Pindah ke Galeri", category: "global" },
  { key: "N", label: "Buat Section baru", category: "global" },
  { key: "[ / ]", label: "Section sebelumnya / berikutnya", category: "global" },
  { key: "F", label: "Layar penuh (Fullscreen)", category: "global" },
  { key: "Esc", label: "Tutup dialog / batal", category: "global" },

  { key: "1-4", label: "Pilih jumlah foto", category: "booth" },
  { key: "← / → / V", label: "Ganti varian layout", category: "booth" },
  { key: "Space / Enter", label: "Mulai hitung mundur", category: "booth" },
  { key: "T", label: "Ganti durasi timer (3/5/10s)", category: "booth" },
  { key: "M", label: "Toggle mirror kamera", category: "booth" },
  { key: "C", label: "Ganti kamera", category: "booth" },
  { key: "L", label: "Ganti filter foto", category: "booth" },

  { key: "Enter", label: "Selesai / foto baru", category: "result" },
  { key: "R", label: "Ulangi foto (buang hasil)", category: "result" },
  { key: "D", label: "Download foto", category: "result" },
  { key: "E", label: "Kirim email", category: "result" },

  { key: "Arrow Keys", label: "Navigasi galeri", category: "gallery" },
  { key: "Space / X", label: "Pilih / batal pilih foto", category: "gallery" },
  { key: "Ctrl+A", label: "Pilih semua", category: "gallery" },
  { key: "Delete", label: "Hapus foto terpilih", category: "gallery" },
]
