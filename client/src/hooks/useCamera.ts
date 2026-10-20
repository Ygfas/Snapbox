import { useState, useEffect, useRef, useCallback } from "react"

export function useCamera(selectedDeviceId?: string) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mountedRef = useRef(true)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  // Setelah kamera pernah menampilkan frame, jangan tampilkan overlay
  // "Menyiapkan kamera..." lagi — frame terakhir langsung terlihat instan.
  const [hasPlayed, setHasPlayed] = useState<boolean>(false)
  const hasPlayedRef = useRef<boolean>(false)

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    // Jangan setStream(null) di sini agar tidak memicu loop effect.
    // State dibersihkan saat init baru / unmount.
  }, [])

  const initCamera = useCallback(async () => {
    if (!mountedRef.current) return
    setIsLoading(true)
    setError(null)

    // Hentikan stream lama sebelum minta yang baru
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      if (!mountedRef.current) {
        mediaStream.getTracks().forEach((t) => t.stop())
        return
      }
      streamRef.current = mediaStream
      setStream(mediaStream)

      // Enumerate setelah izin diberikan agar label terisi
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices()
        if (mountedRef.current) {
          setDevices(allDevices.filter((d) => d.kind === "videoinput"))
        }
      } catch {
        // abaikan, tidak fatal
      }

      // Attach langsung jika video sudah mount, sisanya ditangani effect di bawah.
      // isLoading tetap true sampai video benar-benar playing (lihat effect attach).
      const video = videoRef.current
      if (video) {
        video.srcObject = mediaStream
        try {
          await video.play()
        } catch {
          // play() bisa ditolak sebelum user gesture di sebagian browser;
          // biarkan muted+autoPlay mencoba lagi via effect. Jangan error dulu.
        }
      }
    } catch (err: unknown) {
      console.error("Camera access error:", err)
      const errorObj = err as { name?: string; message?: string }
      if (!mountedRef.current) return
      if (errorObj.name === "NotAllowedError" || errorObj.name === "PermissionDeniedError") {
        setError("Izin kamera ditolak. Berikan izin di browser Anda.")
      } else if (errorObj.name === "NotFoundError" || errorObj.name === "DevicesNotFoundError") {
        setError("Kamera tidak ditemukan pada perangkat ini.")
      } else if (errorObj.name === "NotReadableError" || errorObj.name === "TrackStartError") {
        setError("Kamera sedang digunakan oleh aplikasi lain.")
      } else if (errorObj.name === "OverconstrainedError") {
        setError("Kamera tidak mendukung resolusi yang diminta.")
      } else {
        setError("Gagal mengakses kamera: " + (errorObj.message || errorObj.name))
      }
      setIsLoading(false)
    }
  }, [selectedDeviceId, stopStream])

  // Attach stream ke <video> setiap kali stream / elemen berubah + tunggu playing
  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return

    if (video.srcObject !== stream) {
      video.srcObject = stream
    }

    const markPlayed = () => {
      hasPlayedRef.current = true
      setHasPlayed(true)
      setIsLoading(false)
    }

    let cancelled = false
    const handlePlaying = () => {
      if (!cancelled && mountedRef.current) markPlayed()
    }
    const handleCanPlay = () => {
      video.play().catch(() => {})
    }

    video.addEventListener("playing", handlePlaying)
    video.addEventListener("canplay", handleCanPlay)
    video.muted = true
    video.play().catch(() => {})

    // Fallback: jangan biarkan "Menyiapkan kamera..." nyangkut selamanya.
    // Jika dalam 4 detik belum playing tapi track hidup, tetap tampilkan video.
    const fallback = window.setTimeout(() => {
      if (!cancelled && mountedRef.current) {
        const trackLive = stream.getVideoTracks().some((t) => t.readyState === "live")
        if (trackLive) markPlayed()
      }
    }, 4000)

    return () => {
      cancelled = true
      window.clearTimeout(fallback)
      video.removeEventListener("playing", handlePlaying)
      video.removeEventListener("canplay", handleCanPlay)
    }
  }, [stream])

  useEffect(() => {
    mountedRef.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    initCamera()
    return () => {
      // Jangan stop track saat unmount (mis. pindah tab galeri) agar
      // kamera tetap hidup dan bisa langsung dipakai saat kembali ke booth.
      mountedRef.current = false
    }
    // Hanya init ulang saat device berubah, bukan saat stream berubah (cegah loop glitch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initCamera])

  const retry = useCallback(() => {
    initCamera()
  }, [initCamera])

  // Dipanggil saat kembali ke tab booth / selesai ambil foto: tempel ulang
  // stream yang masih hidup + play() senyap. Bila kamera sudah pernah jalan
  // (hasPlayed), TIDAK ada overlay loading — frame langsung terlihat instan.
  const ensureActive = useCallback(async () => {
    const video = videoRef.current
    const liveStream = streamRef.current
    if (!video) return
    // Jika tidak ada stream hidup sama sekali, init ulang penuh
    if (!liveStream || liveStream.getVideoTracks().every((t) => t.readyState !== "live")) {
      await initCamera()
      return
    }
    if (video.srcObject !== liveStream) {
      video.srcObject = liveStream
    }
    // Track mati (mis. browser menjeda saat tab hidden) -> init ulang
    const track = liveStream.getVideoTracks()[0]
    if (track && track.readyState !== "live") {
      await initCamera()
      return
    }
    // Jalur cepat: kamera sudah pernah jalan & video punya dimensi ->
    // cukup play() tanpa overlay loading sama sekali (instan, tanpa hitam lama).
    if (hasPlayedRef.current && video.videoWidth > 0 && video.videoHeight > 0) {
      setIsLoading(false)
      video.play().catch(() => {})
      return
    }
    video.play().catch(() => {})
    // Jika video sudah punya frame, langsung hilangkan loading
    if (video.readyState >= 2 && video.videoWidth > 0) {
      hasPlayedRef.current = true
      setHasPlayed(true)
      setIsLoading(false)
    } else {
      // Hanya tampilkan loading bila benar-benar belum pernah ada frame
      if (!hasPlayedRef.current) setIsLoading(true)
      const onPlaying = () => {
        hasPlayedRef.current = true
        setHasPlayed(true)
        setIsLoading(false)
        video.removeEventListener("playing", onPlaying)
      }
      video.addEventListener("playing", onPlaying)
      window.setTimeout(() => {
        video.removeEventListener("playing", onPlaying)
        if (video.readyState >= 2) {
          hasPlayedRef.current = true
          setHasPlayed(true)
          setIsLoading(false)
        }
      }, 3000)
    }
  }, [initCamera])

  return {
    videoRef,
    stream,
    devices,
    error,
    isLoading,
    hasPlayed,
    retry,
    ensureActive,
  }
}