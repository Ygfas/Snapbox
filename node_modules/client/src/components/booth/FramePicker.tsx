import React, { useRef } from "react"
import { Upload, X, Check, ImagePlus } from "lucide-react"
import { FRAMES, CUSTOM_FRAME_ID } from "../../config/frames"

interface FramePickerProps {
  selectedFrameId: string | null
  onSelectFrame: (id: string | null) => void
  customBgDataUrl: string | null
  onCustomBgChange: (url: string | null) => void
}

function MiniPreview({ base, accent, accent2, pattern }: { base: string; accent: string; accent2: string; pattern: string }) {
  const box: React.CSSProperties = {
    backgroundColor: base,
    position: "relative",
    width: "100%",
    height: 44,
    borderRadius: 8,
    overflow: "hidden",
    border: "2px solid var(--color-ink)",
  }
  if (pattern === "solid") return <div style={box} />
  if (pattern === "dots") {
    return (
      <div style={box}>
        <div style={{ position: "absolute", inset: 6, display: "flex", gap: 4, alignItems: "center", justifyContent: "center" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: i % 2 === 0 ? accent : accent2 }} />
          ))}
        </div>
      </div>
    )
  }
  if (pattern === "stripes") {
    return (
      <div style={{ ...box, display: "flex" }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ flex: 1, backgroundColor: i % 2 === 0 ? base : accent }} />
        ))}
      </div>
    )
  }
  if (pattern === "checker") {
    return (
      <div style={{ ...box, display: "grid", gridTemplateColumns: "repeat(6,1fr)", gridTemplateRows: "repeat(2,1fr)" }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{ backgroundColor: i % 2 === 0 ? accent : base }} />
        ))}
      </div>
    )
  }
  if (pattern === "confetti") {
    const colors = [accent, accent2, "#F2B705", "#2E7D4F"]
    return (
      <div style={box}>
        <div style={{ position: "absolute", inset: 8, display: "flex", gap: 5, alignItems: "center", justifyContent: "center" }}>
          {colors.map((c, i) => (
            <div key={i} style={{ width: i % 2 === 0 ? 10 : 14, height: 8, borderRadius: i % 2 === 0 ? 999 : 2, backgroundColor: c }} />
          ))}
        </div>
      </div>
    )
  }
  if (pattern === "safari") {
    return (
      <div style={box}>
        <div style={{ height: 14, backgroundColor: accent, display: "flex", gap: 3, alignItems: "center", paddingLeft: 6 }}>
          {[accent2, "#FEBC2E", "#28C840"].map((c, i) => (
            <div key={i} style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: c }} />
          ))}
        </div>
        <div style={{ height: 10, backgroundColor: "#FFFFFF", margin: "4px 8px", borderRadius: 999 }} />
      </div>
    )
  }
  if (pattern === "film") {
    return (
      <div style={{ ...box, backgroundColor: "#111114", display: "flex", justifyContent: "space-between", padding: 6 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ width: 10, height: 7, borderRadius: 2, backgroundColor: "#F4EFE6" }} />
          ))}
        </div>
        <div style={{ width: 22, height: "100%", backgroundColor: "#2E2E34", borderRadius: 2 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ width: 10, height: 7, borderRadius: 2, backgroundColor: "#F4EFE6" }} />
          ))}
        </div>
      </div>
    )
  }
  if (pattern === "scallop" || pattern === "kawaii-border") {
    return (
      <div style={{ ...box, border: `5px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: i === 1 ? accent2 : accent }} />
        ))}
      </div>
    )
  }
  if (pattern === "hearts") {
    return (
      <div style={{ ...box, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        {[accent, accent2, accent].map((c, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: 999, backgroundColor: c }} />
        ))}
      </div>
    )
  }
  if (pattern === "stars") {
    return (
      <div style={{ ...box, backgroundColor: base, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
        {[accent, "#FFFFFF", accent].map((c, i) => (
          <div key={i} style={{ width: 10, height: 10, backgroundColor: c, transform: "rotate(45deg)", borderRadius: 2 }} />
        ))}
      </div>
    )
  }
  if (pattern === "zigzag") {
    return (
      <div style={{ ...box, display: "flex", flexDirection: "column", gap: 3, justifyContent: "center", padding: "0 8px" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ height: 5, borderRadius: 999, backgroundColor: i % 2 === 0 ? accent : accent2 }} />
        ))}
      </div>
    )
  }
  if (pattern === "grid") {
    return (
      <div style={{ ...box, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gridTemplateRows: "repeat(2,1fr)", gap: 2, padding: 6 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ backgroundColor: i % 3 === 0 ? accent : "#FFFFFF", borderRadius: 2 }} />
        ))}
      </div>
    )
  }
  if (pattern === "blobs") {
    return (
      <div style={box}>
        <div style={{ position: "absolute", left: 4, top: 4, width: 22, height: 22, borderRadius: 999, backgroundColor: accent }} />
        <div style={{ position: "absolute", right: 6, top: 8, width: 28, height: 28, borderRadius: 999, backgroundColor: accent2 }} />
        <div style={{ position: "absolute", left: 22, bottom: 4, width: 16, height: 16, borderRadius: 999, backgroundColor: "#FFFFFF" }} />
      </div>
    )
  }
  if (pattern === "rainbow-border") {
    const colors = ["#D93A2F", "#F2B705", "#2E7D4F", "#2196F3", "#7B2CBF"]
    return (
      <div style={{ ...box, display: "flex", padding: 4, gap: 2, backgroundColor: "#FFFFFF" }}>
        {colors.map((c, i) => (
          <div key={i} style={{ flex: 1, borderRadius: 4, backgroundColor: c }} />
        ))}
      </div>
    )
  }
  if (pattern === "retro-blocks") {
    return (
      <div style={box}>
        <div style={{ height: 12, backgroundColor: accent }} />
        <div style={{ height: 6, backgroundColor: accent2 }} />
        <div style={{ height: 14, backgroundColor: base }} />
        <div style={{ height: 12, backgroundColor: accent2 }} />
      </div>
    )
  }
  if (pattern === "waves") {
    return (
      <div style={box}>
        <div style={{ height: 14, backgroundColor: accent, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }} />
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 6 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: accent }} />
          ))}
        </div>
      </div>
    )
  }
  return <div style={box} />
}

export const FramePicker: React.FC<FramePickerProps> = ({
  selectedFrameId,
  onSelectFrame,
  customBgDataUrl,
  onCustomBgChange,
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => {
      const raw = String(reader.result ?? "")
      // Kecilkan agar hemat memori: max 1280px, JPEG 0.85
      const img = new Image()
      img.onload = () => {
        const maxW = 1280
        const scale = Math.min(1, maxW / img.width)
        const cw = Math.round(img.width * scale)
        const ch = Math.round(img.height * scale)
        const canvas = document.createElement("canvas")
        canvas.width = cw
        canvas.height = ch
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          onCustomBgChange(raw)
          onSelectFrame(CUSTOM_FRAME_ID)
          return
        }
        ctx.drawImage(img, 0, 0, cw, ch)
        const out = canvas.toDataURL("image/jpeg", 0.85)
        onCustomBgChange(out)
        onSelectFrame(CUSTOM_FRAME_ID)
        try {
          localStorage.setItem("snapbox-custom-bg", out)
        } catch {
          // abaikan bila kuota penuh
        }
      }
      img.src = raw
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const isCustomSelected = selectedFrameId === CUSTOM_FRAME_ID

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto overscroll-contain pr-1 pb-1 border-2 border-dashed border-[var(--color-line)] rounded-xl p-2 bg-[var(--color-bg)]/50">
        {FRAMES.map((f) => {
          const selected = selectedFrameId === f.id
          return (
            <button
              key={f.id}
              type="button"
              title={f.name}
              onClick={() => onSelectFrame(selected ? null : f.id)}
              className={`text-left rounded-xl border-2 p-1.5 transition-transform bg-[var(--color-surface)] ${
                selected
                  ? "border-[var(--color-accent)] shadow-[3px_3px_0_var(--color-accent)] scale-[1.02]"
                  : "border-[var(--color-ink)] hover:scale-[1.02]"
              }`}
            >
              <MiniPreview base={f.base} accent={f.accent} accent2={f.accent2} pattern={f.pattern} />
              <div className="flex items-center justify-between mt-1 px-0.5">
                <span className="text-[11px] font-bold truncate">{f.name}</span>
                {selected && <Check size={14} className="shrink-0 text-[var(--color-accent)]" />}
              </div>
            </button>
          )
        })}

        {/* Tile custom upload */}
        <button
          type="button"
          title="Custom BG dari foto lokal"
          onClick={() => fileRef.current?.click()}
          className={`text-left rounded-xl border-2 border-dashed p-1.5 transition-transform bg-[var(--color-surface)] ${
            isCustomSelected
              ? "border-[var(--color-accent)] shadow-[3px_3px_0_var(--color-accent)] scale-[1.02]"
              : "border-[var(--color-ink)] hover:scale-[1.02]"
          }`}
        >
          {customBgDataUrl ? (
            <img src={customBgDataUrl} alt="Custom BG" className="w-full h-[44px] object-cover rounded-lg border-2 border-[var(--color-ink)]" />
          ) : (
            <div className="w-full h-[44px] rounded-lg border-2 border-[var(--color-ink)] bg-[var(--color-line)]/40 flex items-center justify-center gap-1 text-[var(--color-muted)]">
              <ImagePlus size={18} />
              <Upload size={14} />
            </div>
          )}
          <div className="flex items-center justify-between mt-1 px-0.5">
            <span className="text-[11px] font-bold truncate">Custom Upload</span>
            {isCustomSelected ? (
              <Check size={14} className="shrink-0 text-[var(--color-accent)]" />
            ) : (
              <ImagePlus size={14} className="shrink-0 text-[var(--color-muted)]" />
            )}
          </div>
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {isCustomSelected && customBgDataUrl && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex-1 px-3 py-1.5 rounded-lg border-2 border-[var(--color-ink)] text-xs font-bold bg-[var(--color-surface)] hover:bg-[var(--color-line)]/40"
          >
            Ganti Gambar
          </button>
          <button
            type="button"
            onClick={() => {
              onCustomBgChange(null)
              onSelectFrame(null)
              try {
                localStorage.removeItem("snapbox-custom-bg")
              } catch {
                // abaikan
              }
            }}
            className="px-3 py-1.5 rounded-lg border-2 border-[var(--color-ink)] text-xs font-bold bg-[var(--color-surface)] flex items-center gap-1"
          >
            <X size={14} /> Hapus
          </button>
        </div>
      )}
      {!isCustomSelected && (
        <p className="text-[11px] text-[var(--color-muted)]">
          Pilih 1 dari 20 frame di atas, atau pakai foto sendiri via Custom Upload. Warna polos tetap bisa dipakai dari pilihan di atas.
        </p>
      )}
    </div>
  )
}