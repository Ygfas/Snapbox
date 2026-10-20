import React from "react"
import { Button } from "../ui/Button"

interface CameraStageProps {
  videoRef: { current: HTMLVideoElement | null }
  mirror: boolean
  error: string | null
  isLoading: boolean
  onRetry: () => void
  flash: boolean
  filterCss?: string
  hasPlayed?: boolean
}

export const CameraStage: React.FC<CameraStageProps> = ({
  videoRef,
  mirror,
  error,
  isLoading,
  onRetry,
  flash,
  filterCss = "none",
  hasPlayed = false,
}) => {
  // Overlay penuh hanya saat pertama kali (belum pernah ada frame).
  // Setelah pernah jalan, frame terakhir tetap terlihat instan tanpa
  // layar hitam/loading lama — cukup badge kecil bila masih reconnect.
  const showFullLoader = isLoading && !error && !hasPlayed
  const showMiniBadge = isLoading && !error && hasPlayed
  return (
    <div className="relative w-full max-w-[800px] aspect-[4/3] rounded-2xl border-4 border-[var(--color-ink)] bg-black overflow-hidden shadow-[6px_6px_0_var(--color-ink)] flex items-center justify-center">
      {flash && <div className="absolute inset-0 bg-white z-40 pointer-events-none" />}

      {/* Video selalu di-mount agar srcObject + play() tidak hilang saat loading.
          Jangan conditional-unmount video, itu penyebab hitam + flicker. */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        disablePictureInPicture
        style={{ filter: filterCss && filterCss !== "" ? filterCss : undefined }}
        className={`w-full h-full object-cover bg-black ${mirror ? "scale-x-[-1]" : ""}`}
      />

      {/* Overlay penuh hanya sebelum kamera pernah menampilkan frame */}
      {showFullLoader && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--color-surface)]/90 pointer-events-none transition-opacity">
          <p className="font-semibold animate-pulse">Menyiapkan kamera...</p>
        </div>
      )}

      {/* Setelah pernah jalan: tanpa overlay hitam, cukup badge kecil */}
      {showMiniBadge && (
        <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-bold pointer-events-none animate-pulse">
          Menghubungkan...
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center bg-[var(--color-surface)]">
          <p className="text-[var(--color-danger)] font-bold mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onRetry}>Coba Lagi</Button>
          </div>
        </div>
      )}
    </div>
  )
}