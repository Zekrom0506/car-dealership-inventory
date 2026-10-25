import type { ReactNode } from 'react'
import { Link } from 'react-router'
import doorPhoto from '../../assets/backgrounds/door_garage.jpg'

/**
 * Shared frame for Log in and Register: blurred garage-door photo under a cream veil,
 * the brand, and the card with the Log in / Register tabs.
 */
export function AuthLayout({ activeTab, children }: { activeTab: 'login' | 'register'; children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden px-4 py-12 font-body text-ink md:justify-center md:py-16">
      {/* Background: inset -40px so the blurred edges stay off-screen. */}
      <div
        aria-hidden="true"
        className="absolute -inset-10 bg-cover bg-center blur-[2px]"
        style={{ backgroundImage: `url(${doorPhoto})` }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-wall/60" />

      <div className="relative flex w-full max-w-[440px] flex-col items-center gap-6 md:gap-7">
        <p className="m-0 font-display text-4xl font-bold tracking-[-1px] md:text-5xl md:tracking-[-1.5px]">yourGarage</p>

        <div className="flex w-full flex-col gap-5 border-[1.5px] border-ink bg-card px-5 py-6 shadow-offset-sm md:gap-[22px] md:p-9 md:shadow-offset">
          <AuthTabs active={activeTab} />
          {children}
        </div>
      </div>
    </div>
  )
}

const tabBase = 'flex h-11 items-center justify-center text-[15px]'

/** The two tabs: the current page is shown selected; the other is a link to it. */
function AuthTabs({ active }: { active: 'login' | 'register' }) {
  const tabs = [
    { id: 'login', label: 'Log in', to: '/login' },
    { id: 'register', label: 'Register', to: '/register' },
  ] as const
  return (
    <div role="tablist" className="grid grid-cols-2 border-[1.5px] border-ink">
      {tabs.map((tab) =>
        tab.id === active ? (
          <span key={tab.id} role="tab" aria-selected="true" className={`${tabBase} bg-ink font-semibold text-card`}>
            {tab.label}
          </span>
        ) : (
          <Link
            key={tab.id}
            to={tab.to}
            role="tab"
            aria-selected="false"
            className={`${tabBase} text-ink no-underline transition-colors duration-150 hover:bg-ink/8 hover:text-ink`}
          >
            {tab.label}
          </Link>
        ),
      )}
    </div>
  )
}
