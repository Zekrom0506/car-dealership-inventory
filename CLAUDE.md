# CLAUDE.md — Car Dealership Inventory System (TDD kata)

Context for any AI session continuing this project. Keep short; update as we go.

## Working rules
- **Strict TDD:** write failing test → run it, confirm it fails for the right reason → minimum code to pass → refactor.
- **Always show the RED output** (the actual failing test lines) in the message and stop before GREEN — even for one-line changes. Text between tool calls is not shown to the user.
- **No screenshots or comparison images** (to save tokens). After a visual step, tell the user which page to open (e.g. `npm run dev` → http://localhost:5173/gallery.html) and they check it in the browser.
- **Ask vs decide:** if something is ambiguous or a decision would be costly to change later, ask the user before building. For small, obvious choices, decide and tell the user what was chosen.
- **Small steps:** after each RED / GREEN / REFACTOR step, stop and wait for the user.
- Never change a test just to make it pass without explaining why.
- Claude runs tests in its sandbox (Postgres 16.14 via `embedded-postgres`, started per test run) and shows output. User confirms with `npm test` on their Mac at the end of each feature.
- User is a beginner: keep explanations concise and concrete.
- Claude cannot commit; it suggests commands, the user runs them.

## Commit format
Conventional Commits prefix; TDD phase tag at the start of the body; two blank lines; co-author trailer.
```
test: add failing tests for user registration

[RED] Tests for 201 success, hashed password, 409 duplicate email, 400 invalid input.


Co-authored-by: Claude <claude@users.noreply.github.com>
```
`test:` = [RED], `feat:` = [GREEN], `refactor:` = [REFACTOR]. Setup/docs use `chore:`/`docs:` with no tag.
Tests added for code that already exists and that **pass immediately** use `test:` with **[COVERAGE]**, never [RED] — only tag [RED] if the test actually failed first. Prove such tests can fail by temporarily breaking the code (then restore it).

## Stack
- Backend: Node 22 + TypeScript + Express 5, Prisma, PostgreSQL 16, jsonwebtoken + bcrypt, zod
- Backend tests: Jest + Supertest (`--runInBand`, separate `dealership_test` DB, tables emptied before each test)
- Frontend: Vite 8 + React 19 + TypeScript + Tailwind 4 (CSS-first `@theme` tokens); tests: Vitest + React Testing Library
- DB: `docker-compose.yml` (Postgres 16, `dealership_dev` + `dealership_test`) locally; Neon in production
- Coverage report: `npm run test:coverage` (text + HTML in `coverage/`)

## Agreed decisions
1. Register always creates `USER`; `role` in body is ignored. Admin comes from a seed script using `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env`.
2. `GET /api/vehicles` returns all vehicles, including quantity 0 (UI disables Purchase).
3. Add / update / delete / restock vehicles: admin only.
4. All vehicle endpoints need login (as per spec).
5. Purchase body: optional `{ quantity }`, default 1. No purchase history table.
6. Search: case-insensitive partial match on make/model; exact category; inclusive `minPrice`/`maxPrice`; filters combined with AND; 400 if min > max.
7. Categories: Sedan, SUV, Hatchback, Truck, Coupe, Convertible, Van.
8. Price = integer in **whole Indian rupees (INR, ₹)** — no paise. Frontend must show `₹` with Indian digit grouping (e.g. `₹7,50,000`, `₹1,20,00,000`; `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })`). Quantity = integer ≥ 0.
9. Errors: `{ "error": "message" }`. JWT expires in 1h.
10. Secrets in `.env` / `.env.test` (git-ignored); `.env.example` and `.env.test.example` committed. App refuses to start without `JWT_SECRET`.
11. Register returns `201 { user: { id, email, role, createdAt } }` (no token). Login returns `200 { token, user }`.
12. Password minimum 8 characters.
13. Emails are trimmed + lowercased via `src/utils/normalizeEmail.ts` — the single shared place (login must use it too).
14. Validation errors are readable, e.g. `email is required`, `password must be at least 8 characters`.
15. JWT payload: `sub` = user id (string), `role`. `requireAuth` loads the user from the DB on every request: deleted users get 401, and the **role comes from the DB**, so a demoted admin loses access immediately (the token's `role` is only informational, e.g. for the frontend). Login returns 401 `Invalid email or password` for both unknown email and wrong password; login only requires a password to be present (no length rule).
17. Vehicle responses: `{ vehicle }` (single) / `{ vehicles }` (list). Create is admin only, `quantity` is required (no default), category must match the fixed list exactly (frontend uses a dropdown).
18. Limits: make/model trimmed and non-empty; price whole number 1–2147483647; quantity whole number 0–2147483647 (PostgreSQL INTEGER max). Unknown body fields (e.g. `id`) are ignored.
19. DB CHECK constraints `vehicles_quantity_non_negative` (quantity ≥ 0) and `vehicles_price_positive` (price > 0), hand-written in migration `add_vehicle_check_constraints` (Prisma schema can't express CHECKs).
19a. Purchase: any logged-in user; body optional `{ quantity }` (default 1, 1–2147483647); returns 200 `{ vehicle }`. Stock check + decrease in ONE `UPDATE … WHERE id = ? AND quantity >= ?` (no overselling). 409 `Out of stock` when stock is 0, else 409 `Not enough stock: only N left`.
19b. Restock: admin only; `{ quantity }` required (1–2147483647, same rules/messages as purchase via `stockChangeQuantity()`); returns 200 `{ vehicle }`. Increase in ONE `UPDATE … WHERE id = ? AND quantity <= 2147483647 - N`; exceeding → 400 `restock would exceed the maximum stock of 2147483647`.
20. Search: blank and unknown query parameters are ignored; terms trimmed; unknown category → 400 with the list (same message as create); minPrice/maxPrice whole numbers 0–2147483647, min > max → 400. Same newest-first order as the list (`NEWEST_FIRST` in vehicle.service.ts).
21. Ids in the URL must be whole numbers 1–2147483647 (`vehicleIdSchema`), else 400 `id must be a positive whole number` — so `/search` can never be read as an id.
21a. PUT is a partial update of make/model/category/price (same rules as create); empty body → 400. `quantity` in the body → 400 `quantity cannot be changed here; use purchase or restock` (avoids an edit form overwriting a concurrent purchase). Unknown vehicle → 404 `Vehicle not found`. Check order: auth → admin → id → body → exists.
21b. Startup: `assertRequiredEnv()` (config/env.ts) — server exits with code 1 and `Missing required environment variable: NAME` if `JWT_SECRET` or `DATABASE_URL` is missing/blank.
21c. Every error response is JSON `{ error }`: malformed body → 400 `Request body must be valid JSON`; no route matched (any path/method) → 404 `Not found` (404, not 405); anything unexpected → 500 `Internal server error`, real error logged with `console.error` only (no details/stack to the client).
21d. Seed (`npm run db:seed`, `src/seed/`): upserts admin from `ADMIN_EMAIL` (normalised via `normalizeEmail`) + `ADMIN_PASSWORD` (≥ 8 chars). Every run sets role ADMIN **and resets the password** to `.env` (`.env` is the single source of truth; a pre-registered USER with that email is promoted and loses their old password). Invalid config → throws, writes nothing, script exits 1. Adds 12 rupee-priced sample vehicles (`sampleVehicles.ts`: all 7 categories, 2 sold out, 1 with one left) **only if the vehicles table is empty**.
22. Changing what the user sees (messages, status codes) is a behaviour change → its own RED/GREEN cycle, never part of REFACTOR.
23. Vehicle `imageUrl` (optional, nullable, agreed 2026-10-25): create + PUT accept it; trimmed; must be an `http(s)://` URL or a site path starting with a single `/` (so `/cars/honda-city.jpg` works; `javascript:`, `ftp:`, `//host` rejected) → 400 `imageUrl must be an http(s) URL or a path starting with /`; max 2048 chars → 400 `imageUrl must be at most 2048 characters`. Missing/null on create = no image. On PUT: `null` clears it, leaving it out keeps it. Seed photos live in `frontend/public/cars/<make>-<model>.jpg` (lowercase, spaces → `-`). Frontend shows the car-icon placeholder when there's no image or it fails to load.

## Schema
- **User:** id (int), email (unique), passwordHash, role (`USER`|`ADMIN`, default `USER`), createdAt
- **Vehicle:** id (int), make, model, category, price (int), quantity (int ≥ 0), createdAt, updatedAt

## Code conventions (backend)
- Layers: `routes/` → `controllers/` (HTTP only) → `services/` (business rules) → Prisma. Input rules in `validation/*.schemas.ts` (shared field helpers + `MAX_INT` in `validation/fields.ts`), parsed with `parseOrThrow`.
- Throw `HttpError(status, message)`; `middleware/errorHandler.ts` sends `{ error }`. Non-HttpErrors go to Express's default handler.
- Prisma "record not found" (P2025) → 404 via `rethrowNotFound()` in `src/lib/prismaErrors.ts`; controllers read `:id` via `vehicleIdFrom(req)`.
- Read environment variables only through `src/config/env.ts`; all JWT code lives in `src/lib/jwt.ts`; all bcrypt code in `src/lib/password.ts` (`hashPassword`/`verifyPassword`). `blankToUndefined` lives in `validation/fields.ts`.
- Prisma 7 client is generated into `src/generated/prisma` (git-ignored). `npm install` and `npm run db:migrate` regenerate it; after pulling a schema change run `npm run db:generate`.
- Category list comes from the Prisma `Category` enum (`src/generated/prisma/enums`) — one source of truth.
- Claude's sandbox runs tests via `~/pg-sandbox/with-pg.sh npm test` (starts Postgres 16.14 for one command). Claude can't commit in the user's folder; delete permission was granted (needed for `prisma generate`) — delete only when a tool needs it or the user asks.
- Command blocks for the user: explanations go **above** commands, never as `# comments` on the same line (user's zsh passes them as arguments).
- `git add` uses exact file paths only (never whole folders), so each commit holds only its own changes.
- Known history quirk: commit `ef061b5` (refactor) also contains the clear-messages change, so `1ad14e6` [RED] did not actually fail. Left as-is; mention in README.

## Known limitations (put in README)
- **Login token in `localStorage`.** The session (`yourGarage.session`) is kept in localStorage so users stay logged in after a refresh. Any script on the page can read it, so an XSS bug could steal it. Safer alternative: an httpOnly, Secure, SameSite cookie set by the backend (needs cookie handling and CSRF protection). Kept localStorage for simplicity in this kata. The app drops expired tokens on load; the server still verifies every request.
- **No downward stock correction.** Quantity is locked out of PUT and restock only adds. If a stock-take finds fewer cars, an admin can only lower stock by "purchasing" the extra units (safe: single conditional UPDATE). Decided 2026-10-25 (option 1).
  - **Future improvement:** admin-only `POST /api/vehicles/:id/adjust` with `{ change: -2 }` — a relative, race-safe change that refuses to go below 0. Never "set quantity to N", which could overwrite a concurrent purchase.

## Design system (frontend) — match `docs/design/` exactly
Source of truth: `docs/design/yourGarage UI.html` (9 boards; `screens.pdf` is the same screens but its export dropped the background photos on some pages — follow the HTML). Tokens live in `frontend/src/styles/theme.css`; Tailwind's default colours, radii and shadows are disabled, so **only these named tokens exist**. Never hard-code a hex value in a component. If the design is unclear or can't be built as shown, **ask** — don't improvise.

**Colours** (Tailwind name → hex → use)
- `wall` #EDE3D4 page ground (under texture) · `card` #F7F1E7 cards, login card, dialogs · `paper` #FFFCF6 inputs, search panel, text on rust/navy
- `orange` #F28A1E primary buttons · `orange-light` #F9C78F secondary buttons, stepper −/+ · `orange-burnt` #C4621A primary hover, focus ring, offset shadows
- `ink` #111111 brand, text, borders
- Accents (sparingly): `rust` #A3352B delete, errors, SOLD OUT · `navy` #34496E links, success/info banner · `label` #F2C230 strip labels + header sign only · `grease` #4A4137 muted text · `hairline` #D8CBB6 dividers · `photo` #E3D6C3 photo placeholder, skeleton

**Fonts** (self-hosted via @fontsource): `font-display` Space Grotesk 500/700 — brand, headings, prices · `font-body` Archivo 400/500/600 — UI, body, forms · `font-mono` IBM Plex Mono 500/600 — strip labels.
Brand "yourGarage": display 700, 46px desktop header (−1.5px tracking) / 32–34px mobile header / 48px login. Page h1 40px (−1px) desktop, 30px mobile. Card model 22px, price 24px (display 700).

**Corners:** always sharp (`border-radius: 0`). No rounded anything.

**Buttons** (height 44px, padding 0 18–20px, Archivo 15px, icon 18px + 8px gap, no border):
- Primary: `bg-orange` text ink, 600; hover `bg-orange-burnt`. Big CTAs 48px tall, 16px.
- Secondary: `bg-orange-light` text ink, 400.
- Danger: `bg-rust` text **paper** (cream on rust — black fails contrast), 600.
- Disabled primary ("Sold out"): transparent, `1px dashed grease`, text grease, 400, `cursor: not-allowed`.
- Outline (header Log out): transparent, `1.5px solid ink`, height 40px. Mobile icon buttons: 44×44, `1.5px solid ink`.

**Button states (added 2026-10-25, not in the design boards):** hover — primary `orange-burnt`, secondary `orange-light-hover`, danger `rust-hover` (both palette mixes in theme.css), outline `ink/8` fill; keyboard focus — 2px `orange-burnt` outline, 2px offset (`focus-visible`); disabled — primary = dashed "Sold out" style, secondary/danger/outline = 50% opacity; disabled buttons never change on hover.

**Labels (yellow strip):** IBM Plex Mono 600, 12px, letter-spacing 1.2px, UPPERCASE, `bg-label` text ink, padding 4px 8px. Variants: SOLD OUT = `bg-rust` text paper; ONLY 1 LEFT = yellow + `1.5px solid ink`; ADMIN badge = `bg-ink` text label (11–12px, 1.2–1.5px tracking).

**Cards (vehicle):** `bg-card`, `1.5px solid ink`, sharp. Photo area 180px (190px mobile) `bg-photo` with a 72px Lucide car icon (stroke 1, grease); category label top-left, SOLD OUT / ONLY 1 LEFT top-right (12px inset). Body padding 18/18/20 (16 mobile): make 13px grease 500, model h2; hairline top border before price row (price left, "N in stock"/"Out of stock" right, 13px grease); full-width Purchase button. Hover: `shadow-offset` (`shadow-offset-sm` mobile) + translate(−2px,−2px), 0.15s. Admin cards add a row under Purchase: `1px dashed hairline` top border, grid `1fr 1fr 44px` gap 8 — Edit (secondary), Restock (secondary), Delete icon-only (danger, aria-label "Delete {make} {model}").
Login card: `bg-card`, `1.5px solid ink`, `shadow-offset` (sm on mobile), 440px wide, padding 36px (24/20 mobile). Dialogs: `bg-card`, `1.5px solid ink`, `shadow-dialog`, padding 28px; delete dialog adds `border-top: 6px solid rust`.

**Inputs:** height 44px (46px on login/register), `1px solid ink`, `bg-paper`, padding 0 12px, Archivo 15px (16px on mobile). Error: `2px solid rust` + message row (13px, rust, 500, alert icon). Field label 13px, 500 (600 on auth/dialog forms), 6px gap.

**Backgrounds:**
- App pages (dashboard/admin/loading): `wall.jpg` texture, `background-size: cover`, `background-attachment: fixed`, under a `bg-wall/55` veil (gradient layer over the image), base colour `wall`.
- Login/Register: `door_garage.jpg` full-bleed (`cover`, centred, `filter: blur(2px)`, inset −40px so blurred edges don't show), under a `bg-wall/60` veil.
- Dialog backdrop: `bg-ink/45` over the page.
- Header "sign": `bg-label` with `3px solid ink` bottom border; 84px tall desktop (content max-width 1312px, padding 0 32px), 68px mobile (padding 0 16px).
- Success/info banner: `bg-navy` text paper, padding 14px 18px, check-circle icon, dismiss ✕ (desktop).

**Icons:** Lucide (`lucide-react`): car, user, log-out, circle-check, x, search, funnel, shopping-cart, pencil, trash-2, circle-alert.
**Prices:** `₹` with Indian grouping (`Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })`).

## Frontend decisions (agreed 2026-10-25)
- One dashboard for everyone; admin extras (ADMIN badge, "Manage inventory" label, Add vehicle, Edit/Restock/Delete row) render only for role ADMIN.
- Routes: `/login`, `/register` (tabs are links between them), `/` dashboard (logged-in only).
- Purchase always buys 1 (no quantity picker). Search runs on Filter / Enter, not per keystroke.
- Register "Confirm password" is checked in the frontend only.
- Mobile (< 768px header): one "Search make or model" box → backend `q` (make OR model). Category chips "All, SUV, Hatchback, Coupe, +4"; "+4" reveals all 7. "Filter" opens a panel with category + min/max price (styled like the desktop filter form). Account icon opens a small menu showing the email and a Log out button.
- Grid: 1 column < 640px, 2 < 1024px, 3 < 1280px, 4 from 1280px.
- Edit dialog: title "Edit vehicle", quantity field hidden ("Only when adding").
- Messages: server errors → rust banner shaped like the navy one; success after add/edit/restock/delete/purchase → navy banner (e.g. "Stock updated. Ford Mustang now has 5 in stock."); validation text not in the design → same tone (e.g. "Price must be a whole number").
- Background photos for the app are resized to 1600px in `frontend/src/assets/backgrounds/` (originals stay in `docs/design/`).
- Focus: 2px `orange-burnt` outline, 2px offset.
- Tests: Vitest + RTL with our API module faked per test (no real network). Styling is checked visually against the design at 1440px and 390px, not unit-tested.
- Dev: Vite proxies `/api` → `http://localhost:4000` (no CORS locally).

## Phases & progress
### Phase 1 — Backend (TDD) ✅ complete
- [x] 0. Setup + `GET /api/health`
- [x] 1. Register
- [x] 2. Login
- [x] 3. Auth middleware (401 / admin 403)
- [x] 4. POST /api/vehicles
- [x] 5. GET /api/vehicles (newest first, id tie-breaker, includes quantity 0)
- [x] 6. GET /api/vehicles/search (registered above any `/:id` route)
- [x] 7. PUT /api/vehicles/:id (partial update, quantity rejected)
- [x] 8. DELETE /api/vehicles/:id (204; 404 when already deleted)
- [x] 9. POST /api/vehicles/:id/purchase (single conditional UPDATE, DB CHECK constraints)
- [x] 10. POST /api/vehicles/:id/restock (single conditional UPDATE)
- [x] 11. Admin seed script + coverage check
  - [x] startup env check · [x] JSON 400 malformed body · [x] JSON 404 unknown routes · [x] JSON 500 unexpected errors
  - [x] seed: `npm run db:seed` (src/seed/)
  - [x] coverage report → `docs/test-report-backend.md` (190 tests, 98.28% stmts / 94.44% branches)
### Phase 2 — Frontend design ✅ complete (`docs/design/`; tokens in `frontend/src/styles/theme.css`)
### Phase 3 — Frontend build (TDD with Vitest + RTL)
- [x] 0. Test tooling (Vitest 5, jsdom, RTL, jest-dom), `/api` dev proxy, 1600px backgrounds
- [x] 1. Shared UI: Button, StripLabel, TextField, Banner, `formatInr` (+ dev gallery at `/gallery.html`)
- [x] 2. API client (`src/api/client.ts`) + auth state (`AuthProvider` / `useAuth`; register auto-logs in; 401 with a token → logout)
- [x] 3. Log in + Register pages (shared submit logic: `src/hooks/useSubmitAction.ts`)
- [x] 4. Routing + guards (`src/AppRoutes.tsx`: RequireAuth, GuestOnly, unknown paths → `/`; wired in `App.tsx`)
- [x] 4a. **Backend:** optional `imageUrl` on vehicles (decision 23), RED/GREEN; then seed sets it for the 12 sample cars
- [ ] 5. Dashboard header (brand sign, user email, ADMIN badge, **Log out** button → clears session → /login) + list (skeleton, card states with photo or car-icon placeholder — photo uses `object-cover` in one fixed ratio for every card; if `imageUrl` is null **or the image fails to load** (onError), show the placeholder instead, Sold out disabled, Only 1 left, "Showing X of Y")
- [x] 6a. **Backend:** `q` search parameter (make OR model), its own RED/GREEN cycle
- [x] 6b. Search + filter (desktop form, empty state, Clear all filters)
- [x] 7. Purchase flow (banner, stock update, 409 error, no double-submit)
- [x] 8. Admin (role-gated UI, Add/Edit dialog with optional Photo URL, Restock stepper, Delete confirm)
- [ ] 9. Mobile layout (search box → `q`, category chips, Filter panel), account menu, dialog a11y (Esc, focus trap), screenshots
**Left to do (as of 2026-10-25):** step 9 mobile polish (search box/chips/Filter panel, account menu, dialog Esc + focus trap; dialogs currently close only via Cancel), then Phase 4 deployment and Phase 5 README.
### Phase 4 — Deployment (Neon Postgres + API host + frontend host)
- **CORS:** if the frontend and API end up on different domains, the backend needs CORS allowing only the frontend's origin — add as a small backend RED/GREEN cycle here. (Locally the Vite proxy avoids it.)
### Phase 5 — README (setup, screenshots, "My AI Usage"), test report, PROMPTS.md
