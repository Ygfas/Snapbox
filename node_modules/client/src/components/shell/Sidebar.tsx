import React, { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { Plus, Folder, Trash2 } from "lucide-react"
import { db, type Section } from "../../db/dexie"
import { i18n } from "../../i18n/id"
import { useUIStore } from "../../store/ui.store"
import { Button } from "../ui/Button"
import { IconButton } from "../ui/IconButton"
import { StorageMeter } from "../ui/StorageMeter"
import { Dialog } from "../ui/Dialog"
import { Kbd } from "../ui/Kbd"

export const Sidebar: React.FC = () => {
  const { activeSectionId, setActiveSectionId } = useUIStore()
  const sections = useLiveQuery(() => db.sections.toArray()) || []
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [newSectionName, setNewSectionName] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Section | null>(null)

  async function handleCreateSection(e: React.FormEvent) {
    e.preventDefault()
    const name = newSectionName.trim() || `Sesi ${sections.length + 1}`
    const id = crypto.randomUUID()
    const now = Date.now()
    await db.sections.add({ id, name, createdAt: now, updatedAt: now })
    setActiveSectionId(id)
    setNewSectionName("")
    setIsNewDialogOpen(false)
  }

  async function handleDeleteSection() {
    if (!deleteTarget) return
    await db.captures.where("sectionId").equals(deleteTarget.id).delete()
    await db.sections.delete(deleteTarget.id)

    setDeleteTarget(null)

    // Switch to another section if active was deleted
    if (activeSectionId === deleteTarget.id) {
      const remaining = await db.sections.toArray()
      if (remaining.length > 0) {
        setActiveSectionId(remaining[0].id)
      } else {
        const newId = crypto.randomUUID()
        const now = Date.now()
        await db.sections.add({ id: newId, name: "Sesi 1", createdAt: now, updatedAt: now })
        setActiveSectionId(newId)
      }
    }
  }

  return (
    <aside className="w-72 border-r-4 border-[var(--color-ink)] bg-[var(--color-surface)] p-5 flex flex-col justify-between">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">{i18n.sections.title}</h2>
          <Button size="sm" onClick={() => setIsNewDialogOpen(true)}>
            <Plus size={16} /> Baru <Kbd>N</Kbd>
          </Button>
        </div>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {sections.map((sec) => {
            const isActive = sec.id === activeSectionId
            return (
              <div
                key={sec.id}
                onClick={() => setActiveSectionId(sec.id)}
                className={`flex items-center justify-between p-3 rounded-lg border-2 border-[var(--color-ink)] cursor-pointer transition-all ${
                  isActive
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)] shadow-[2px_2px_0_var(--color-ink)]"
                    : "bg-[var(--color-surface)] hover:bg-[var(--color-line)]"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Folder size={18} />
                  <span className="font-medium truncate">{sec.name}</span>
                </div>
                {sections.length > 1 && (
                  <IconButton
                    label="Hapus Section"
                    icon={<Trash2 size={16} />}
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteTarget(sec)
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="pt-6 border-t-2 border-[var(--color-line)]">
        <StorageMeter />
      </div>

      {/* New Section Dialog */}
      <Dialog
        isOpen={isNewDialogOpen}
        onClose={() => setIsNewDialogOpen(false)}
        title={i18n.sections.newSection}
      >
        <form onSubmit={handleCreateSection} className="space-y-4">
          <input
            type="text"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            placeholder={i18n.sections.sectionNamePlaceholder}
            className="w-full px-4 py-2 rounded-lg border-2 border-[var(--color-ink)] bg-[var(--color-surface)]"
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsNewDialogOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Buat</Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Section Dialog */}
      <Dialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={i18n.sections.delete}
      >
        <div className="space-y-4">
          <p>
            Apakah Anda yakin ingin menghapus section &ldquo;{deleteTarget?.name}&rdquo;?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDeleteSection}>
              Hapus
            </Button>
          </div>
        </div>
      </Dialog>
    </aside>
  )
}
