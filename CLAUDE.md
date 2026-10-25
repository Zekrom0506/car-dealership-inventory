# CLAUDE.md — Car Dealership Inventory System (TDD kata)

Context for any AI session continuing this project. Keep short; update as we go.

## Working rules
- **Strict TDD:** write failing test → run it, confirm it fails for the right reason → minimum code to pass → refactor.
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
15. JWT payload: `sub` = user id (string), `role`. Role changes need a new login. Login returns 401 `Invalid email or password` for both unknown email and wrong password; login only requires a password to be present (no length rule).
16. Changing what the user sees (messages, status codes) is a behaviour change → its own RED/GREEN cycle, never part of REFACTOR.

## Schema
- **User:** id (int), email (unique), passwordHash, role (`USER`|`ADMIN`, default `USER`), createdAt
- **Vehicle:** id (int), make, model, category, price (int), quantity (int ≥ 0), createdAt, updatedAt

## Code conventions (backend)
- Layers: `routes/` → `controllers/` (HTTP only) → `services/` (business rules) → Prisma. Input rules in `validation/*.schemas.ts`, parsed with `parseOrThrow`.
- Throw `HttpError(status, message)`; `middleware/errorHandler.ts` sends `{ error }`. Non-HttpErrors go to Express's default handler.
- Read environment variables only through `src/config/env.ts`; all JWT code lives in `src/lib/jwt.ts`.
- Prisma 7 client is generated into `src/generated/prisma` (git-ignored; `npm install` regenerates it).
- Claude's sandbox runs tests via `~/pg-sandbox/with-pg.sh npm test` (starts Postgres 16.14 for one command). Claude can't delete files or commit in the user's folder.
- `git add` uses exact file paths only (never whole folders), so each commit holds only its own changes.
- Known history quirk: commit `ef061b5` (refactor) also contains the clear-messages change, so `1ad14e6` [RED] did not actually fail. Left as-is; mention in README.

## Phases & progress
### Phase 1 — Backend (TDD)
- [x] 0. Setup + `GET /api/health`
- [x] 1. Register
- [x] 2. Login
- [ ] 3. Auth middleware (401 / admin 403)
- [ ] 4. POST /api/vehicles
- [ ] 5. GET /api/vehicles
- [ ] 6. GET /api/vehicles/search
- [ ] 7. PUT /api/vehicles/:id
- [ ] 8. DELETE /api/vehicles/:id
- [ ] 9. POST /api/vehicles/:id/purchase (atomic, 409 when out of stock)
- [ ] 10. POST /api/vehicles/:id/restock
- [ ] 11. Admin seed script + coverage check
### Phase 2 — Frontend design (look & feel, pages, components)
### Phase 3 — Frontend build (TDD with Vitest + RTL)
### Phase 4 — Deployment (Neon Postgres + API host + frontend host)
### Phase 5 — README (setup, screenshots, "My AI Usage"), test report, PROMPTS.md
