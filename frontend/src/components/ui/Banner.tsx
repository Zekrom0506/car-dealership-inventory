import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, X } from 'lucide-react'

export interface BannerProps {
  /** success = navy (confirmations), error = rust (server errors). */
  tone: 'success' | 'error'
  children: ReactNode
  /** When given, a ✕ Dismiss button is shown. */
  onDismiss?: () => void
}

/** Full-width message strip. Success is announced politely, errors immediately. */
export function Banner({ tone, children, onDismiss }: BannerProps) {
  const Icon = tone === 'success' ? CircleCheck : CircleAlert
  return (
    <div
      role={tone === 'success' ? 'status' : 'alert'}
      className={
        `flex items-start gap-2.5 px-3.5 py-3 text-sm leading-[1.4] text-paper md:items-center md:gap-3 md:px-[18px] md:py-3.5 md:text-[15px] ` +
        (tone === 'success' ? 'bg-navy' : 'bg-rust')
      }
    >
      <Icon size={20} strokeWidth={2} aria-hidden="true" className="shrink-0" />
      <span className="flex-1">{children}</span>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="-my-1.5 flex h-8 w-11 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent text-paper"
        >
          <X size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
