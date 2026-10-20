import React, { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, type Capture } from "../../db/dexie"
import { i18n } from "../../i18n/id"
import { useUIStore } from "../../store/ui.store"
import { PhotoCard } from "./PhotoCard"
import { Lightbox } from "./Lightbox"
import { SelectionBar } from "./SelectionBar"
import { exportCapturesAsZip } from "../../lib/zip"

export const GalleryGrid: React.FC = () => {
  const { activeSectionId } = useUIStore()
  const section = useLiveQuery(() => db.sections.get(activeSectionId), [activeSectionId])
  const captures =
    useLiveQuery(
      () => db.captures.where("sectionId").equals(activeSectionId).reverse().toArray(),
      [activeSectionId]
    ) || []

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [lightboxCapture, setLightboxCapture] = useState<Capture | null>(null)

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  function handleClearSelection() {
    setSelectedIds([])
  }

  async function handleDeleteSingle(id: string) {
    await db.captures.delete(id)
    setSelectedIds((prev) => prev.filter((i) => i !== id))
  }

  async function handleDeleteSelected() {
    await db.captures.bulkDelete(selectedIds)
    setSelectedIds([])
  }

  async function handleDownloadSelected() {
    const items = captures.filter((c) => selectedIds.includes(c.id))
    for (let i = 0; i < items.length; i++) {
      const cap = items[i]
      const url = URL.createObjectURL(cap.composite)
      const a = document.createElement("a")
      a.href = url
      a.download = `snapbox_${cap.id}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  async function handleExportZip() {
    const items = captures.filter((c) => selectedIds.includes(c.id))
    if (items.length === 0) return
    const zipBlob = await exportCapturesAsZip(items, section?.name || "snapbox")
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${(section?.name || "snapbox").replace(/[^a-z0-9]/gi, "_").toLowerCase()}_photos.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (captures.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-[var(--color-muted)]">
        <p className="text-lg font-bold mb-2">{i18n.gallery.empty}</p>
        <p className="text-sm">{i18n.gallery.emptySubtitle}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {captures.map((cap) => (
          <PhotoCard
            key={cap.id}
            capture={cap}
            isSelected={selectedIds.includes(cap.id)}
            onToggleSelect={toggleSelect}
            onOpenLightbox={(c) => setLightboxCapture(c)}
          />
        ))}
      </div>

      <Lightbox
        capture={lightboxCapture}
        onClose={() => setLightboxCapture(null)}
        onDelete={handleDeleteSingle}
        onOpenEmail={() => {
          // TODO: hook up email modal from gallery if needed
        }}
      />

      <SelectionBar
        selectedCount={selectedIds.length}
        onClearSelection={handleClearSelection}
        onDownloadSelected={handleDownloadSelected}
        onExportZip={handleExportZip}
        onDeleteSelected={handleDeleteSelected}
      />
    </div>
  )
}
