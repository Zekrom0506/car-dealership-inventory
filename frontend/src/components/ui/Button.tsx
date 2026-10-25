import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** "lg" = 48px tall call-to-action (login, Add vehicle, mobile Purchase). */
  size?: 'md' | 'lg'
  /** Icon shown before the text. */
  icon?: ReactNode
  /** Request in progress: disabled, aria-busy, and a "busy" look instead of the disabled style. */
  busy?: boolean
}

// Keyboard focus: a 2px burnt-orange outline with a 2px gap (focus-visible = keyboard, not mouse clicks).
const base =
  'inline-flex items-center justify-center gap-2 box-border border-0 font-body text-ink cursor-pointer ' +
  'transition-colors duration-150 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-burnt'

const sizes = {
  md: 'h-11 px-[18px] text-[15px]',
  lg: 'h-12 px-[22px] text-base',
} as const

/** Colours per variant — see CLAUDE.md "Buttons" / "Button states". */
const colours: Record<ButtonVariant, string> = {
  primary: 'bg-orange font-semibold',
  secondary: 'bg-orange-light font-normal',
  // Cream text on rust: black on rust fails contrast.
  danger: 'bg-rust text-paper font-semibold',
  outline: 'bg-transparent border-[1.5px] border-solid border-ink',
}

/** Hover applies to enabled buttons only (`enabled:`), so disabled ones like "Sold out" never react. */
const hover: Record<ButtonVariant, string> = {
  primary: 'enabled:hover:bg-orange-burnt',
  secondary: 'enabled:hover:bg-orange-light-hover',
  danger: 'enabled:hover:bg-rust-hover',
  outline: 'enabled:hover:bg-ink/8',
}

/** Disabled look: primary = the design's dashed "Sold out"; others dim to 50% (e.g. "Save vehicle" while saving). */
const disabledLook: Record<ButtonVariant, string> = {
  primary:
    'disabled:bg-transparent disabled:border disabled:border-dashed disabled:border-grease disabled:text-grease disabled:font-normal',
  secondary: 'disabled:opacity-50',
  danger: 'disabled:opacity-50',
  outline: 'disabled:opacity-50',
}

/** Busy look: keeps the variant's colours, slightly faded, with a wait cursor. */
const busyLook = 'disabled:opacity-70 disabled:cursor-wait'

/** The one button used everywhere. Defaults to type="button" so it never submits a form by accident. */
export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  busy = false,
  type = 'button',
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const state = busy ? busyLook : `${disabledLook[variant]} disabled:cursor-not-allowed`
  return (
    <button
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={`${base} ${sizes[size]} ${colours[variant]} ${hover[variant]} ${state} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
