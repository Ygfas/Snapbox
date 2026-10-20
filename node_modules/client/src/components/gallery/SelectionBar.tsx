import React from "react"
import { Download, Archive, Trash2, X } from "lucide-react"
import { i18n } from "../../i18n/id"
import { Button } from "../ui/Button"

interface SelectionBarProps {
  selectedCount: number
  onClearSelection: () => void
  onDownloadSelected: () => void
  onExportZip: () => void
  onDeleteSelected: () => void
}

export const SelectionBar: React.FC<SelectionBarProps> = ({
  selectedCount,
  onClearSelection,
  onDownloadSelected,
  onExportZip,
  onDeleteSelected,
}) => {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 rounded-xl border-4 border-[var(--color-ink)] bg-[var(--color-surface)] px-6 py-3 shadow-[8px_8px_0_var(--color-ink)] animate-bounce-short">
      <span className="font-bold text-sm">
        {selectedCount} {i18n.gallery.selected}
      </span>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onDownloadSelected}>
          <Download size={16} /> Unduh
        </Button>
        <Button size="sm" variant="secondary" onClick={onExportZip}>
          <Archive size={16} /> ZIP
        </Button>
        <Button size="sm" variant="danger" onClick={onDeleteSelected}>
          <Trash2 size={16} /> Hapus
        </Button>
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1 rounded hover:bg-[var(--color-line)] text-[var(--color-ink)]"
          title="Batal Pilih"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
