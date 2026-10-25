import type { ReactNode } from 'react'
import wallPhoto from '../../assets/backgrounds/wall.jpg'
import { AppHeader } from './AppHeader'

/** Frame for logged-in pages: wall texture under a cream veil, the header sign, then the page. */
export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen bg-wall bg-cover bg-fixed font-body text-ink"
      style={{
        backgroundImage: `linear-gradient(color-mix(in oklab, var(--color-wall) 55%, transparent), color-mix(in oklab, var(--color-wall) 55%, transparent)), url(${wallPhoto})`,
      }}
    >
      <AppHeader />
      <main className="mx-auto flex max-w-[1312px] flex-col gap-6 px-4 py-6 md:px-8 md:py-10">{children}</main>
    </div>
  )
}
