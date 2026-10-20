import { getLayoutMetrics, type LayoutCode } from "../config/layouts"
import { FILTERS, type FilterId } from "../config/filters"
import { APP_NAME } from "../config/constants"
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
}: ComposeOptions): Promise<{ blob: Blob; width: number; height: number }> {
  const metrics = getLayoutMetrics(layout)
  const canvas = document.createElement("canvas")
  canvas.width = metrics.width
  canvas.height = metrics.height
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Canvas context not available")
  }

  // Solid background
  ctx.fillStyle = frameColor
  ctx.fillRect(0, 0, metrics.width, metrics.height)

  const filterConfig = FILTERS[filter] || FILTERS.normal

  // Load and draw each shot
  for (let i = 0; i < metrics.cellPositions.length; i++) {
    const pos = metrics.cellPositions[i]
    const shotBlob = shots[i]
    if (!shotBlob) continue

    const url = URL.createObjectURL(shotBlob)
    try {
      const img = await loadImage(url)
      ctx.save()
      ctx.beginPath()
      ctx.rect(pos.x, pos.y, metrics.cellWidth, metrics.cellHeight)
      ctx.clip()

      // Shots baru sudah di-bake dengan filter masing-masing saat capture,
      // jadi jangan timpa dengan filter global (cegah double-filter).
      // Fallback ke filter global hanya untuk sesi lama tanpa shotFilters.
      const hasBakedFilters = shotFilters && shotFilters.length === shots.length
      ctx.filter = hasBakedFilters ? "none" : filterConfig.cssFilter

      if (mirror) {
        ctx.translate(pos.x + metrics.cellWidth, pos.y)
        ctx.scale(-1, 1)
        drawCover(ctx, img, 0, 0, metrics.cellWidth, metrics.cellHeight)
      } else {
        drawCover(ctx, img, pos.x, pos.y, metrics.cellWidth, metrics.cellHeight)
      }

      ctx.restore()
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  // Draw stickers if any
  for (const sticker of stickers) {
    ctx.save()
    ctx.translate(sticker.x, sticker.y)
    ctx.rotate((sticker.rotation * Math.PI) / 180)
    ctx.scale(sticker.scale, sticker.scale)
    ctx.font = "48px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(sticker.emoji, 0, 0)
    ctx.restore()
  }

  // Draw footer
  const footerY = metrics.height - metrics.footerHeight + 40
  ctx.save()
  ctx.filter = "none"
  ctx.fillStyle = getContrastColor(frameColor)
  ctx.font = "bold 20px Inter, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  const dateStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  const textToDraw = footerText ? `${footerText} — ${dateStr}` : `${APP_NAME} — ${dateStr}`
  ctx.fillText(textToDraw, metrics.width / 2, footerY)
  ctx.restore()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({ blob, width: metrics.width, height: metrics.height })
        } else {
          reject(new Error("Failed to export composite image"))
        }
      },
      "image/jpeg",
      0.92
    )
  })
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
