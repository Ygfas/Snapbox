import React, { useState } from "react"
import { FILTERS, type FilterId } from "../../config/filters"
import { useObjectUrl } from "../../hooks/useObjectUrl"
import { Dialog } from "../ui/Dialog"

interface ShotStripProps {
  shots: Blob[]
  total: number
  _currentIndex: number
  isReviewing?: boolean
  onRetake?: (index: number) => void
  shotFilters?: FilterId[]
  retakingIndex?: number | null
  disableRetake?: boolean
}

export const ShotStrip: React.FC<ShotStripProps> = ({
  shots,
  total,
  _currentIndex,
  isReviewing = false,
  onRetake,
  shotFilters,
  retakingIndex = null,
  disableRetake = false,
}) => {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const previewBlob = previewIndex !== null ? shots[previewIndex] : null
  const previewUrl = useObjectUrl(previewBlob || null)
  const previewFilter: FilterId | undefined =
    previewIndex !== null ? shotFilters?.[previewIndex] : undefined

  return (
    <>
      <div className="flex gap-3 overflow-x-auto py-2">
        {Array.from({ length: total }).map((_, idx) => {
          const blob = shots[idx]
          const isRetaking = retakingIndex === idx
          const showRetake = isReviewing && !!blob && !!onRetake
          return (
            <div key={idx} className="flex flex-col items-center gap-1 shrink-0 w-24">
              <ShotThumb
                blob={blob}
                index={idx}
                isActive={!isReviewing && idx === _currentIndex}
                isRetaking={isRetaking}
                filterCss={FILTERS[shotFilters?.[idx] ?? "normal"]?.cssFilter ?? "none"}
                onPreview={() => {
                  // Jangan buka preview saat retake berjalan (cegah glitch)
                  if (blob && retakingIndex === null) setPreviewIndex(idx)
                }}
              />
              {/* Tombol Ulangi di BAWAH thumbnail (terpisah dari area preview)
                  agar klik preview tidak kepencet ulangi. */}
              <div className="h-6 flex items-center justify-center w-full">
                {showRetake &&
                  (isRetaking ? (
                    <span className="text-[10px] font-bold text-[var(--color-danger)] animate-pulse">
                      Memotret...
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={disableRetake}
                      onClick={() => onRetake(idx)}
                      aria-label={`Ulangi foto ${idx + 1}`}
                      className="w-full text-[10px] font-bold py-1 rounded-md border-2 border-[var(--color-ink)] bg-[var(--color-surface)] hover:bg-[var(--color-danger)] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Ulangi
                    </button>
                  ))}
              </div>
            </div>
          )
        })}
      </div>

      <Dialog
        isOpen={previewIndex !== null && !!previewBlob}
        onClose={() => setPreviewIndex(null)}
        title={previewIndex !== null ? `Preview Foto ${previewIndex + 1}` : "Preview Foto"}
        size="lg"
      >
        <div className="flex items-center justify-center min-h-[30vh] bg-[var(--color-line)]/30 rounded-lg overflow-hidden">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={`Preview shot ${(previewIndex ?? 0) + 1}`}
              style={{
                filter:
                  previewFilter && FILTERS[previewFilter]
                    ? FILTERS[previewFilter].cssFilter
                    : undefined,
              }}
              className="max-h-[60vh] w-auto object-contain rounded-lg border-2 border-[var(--color-ink)]"
            />
          ) : (
            <p className="text-sm font-bold text-[var(--color-muted)] animate-pulse p-8">
              Memuat preview...
            </p>
          )}
        </div>
        {isReviewing && previewIndex !== null && onRetake && !disableRetake && (
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => {
                onRetake(previewIndex)
                setPreviewIndex(null)
              }}
              className="px-4 py-2 rounded-lg border-2 border-[var(--color-ink)] bg-[var(--color-danger)] text-white text-sm font-bold"
            >
              Ulangi Foto Ini
            </button>
          </div>
        )}
      </Dialog>
    </>
  )
}

function ShotThumb({
  blob,
  index,
  isActive,
  isRetaking = false,
  onPreview,
  filterCss = "none",
}: {
  blob?: Blob
  index: number
  isActive: boolean
  isRetaking?: boolean
  onPreview?: () => void
  filterCss?: string
}) {
  const url = useObjectUrl(blob || null)

  return (
    <div
      role={blob ? "button" : undefined}
      tabIndex={blob ? 0 : undefined}
      aria-label={blob ? `Buka preview foto ${index + 1}` : `Slot foto ${index + 1} kosong`}
      onClick={() => {
        if (blob && onPreview) onPreview()
      }}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && blob && onPreview) {
          e.preventDefault()
          onPreview()
        }
      }}
      title={blob ? "Klik untuk preview" : undefined}
      className={`relative w-24 aspect-[4/3] rounded-lg border-2 border-[var(--color-ink)] bg-[var(--color-surface)] overflow-hidden flex items-center justify-center shrink-0 ${
        blob ? "cursor-pointer hover:ring-2 hover:ring-[var(--color-accent)]" : ""
      } ${isActive ? "ring-4 ring-[var(--color-accent)] ring-offset-2" : ""} ${
        isRetaking ? "ring-4 ring-[var(--color-danger)] ring-offset-2" : ""
      }`}
    >
      {url ? (
        <img
          src={url}
          alt={`Shot ${index + 1}`}
          style={{ filter: filterCss !== "none" ? filterCss : undefined }}
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
      ) : (
        <span className="text-xs font-bold text-[var(--color-muted)]">{index + 1}</span>
      )}

      {/* Overlay slot yang sedang di-take ulang */}
      {isRetaking && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 pointer-events-none">
          <span className="text-white text-[10px] font-bold animate-pulse px-2 text-center">
            Memotret...
          </span>
        </div>
      )}
    </div>
  )
}