import React, { useState } from "react"
import { Trash2, Download, Mail, Share2, Printer } from "lucide-react"
import { type Capture } from "../../db/dexie"
import { useObjectUrl } from "../../hooks/useObjectUrl"
import { i18n } from "../../i18n/id"
import { Dialog } from "../ui/Dialog"
import { Button } from "../ui/Button"

interface LightboxProps {
  capture: Capture | null
  onClose: () => void
  onDelete: (id: string) => void
  onOpenEmail: (capture: Capture) => void
}

export const Lightbox: React.FC<LightboxProps> = ({ capture, onClose, onDelete, onOpenEmail }) => {
  const compositeUrl = useObjectUrl(capture?.composite || null)
  const [copied, setCopied] = useState(false)

  if (!capture) return null

  function handleDownload() {
    if (!compositeUrl) return
    const a = document.createElement("a")
    a.href = compositeUrl
    a.download = `snapbox_${capture?.id}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  function handlePrint() {
    if (!compositeUrl) return
    const win = window.open("", "_blank")
    if (win) {
      win.document.write(`
        <html>
          <head><title>Cetak Foto</title></head>
          <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;">
            <img src="${compositeUrl}" style="max-width:100%;max-height:100%;object-fit:contain;" onload="window.print();window.close();"/>
          </body>
        </html>
      `)
      win.document.close()
    }
  }

  async function handleShare() {
    if (!capture) return
    const file = new File([capture.composite], `snapbox_${capture.id}.jpg`, { type: "image/jpeg" })
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: i18n.appName,
          text: "Foto dari " + i18n.appName,
          files: [file],
        })
        return
      } catch (err) {
        console.error("Share error:", err)
      }
    }
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/jpeg": capture.composite })])
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error("Clipboard write error:", err)
    }
  }

  return (
    <Dialog isOpen={!!capture} onClose={onClose} title={i18n.gallery.detail} size="xl">
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1 flex items-center justify-center max-h-[60vh] min-h-[30vh] overflow-hidden bg-[var(--color-line)]/30 rounded-lg">
          {compositeUrl ? (
            <img
              src={compositeUrl}
              alt="Detail Foto"
              className="max-h-[55vh] rounded-lg border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] object-contain"
            />
          ) : (
            <p className="text-sm font-bold text-[var(--color-muted)] animate-pulse p-8">
              Memuat preview...
            </p>
          )}
        </div>

        <div className="w-full md:w-64 flex flex-col gap-4">
          <div className="text-sm space-y-1">
            <p className="font-bold text-[var(--color-muted)]">Tanggal</p>
            <p className="font-medium">{new Date(capture.createdAt).toLocaleString("id-ID")}</p>
          </div>

          <div className="text-sm space-y-1">
            <p className="font-bold text-[var(--color-muted)]">Layout & Ukuran</p>
            <p className="font-medium">
              Layout {capture.layout} • {(capture.bytes / 1024).toFixed(0)} KB
            </p>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <Button onClick={handleDownload} size="sm">
              <Download size={16} /> Unduh
            </Button>
            <Button onClick={() => onOpenEmail(capture)} variant="secondary" size="sm">
              <Mail size={16} /> Kirim Email
            </Button>
            <Button onClick={handlePrint} variant="secondary" size="sm">
              <Printer size={16} /> Cetak
            </Button>
            <Button onClick={handleShare} variant="secondary" size="sm">
              <Share2 size={16} /> {copied ? "Disalin!" : "Bagikan"}
            </Button>
            <Button
              onClick={() => {
                onDelete(capture.id)
                onClose()
              }}
              variant="danger"
              size="sm"
            >
              <Trash2 size={16} /> Hapus
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
