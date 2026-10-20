import React from "react"

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  icon: React.ReactNode
}

export const IconButton: React.FC<IconButtonProps> = ({ label, icon, className = "", ...props }) => {
  return (
    <button
      aria-label={label}
      title={label}
      className={`p-2 rounded-lg border-2 border-[var(--color-ink)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-line)] shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none inline-flex items-center justify-center cursor-pointer transition-all ${className}`}
      {...props}
    >
      {icon}
    </button>
  )
}
