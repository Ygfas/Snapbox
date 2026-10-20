import React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline"
  size?: "sm" | "md" | "lg"
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) => {
  const base = "font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"

  let variantStyles = ""
  switch (variant) {
    case "primary":
      variantStyles = "bg-[var(--color-accent)] text-[var(--color-accent-ink)] border-2 border-[var(--color-ink)]"
      break
    case "secondary":
      variantStyles = "bg-[var(--color-surface)] text-[var(--color-ink)] border-2 border-[var(--color-ink)] hover:bg-[var(--color-line)]"
      break
    case "danger":
      variantStyles = "bg-[var(--color-danger)] text-white border-2 border-[var(--color-ink)]"
      break
    case "outline":
      variantStyles = "bg-transparent text-[var(--color-ink)] border-2 border-[var(--color-line)] hover:border-[var(--color-ink)] shadow-none"
      break
  }

  let sizeStyles = ""
  switch (size) {
    case "sm":
      sizeStyles = "px-3 py-1.5 text-xs"
      break
    case "md":
      sizeStyles = "px-4 py-2 text-sm"
      break
    case "lg":
      sizeStyles = "px-6 py-3 text-base font-semibold"
      break
  }

  return (
    <button className={`${base} ${variantStyles} ${sizeStyles} ${className}`} {...props}>
      {children}
    </button>
  )
}
