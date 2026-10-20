import { useEffect, useState, useCallback } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { Play, Camera } from "lucide-react"
import { db, type Sticker } from "./db/dexie"
import { useUIStore } from "./store/ui.store"
import { useCamera } from "./hooks/useCamera"
import { useCaptureFlow } from "./hooks/useCaptureFlow"
import { useHotkeys } from "./hooks/useHotkeys"
import { TopBar } from "./components/shell/TopBar"
import { Sidebar } from "./components/shell/Sidebar"
import { ShortcutHelp } from "./components/shell/ShortcutHelp"
import { CameraStage } from "./components/booth/CameraStage"
import { LayoutPicker } from "./components/booth/LayoutPicker"
import { Countdown } from "./components/booth/Countdown"
import { ShotStrip } from "./components/booth/ShotStrip"
import { ResultView } from "./components/booth/ResultView"
import { GalleryGrid } from "./components/gallery/GalleryGrid"
import { Button } from "./components/ui/Button"
import { Segmented } from "./components/ui/Segmented"
import { Switch } from "./components/ui/Switch"
import { SwatchPicker } from "./components/ui/SwatchPicker"
import { FramePicker } from "./components/booth/FramePicker"
import { Kbd } from "./components/ui/Kbd"
import { LAYOUTS, type LayoutCode } from "./config/layouts"
import { FILTERS, type FilterId } from "./config/filters"

type CaptureMode = "auto" | "manual"

export function App() {
  const {
    activeTab,
    setActiveTab,
    activeSectionId,
    setActiveSectionId,
    layoutCode,
    setLayoutCode,
    timerDuration,
    setTimerDuration,
    mirror,
    setMirror,
    filter,
    setFilter,
    frameColor,
    setFrameColor,
    frameId,
    setFrameId,
    customBgDataUrl,
    setCustomBgDataUrl,
    footerText,
    setFooterText,
    setIsHelpOpen,
  } = useUIStore()

  const sections = useLiveQuery(() => db.sections.toArray()) || []
  const firstSectionId = sections[0]?.id

  // Mode pengambilan: auto (langsung semua) atau manual (satu per satu,
  // bisa ganti filter/pengaturan di antara jepretan)
  const [captureMode, setCaptureMode] = useState<CaptureMode>("auto")

  // Ensure default section on mount
  useEffect(() => {
    async function initDefaultSection() {
      const count = await db.sections.count()
      if (count === 0) {
        const id = crypto.randomUUID()
        const now = Date.now()
        await db.sections.add({ id, name: "Sesi 1", createdAt: now, updatedAt: now })
        setActiveSectionId(id)
      } else if (!activeSectionId && firstSectionId) {
        setActiveSectionId(firstSectionId)
      }
    }
    initDefaultSection()
  }, [activeSectionId, firstSectionId, setActiveSectionId])

  const {
    videoRef,
    error: camError,
    isLoading: camLoading,
    hasPlayed: camHasPlayed,
    retry: camRetry,
    ensureActive: camEnsureActive,
  } = useCamera()

  // Upsert by id: simpan baru = insert, simpan ulang setelah edit = update
  // (tidak duplikat di galeri).
  const handleSaveCapture = useCallback(
    async (captureData: {
      id: string
      composite: Blob
      thumb: Blob
      shots: Blob[]
      layout: LayoutCode
      style: {
        frameColor: string
        footerText: string
        filter: FilterId
        stickers: Sticker[]
        frameId?: string | null
        customBgDataUrl?: string | null
      }
      width: number
      height: number
      bytes: number
    }) => {
      const existing = await db.captures.get(captureData.id)
      const now = Date.now()
      await db.captures.put({
        sectionId: activeSectionId,
        createdAt: existing?.createdAt ?? now,
        ...captureData,
      })
    },
    [activeSectionId]
  )

  const {
    state: captureState,
    countdownValue,
    shots,
    shotFilters,
    flash,
    resultBlob,
    resultUrl,
    previewUrl,
    isPreviewLoading,
    retakingIndex,
    startCaptureSequence,
    takeOneShot,
    retakeSingleShot,
    abortRetake,
    confirmReviewAndCompose,
    backToReview,
    cancelSession,
    resetToReady,
  } = useCaptureFlow({
    layoutCode,
    timerDuration,
    mirror,
    filter,
    frameColor,
    frameId,
    customBgDataUrl,
    footerText,
    videoRef,
    onSaveCapture: handleSaveCapture,
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem("snapbox-custom-bg")
      if (saved && !customBgDataUrl) setCustomBgDataUrl(saved)
    } catch {
      // abaikan
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalShots = LAYOUTS[layoutCode].photoCount
  const filterCss = FILTERS[filter]?.cssFilter ?? "none"
  const isResult = captureState === "result"

  // Kamera + video TIDAK PERNAH di-unmount (baik saat ke galeri maupun saat
  // result view) sehingga tidak ada blackscreen lama. ensureActive dipanggil
  // langsung tanpa delay; bila sudah pernah jalan, ia hanya play() senyap.
  useEffect(() => {
    if (activeTab !== "booth") return undefined
    camEnsureActive()
    return undefined
  }, [activeTab, camEnsureActive])
  useEffect(() => {
    if (activeTab === "booth" && !isResult) camEnsureActive()
    return undefined
  }, [isResult, activeTab, camEnsureActive])

  function handleStartCapture() {
    if (captureMode === "manual") {
      takeOneShot()
    } else {
      startCaptureSequence()
    }
  }

  // Hotkeys mapping
  useHotkeys({
    onToggleHelp: () => setIsHelpOpen(true),
    onBooth: () => setActiveTab("booth"),
    onGallery: () => setActiveTab("gallery"),
    onNewSection: () => {
      // handled in sidebar or trigger
    },
    onFullscreen: () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {})
      } else if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    },
    onEscape: () => {
      setIsHelpOpen(false)
      // Esc saat retake = batalkan retake saja (foto lain aman),
      // selain itu batalkan sesi seperti biasa.
      if (retakingIndex !== null) {
        abortRetake()
      } else {
        cancelSession()
      }
    },
    onStartCapture: () => {
      if (activeTab === "booth" && captureState === "ready") {
        handleStartCapture()
      } else if (captureState === "reviewing") {
        confirmReviewAndCompose()
      }
    },
    onSelectLayout: (code) => {
      const map: Record<string, LayoutCode> = { "1": "1", "2": "2v", "3": "3v", "4": "4v" }
      if (map[code]) setLayoutCode(map[code])
    },
    onCycleTimer: () => {
      const timers = [3, 5, 10]
      const next = timers[(timers.indexOf(timerDuration) + 1) % timers.length]
      setTimerDuration(next)
    },
    onToggleMirror: () => setMirror(!mirror),
    onCycleFilter: () => {
      const filterKeys = Object.keys(FILTERS) as FilterId[]
      const next = filterKeys[(filterKeys.indexOf(filter) + 1) % filterKeys.length]
      setFilter(next)
    },
    onRetakeResult: resetToReady,
    onDownloadResult: () => {
      if (resultUrl) {
        const a = document.createElement("a")
        a.href = resultUrl
        a.download = `snapbox_${Date.now()}.jpg`
        a.click()
      }
    },
  })

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-bg)] font-sans text-[var(--color-ink)] select-none">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Booth & galeri SELALU di-mount. Sembunyikan pakai visibility
              (bukan display:none) agar <video> tetap decode frame di
              background — saat kembali, gambar kamera langsung terlihat
              instan tanpa blackscreen lama. */}
          <div
            className={`flex-1 flex-col lg:flex-row gap-6 p-6 overflow-y-auto items-start justify-start lg:justify-center lg:items-start ${
              activeTab === "booth" ? "flex visible static" : "flex invisible absolute inset-0 pointer-events-none"
            }`}
          >
            {/* Konten booth tetap mount saat result (invisible) agar video
                tidak unmount — "Ambil Lagi" langsung tampil tanpa menunggu. */}
            <div
              className={
                isResult
                  ? "invisible absolute inset-0 pointer-events-none overflow-hidden"
                  : "contents"
              }
            >
                <div className="flex flex-col items-center gap-4 flex-1">
                  <div className="relative">
                    <CameraStage
                      videoRef={videoRef}
                      mirror={mirror}
                      error={camError}
                      isLoading={camLoading}
                      hasPlayed={camHasPlayed}
                      onRetry={camRetry}
                      flash={flash}
                      filterCss={filterCss}
                    />
                    {captureState === "countdown" && <Countdown value={countdownValue} />}
                  </div>

                  <div className="w-full max-w-[800px]">
                    <ShotStrip
                      shots={shots}
                      total={totalShots}
                      _currentIndex={shots.length}
                      isReviewing={captureState === "reviewing" || retakingIndex !== null}
                      onRetake={retakeSingleShot}
                      shotFilters={shotFilters}
                      retakingIndex={retakingIndex}
                      disableRetake={retakingIndex !== null}
                    />
                    {captureMode === "manual" && captureState === "ready" && shots.length > 0 && (
                      <p className="text-xs text-center text-[var(--color-muted)] mt-1">
                        {shots.length}/{totalShots} foto diambil — ganti filter/pengaturan lalu
                        ambil lagi, atau batalkan sesi untuk ulang dari awal.
                      </p>
                    )}
                  </div>
                </div>

                <div className="w-full lg:w-96 flex flex-col gap-6 p-6 rounded-2xl border-4 border-[var(--color-ink)] bg-[var(--color-surface)] shadow-[6px_6px_0_var(--color-ink)]">
                  {retakingIndex !== null ? (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold">
                        Foto Ulang {retakingIndex + 1}/{totalShots}
                      </h2>
                      <p className="text-sm text-[var(--color-muted)]">
                        Siap-siap di depan kamera — foto slot ini akan diganti. Pratinjau
                        diperbarui otomatis setelah jepretan.
                      </p>
                      <Button onClick={abortRetake} variant="outline" className="w-full">
                        Batalkan Ulangi <Kbd>Esc</Kbd>
                      </Button>
                    </div>
                  ) : captureState === "reviewing" ? (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold">Review & Edit Foto</h2>
                      {/* Pratinjau layout SEBELUM disimpan — foto jelek bisa
                          diganti dulu via tombol Ulangi di thumbnail. */}
                      <div className="flex items-center justify-center min-h-[180px] max-h-[38vh] overflow-hidden rounded-lg border-2 border-[var(--color-ink)] bg-[var(--color-line)]/30">
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Pratinjau layout"
                            className="max-h-[38vh] w-auto object-contain"
                          />
                        ) : (
                          <p className="text-xs font-bold text-[var(--color-muted)] animate-pulse p-6 text-center">
                            {isPreviewLoading
                              ? "Menyusun pratinjau..."
                              : "Menyiapkan pratinjau..."}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-muted)]">
                        Ada foto yang jelek? Klik{" "}
                        <span className="font-bold">Ulangi</span> pada thumbnail di bawah
                        untuk foto ulang slot itu — pratinjau ikut diperbarui otomatis.
                      </p>
                      <Button onClick={confirmReviewAndCompose} size="lg" className="w-full">
                        Simpan ke Galeri <Kbd>Enter</Kbd>
                      </Button>
                      <Button onClick={cancelSession} variant="outline" className="w-full">
                        Batalkan Sesi <Kbd>Esc</Kbd>
                      </Button>
                    </div>
                  ) : captureState === "composing" ? (
                    <div className="py-12 text-center space-y-4">
                      <p className="font-bold text-lg animate-pulse">Menyusun foto...</p>
                    </div>
                  ) : (
                    <>
                      <LayoutPicker layoutCode={layoutCode} onSelectLayout={setLayoutCode} />

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                          Mode Pengambilan
                        </label>
                        <Segmented
                          options={[
                            { value: "auto", label: "Otomatis Semua" },
                            { value: "manual", label: "Satu per Satu" },
                          ]}
                          value={captureMode}
                          onChange={(v) => setCaptureMode(v as CaptureMode)}
                        />
                        <p className="text-[11px] text-[var(--color-muted)]">
                          {captureMode === "auto"
                            ? "Sekali klik langsung ambil semua foto berurutan."
                            : "Ambil satu foto per klik — bebas ganti filter/pengaturan di antara jepretan."}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                          Timer Hitung Mundur
                        </label>
                        <Segmented
                          options={[
                            { value: "3", label: "3 Detik" },
                            { value: "5", label: "5 Detik" },
                            { value: "10", label: "10 Detik" },
                          ]}
                          value={String(timerDuration)}
                          onChange={(v) => setTimerDuration(Number(v))}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                          Filter Kamera
                        </label>
                        <select
                          value={filter}
                          onChange={(e) => setFilter(e.target.value as FilterId)}
                          className="w-full px-3 py-2 rounded-lg border-2 border-[var(--color-ink)] bg-[var(--color-surface)] font-medium"
                        >
                          {Object.entries(FILTERS).map(([key, f]) => (
                            <option key={key} value={key}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                          Warna Bingkai
                        </label>
                        <SwatchPicker value={frameColor} onChange={setFrameColor} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                          Frame Unik (20 + Custom)
                        </label>
                        <FramePicker
                          selectedFrameId={frameId}
                          onSelectFrame={setFrameId}
                          customBgDataUrl={customBgDataUrl}
                          onCustomBgChange={setCustomBgDataUrl}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                          Teks Footer Kustom
                        </label>
                        <input
                          type="text"
                          maxLength={40}
                          value={footerText}
                          onChange={(e) => setFooterText(e.target.value)}
                          placeholder="Contoh: Ulang Tahun Andi"
                          className="w-full px-3 py-2 rounded-lg border-2 border-[var(--color-ink)] bg-[var(--color-surface)] font-medium text-sm"
                        />
                      </div>

                      <div className="pt-2">
                        <Switch
                          checked={mirror}
                          onChange={setMirror}
                          label="Cermin Kamera (Mirror)"
                        />
                      </div>

                      {captureMode === "manual" ? (
                        <div className="space-y-2 mt-4">
                          <Button
                            onClick={takeOneShot}
                            size="lg"
                            className="w-full"
                            disabled={captureState !== "ready"}
                          >
                            <Camera size={20} /> Ambil Foto {shots.length + 1}/{totalShots}{" "}
                            <Kbd>Space</Kbd>
                          </Button>
                          {shots.length > 0 && (
                            <Button
                              onClick={cancelSession}
                              variant="outline"
                              className="w-full"
                            >
                              Batalkan Sesi <Kbd>Esc</Kbd>
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button
                          onClick={startCaptureSequence}
                          size="lg"
                          className="w-full mt-4"
                          disabled={captureState !== "ready"}
                        >
                          <Play size={20} /> Mulai Foto <Kbd>Space</Kbd>
                        </Button>
                      )}
                    </>
                  )}
                </div>
            </div>

            {isResult && (
              <ResultView
                resultUrl={resultUrl}
                resultBlob={resultBlob}
                onRetakeAll={resetToReady}
                onBackToReview={backToReview}
              />
            )}
          </div>

          {/* Galeri selalu mount, visibility-hiding agar video booth tetap decode */}
          <div
            className={`flex-1 flex-col overflow-hidden ${
              activeTab === "gallery"
                ? "flex visible static"
                : "flex invisible absolute inset-0 pointer-events-none"
            }`}
          >
            <GalleryGrid />
          </div>
        </main>
      </div>

      <ShortcutHelp />
    </div>
  )
}

export default App