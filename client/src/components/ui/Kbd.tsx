import React from "react"

export const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <kbd className="inline-block px-2 py-0.5 text-xs font-mono font-bold rounded border-2 border-[var(--color-ink)] bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[1px_1px_0_var(--color-ink)]">
      {children}
    </kbd>
  )
}
