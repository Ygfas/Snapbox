import React, { useEffect } from "react"
import { X } from "lucide-react"
import { IconButton } from "./IconButton"

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
}

const SIZE_CLASS: Record<NonNullable<DialogProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children, size = "md" }) => {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Kunci scroll body saat dialog terbuka agar preview stabil
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`relative w-full ${SIZE_CLASS[size]} max-h-[90vh] overflow-y-auto rounded-xl border-4 border-[var(--color-ink)] bg-[var(--color-surface)] p-6 shadow-[8px_8px_0_var(--color-ink)]`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b-2 border-[var(--color-line)] mb-4">
          <h2 id="dialog-title" className="text-xl font-bold">
            {title}
          </h2>
          <IconButton label="Tutup" icon={<X size={20} />} onClick={onClose} />
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}