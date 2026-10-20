import React from "react"

interface SegmentedOption {
  value: string
  label: string | React.ReactNode
}

interface SegmentedProps {
  options: SegmentedOption[]
  value: string
  onChange: (value: string) => void
}

export const Segmented: React.FC<SegmentedProps> = ({ options, value, onChange }) => {
  return (
    <div className="inline-flex rounded-lg border-2 border-[var(--color-ink)] bg-[var(--color-surface)] p-1 gap-1">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              active
                ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)] border-2 border-[var(--color-ink)] shadow-[1px_1px_0_var(--color-ink)]"
                : "text-[var(--color-ink)] hover:bg-[var(--color-line)] border-2 border-transparent"
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
