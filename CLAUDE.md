# CLAUDE.md — Car Dealership Inventory System (TDD kata)

Context for any AI session continuing this project. Keep short; update as we go.

## Working rules
- **Strict TDD:** write failing test → run it, confirm it fails for the right reason → minimum code to pass → refactor.
- **Always show the RED output** (the actual failing test lines) in the message and stop before GREEN — even for one-line changes. Text between tool calls is not shown to the user.
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

## Stack
- Backend: Node 22 + TypeScript + Express 5, Prisma, PostgreSQL 16, jsonwebtoken + bcrypt, zod
- Backend tests: Jest + Supertest (`--runInBand`, separate `dealership_test` DB, tables emptied before each test)
- Frontend: Vite + React + TypeScript + Tailwind; tests: Vitest + React Testing Library
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
8. Price = integer (whole currency units). Quantity = integer ≥ 0.
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
22. Changing what the user sees (messages, status codes) is a behaviour change → its own RED/GREEN cycle, never part of REFACTOR.

## Schema
- **User:** id (int), email (unique), passwordHash, role (`USER`|`ADMIN`, default `USER`), createdAt
- **Vehicle:** id (int), make, model, category, price (int), quantity (int ≥ 0), createdAt, updatedAt

## Code conventions (backend)
- Layers: `routes/` → `controllers/` (HTTP only) → `services/` (business rules) → Prisma. Input rules in `validation/*.schemas.ts` (shared field helpers + `MAX_INT` in `validation/fields.ts`), parsed with `parseOrThrow`.
- Throw `HttpError(status, message)`; `middleware/errorHandler.ts` sends `{ error }`. Non-HttpErrors go to Express's default handler.
- Prisma "record not found" (P2025) → 404 via `rethrowNotFound()` in `src/lib/prismaErrors.ts`; controllers read `:id` via `vehicleIdFrom(req)`.
- Read environment variables only through `src/config/env.ts`; all JWT code lives in `src/lib/jwt.ts`.
- Prisma 7 client is generated into `src/generated/prisma` (git-ignored). `npm install` and `npm run db:migrate` regenerate it; after pulling a schema change run `npm run db:generate`.
- Category list comes from the Prisma `Category` enum (`src/generated/prisma/enums`) — one source of truth.
- Claude's sandbox runs tests via `~/pg-sandbox/with-pg.sh npm test` (starts Postgres 16.14 for one command). Claude can't commit in the user's folder; delete permission was granted (needed for `prisma generate`) — delete only when a tool needs it or the user asks.
- Command blocks for the user: explanations go **above** commands, never as `# comments` on the same line (user's zsh passes them as arguments).
- `git add` uses exact file paths only (never whole folders), so each commit holds only its own changes.
- Known history quirk: commit `ef061b5` (refactor) also contains the clear-messages change, so `1ad14e6` [RED] did not actually fail. Left as-is; mention in README.

## Known limitations (put in README)
- **No downward stock correction.** Quantity is locked out of PUT and restock only adds. If a stock-take finds fewer cars, an admin can only lower stock by "purchasing" the extra units (safe: single conditional UPDATE). Decided 2026-10-25 (option 1).
  - **Future improvement:** admin-only `POST /api/vehicles/:id/adjust` with `{ change: -2 }` — a relative, race-safe change that refuses to go below 0. Never "set quantity to N", which could overwrite a concurrent purchase.

## Phases & progress
### Phase 1 — Backend (TDD)
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
- [ ] 11. Admin seed script + coverage check
### Phase 2 — Frontend design (look & feel, pages, components)
### Phase 3 — Frontend build (TDD with Vitest + RTL)
### Phase 4 — Deployment (Neon Postgres + API host + frontend host)
### Phase 5 — README (setup, screenshots, "My AI Usage"), test report, PROMPTS.md
