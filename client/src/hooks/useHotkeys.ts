import { useEffect } from "react"

interface HotkeyHandlers {
  onToggleHelp?: () => void
  onBooth?: () => void
  onGallery?: () => void
  onNewSection?: () => void
  onPrevSection?: () => void
  onNextSection?: () => void
  onFullscreen?: () => void
  onEscape?: () => void
  onStartCapture?: () => void
  onSelectLayout?: (code: string) => void
  onCycleVariant?: () => void
  onCycleTimer?: () => void
  onToggleMirror?: () => void
  onCycleFilter?: () => void
  onConfirmResult?: () => void
  onRetakeResult?: () => void
  onDownloadResult?: () => void
  onEmailResult?: () => void
}

export function useHotkeys(handlers: HotkeyHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable

      // Allow Escape and fullscreen even if in input
      if (e.key === "Escape") {
        handlers.onEscape?.()
        return
      }

      if (isInput) return

      // Ignore modifiers except Ctrl+A
      if (e.altKey || e.metaKey || (e.ctrlKey && e.key.toLowerCase() !== "a")) {
        return
      }

      switch (e.key) {
        case "?":
          e.preventDefault()
          handlers.onToggleHelp?.()
          break
        case "b":
        case "B":
          e.preventDefault()
          handlers.onBooth?.()
          break
        case "g":
        case "G":
          e.preventDefault()
          handlers.onGallery?.()
          break
        case "n":
        case "N":
          e.preventDefault()
          handlers.onNewSection?.()
          break
        case "[":
          e.preventDefault()
          handlers.onPrevSection?.()
          break
        case "]":
          e.preventDefault()
          handlers.onNextSection?.()
          break
        case "f":
        case "F":
          e.preventDefault()
          handlers.onFullscreen?.()
          break
        case "1":
        case "2":
        case "3":
        case "4":
          e.preventDefault()
          handlers.onSelectLayout?.(e.key)
          break
        case "v":
        case "V":
          e.preventDefault()
          handlers.onCycleVariant?.()
          break
        case " ":
        case "Enter":
          e.preventDefault()
          handlers.onStartCapture?.()
          handlers.onConfirmResult?.()
          break
        case "t":
        case "T":
          e.preventDefault()
          handlers.onCycleTimer?.()
          break
        case "m":
        case "M":
          e.preventDefault()
          handlers.onToggleMirror?.()
          break
        case "l":
        case "L":
          e.preventDefault()
          handlers.onCycleFilter?.()
          break
        case "r":
        case "R":
          e.preventDefault()
          handlers.onRetakeResult?.()
          break
        case "d":
        case "D":
          e.preventDefault()
          handlers.onDownloadResult?.()
          break
        case "e":
        case "E":
          e.preventDefault()
          handlers.onEmailResult?.()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handlers])
}
