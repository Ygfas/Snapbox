export type FilterId = "normal" | "grayscale" | "sepia" | "vintage" | "warm" | "cool" | "contrast" | "fade"

export interface FilterConfig {
  id: FilterId
  name: string
  cssFilter: string
}

export const FILTERS: Record<FilterId, FilterConfig> = {
  normal: { id: "normal", name: "Normal", cssFilter: "none" },
  grayscale: { id: "grayscale", name: "Hitam Putih", cssFilter: "grayscale(1) contrast(1.1)" },
  sepia: { id: "sepia", name: "Sepia", cssFilter: "sepia(0.8)" },
  vintage: { id: "vintage", name: "Vintage", cssFilter: "sepia(0.35) contrast(0.9) saturate(1.2)" },
  warm: { id: "warm", name: "Hangat", cssFilter: "sepia(0.2) saturate(1.3) hue-rotate(-10deg)" },
  cool: { id: "cool", name: "Dingin", cssFilter: "saturate(1.1) hue-rotate(15deg) brightness(1.05)" },
  contrast: { id: "contrast", name: "Kontras Tinggi", cssFilter: "contrast(1.35) saturate(1.1)" },
  fade: { id: "fade", name: "Pudar", cssFilter: "contrast(0.85) brightness(1.1) saturate(0.8)" },
}
