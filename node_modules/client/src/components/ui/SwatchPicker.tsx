import React from "react"

const SWATCHES = [
  { name: "Putih Bersih", value: "#FFFFFF" },
  { name: "Hitam Klasik", value: "#17171A" },
  { name: "Merah Aksen", value: "#D93A2F" },
  { name: "Kuning Hangat", value: "#F2B705" },
  { name: "Hijau Daun", value: "#2E7D4F" },
  { name: "Biru Laut", value: "#2196F3" },
  { name: "Pink Pastel", value: "#FF80AB" },
  { name: "Ungu Lucu", value: "#9B5DE5" },
  { name: "Toska Cerah", value: "#00BBF9" },
  { name: "Coral Ceria", value: "#FF6B6B" },
  { name: "Mint Segar", value: "#06D6A0" },
  { name: "Oranye Permen", value: "#FF9F1C" },
  { name: "Coklat Susu", value: "#C89F73" },
  { name: "Navy Elegan", value: "#1D3557" },
  { name: "Lilac Lembut", value: "#CDB4DB" },
  { name: "Sage Estetik", value: "#A3B18A" },
  { name: "Maroon Hangat", value: "#6A040F" },
]

interface SwatchPickerProps {
  value: string
  onChange: (color: string) => void
}

export const SwatchPicker: React.FC<SwatchPickerProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {SWATCHES.map((s) => {
        const selected = value === s.value
        return (
          <button
            key={s.value}
            type="button"
            title={s.name}
            onClick={() => onChange(s.value)}
            className={`w-8 h-8 rounded-full border-2 border-[var(--color-ink)] transition-transform ${
              selected ? "scale-110 ring-2 ring-[var(--color-accent)] ring-offset-2" : "hover:scale-105"
            }`}
            style={{ backgroundColor: s.value }}
          />
        )
      })}
    </div>
  )
}