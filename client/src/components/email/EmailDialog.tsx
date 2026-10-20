import React, { useState } from "react"
import { i18n } from "../../i18n/id"
import { sendEmailApi } from "../../lib/emailApi"
import { Dialog } from "../ui/Dialog"
import { Button } from "../ui/Button"

interface EmailDialogProps {
  isOpen: boolean
  onClose: () => void
  photos: Blob[]
}

export const EmailDialog: React.FC<EmailDialogProps> = ({ isOpen, onClose, photos }) => {
  const [to, setTo] = useState("")
  const [senderName, setSenderName] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!to) return
    setStatus("sending")
    setErrorMsg("")

    const res = await sendEmailApi({
      to,
      senderName,
      message,
      photos,
    })

    if (res.ok) {
      setStatus("success")
      setTimeout(() => {
        setStatus("idle")
        setTo("")
        setSenderName("")
        setMessage("")
        onClose()
      }, 2500)
    } else {
      setStatus("error")
      setErrorMsg(res.message || i18n.email.error)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={i18n.email.title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {status === "success" ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-xl font-bold text-[var(--color-accent)]">{i18n.email.success}</p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider">{i18n.email.to}</label>
              <input
                type="email"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-2 rounded-lg border-2 border-[var(--color-ink)] bg-[var(--color-surface)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider">{i18n.email.senderName}</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Nama Anda"
                className="w-full px-4 py-2 rounded-lg border-2 border-[var(--color-ink)] bg-[var(--color-surface)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider">{i18n.email.message}</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Pesan tambahan..."
                rows={3}
                className="w-full px-4 py-2 rounded-lg border-2 border-[var(--color-ink)] bg-[var(--color-surface)]"
              />
            </div>

            {status === "error" && <p className="text-sm font-bold text-[var(--color-danger)]">{errorMsg}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" disabled={status === "sending"}>
                {status === "sending" ? i18n.email.sending : i18n.email.send}
              </Button>
            </div>
          </>
        )}
      </form>
    </Dialog>
  )
}
