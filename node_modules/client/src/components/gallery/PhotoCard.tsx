import React from "react"
import { useObjectUrl } from "../../hooks/useObjectUrl"
import type { Capture } from "../../db/dexie"

interface PhotoCardProps {
  capture: Capture
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onOpenLightbox: (capture: Capture) => void
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  capture,
  isSelected,
  onToggleSelect,
  onOpenLightbox,
}) => {
  const thumbUrl = useObjectUrl(capture.thumb)

  function handleOpen() {
    onOpenLightbox(capture)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleOpen()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Buka preview foto ${capture.layout}`}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      className={`relative group rounded-xl border-4 border-[var(--color-ink)] bg-[var(--color-surface)] overflow-hidden cursor-pointer shadow-[4px_4px_0_var(--color-ink)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_var(--color-ink)] transition-all focus-visible:outline-none ${
        isSelected ? "ring-4 ring-[var(--color-accent)] ring-offset-2" : ""
      }`}
    >
      <div className="aspect-[3/4] bg-[var(--color-line)] flex items-center justify-center overflow-hidden">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt="Capture thumbnail"
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
        ) : (
          <span className="text-xs font-bold text-[var(--color-muted)]">Memuat...</span>
        )}
      </div>

      <div
        className="absolute top-3 right-3"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          aria-label="Pilih foto"
          checked={isSelected}
          onChange={() => onToggleSelect(capture.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-5 h-5 rounded border-2 border-[var(--color-ink)] accent-[var(--color-accent)] cursor-pointer"
        />
      </div>

      <div className="p-3 border-t-2 border-[var(--color-ink)] flex items-center justify-between text-xs">
        <span className="font-mono text-[var(--color-muted)]">
          {new Date(capture.createdAt).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span className="font-bold uppercase tracking-wider">{capture.layout}</span>
      </div>
    </div>
  )
}