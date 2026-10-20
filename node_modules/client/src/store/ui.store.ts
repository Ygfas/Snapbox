import { create } from "zustand"
import type { LayoutCode } from "../config/layouts"
import type { FilterId } from "../config/filters"

export type AppTab = "booth" | "gallery"

interface UIState {
  activeTab: AppTab
  activeSectionId: string
  layoutCode: LayoutCode
  layoutVariantIndex: number
  timerDuration: number
  mirror: boolean
  filter: FilterId
  frameColor: string
  footerText: string
  soundEnabled: boolean
  ttlDays: number
  selectedCaptureIds: string[]
  previewCaptureId: string | null
  isHelpOpen: boolean

  setActiveTab: (tab: AppTab) => void
  setActiveSectionId: (id: string) => void
  setLayoutCode: (code: LayoutCode) => void
  setLayoutVariantIndex: (index: number) => void
  setTimerDuration: (seconds: number) => void
  setMirror: (mirror: boolean) => void
  setFilter: (filter: FilterId) => void
  setFrameColor: (color: string) => void
  setFooterText: (text: string) => void
  setSoundEnabled: (enabled: boolean) => void
  setTtlDays: (days: number) => void
  setSelectedCaptureIds: (ids: string[]) => void
  toggleSelectCaptureId: (id: string) => void
  clearSelectedCaptureIds: () => void
  setPreviewCaptureId: (id: string | null) => void
  setIsHelpOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: "booth",
  activeSectionId: "",
  layoutCode: "1",
  layoutVariantIndex: 0,
  timerDuration: 3,
  mirror: true,
  filter: "normal",
  frameColor: "#FFFFFF",
  footerText: "",
  soundEnabled: false,
  ttlDays: 7,
  selectedCaptureIds: [],
  previewCaptureId: null,
  isHelpOpen: false,

  setActiveTab: (activeTab) => set({ activeTab }),
  setActiveSectionId: (activeSectionId) => set({ activeSectionId }),
  setLayoutCode: (layoutCode) => set({ layoutCode, layoutVariantIndex: 0 }),
  setLayoutVariantIndex: (layoutVariantIndex) => set({ layoutVariantIndex }),
  setTimerDuration: (timerDuration) => set({ timerDuration }),
  setMirror: (mirror) => set({ mirror }),
  setFilter: (filter) => set({ filter }),
  setFrameColor: (frameColor) => set({ frameColor }),
  setFooterText: (footerText) => set({ footerText }),
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  setTtlDays: (ttlDays) => set({ ttlDays }),
  setSelectedCaptureIds: (selectedCaptureIds) => set({ selectedCaptureIds }),
  toggleSelectCaptureId: (id) =>
    set((state) => {
      const exists = state.selectedCaptureIds.includes(id)
      return {
        selectedCaptureIds: exists
          ? state.selectedCaptureIds.filter((i) => i !== id)
          : [...state.selectedCaptureIds, id],
      }
    }),
  clearSelectedCaptureIds: () => set({ selectedCaptureIds: [] }),
  setPreviewCaptureId: (previewCaptureId) => set({ previewCaptureId }),
  setIsHelpOpen: (isHelpOpen) => set({ isHelpOpen }),
}))
