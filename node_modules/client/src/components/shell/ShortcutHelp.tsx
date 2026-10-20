import React from "react"
import { HOTKEYS } from "../../config/hotkeys"
import { i18n } from "../../i18n/id"
import { useUIStore } from "../../store/ui.store"
import { Dialog } from "../ui/Dialog"
import { Kbd } from "../ui/Kbd"

export const ShortcutHelp: React.FC = () => {
  const { isHelpOpen, setIsHelpOpen } = useUIStore()

  const categories = [
    { id: "global", name: "Global" },
    { id: "booth", name: "Booth" },
    { id: "result", name: "Hasil Foto" },
    { id: "gallery", name: "Galeri" },
  ]

  return (
    <Dialog isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title={i18n.hotkeys.title}>
      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {categories.map((cat) => {
          const items = HOTKEYS.filter((h) => h.category === cat.id)
          if (items.length === 0) return null
          return (
            <div key={cat.id} className="space-y-2">
              <h3 className="font-bold text-sm uppercase tracking-wider text-[var(--color-accent)]">
                {cat.name}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-[var(--color-line)] text-sm">
                    <span>{item.label}</span>
                    <Kbd>{item.key}</Kbd>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Dialog>
  )
}
