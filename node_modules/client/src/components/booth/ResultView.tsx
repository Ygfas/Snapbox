import React, { useState } from "react"
import { Download, Mail, RotateCcw, Share2, Printer, Pencil } from "lucide-react"
import { i18n } from "../../i18n/id"
import { Button } from "../ui/Button"
import { Kbd } from "../ui/Kbd"

interface ResultViewProps {
  resultUrl: string | null
  resultBlob: Blob | null
  onRetakeAll: () => void
  onOpenEmail: () => void
  onBackToReview?: () => void
}

export const ResultView: React.FC<ResultViewProps> = ({
  resultUrl,
  resultBlob,
  onRetakeAll,
  onOpenEmail,
  onBackToReview,
}) => {
  const [copied, setCopied] = useState(false)

  function handleDownload() {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = `snapbox_${Date.now()}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  function handlePrint() {
    if (!resultUrl) return
    const win = window.open("", "_blank")
    if (win) {
      win.document.write(`
        <html>
          <head><title>Cetak Foto</title></head>
          <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;">
            <img src="${resultUrl}" style="max-width:100%;max-height:100%;object-fit:contain;" onload="window.print();window.close();"/>
          </body>
        </html>
      `)
      win.document.close()
    }
  }

  async function handleShare() {
    if (!resultBlob) return
    const file = new File([resultBlob], `snapbox_${Date.now()}.jpg`, { type: "image/jpeg" })
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
    // Fallback to copy link / blob
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/jpeg": resultBlob })])
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error("Clipboard write error:", err)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8 w-full max-w-5xl mx-auto p-6 bg-[var(--color-surface)] rounded-2xl border-4 border-[var(--color-ink)] shadow-[8px_8px_0_var(--color-ink)]">
      <div className="flex-1 flex items-center justify-center max-h-[70vh]">
        {resultUrl && (
          <img
            src={resultUrl}
            alt="Hasil Foto"
            className="max-h-[65vh] rounded-lg border-2 border-[var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] object-contain"
          />
        )}
      </div>

      <div className="w-full lg:w-80 flex flex-col gap-4">
        <h2 className="text-2xl font-black">{i18n.booth.resultTitle}</h2>
        <p className="text-sm text-[var(--color-muted)]">{i18n.booth.resultSubtitle}</p>

        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={handleDownload} size="lg">
            <Download size={20} /> Unduh <Kbd>D</Kbd>
          </Button>

          <Button onClick={onOpenEmail} variant="secondary">
            <Mail size={20} /> Kirim Email <Kbd>E</Kbd>
          </Button>

          <Button onClick={handlePrint} variant="secondary">
            <Printer size={20} /> Cetak
          </Button>

          <Button onClick={handleShare} variant="secondary">
            <Share2 size={20} /> {copied ? "Disalin ke Clipboard!" : "Bagikan"}
          </Button>

          {onBackToReview && (
            <Button onClick={onBackToReview} variant="secondary">
              <Pencil size={18} /> Edit Foto per Slot
            </Button>
          )}

          <Button onClick={onRetakeAll} variant="outline">
            <RotateCcw size={18} /> Ambil Lagi <Kbd>R</Kbd>
          </Button>
        </div>
      </div>
    </div>
  )
}
