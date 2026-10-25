import type { ReactNode } from 'react'

export type StripLabelTone = 'default' | 'soldOut' | 'low' | 'admin'

const tones: Record<StripLabelTone, string> = {
  default: 'bg-label text-ink',
  soldOut: 'bg-rust text-paper', // SOLD OUT
  low: 'bg-label text-ink border-[1.5px] border-ink', // ONLY 1 LEFT
  admin: 'bg-ink text-label tracking-[1.5px]', // ADMIN badge in the header
}

/** Yellow "strip" label: IBM Plex Mono, uppercase, tracked — like the stamped plates on the door. */
export function StripLabel({
  tone = 'default',
  className = '',
  children,
}: {
  tone?: StripLabelTone
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={`inline-block px-2 py-1 font-mono text-xs leading-[1.4] font-semibold tracking-[1.2px] uppercase ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
