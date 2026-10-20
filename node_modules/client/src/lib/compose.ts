import { getLayoutMetrics, type LayoutCode } from "../config/layouts"
import { FILTERS, type FilterId } from "../config/filters"
import { APP_NAME } from "../config/constants"
import { getFrameById, isCustomFrameId } from "../config/frames"
import type { Sticker } from "../db/dexie"

interface ComposeOptions {
  shots: Blob[]
  layout: LayoutCode
  frameColor: string
  footerText: string
  filter: FilterId
  // Filter per-shot (sudah di-bake saat capture). Jika diisi, compose tidak
  // menerapkan filter global lagi agar tidak double.
  shotFilters?: FilterId[]
  stickers?: Sticker[]
  mirror?: boolean
  frameId?: string
  customBgDataUrl?: string | null
  customBgBlob?: Blob | null
}

export async function composeCapture({
  shots,
  layout,
  frameColor,
  footerText,
  filter,
  shotFilters,
  stickers = [],
  mirror = false,
  frameId,
  customBgDataUrl,
  customBgBlob,
}: ComposeOptions): Promise<{ blob: Blob; width: number; height: number }> {
  const metrics = getLayoutMetrics(layout)
  const frame = frameId ? getFrameById(frameId) : undefined
  const isCustom = frameId ? isCustomFrameId(frameId) : false
  const baseColor = frame ? frame.base : frameColor
  const inkColor = frame ? frame.ink : getContrastColor(frameColor)

  // Safari butuh ruang ekstra di atas untuk bar browser agar foto + footer tidak terdorong
  const isSafari = frame?.pattern === "safari"
  const safariTopH = isSafari ? 96 : 0
  const fullW = metrics.width
  const fullH = metrics.height + safariTopH

  const canvas = document.createElement("canvas")
  canvas.width = fullW
  canvas.height = fullH
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Canvas context not available")
  }

  // Background: custom image / frame pattern / solid
  if (isCustom && (customBgDataUrl || customBgBlob)) {
    const url =
      customBgDataUrl ?? (customBgBlob ? URL.createObjectURL(customBgBlob) : null)
    const shouldRevoke = !customBgDataUrl && !!customBgBlob
    if (url) {
      try {
        const bgImg = await loadImage(url)
        drawCover(ctx, bgImg, 0, 0, fullW, fullH)
        // Lapisan solid tipis agar foto tetap terbaca bila bg ramai
        ctx.save()
        ctx.fillStyle = "rgba(255,255,255,0.08)"
        ctx.fillRect(0, 0, fullW, fullH)
        ctx.restore()
      } catch {
        ctx.fillStyle = frameColor
        ctx.fillRect(0, 0, fullW, fullH)
      } finally {
        if (shouldRevoke && url.startsWith("blob:")) URL.revokeObjectURL(url)
      }
    } else {
      ctx.fillStyle = frameColor
      ctx.fillRect(0, 0, fullW, fullH)
    }
  } else if (frame) {
    await drawFrameBackground(ctx, fullW, fullH, frame.base, frame.pattern, frame.accent, frame.accent2)
  } else {
    // Solid background (kompatibel lama)
    ctx.fillStyle = frameColor
    ctx.fillRect(0, 0, fullW, fullH)
  }

  // Safari chrome digambar setelah bg tapi sebelum foto agar foto tidak menutup bar
  if (isSafari && frame) {
    drawSafariChrome(ctx, fullW, frame.accent, frame.accent2)
  }

  const filterConfig = FILTERS[filter] || FILTERS.normal

  // Load and draw each shot (geser ke bawah bila ada bar safari)
  for (let i = 0; i < metrics.cellPositions.length; i++) {
    const pos = metrics.cellPositions[i]
    const shotBlob = shots[i]
    if (!shotBlob) continue

    const url = URL.createObjectURL(shotBlob)
    try {
      const img = await loadImage(url)
      ctx.save()
      ctx.beginPath()
      const dy = safariTopH
      ctx.rect(pos.x, pos.y + dy, metrics.cellWidth, metrics.cellHeight)
      ctx.clip()

      // Shots baru sudah di-bake dengan filter masing-masing saat capture,
      // jadi jangan timpa dengan filter global (cegah double-filter).
      // Fallback ke filter global hanya untuk sesi lama tanpa shotFilters.
      const hasBakedFilters = shotFilters && shotFilters.length === shots.length
      ctx.filter = hasBakedFilters ? "none" : filterConfig.cssFilter

      if (mirror) {
        ctx.translate(pos.x + metrics.cellWidth, pos.y + dy)
        ctx.scale(-1, 1)
        drawCover(ctx, img, 0, 0, metrics.cellWidth, metrics.cellHeight)
      } else {
        drawCover(ctx, img, pos.x, pos.y + dy, metrics.cellWidth, metrics.cellHeight)
      }

      ctx.restore()
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  // Bingkai tebal untuk pola yang butuh outline luar (digambar setelah foto)
  if (frame && (frame.pattern === "rainbow-border" || frame.pattern === "kawaii-border")) {
    drawOuterBorder(ctx, fullW, fullH, frame.pattern, frame.accent, frame.accent2, baseColor)
  }
  if (frame && frame.pattern === "film") {
    drawFilmHoles(ctx, fullW, fullH)
  }

  // Draw stickers if any
  for (const sticker of stickers) {
    ctx.save()
    ctx.translate(sticker.x, sticker.y + safariTopH)
    ctx.rotate((sticker.rotation * Math.PI) / 180)
    ctx.scale(sticker.scale, sticker.scale)
    ctx.font = "48px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(sticker.emoji, 0, 0)
    ctx.restore()
  }

  // Draw footer — selalu di area frame bawah, beri jarak aman dari foto terakhir
  const footerTop = fullH - metrics.footerHeight
  const footerY = footerTop + 62
  ctx.save()
  ctx.filter = "none"
  ctx.fillStyle = isCustom ? "#FFFFFF" : inkColor
  // Bayangan solid tipis agar teks terbaca di atas foto custom yang ramai
  if (isCustom) {
    ctx.fillStyle = "rgba(0,0,0,0.55)"
    const tw = ctx.measureText("").width
    void tw
    ctx.fillRect(0, footerTop, fullW, metrics.footerHeight)
    ctx.fillStyle = "#FFFFFF"
  } else if (isSafari) {
    // Strip footer solid agar teks tidak menempel foto
    ctx.fillStyle = frame ? frame.base : frameColor
    ctx.fillRect(0, footerTop - 8, fullW, metrics.footerHeight + 8)
    ctx.fillStyle = inkColor
  }
  ctx.font = "bold 20px Inter, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  const dateStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  const textToDraw = footerText ? `${footerText} — ${dateStr}` : `${APP_NAME} — ${dateStr}`
  ctx.fillText(textToDraw, fullW / 2, footerY)
  // Hiasan footer kecil sesuai frame (solid saja)
  if (frame) {
    drawFooterOrnament(ctx, fullW, footerY, frame.pattern, frame.accent, frame.accent2, inkColor)
  }
  ctx.restore()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({ blob, width: fullW, height: fullH })
        } else {
          reject(new Error("Failed to export composite image"))
        }
      },
      "image/jpeg",
      0.92
    )
  })
}

async function drawFrameBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  base: string,
  pattern: string,
  accent: string,
  accent2: string
): Promise<void> {
  ctx.save()
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  switch (pattern) {
    case "dots": {
      ctx.fillStyle = accent
      const step = 56
      for (let y = 28; y < h; y += step) {
        for (let x = 28; x < w; x += step) {
          ctx.beginPath()
          ctx.arc(x, y, 9, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.fillStyle = accent2
      for (let y = 56; y < h; y += step * 2) {
        for (let x = 56; x < w; x += step * 2) {
          ctx.beginPath()
          ctx.arc(x, y, 4, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      break
    }
    case "stripes": {
      ctx.fillStyle = accent
      const bw = 28
      const gap = 28
      for (let x = -h; x < w + h; x += bw + gap) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x + bw, 0)
        ctx.lineTo(x + bw - 40, h)
        ctx.lineTo(x - 40, h)
        ctx.closePath()
        ctx.fill()
      }
      break
    }
    case "checker": {
      const s = 44
      let row = 0
      for (let y = 0; y < h; y += s, row++) {
        for (let x = 0; x < w; x += s) {
          const col = Math.floor(x / s)
          if ((row + col) % 2 === 0) {
            ctx.fillStyle = accent
            ctx.fillRect(x, y, s, s)
          }
        }
      }
      // Aksen pink kecil di tiap kotak gelap
      ctx.fillStyle = accent2
      for (let y = 22; y < h; y += s * 2) {
        for (let x = 22; x < w; x += s * 2) {
          ctx.beginPath()
          ctx.arc(x, y, 6, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      break
    }
    case "confetti": {
      const palette = [accent, accent2, "#F2B705", "#2E7D4F", "#FF80AB", "#7B2CBF"]
      for (let i = 0; i < 220; i++) {
        const px = pseudoRand(i * 2 + 1) * w
        const py = pseudoRand(i * 2 + 2) * h
        ctx.fillStyle = palette[i % palette.length]
        if (i % 3 === 0) {
          ctx.beginPath()
          ctx.arc(px, py, 7, 0, Math.PI * 2)
          ctx.fill()
        } else if (i % 3 === 1) {
          ctx.save()
          ctx.translate(px, py)
          ctx.rotate(pseudoRand(i + 99) * Math.PI)
          ctx.fillRect(-9, -5, 18, 10)
          ctx.restore()
        } else {
          ctx.save()
          ctx.translate(px, py)
          ctx.rotate(pseudoRand(i + 50) * Math.PI)
          ctx.fillRect(-4, -4, 8, 8)
          ctx.restore()
        }
      }
      break
    }
    case "safari": {
      // Badan sudah diisi base, chrome digambar terpisah
      ctx.fillStyle = accent
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = i % 2 === 0 ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.5)"
        ctx.fillRect((i * 47) % w, (i * 89) % h, 3, 3)
      }
      break
    }
    case "film": {
      // Lubang sproket digambar setelah foto agar selalu terlihat
      break
    }
    case "scallop": {
      ctx.fillStyle = accent
      const r = 18
      for (let x = 0; x <= w; x += r * 2) {
        ctx.beginPath()
        ctx.arc(x + r, 18, r, 0, Math.PI)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x + r, h - 18, r, Math.PI, 0)
        ctx.fill()
      }
      ctx.fillStyle = accent2
      for (let x = 0; x <= w; x += 36) {
        ctx.beginPath()
        ctx.arc(x + 18, 44, 5, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case "hearts": {
      for (let i = 0; i < 46; i++) {
        const px = pseudoRand(i * 3 + 1) * w
        const py = pseudoRand(i * 3 + 2) * h
        const s = 8 + pseudoRand(i + 7) * 10
        ctx.fillStyle = i % 2 === 0 ? accent : accent2
        drawHeart(ctx, px, py, s)
      }
      break
    }
    case "stars": {
      for (let i = 0; i < 90; i++) {
        const px = pseudoRand(i * 5 + 1) * w
        const py = pseudoRand(i * 5 + 3) * h
        const r = 5 + pseudoRand(i + 11) * 9
        ctx.fillStyle = i % 4 === 0 ? accent : accent2
        drawStar(ctx, px, py, r)
      }
      // Bulan sabit solid
      ctx.fillStyle = accent
      ctx.beginPath()
      ctx.arc(w - 90, 90, 44, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = base
      ctx.beginPath()
      ctx.arc(w - 70, 76, 36, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case "zigzag": {
      ctx.strokeStyle = accent
      ctx.lineWidth = 14
      ctx.lineJoin = "round"
      for (let y = 20; y < h; y += 72) {
        ctx.beginPath()
        for (let x = -20; x <= w + 20; x += 36) {
          const yy = y + ((x / 36) % 2 === 0 ? 0 : 22)
          if (x === -20) ctx.moveTo(x, yy)
          else ctx.lineTo(x, yy)
        }
        ctx.stroke()
      }
      break
    }
    case "grid": {
      ctx.strokeStyle = accent
      ctx.lineWidth = 2
      for (let x = 0; x <= w; x += 44) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let y = 0; y <= h; y += 44) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }
      ctx.fillStyle = accent2
      for (let y = 0; y <= h; y += 44) {
        for (let x = 0; x <= w; x += 44) {
          ctx.beginPath()
          ctx.arc(x, y, 3, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      break
    }
    case "blobs": {
      const blobs: Array<{ x: number; y: number; r: number; c: string }> = [
        { x: w * 0.12, y: h * 0.1, r: 120, c: accent },
        { x: w * 0.88, y: h * 0.22, r: 150, c: accent2 },
        { x: w * 0.1, y: h * 0.85, r: 140, c: accent2 },
        { x: w * 0.9, y: h * 0.9, r: 110, c: accent },
        { x: w * 0.5, y: h * 0.55, r: 90, c: "#FFFFFF" },
      ]
      for (const b of blobs) {
        ctx.fillStyle = b.c
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = "rgba(0,0,0,0.06)"
      for (let i = 0; i < 40; i++) {
        ctx.beginPath()
        ctx.arc(pseudoRand(i + 1) * w, pseudoRand(i + 200) * h, 4, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case "rainbow-border":
    case "kawaii-border": {
      // Digambar setelah foto (lihat drawOuterBorder)
      break
    }
    case "retro-blocks": {
      ctx.fillStyle = accent
      ctx.fillRect(0, 0, w, 90)
      ctx.fillStyle = accent2
      ctx.fillRect(0, 90, w, 34)
      ctx.fillStyle = accent
      ctx.fillRect(0, h - 124, w, 34)
      ctx.fillStyle = accent2
      ctx.fillRect(0, h - 90, w, 90)
      ctx.fillStyle = "#FFFFFF"
      for (let x = 20; x < w; x += 60) {
        ctx.fillRect(x, 36, 28, 18)
      }
      break
    }
    case "waves": {
      ctx.fillStyle = accent
      for (let row = 0; row < 4; row++) {
        const yBase = 60 + row * 90 + (h % 120)
        void yBase
      }
      // Gelombang atas & bawah solid
      for (const yTop of [0, h - 130]) {
        ctx.beginPath()
        ctx.moveTo(0, yTop)
        for (let x = 0; x <= w; x += 40) {
          ctx.arc(x + 20, yTop + 30, 20, Math.PI, 0)
        }
        ctx.lineTo(w, yTop + 60)
        ctx.lineTo(0, yTop + 60)
        ctx.closePath()
        ctx.fill()
      }
      ctx.fillStyle = accent2
      for (let x = 20; x < w; x += 80) {
        ctx.beginPath()
        ctx.arc(x, 90, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x + 40, h - 70, 8, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    default: {
      break
    }
  }
  ctx.restore()
}

function drawSafariChrome(ctx: CanvasRenderingContext2D, w: number, bar: string, red: string): void {
  const h = 96
  ctx.save()
  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = bar
  ctx.fillRect(0, 0, w, 52)
  const dots: Array<{ x: number; c: string }> = [
    { x: 28, c: red },
    { x: 52, c: "#FEBC2E" },
    { x: 76, c: "#28C840" },
  ]
  for (const d of dots) {
    ctx.fillStyle = d.c
    ctx.beginPath()
    ctx.arc(d.x, 26, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = "rgba(0,0,0,0.15)"
    ctx.lineWidth = 2
    ctx.stroke()
  }
  // Address pill
  const pillX = 110
  const pillW = w - 220
  ctx.fillStyle = "#E9ECEF"
  roundRect(ctx, pillX, 12, pillW, 28, 14)
  ctx.fill()
  ctx.fillStyle = "#868E96"
  ctx.beginPath()
  ctx.arc(pillX + 22, 26, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "#ADB5BD"
  ctx.fillRect(pillX + 38, 21, pillW - 90, 10)
  // Tab kecil
  ctx.fillStyle = "#F1F3F5"
  ctx.fillRect(0, 52, w, 44)
  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(16, 58, 220, 36)
  ctx.fillStyle = "#495057"
  ctx.fillRect(32, 70, 120, 10)
  ctx.restore()
}

function drawOuterBorder(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pattern: string,
  accent: string,
  accent2: string,
  base: string
): void {
  ctx.save()
  if (pattern === "rainbow-border") {
    const colors = ["#D93A2F", "#F2B705", "#2E7D4F", "#2196F3", "#7B2CBF", "#FF80AB"]
    const bw = 26
    // Atas & bawah
    const segW = w / colors.length
    for (let i = 0; i < colors.length; i++) {
      ctx.fillStyle = colors[i]
      ctx.fillRect(i * segW, 0, segW, bw)
      ctx.fillRect(i * segW, h - bw, segW, bw)
    }
    // Kiri & kanan
    const segH = h / colors.length
    for (let i = 0; i < colors.length; i++) {
      ctx.fillStyle = colors[i]
      ctx.fillRect(0, i * segH, bw, segH)
      ctx.fillRect(w - bw, i * segH, bw, segH)
    }
    void accent
    void accent2
    void base
  } else {
    // kawaii-border: bingkai pink tebal + dot kuning/putih
    ctx.fillStyle = accent
    const bw = 30
    ctx.fillRect(0, 0, w, bw)
    ctx.fillRect(0, h - bw, w, bw)
    ctx.fillRect(0, 0, bw, h)
    ctx.fillRect(w - bw, 0, bw, h)
    ctx.fillStyle = "#FFFFFF"
    for (let x = 30; x < w; x += 60) {
      ctx.beginPath()
      ctx.arc(x, 15, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x + 30, h - 15, 7, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = accent2
    for (let y = 40; y < h; y += 70) {
      ctx.beginPath()
      ctx.arc(15, y, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(w - 15, y + 35, 6, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

function drawFilmHoles(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save()
  ctx.fillStyle = "#F4EFE6"
  const holeW = 26
  const holeH = 20
  for (let y = 24; y < h - holeH; y += 56) {
    roundRect(ctx, 10, y, holeW, holeH, 5)
    ctx.fill()
    roundRect(ctx, w - 10 - holeW, y, holeW, holeH, 5)
    ctx.fill()
  }
  ctx.restore()
}

function drawFooterOrnament(
  ctx: CanvasRenderingContext2D,
  w: number,
  footerY: number,
  pattern: string,
  accent: string,
  accent2: string,
  ink: string
): void {
  void ink
  ctx.save()
  if (pattern === "hearts") {
    ctx.fillStyle = accent
    drawHeart(ctx, w / 2 - 150, footerY, 12)
    drawHeart(ctx, w / 2 + 150, footerY, 12)
  } else if (pattern === "stars") {
    ctx.fillStyle = accent
    drawStar(ctx, w / 2 - 150, footerY, 12)
    drawStar(ctx, w / 2 + 150, footerY, 12)
  } else if (pattern === "dots" || pattern === "scallop") {
    ctx.fillStyle = accent2
    for (const dx of [-120, -100, 100, 120]) {
      ctx.beginPath()
      ctx.arc(w / 2 + dx, footerY, 6, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (pattern === "safari") {
    ctx.fillStyle = "#28C840"
    ctx.beginPath()
    ctx.arc(w / 2 - 140, footerY, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = accent2
    ctx.beginPath()
    ctx.arc(w / 2 + 140, footerY, 6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.beginPath()
  ctx.moveTo(0, s * 0.6)
  ctx.bezierCurveTo(-s * 1.2, -s * 0.2, -s * 0.5, -s * 1.1, 0, -s * 0.4)
  ctx.bezierCurveTo(s * 0.5, -s * 1.1, s * 1.2, -s * 0.2, 0, s * 0.6)
  ctx.fill()
  ctx.restore()
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.save()
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45
    const a = (Math.PI / 5) * i - Math.PI / 2
    const x = cx + Math.cos(a) * rr
    const y = cy + Math.sin(a) * rr
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function pseudoRand(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  targetW: number,
  targetH: number
) {
  const imgRatio = img.width / img.height
  const targetRatio = targetW / targetH

  let renderW = targetW
  let renderH = targetH
  let offsetX = x
  let offsetY = y

  if (imgRatio > targetRatio) {
    renderW = targetH * imgRatio
    offsetX = x - (renderW - targetW) / 2
  } else {
    renderH = targetW / imgRatio
    offsetY = y - (renderH - targetH) / 2
  }

  ctx.drawImage(img, offsetX, offsetY, renderW, renderH)
}

function getContrastColor(hexColor: string): string {
  // Simple heuristic for dark vs light background
  const hex = hexColor.replace("#", "")
  if (hex.length !== 6) return "#17171A"
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? "#17171A" : "#FFFFFF"
}