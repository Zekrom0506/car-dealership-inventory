# yourGarage — Car Dealership Inventory System by Utkarsh Prithviraj

A full-stack inventory app for a car dealership, built test-first (TDD). Everyone can log in, browse, search and buy cars; admins can also add, edit, restock and delete vehicles. Prices are in Indian rupees (₹, Indian digit grouping).

**Live demo:** _coming soon_ <!-- TODO: replace with the Vercel URL, e.g. https://your-garage.vercel.app -->

## Features

- **Accounts:** register and log in (JWT, 1-hour expiry). Registration always creates a normal user; the admin comes from a seed script.
- **Dashboard:** every vehicle with photo (or a placeholder if missing or broken), category, rupee price and stock. Sold-out cars show a disabled "Sold out" button; the last unit shows "Only 1 left".
- **Search and filter:** make, model, category and price range, combined; "Showing X of Y vehicles", a no-results state and "Clear all filters".
- **Purchase:** buys one unit; stock check and decrease happen in one database update, so stock can never go below zero, even with simultaneous buyers.
- **Admin:** add vehicles (with optional photo URL), edit (only changed fields are sent), restock with a −/+ stepper and preview, delete with confirmation.
- **Clear errors:** every API error is JSON `{ "error": "message" }` and is shown in the UI.

## Tech stack

| Part | Tools |
|---|---|
| Backend | Node 22, TypeScript, Express 5, Prisma 7, PostgreSQL 16, zod, jsonwebtoken, bcrypt |
| Backend tests | Jest + Supertest against a separate `dealership_test` database |
| Frontend | Vite 8, React 19, TypeScript, React Router, Tailwind CSS 4 (custom design tokens), lucide-react icons |
| Frontend tests | Vitest + React Testing Library (jsdom), API faked per test |
| Database locally | Docker Compose (`postgres:16`) |

## API

All vehicle endpoints need a `Authorization: Bearer <token>` header.

| Method | Path | Who |
|---|---|---|
| POST | `/api/auth/register` | anyone |
| POST | `/api/auth/login` | anyone |
| GET | `/api/vehicles` | logged in |
| GET | `/api/vehicles/search?q=&make=&model=&category=&minPrice=&maxPrice=` | logged in |
| POST | `/api/vehicles/:id/purchase` | logged in |
| POST | `/api/vehicles` | admin |
| PUT | `/api/vehicles/:id` | admin |
| DELETE | `/api/vehicles/:id` | admin |
| POST | `/api/vehicles/:id/restock` | admin |

## Setup

You need **Node 22**, **npm** and **Docker Desktop**.

### 1. Clone and start the database

```
git clone https://github.com/Zekrom0506/car-dealership-inventory.git
```
```
cd car-dealership-inventory
```
```
docker compose up -d
```

This starts PostgreSQL 16 on port 5432 and creates two databases: `dealership_dev` (the app) and `dealership_test` (the test suite).

### 2. Backend

```
cd backend
```
```
npm install
```

Create the environment files from the examples, then open `.env` and set your own `JWT_SECRET`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` (at least 8 characters):
```
cp .env.example .env
```
```
cp .env.test.example .env.test
```

Create the tables, then add the admin account and 12 sample cars:
```
npm run db:migrate
```
```
npm run db:seed
```

Start the API on http://localhost:4000 (leave it running):
```
npm run dev
```

### 3. Frontend

In a second terminal, from the project folder:
```
cd frontend
```
```
npm install
```
```
npm run dev
```

Open http://localhost:5173 and log in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `backend/.env`, or register a new user. The Vite dev server forwards `/api` to the backend, so no CORS setup is needed locally.

Sample car photos are in `frontend/public/cars/`, named `<make>-<model>.jpg` (e.g. `honda-city.jpg`).

### 4. Running the tests

Backend (needs the Docker database running; migrations are applied to `dealership_test` automatically):
```
cd backend
```
```
npm test
```
```
npm run test:coverage
```

Frontend (no database or backend needed):
```
cd frontend
```
```
npm test
```
```
npm run test:coverage
```

## Deployment

Three free services: **Neon** (PostgreSQL), **Render** (API) and **Vercel** (frontend).

| Service | Setting | Value |
|---|---|---|
| Neon | `DATABASE_URL` | the direct (non-pooled) connection string, ending in `?sslmode=require` |
| Render | Root directory | `backend` |
| Render | Build command | `npm install --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build` |
| Render | Start command | `npm start` |
| Render | Health check path | `/api/health` |
| Render | Environment | `DATABASE_URL`, `JWT_SECRET` (long random string), `JWT_EXPIRES_IN=1h`, `FRONTEND_ORIGIN` (the Vercel URL, no trailing path), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NODE_VERSION=22` (Render supplies `PORT` itself) |
| Vercel | Root directory | `frontend` |
| Vercel | Build command / output | `npm run build` / `dist` |
| Vercel | Environment | `VITE_API_URL` = the Render URL (e.g. `https://your-api.onrender.com`) |

- The API only accepts browser requests from the origin(s) in `FRONTEND_ORIGIN` (CORS). Several origins can be comma-separated.
- `frontend/vercel.json` sends every path to `index.html`, so pages like `/login` also work on refresh.
- Create the admin and sample cars once, from your own computer, after the first Render deploy (migrations run during the build):

```
cd backend
```
```
DATABASE_URL='<Neon connection string>' ADMIN_EMAIL='<your email>' ADMIN_PASSWORD='<strong password>' npm run db:seed
```

## Test reports

| Part | Tests | Statements | Branches | Functions | Lines | Report |
|---|---|---|---|---|---|---|
| Backend | 218 passed | 98.34% | 94.44% | 95.23% | 98.28% | [docs/test-report-backend.md](docs/test-report-backend.md) |
| Frontend | 122 passed | 96.77% | 88.74% | 97.88% | 98.93% | [docs/test-report-frontend.md](docs/test-report-frontend.md) |

## Screenshots

<!-- TODO: add screenshots -->
| Screen | Image |
|---|---|
| Log in | _screenshot coming soon_ |
| Register | _screenshot coming soon_ |
| Dashboard (user) | _screenshot coming soon_ |
| Dashboard (admin) | _screenshot coming soon_ |
| Search with no results | _screenshot coming soon_ |
| Add / edit vehicle | _screenshot coming soon_ |
| Restock | _screenshot coming soon_ |
| Delete confirmation | _screenshot coming soon_ |

## Known limitations

- **Login token in `localStorage`.** It keeps you logged in after a refresh, but any script on the page could read it, so an XSS bug could steal it. A safer option is an httpOnly, Secure, SameSite cookie set by the backend (needs CSRF protection). Expired tokens are dropped on load, and the server checks the token on every request.
- **No downward stock correction.** Quantity can't be changed through edit, and restock only adds. If a stock-take finds fewer cars, an admin can only lower stock by "purchasing" the extra units. A future fix: an admin-only relative adjustment (e.g. `{ "change": -2 }`) that refuses to go below zero.
- **Mobile search and filter controls are not built yet.** The design's mobile search box, category chips and Filter panel aren't done; on small screens the desktop filter form is shown instead. The mobile account menu is also not done (the header shows Log out directly).
- **Dialogs close only with Cancel.** Esc-to-close and keeping keyboard focus inside dialogs are not done yet.
- **Free hosting is slow to wake.** Render's free plan puts the API to sleep when idle, so the first request after a break can take about a minute.
- **Uncovered lines.** A few lines are not covered by tests, mostly defensive code (e.g. fallback error messages, "already submitting" guards). Each one is listed with the reason in the test reports. One real frontend gap: no test types into the Model filter.
- **Git history quirk.** Commit `ef061b5` (a refactor) also contains a change to clearer error messages, so the earlier `[RED]` commit `1ad14e6` did not actually fail.

## My AI Usage

### Tools used
- **Claude (claude.ai), two chats:** the first for planning and building the backend, the second for the frontend, README and test reports. Chat links are in `PROMPTS.md`.
- **Claude Design:** for the frontend look and layout (cream wall, orange buttons, rust-red danger actions). I used one palette photo as a colour reference only, and exported the design (HTML and PDF) into `docs/design/`.

### How I used them
- **Planning first.** I asked Claude for a stack, folder structure, schema and build order before any code, then reviewed it and made the open decisions myself.
- **Strict Red-Green-Refactor.** Claude wrote failing tests first and showed the failing output before any implementation. I ran the commits myself, so the history shows `[RED]`, `[GREEN]` and `[REFACTOR]` tags in the commit bodies. Tests written after the code, for coverage only, are tagged `[COVERAGE]` so the history stays honest.
- **Claude ran the tests in its own sandbox,** and I re-ran them on my Mac (Docker + PostgreSQL 16) at the end of each feature.
- **Design to code.** I iterated on the design in Claude Design, then had Claude record the palette, fonts and button styles in `CLAUDE.md` and as Tailwind theme tokens before building any screen.
- **`CLAUDE.md` as shared memory.** It holds the plan, decisions and working rules, so I could continue in a fresh chat without losing context.

### Decisions I made or changed
- **PostgreSQL from the start** (Docker locally, Neon planned for production) so tests and deployment behave the same.
- **Email normalisation** (trim and lowercase) in one shared helper, so register, login and the seed agree.
- **Error-message changes kept out of refactors,** and done as their own RED/GREEN cycle, since they change visible behaviour.
- **Quantity can't be changed through PUT.** Stock changes only through purchase and restock, which avoids overwriting a sale made while an admin edits.
- **Role read from the database on every request,** so a demoted admin loses access immediately.
- **No crashes from odd input:** maximum values for price, quantity and image URLs; JSON errors for malformed bodies, unknown routes and unexpected failures, with no internal details or stack traces leaked.
- **Seed script resets the admin password** from `.env`, so nobody can take over the admin email by registering it first.
- **"Out of stock" message** when buying a sold-out car, and a list reload after a failed purchase, for two people buying the last car.
- **Search `q` parameter, optional `imageUrl`** (with `null` clearing it) and an empty-inventory message, added as separate test-first cycles.
- **Admin edit form** reuses the add form and sends only changed fields.

### Mistakes I caught and corrected
- An early commit used `git add backend/src`, which pulled a later change into the wrong commit. I kept the history as it is and switched to exact file paths in every `git add`.
- Some commits were missing the `Co-authored-by` trailer. I asked for it on every commit.
- Claude sometimes moved on to GREEN without showing the failing RED output, or said a file was updated when it wasn't. I made showing RED output a standing rule in `CLAUDE.md` and checked the files myself.
- Claude's commit commands assumed a working directory, so I started each block with `cd` to the project root.

### Reflection
AI sped up the repetitive parts: boilerplate, test cases, and checking edge cases like race conditions on purchase. It worked best when I gave small, specific tasks with the reasons behind the rules. It needed supervision: it made small mistakes in git handling and process, and I had to read the tests as carefully as the code. I made the design and trade-off decisions, and I can explain every endpoint, test and commit.

The full conversations are linked in [PROMPTS.md](PROMPTS.md).
