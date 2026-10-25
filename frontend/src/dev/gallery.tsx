/**
 * Component gallery — DEV ONLY (open /gallery.html with `npm run dev`).
 * Shows every shared UI piece in the same arrangement as the design boards,
 * so they can be compared side by side with docs/design/. Not part of the app build.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LogOut, Pencil, ShoppingCart, Funnel, Trash2 } from 'lucide-react'
import '@fontsource/archivo/400.css'
import '@fontsource/archivo/500.css'
import '@fontsource/archivo/600.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import '../index.css'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { StripLabel } from '../components/ui/StripLabel'
import { TextField } from '../components/ui/TextField'
import { formatInr } from '../lib/formatInr'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <StripLabel className="self-start">{title}</StripLabel>
      {children}
    </section>
  )
}

function Gallery() {
  return (
    <main className="flex w-[1100px] flex-col gap-10 bg-wall p-12 font-body text-ink">
      <Section title="Buttons">
        <div className="flex flex-wrap gap-3">
          <Button icon={<ShoppingCart size={18} strokeWidth={2} />}>Purchase</Button>
          <Button variant="secondary" icon={<Pencil size={18} strokeWidth={1.5} />}>Edit</Button>
          <Button variant="danger" icon={<Trash2 size={18} strokeWidth={2} />}>Delete</Button>
          <Button disabled>Sold out</Button>
          <Button variant="outline" className="h-10" icon={<LogOut size={17} strokeWidth={1.75} />}>Log out</Button>
          <Button variant="secondary" icon={<Funnel size={17} strokeWidth={1.5} />}>Filter</Button>
          <Button size="lg">Log in</Button>
        </div>
        <div className="flex flex-wrap gap-3" data-gallery="disabled">
          <Button variant="secondary" disabled>Secondary disabled</Button>
          <Button variant="danger" disabled>Danger disabled</Button>
          <Button variant="outline" disabled>Outline disabled</Button>
        </div>
      </Section>

      <Section title="Strip labels">
        <div className="flex flex-wrap items-center gap-2">
          <StripLabel>SUV</StripLabel>
          <StripLabel tone="low">Only 1 left</StripLabel>
          <StripLabel tone="soldOut">Sold out</StripLabel>
          <StripLabel tone="admin">Admin</StripLabel>
        </div>
      </Section>

      <Section title="Inputs (log in / dialog states)">
        <div className="grid w-[440px] grid-cols-1 gap-[18px] border-[1.5px] border-ink bg-card p-9 shadow-offset">
          <TextField label="Email" emphasis="strong" inputSize="lg" defaultValue="priya.sharma@gmail" error="Enter a valid email address, like name@example.com" />
          <TextField label="Password" emphasis="strong" inputSize="lg" type="password" error="Password is required" />
          <div className="grid grid-cols-2 gap-3.5">
            <TextField label="Price (₹)" emphasis="strong" defaultValue="-50000" error="Price must be above ₹0" />
            <TextField label="Quantity" emphasis="strong" defaultValue="3" hint="Only when adding" />
          </div>
          <TextField label="Min price (₹)" placeholder="0" />
        </div>
      </Section>

      <Section title="Banners">
        <Banner tone="success" onDismiss={() => {}}>
          <b>Purchase confirmed.</b> Hyundai i20 is yours — 5 left in stock.
        </Banner>
        <Banner tone="error" onDismiss={() => {}}>
          <b>Couldn’t complete purchase.</b> Out of stock
        </Banner>
      </Section>

      <Section title="Prices (formatInr)">
        <div className="flex flex-wrap gap-8 font-display text-2xl font-bold">
          {[9_999, 7_50_000, 1_20_00_000, 2_147_483_647].map((p) => (
            <span key={p}>{formatInr(p)}</span>
          ))}
        </div>
      </Section>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Gallery />
  </StrictMode>,
)
