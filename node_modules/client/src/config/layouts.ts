export type LayoutCode = "1" | "2v" | "2h" | "3v" | "4v" | "4g"

export interface LayoutConfig {
  code: LayoutCode
  name: string
  photoCount: number
  cols: number
  rows: number
}

export interface LayoutMetrics {
  width: number
  height: number
  cellWidth: number
  cellHeight: number
  padding: number
  gap: number
  footerHeight: number
  cellPositions: Array<{ x: number; y: number }>
}

export const LAYOUTS: Record<LayoutCode, LayoutConfig> = {
  "1": { code: "1", name: "Satu Foto", photoCount: 1, cols: 1, rows: 1 },
  "2v": { code: "2v", name: "Dua Strip", photoCount: 2, cols: 1, rows: 2 },
  "2h": { code: "2h", name: "Dua Berdampingan", photoCount: 2, cols: 2, rows: 1 },
  "3v": { code: "3v", name: "Tiga Strip", photoCount: 3, cols: 1, rows: 3 },
  "4v": { code: "4v", name: "Empat Strip", photoCount: 4, cols: 1, rows: 4 },
  "4g": { code: "4g", name: "Empat Grid 2x2", photoCount: 4, cols: 2, rows: 2 },
}

export function getLayoutMetrics(code: LayoutCode): LayoutMetrics {
  const config = LAYOUTS[code]
  const cellWidth = 640
  const cellHeight = 480
  const padding = 40
  const gap = 20
  const footerHeight = 120

  const width = config.cols * cellWidth + (config.cols - 1) * gap + 2 * padding
  const height = config.rows * cellHeight + (config.rows - 1) * gap + 2 * padding + footerHeight

  const cellPositions: Array<{ x: number; y: number }> = []

  for (let r = 0; r < config.rows; r++) {
    for (let c = 0; c < config.cols; c++) {
      if (cellPositions.length < config.photoCount) {
        const x = padding + c * (cellWidth + gap)
        const y = padding + r * (cellHeight + gap)
        cellPositions.push({ x, y })
      }
    }
  }

  return {
    width,
    height,
    cellWidth,
    cellHeight,
    padding,
    gap,
    footerHeight,
    cellPositions,
  }
}
