import React from "react"

export const Countdown: React.FC<{ value: number }> = ({ value }) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 backdrop-blur-xs">
      <span className="font-mono text-9xl font-black text-white drop-shadow-[4px_4px_0_var(--color-ink)] animate-ping-once">
        {value}
      </span>
    </div>
  )
}
