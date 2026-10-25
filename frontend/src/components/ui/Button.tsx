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

// Hover changes only apply to enabled buttons (`enabled:`), so disabled ones like "Sold out" never react.
// Keyboard focus: a 2px burnt-orange outline with a 2px gap (focus-visible = keyboard, not mouse clicks).
const base =
  'inline-flex items-center justify-center gap-2 box-border border-0 font-body text-ink cursor-pointer ' +
  'transition-colors duration-150 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-burnt ' +
  'disabled:cursor-not-allowed'

const sizes = {
  md: 'h-11 px-[18px] text-[15px]',
  lg: 'h-12 px-[22px] text-base',
} as const

/** Colours per variant — see CLAUDE.md "Buttons". */
const variants: Record<ButtonVariant, string> = {
  // Disabled primary is the dashed "Sold out" style from the design.
  primary:
    'bg-orange font-semibold enabled:hover:bg-orange-burnt ' +
    'disabled:bg-transparent disabled:border disabled:border-dashed disabled:border-grease disabled:text-grease disabled:font-normal',
  // Other variants dim to 50% when disabled (e.g. "Save vehicle" while saving).
  secondary: 'bg-orange-light font-normal enabled:hover:bg-orange-light-hover disabled:opacity-50',
  // Cream text on rust: black on rust fails contrast.
  danger: 'bg-rust text-paper font-semibold enabled:hover:bg-rust-hover disabled:opacity-50',
  outline: 'bg-transparent border-[1.5px] border-solid border-ink enabled:hover:bg-ink/8 disabled:opacity-50',
}

/** The one button used everywhere. Defaults to type="button" so it never submits a form by accident. */
export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  type = 'button',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>
      {icon}
      {children}
    </button>
  )
}
