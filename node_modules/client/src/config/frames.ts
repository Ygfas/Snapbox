export type FramePattern =
  | "solid"
  | "dots"
  | "stripes"
  | "checker"
  | "confetti"
  | "safari"
  | "film"
  | "scallop"
  | "hearts"
  | "stars"
  | "zigzag"
  | "grid"
  | "blobs"
  | "rainbow-border"
  | "kawaii-border"
  | "retro-blocks"
  | "waves"
  | "polaroid"
  | "ticket"

export interface FrameDef {
  id: string
  name: string
  base: string
  ink: string
  pattern: FramePattern
  accent: string
  accent2: string
}

export const FRAMES: FrameDef[] = [
  { id: "krem-polos", name: "Krem Polos", base: "#F4EFE6", ink: "#17171A", pattern: "solid", accent: "#F4EFE6", accent2: "#F4EFE6" },
  { id: "hitam-klasik", name: "Hitam Klasik", base: "#17171A", ink: "#FFFFFF", pattern: "solid", accent: "#17171A", accent2: "#17171A" },
  { id: "pink-dot", name: "Pink Lucu Dot", base: "#FFD6E8", ink: "#7A2E4A", pattern: "dots", accent: "#FFFFFF", accent2: "#FF8FAB" },
  { id: "langit-dot", name: "Langit Dot", base: "#BDE0FE", ink: "#1D3557", pattern: "dots", accent: "#FFFFFF", accent2: "#2196F3" },
  { id: "mint-garis", name: "Mint Garis", base: "#C8F0D4", ink: "#1B4332", pattern: "stripes", accent: "#FFFFFF", accent2: "#2E7D4F" },
  { id: "lemon-garis", name: "Lemon Garis", base: "#FFF3B0", ink: "#7A5C00", pattern: "stripes", accent: "#FFFFFF", accent2: "#F2B705" },
  { id: "catur-ceria", name: "Catur Ceria", base: "#FFFFFF", ink: "#17171A", pattern: "checker", accent: "#17171A", accent2: "#FF80AB" },
  { id: "konfeti-pesta", name: "Konfeti Pesta", base: "#FFFFFF", ink: "#17171A", pattern: "confetti", accent: "#D93A2F", accent2: "#2196F3" },
  { id: "safari-browser", name: "Safari Browser", base: "#F1F3F5", ink: "#17171A", pattern: "safari", accent: "#DEE2E6", accent2: "#FF5F57" },
  { id: "strip-film", name: "Strip Film", base: "#111114", ink: "#FFFFFF", pattern: "film", accent: "#2E2E34", accent2: "#F2B705" },
  { id: "renda-pink", name: "Renda Pink", base: "#FFF0F3", ink: "#7A2E4A", pattern: "scallop", accent: "#FF8FAB", accent2: "#FFB3C6" },
  { id: "hati-cinta", name: "Hati Cinta", base: "#FFE5EC", ink: "#7A2E4A", pattern: "hearts", accent: "#FF4D6D", accent2: "#FF8FAB" },
  { id: "bintang-malam", name: "Bintang Malam", base: "#1A1A2E", ink: "#FFFFFF", pattern: "stars", accent: "#F2B705", accent2: "#FFFFFF" },
  { id: "zigzag-permen", name: "Zigzag Permen", base: "#FF8FA3", ink: "#FFFFFF", pattern: "zigzag", accent: "#FFFFFF", accent2: "#7A2E4A" },
  { id: "grid-estetik", name: "Grid Estetik", base: "#E9E4D8", ink: "#3A3A3A", pattern: "grid", accent: "#C9BFA8", accent2: "#8A7E66" },
  { id: "blob-abstrak", name: "Blob Abstrak", base: "#D8E2DC", ink: "#1B4332", pattern: "blobs", accent: "#FF8FAB", accent2: "#F2B705" },
  { id: "pelangi-ceria", name: "Pelangi Ceria", base: "#FFFFFF", ink: "#17171A", pattern: "rainbow-border", accent: "#D93A2F", accent2: "#2196F3" },
  { id: "bingkai-lucu", name: "Bingkai Lucu", base: "#FFF0F3", ink: "#7A2E4A", pattern: "kawaii-border", accent: "#FF8FAB", accent2: "#F2B705" },
  { id: "retro-senja", name: "Retro Senja", base: "#FFBA08", ink: "#5C2E00", pattern: "retro-blocks", accent: "#D93A2F", accent2: "#6A040F" },
  { id: "ombak-laut", name: "Ombak Laut", base: "#CAF0F8", ink: "#0B3D4A", pattern: "waves", accent: "#2196F3", accent2: "#FFFFFF" },
]

export const CUSTOM_FRAME_ID = "custom-upload"

export function getFrameById(id: string): FrameDef | undefined {
  return FRAMES.find((f) => f.id === id)
}

export function isCustomFrameId(id: string): boolean {
  return id === CUSTOM_FRAME_ID
}