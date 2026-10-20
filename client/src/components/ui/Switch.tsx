import React from "react"

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label }) => {
  return (
    <label className="flex items-center justify-between cursor-pointer select-none">
      <span className="font-medium">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full border-2 border-[var(--color-ink)] transition-colors ${
          checked ? "bg-[var(--color-accent)]" : "bg-[var(--color-line)]"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-ink)] transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  )
}
