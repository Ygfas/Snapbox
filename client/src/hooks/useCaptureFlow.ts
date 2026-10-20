import { useState, useRef, useCallback, useEffect } from "react"
import { LAYOUTS, type LayoutCode } from "../config/layouts"
import { composeCapture } from "../lib/compose"
import { createThumbnail } from "../lib/image"
import { FILTERS, type FilterId } from "../config/filters"
import type { Sticker } from "../db/dexie"

export type CaptureState =
  | "ready"
  | "countdown"
  | "capturing"
  | "reviewing"
  | "composing"
  | "result"

interface UseCaptureFlowProps {
  layoutCode: LayoutCode
  timerDuration: number
  mirror: boolean
  filter: FilterId
  frameColor: string
  frameId?: string | null
  customBgDataUrl?: string | null
  footerText: string
  videoRef: { current: HTMLVideoElement | null }
  onSaveCapture: (capture: {
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
  }) => Promise<void>
}

export function useCaptureFlow({
  layoutCode,
  timerDuration,
  mirror,
  filter,
  frameColor,
  frameId,
  customBgDataUrl,
  footerText,
  videoRef,
  onSaveCapture,
}: UseCaptureFlowProps) {
  const [state, setState] = useState<CaptureState>("ready")
  const [countdownValue, setCountdownValue] = useState<number>(timerDuration)
  const [currentShotIndex, setCurrentShotIndex] = useState<number>(0)
  const [shots, setShots] = useState<Blob[]>([])
  // Filter yang dipakai tiap shot (agar bisa ganti filter di antara jepretan manual)
  const [shotFilters, setShotFilters] = useState<FilterId[]>([])
  const [flash, setFlash] = useState<boolean>(false)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  // Pratinjau komposit SEBELUM disimpan — agar foto jelek bisa diganti dulu
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false)
  // Id galeri yang sudah tersimpan (agar simpan ulang = update, bukan duplikat)
  const [savedId, setSavedId] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const previewReqRef = useRef<number>(0)
  const previewCacheRef = useRef<{
    key: string
    blob: Blob
    width: number
    height: number
    url: string
  } | null>(null)
  // Ref agar callback async selalu baca filter terbaru (cegah stale closure)
  const filterRef = useRef<FilterId>(filter)
  const timerRef = useRef<number>(timerDuration)
  useEffect(() => {
    filterRef.current = filter
  }, [filter])
  useEffect(() => {
    timerRef.current = timerDuration
  }, [timerDuration])

  const layoutConfig = LAYOUTS[layoutCode]

  const captureSingleShot = useCallback(
    async (filterId?: FilterId): Promise<Blob> => {
      const video = videoRef.current
      if (!video) throw new Error("Video element not found")

      // Tunggu sampai video benar-benar punya frame (cegah hasil hitam).
      if (video.paused) {
        try {
          await video.play()
        } catch {
          // abaikan, lanjut ke pengecekan readyState
        }
      }
      if (video.readyState < 2 || video.videoWidth === 0) {
        await new Promise<void>((resolve) => {
          let done = false
          const finish = () => {
            if (done) return
            done = true
            video.removeEventListener("playing", finish)
            video.removeEventListener("canplay", finish)
            video.removeEventListener("loadeddata", finish)
            resolve()
          }
          if (video.readyState >= 2 && video.videoWidth > 0) {
            finish()
            return
          }
          video.addEventListener("playing", finish)
          video.addEventListener("canplay", finish)
          video.addEventListener("loadeddata", finish)
          window.setTimeout(finish, 2500)
        })
      }

      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error("Kamera belum siap. Tunggu video tampil lalu coba lagi.")
      }

      const canvas = document.createElement("canvas")
      canvas.width = 640
      canvas.height = 480
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas context not available")

      const vW = video.videoWidth || 640
      const vH = video.videoHeight || 480
      const vRatio = vW / vH
      const targetRatio = 4 / 3

      let sW = vW
      let sH = vH
      let sX = 0
      let sY = 0

      if (vRatio > targetRatio) {
        sW = vH * targetRatio
        sX = (vW - sW) / 2
      } else {
        sH = vW / targetRatio
        sY = (vH - sH) / 2
      }

      // Bake filter langsung ke shot agar tiap foto bisa beda filter
      // dan hasil tidak bergantung pada dukungan ctx.filter saat compose.
      const activeFilter = filterId ?? filterRef.current
      const cssFilter = FILTERS[activeFilter]?.cssFilter ?? "none"
      ctx.save()
      try {
        ctx.filter = cssFilter
      } catch {
        // browser lama tanpa ctx.filter: lanjut tanpa filter
      }

      if (mirror) {
        ctx.translate(640, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(video, sX, sY, sW, sH, 0, 0, 640, 480)
      } else {
        ctx.drawImage(video, sX, sY, sW, sH, 0, 0, 640, 480)
      }
      ctx.restore()

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b)
            else reject(new Error("Failed to capture shot"))
          },
          "image/jpeg",
          0.9
        )
      })
    },
    [videoRef, mirror]
  )

  const startCaptureSequence = useCallback(async () => {
    if (state !== "ready") return
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    const newShots: Blob[] = []
    const newFilters: FilterId[] = []
    const totalShots = layoutConfig.photoCount
    const duration = timerRef.current

    try {
      for (let i = 0; i < totalShots; i++) {
        setCurrentShotIndex(i)
        setState("countdown")

        for (let t = duration; t > 0; t--) {
          if (signal.aborted) return
          setCountdownValue(t)
          await new Promise((r) => setTimeout(r, 1000))
        }

        if (signal.aborted) return
        setState("capturing")
        setFlash(true)
        await new Promise((r) => setTimeout(r, 150))
        setFlash(false)

        // Kunci filter yang aktif saat jepretan ini diambil
        const shotFilter = filterRef.current
        const shotBlob = await captureSingleShot(shotFilter)
        newShots.push(shotBlob)
        newFilters.push(shotFilter)
        setShots([...newShots])
        setShotFilters([...newFilters])

        if (i < totalShots - 1) {
          await new Promise((r) => setTimeout(r, 1500))
        }
      }

      if (signal.aborted) return
      setState("reviewing")
    } catch (err) {
      console.error("Capture sequence error:", err)
      setState("ready")
    }
  }, [state, layoutConfig.photoCount, captureSingleShot])

  // Mode manual: ambil SATU foto per klik (dengan countdown), bisa ganti
  // filter/pengaturan di antara jepretan. Otomatis ke reviewing saat penuh.
  const takeOneShot = useCallback(async () => {
    if (state !== "ready") return
    const totalShots = layoutConfig.photoCount
    if (shots.length >= totalShots) {
      setState("reviewing")
      return
    }
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal
    const duration = timerRef.current

    try {
      setCurrentShotIndex(shots.length)
      setState("countdown")
      for (let t = duration; t > 0; t--) {
        if (signal.aborted) {
          setState("ready")
          return
        }
        setCountdownValue(t)
        await new Promise((r) => setTimeout(r, 1000))
      }
      if (signal.aborted) {
        setState("ready")
        return
      }
      setState("capturing")
      setFlash(true)
      await new Promise((r) => setTimeout(r, 150))
      setFlash(false)

      const shotFilter = filterRef.current
      const shotBlob = await captureSingleShot(shotFilter)
      const updated = [...shots, shotBlob]
      const updatedFilters = [...shotFilters, shotFilter]
      setShots(updated)
      setShotFilters(updatedFilters)
      setCurrentShotIndex(updated.length)

      if (updated.length >= totalShots) {
        setState("reviewing")
      } else {
        setState("ready")
      }
    } catch (err) {
      console.error("Manual capture error:", err)
      setState("ready")
    }
  }, [state, shots, shotFilters, layoutConfig.photoCount, captureSingleShot])

  // Slot yang sedang di-take ulang (untuk overlay loading di thumbnail)
  const [retakingIndex, setRetakingIndex] = useState<number | null>(null)

  const retakeSingleShot = useCallback(
    async (index: number) => {
      // Hanya dari reviewing & tidak sedang retake lain — cegah klik ganda
      if (state !== "reviewing" || retakingIndex !== null) return
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal
      const duration = timerRef.current
      try {
        setRetakingIndex(index)
        setCurrentShotIndex(index)
        // Countdown dulu agar pengguna sempat siap/pose (seperti ambil biasa)
        setState("countdown")
        for (let t = duration; t > 0; t--) {
          if (signal.aborted) return
          setCountdownValue(t)
          await new Promise((r) => setTimeout(r, 1000))
        }
        if (signal.aborted) return
        setState("capturing")
        setFlash(true)
        await new Promise((r) => setTimeout(r, 150))
        setFlash(false)
        if (signal.aborted) return

        // Retake memakai filter yang sedang aktif (boleh beda dari sebelumnya)
        const shotFilter = filterRef.current
        const shotBlob = await captureSingleShot(shotFilter)
        if (signal.aborted) return
        setShots((prev) => {
          const updated = [...prev]
          updated[index] = shotBlob
          return updated
        })
        setShotFilters((prev) => {
          const updated = [...prev]
          updated[index] = shotFilter
          return updated
        })
        setState("reviewing")
      } catch (err) {
        // Jangan pernah nyangkut di countdown/capturing — kembali ke review
        console.error("Retake error:", err)
        if (!signal.aborted) setState("reviewing")
      } finally {
        setRetakingIndex(null)
      }
    },
    [state, retakingIndex, captureSingleShot]
  )

  // Batalkan retake saja (kembali ke review, shots utuh) — untuk tombol Esc
  // saat countdown retake, agar tidak menghapus semua foto seperti cancelSession.
  const abortRetake = useCallback(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort()
    setRetakingIndex(null)
    setState("reviewing")
  }, [])

  function buildPreviewKey(): string {
    return [
      layoutCode,
      shots.length,
      shots.map((s) => s.size).join(","),
      shotFilters.join(","),
      frameColor,
      frameId ?? "",
      (customBgDataUrl ?? "").slice(0, 64),
      (customBgDataUrl ?? "").length,
      footerText,
      filter,
    ].join("|")
  }

  // Susun pratinjau komposit TANPA menyimpan — dipanggil otomatis setiap
  // masuk reviewing / ada perubahan shot, agar foto jelek bisa diganti dulu.
  const refreshPreview = useCallback(async () => {
    if (shots.length === 0) return
    const key = buildPreviewKey()
    const cached = previewCacheRef.current
    if (cached && cached.key === key) {
      setPreviewUrl(cached.url)
      return
    }
    const req = ++previewReqRef.current
    setIsPreviewLoading(true)
    try {
      const { blob, width, height } = await composeCapture({
        shots,
        layout: layoutCode,
        frameColor,
        frameId: frameId ?? undefined,
        customBgDataUrl: customBgDataUrl ?? null,
        footerText,
        filter,
        shotFilters,
        mirror: false,
      })
      if (previewReqRef.current !== req) return // request basi, abaikan
      const url = URL.createObjectURL(blob)
      const old = previewCacheRef.current
      if (old) URL.revokeObjectURL(old.url)
      previewCacheRef.current = { key, blob, width, height, url }
      setPreviewUrl(url)
    } catch (err) {
      console.error("Preview compose error:", err)
    } finally {
      if (previewReqRef.current === req) setIsPreviewLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shots, shotFilters, layoutCode, frameColor, frameId, customBgDataUrl, footerText, filter])

  // Otomatis susun ulang pratinjau saat reviewing dan ada perubahan
  useEffect(() => {
    if (state !== "reviewing") return undefined
    refreshPreview()
    return undefined
  }, [state, refreshPreview])

  function clearPreview() {
    previewReqRef.current += 1
    const cached = previewCacheRef.current
    if (cached) URL.revokeObjectURL(cached.url)
    previewCacheRef.current = null
    setPreviewUrl(null)
    setIsPreviewLoading(false)
  }

  const confirmReviewAndCompose = useCallback(async () => {
    setState("composing")
    try {
      // Pakai ulang pratinjau bila masih cocok agar simpan instan,
      // jika tidak cocok susun ulang dari shots terbaru.
      const key = buildPreviewKey()
      const cached = previewCacheRef.current
      let blob: Blob
      let width: number
      let height: number
      if (cached && cached.key === key) {
        blob = cached.blob
        width = cached.width
        height = cached.height
      } else {
        const composed = await composeCapture({
          shots,
          layout: layoutCode,
          frameColor,
          frameId: frameId ?? undefined,
          customBgDataUrl: customBgDataUrl ?? null,
          footerText,
          filter,
          shotFilters,
          mirror: false,
        })
        blob = composed.blob
        width = composed.width
        height = composed.height
      }

      const thumb = await createThumbnail(blob, 320)
      const style = { frameColor, frameId, customBgDataUrl, footerText, filter, stickers: [] }

      // Pakai id yang sama bila sudah pernah disimpan (edit ulang) agar
      // tidak duplikat di galeri — App melakukan upsert by id.
      const id = savedId ?? crypto.randomUUID()
      await onSaveCapture({
        id,
        composite: blob,
        thumb,
        shots,
        layout: layoutCode,
        style,
        width,
        height,
        bytes: blob.size,
      })
      setSavedId(id)

      if (resultUrl) URL.revokeObjectURL(resultUrl)
      setResultBlob(blob)
      setResultUrl(URL.createObjectURL(blob))
      setState("result")
    } catch (err) {
      console.error("Compose error:", err)
      setState("reviewing")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shots, shotFilters, layoutCode, frameColor, frameId, customBgDataUrl, footerText, filter, onSaveCapture, resultUrl])

  // Kembali dari result ke reviewing untuk edit lagi (shots utuh,
  // simpan ulang akan update record yang sama — tidak duplikat).
  const backToReview = useCallback(() => {
    if (resultUrl) URL.revokeObjectURL(resultUrl)
    setResultBlob(null)
    setResultUrl(null)
    setState("reviewing")
  }, [resultUrl])

  const cancelSession = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    clearPreview()
    setSavedId(null)
    setState("ready")
    setShots([])
    setShotFilters([])
    setCurrentShotIndex(0)
  }, [])

  const resetToReady = useCallback(() => {
    if (resultUrl) URL.revokeObjectURL(resultUrl)
    setResultBlob(null)
    setResultUrl(null)
    clearPreview()
    setSavedId(null)
    setShots([])
    setShotFilters([])
    setCurrentShotIndex(0)
    setState("ready")
  }, [resultUrl])

  return {
    state,
    countdownValue,
    currentShotIndex,
    shots,
    shotFilters,
    flash,
    resultBlob,
    resultUrl,
    previewUrl,
    isPreviewLoading,
    refreshPreview,
    retakingIndex,
    startCaptureSequence,
    takeOneShot,
    retakeSingleShot,
    abortRetake,
    confirmReviewAndCompose,
    backToReview,
    cancelSession,
    resetToReady,
  }
}