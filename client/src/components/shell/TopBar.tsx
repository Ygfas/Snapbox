import React from "react"
import { Camera, Image as ImageIcon, Maximize, HelpCircle } from "lucide-react"
import { i18n } from "../../i18n/id"
import { useUIStore } from "../../store/ui.store"
import { Button } from "../ui/Button"
import { Kbd } from "../ui/Kbd"

export const TopBar: React.FC = () => {
  const { activeTab, setActiveTab, setIsHelpOpen } = useUIStore()

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err)
      })
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b-4 border-[var(--color-ink)] bg-[var(--color-surface)]">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-black tracking-wider text-[var(--color-accent)]">{i18n.appName}</h1>
        <span className="text-xs font-medium text-[var(--color-muted)] hidden sm:inline">
          {i18n.tagline}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={activeTab === "booth" ? "primary" : "outline"}
          onClick={() => setActiveTab("booth")}
        >
          <Camera size={18} />
          {i18n.tabs.booth} <Kbd>B</Kbd>
        </Button>
        <Button
          variant={activeTab === "gallery" ? "primary" : "outline"}
          onClick={() => setActiveTab("gallery")}
        >
          <ImageIcon size={18} />
          {i18n.tabs.gallery} <Kbd>G</Kbd>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={toggleFullscreen} title="Fullscreen (F)">
          <Maximize size={16} />
          <span className="hidden md:inline">Layar Penuh</span> <Kbd>F</Kbd>
        </Button>
        <Button variant="outline" size="sm" onClick={() => setIsHelpOpen(true)} title="Bantuan (?)">
          <HelpCircle size={16} />
          <Kbd>?</Kbd>
        </Button>
      </div>
    </header>
  )
}
