import React, { useEffect } from "react"
import { Button } from "./Button"

interface ToastProps {
  message: string
  onUndo?: () => void
  onClose: () => void
  duration?: number
}

export const Toast: React.FC<ToastProps> = ({ message, onUndo, onClose, duration = 6000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 rounded-xl border-4 border-[var(--color-ink)] bg-[var(--color-surface)] px-5 py-4 shadow-[6px_6px_0_var(--color-ink)] animate-bounce-short">
      <span className="font-medium">{message}</span>
      {onUndo && (
        <Button size="sm" variant="secondary" onClick={onUndo}>
          Undo
        </Button>
      )}
    </div>
  )
}
