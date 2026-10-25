import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { Button } from '../ui/Button'
import { StripLabel } from '../ui/StripLabel'

/** The yellow "sign" across the top: brand, who is logged in, ADMIN badge, Log out. */
export function AppHeader() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="relative border-b-[3px] border-ink bg-label">
      <div className="mx-auto flex h-[68px] max-w-[1312px] items-center justify-between gap-4 px-4 md:h-[84px] md:px-8">
        <p className="m-0 font-display text-[32px] leading-none font-bold tracking-[-1px] md:text-[46px] md:tracking-[-1.5px]">
          yourGarage
        </p>
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          {isAdmin && <StripLabel tone="admin">Admin</StripLabel>}
          <span className="hidden truncate text-[15px] sm:inline">{user?.email}</span>
          <Button variant="outline" className="h-10" icon={<LogOut size={18} aria-hidden="true" />} onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </div>
    </header>
  )
}
