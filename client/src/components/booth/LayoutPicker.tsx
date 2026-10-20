import React from "react"
import { LAYOUTS, getLayoutMetrics, type LayoutCode } from "../../config/layouts"
import { i18n } from "../../i18n/id"

interface LayoutPickerProps {
  layoutCode: LayoutCode
  onSelectLayout: (_code: LayoutCode) => void
}

export const LayoutPicker: React.FC<LayoutPickerProps> = ({ layoutCode, onSelectLayout }) => {
  const codes: LayoutCode[] = ["1", "2v", "2h", "3v", "4v", "4g"]

  return (
    <div className="space-y-3 min-w-0">
      <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
        {i18n.booth.layout} (Bento Grid)
      </label>
      <div className="grid grid-cols-2 gap-2">
        {codes.map((code) => {
          const active = layoutCode === code
          const conf = LAYOUTS[code]
          return (
            <button
              key={code}
              type="button"
              title={`${conf.name} — ${conf.photoCount} foto`}
              onClick={() => onSelectLayout(code)}
              className={`p-2.5 rounded-lg border-2 border-[var(--color-ink)] flex flex-col items-start justify-center gap-1 transition-all cursor-pointer min-w-0 text-left ${
                active
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)] shadow-[3px_3px_0_var(--color-ink)]"
                  : "bg-[var(--color-surface)] hover:bg-[var(--color-line)] text-[var(--color-ink)] shadow-[2px_2px_0_var(--color-ink)]"
              }`}
            >
              <div className="flex items-center justify-between w-full gap-1.5 min-w-0">
                <span className="font-bold text-sm tracking-tight truncate leading-tight">
                  {conf.name}
                </span>
                <span className="shrink-0 text-[10px] px-1.5 py-px rounded-full border border-current font-mono font-bold leading-tight">
                  {conf.photoCount}
                </span>
              </div>
              <p className="text-[10px] leading-tight opacity-70 truncate w-full font-mono">
                {getLayoutMetrics(code).width}×{getLayoutMetrics(code).height}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}