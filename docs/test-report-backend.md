# Backend test report

- **Date:** 25 October 2026
- **Command:** `cd backend && npx jest --runInBand --coverage --verbose` (same as `npm run test:coverage`, plus `--verbose` to list every test; Jest 30 + Supertest)
- **Run on:** the developer's Mac (Mac mini), with PostgreSQL 16 in Docker (`docker compose`, image `postgres:16`)
- **Database:** PostgreSQL 16 (separate `dealership_test` database, emptied before each test)
- **Result:** 16 test suites, **190 tests passed, 0 failed**
- **Coverage:** 98.28% statements · 94.44% branches · 95% functions · 98.23% lines

## Uncovered lines (deliberately not tested)

| File | Lines | Why |
|---|---|---|
| `src/config/env.ts` | 7, 17–20 | `port`, `adminEmail`, `adminPassword` are only read by `server.ts` and `seed/run.ts`. Those entry points are tested by starting them as real separate processes (`server.startup.test.ts`, `seed.test.ts`), which Jest's coverage cannot measure. |
| `src/middleware/errorHandler.ts` | 29–30 | Standard Express safety code for an error after a response has started streaming; the API never streams. |

Excluded from coverage: the generated Prisma client (`src/generated/`) and the two entry points (`src/server.ts`, `src/seed/run.ts`) — see `backend/jest.config.js`.

## Full output

```
 PASS  tests/integration/seed.test.ts
  seedAdmin
    ✓ creates an ADMIN with a bcrypt-hashed password (200 ms)
    ✓ normalises ADMIN_EMAIL like register does (trim + lowercase) (68 ms)
    ✓ creates only one admin when run twice (113 ms)
    ✓ promotes an existing USER with that email (any case) and resets their password to ADMIN_PASSWORD (163 ms)
    ✓ updates an existing admin password when ADMIN_PASSWORD changes (.env is the source of truth) (167 ms)
    ✓ creates an admin who can log in through the API (126 ms)
    ✓ refuses to run, and creates nothing, when ADMIN_PASSWORD is missing (11 ms)
    ✓ refuses to run, and creates nothing, when ADMIN_PASSWORD is blank (8 ms)
    ✓ refuses to run, and creates nothing, when ADMIN_PASSWORD is shorter than 8 characters (6 ms)
    ✓ refuses to run, and creates nothing, when ADMIN_EMAIL is missing (7 ms)
    ✓ refuses to run, and creates nothing, when ADMIN_EMAIL is not a valid email (6 ms)
  seedSampleVehicles
    ✓ adds 12 vehicles to an empty table (10 ms)
    ✓ covers every category and the requested brands (7 ms)
    ✓ includes exactly two sold-out vehicles and one with only 1 left (6 ms)
    ✓ uses a wide range of rupee prices (under ₹10 lakh up to over ₹1 crore) (7 ms)
    ✓ adds nothing if the table already has vehicles (5 ms)
    ✓ does not duplicate vehicles when run twice (6 ms)
  npm run db:seed (src/seed/run.ts)
    ✓ exits with code 1, explains why, and writes nothing when ADMIN_PASSWORD is too short (155 ms)

 PASS  tests/integration/auth.register.test.ts
  POST /api/auth/register
    ✓ returns 201 with the new user and no password fields (79 ms)
    ✓ stores a bcrypt hash of the password, never the plain password (113 ms)
    ✓ ignores a role sent in the body, so nobody can self-register as ADMIN (63 ms)
    ✓ returns 409 when the email is already registered (67 ms)
    ✓ trims and lowercases the email before saving it (62 ms)
    ✓ returns 409 when the same email is registered with different case or spaces (65 ms)
    ✓ returns 400 when email is missing, with a clear message (11 ms)
    ✓ returns 400 when email is not a valid email address, with a clear message (8 ms)
    ✓ returns 400 when password is missing, with a clear message (7 ms)
    ✓ returns 400 when password is shorter than 8 characters, with a clear message (7 ms)

 PASS  tests/integration/server.startup.test.ts
  server startup
    ✓ refuses to start (exit code 1) and says why when JWT_SECRET is missing (173 ms)
    ✓ starts normally when the required variables are set (198 ms)

 PASS  tests/integration/vehicles.update.test.ts
  PUT /api/vehicles/:id
    ✓ changes only the fields that are sent and returns 200 with the updated vehicle (31 ms)
    ✓ can change make, model and category together, trimming make and model (11 ms)
    ✓ updates updatedAt but keeps createdAt (11 ms)
    ✓ ignores id and unknown fields in the body (11 ms)
    ✓ returns 400 when quantity is sent, because stock only changes via purchase and restock (12 ms)
    ✓ returns 400 when the body is empty (9 ms)
    ✓ returns 400 when the body has only unknown fields (9 ms)
    ✓ returns 400 when make is only spaces, and changes nothing (8 ms)
    ✓ returns 400 when model is only spaces, and changes nothing (8 ms)
    ✓ returns 400 when make is not a string, and changes nothing (9 ms)
    ✓ returns 400 when category is not in the fixed list, and changes nothing (9 ms)
    ✓ returns 400 when price is 0, and changes nothing (8 ms)
    ✓ returns 400 when price has decimals, and changes nothing (8 ms)
    ✓ returns 400 when price is a string, and changes nothing (8 ms)
    ✓ returns 400 when price is above the maximum, and changes nothing (9 ms)
    ✓ returns 400 when the id is a word (7 ms)
    ✓ returns 400 when the id is "search" (must never be treated as an id) (7 ms)
    ✓ returns 400 when the id is a decimal (7 ms)
    ✓ returns 400 when the id is zero (7 ms)
    ✓ returns 400 when the id is negative (8 ms)
    ✓ returns 400 when the id is above the database integer limit (7 ms)
    ✓ returns 404 when no vehicle has that id (18 ms)
    ✓ returns 401 without a token (8 ms)
    ✓ returns 403 for a logged-in USER, and changes nothing (15 ms)

 PASS  tests/integration/vehicles.search.test.ts
  GET /api/vehicles/search
    ✓ returns every vehicle, newest first, when no filters are given (28 ms)
    ✓ matches make partially and case-insensitively, including sold-out vehicles (13 ms)
    ✓ matches model partially and case-insensitively (10 ms)
    ✓ matches category exactly (11 ms)
    ✓ treats minPrice as inclusive (9 ms)
    ✓ treats maxPrice as inclusive (7 ms)
    ✓ filters by a price range (9 ms)
    ✓ combines filters with AND (10 ms)
    ✓ returns 200 with an empty list when nothing matches (9 ms)
    ✓ trims spaces around search terms (9 ms)
    ✓ ignores empty filters (e.g. a blank search box) (8 ms)
    ✓ ignores unknown query parameters instead of failing (9 ms)
    ✓ returns 400 when category is not in the fixed list (9 ms)
    ✓ returns 400 when minPrice is not a number (8 ms)
    ✓ returns 400 when minPrice has decimals (7 ms)
    ✓ returns 400 when maxPrice is negative (8 ms)
    ✓ returns 400 when maxPrice is above the maximum (8 ms)
    ✓ returns 400 when minPrice is greater than maxPrice (8 ms)
    ✓ returns 401 without a token (7 ms)

 PASS  tests/integration/vehicles.create.test.ts
  POST /api/vehicles
    ✓ returns 201 with the new vehicle when called by an admin (21 ms)
    ✓ trims extra spaces from make and model (7 ms)
    ✓ accepts a quantity of 0 (a vehicle can be added before stock arrives) (8 ms)
    ✓ accepts the largest allowed price and quantity (2147483647, the database integer limit) (8 ms)
    ✓ ignores an id sent in the body (ids are generated by the database) (7 ms)
    ✓ returns 401 without a token (5 ms)
    ✓ returns 403 for a logged-in USER (6 ms)
    ✓ returns 400 when make is missing (6 ms)
    ✓ returns 400 when make is only spaces (11 ms)
    ✓ returns 400 when model is missing (7 ms)
    ✓ returns 400 when model is only spaces (7 ms)
    ✓ returns 400 when category is missing (6 ms)
    ✓ returns 400 when category is not in the fixed list (6 ms)
    ✓ returns 400 when category has the wrong case (6 ms)
    ✓ returns 400 when price is missing (7 ms)
    ✓ returns 400 when price is 0 (6 ms)
    ✓ returns 400 when price is negative (6 ms)
    ✓ returns 400 when price has decimals (7 ms)
    ✓ returns 400 when price is a string (7 ms)
    ✓ returns 400 when price is above the maximum (6 ms)
    ✓ returns 400 when quantity is missing (7 ms)
    ✓ returns 400 when quantity is negative (6 ms)
    ✓ returns 400 when quantity has decimals (7 ms)
    ✓ returns 400 when quantity is a string (6 ms)
    ✓ returns 400 when quantity is above the maximum (7 ms)

 PASS  tests/integration/vehicles.purchase.test.ts
  POST /api/vehicles/:id/purchase
    ✓ buys 1 by default when no body is sent, and returns 200 with the new stock (23 ms)
    ✓ buys the requested quantity (8 ms)
    ✓ allows buying exactly the remaining stock (down to 0) (8 ms)
    ✓ lets an ADMIN purchase too (10 ms)
    ✓ ignores unknown fields in the body (7 ms)
    ✓ returns 409 and keeps the stock when asking for more than is left (13 ms)
    ✓ returns 409 "Out of stock" for a sold-out vehicle (e.g. someone else bought the last one) (8 ms)
    ✓ never oversells when many buyers purchase the last car at the same moment (13 ms)
    ✓ sells exactly the available stock when parallel buyers outnumber it (10 ms)
    ✓ returns 400 when quantity is 0, and keeps the stock (7 ms)
    ✓ returns 400 when quantity is negative, and keeps the stock (6 ms)
    ✓ returns 400 when quantity has decimals, and keeps the stock (6 ms)
    ✓ returns 400 when quantity is a string, and keeps the stock (7 ms)
    ✓ returns 400 when quantity is above the maximum, and keeps the stock (6 ms)
    ✓ returns 400 when the id is a word (6 ms)
    ✓ returns 400 when the id is "search" (6 ms)
    ✓ returns 404 when no vehicle has that id (7 ms)
    ✓ returns 401 without a token, and keeps the stock (6 ms)

 PASS  tests/integration/vehicles.restock.test.ts
  POST /api/vehicles/:id/restock
    ✓ adds the quantity to the stock and returns 200 with the updated vehicle (46 ms)
    ✓ brings a sold-out vehicle back into stock (11 ms)
    ✓ loses no units when several restocks happen at the same moment (15 ms)
    ✓ allows restocking up to exactly the maximum stock (9 ms)
    ✓ returns 400 and keeps the stock when the restock would exceed the maximum stock (12 ms)
    ✓ returns 400 when no body is sent, and keeps the stock (8 ms)
    ✓ returns 400 when quantity is missing, and keeps the stock (7 ms)
    ✓ returns 400 when quantity is 0, and keeps the stock (7 ms)
    ✓ returns 400 when quantity is negative, and keeps the stock (7 ms)
    ✓ returns 400 when quantity has decimals, and keeps the stock (7 ms)
    ✓ returns 400 when quantity is a string, and keeps the stock (7 ms)
    ✓ returns 400 when quantity is above the maximum, and keeps the stock (7 ms)
    ✓ returns 400 when the id is a word (6 ms)
    ✓ returns 400 when the id is "search" (6 ms)
    ✓ returns 404 when no vehicle has that id (8 ms)
    ✓ returns 401 without a token, and keeps the stock (7 ms)
    ✓ returns 403 for a logged-in USER, and keeps the stock (8 ms)

 PASS  tests/integration/auth.middleware.test.ts
  requireAuth
    ✓ lets a request with a valid Bearer token through and attaches the user (19 ms)
    ✓ returns 401 when there is no Authorization header (4 ms)
    ✓ returns 401 when the token has no "Bearer " prefix (4 ms)
    ✓ returns 401 when the header is "Bearer" with no token (5 ms)
    ✓ returns 401 when a different scheme is used (6 ms)
    ✓ returns 401 when the token is not a valid JWT (5 ms)
    ✓ returns 401 when the token was signed with a different secret (6 ms)
    ✓ returns 401 (and does not crash) when the token has expired (6 ms)
    ✓ returns 401 when a correctly signed token has a subject that is not a user id (6 ms)
    ✓ returns 401 when the token is valid but the user has since been deleted (7 ms)
  requireAdmin
    ✓ lets an ADMIN through (7 ms)
    ✓ returns 403 for a logged-in USER (6 ms)
    ✓ uses the current role from the database: a demoted admin gets 403 with their old token (7 ms)

 PASS  tests/integration/vehicles.delete.test.ts
  DELETE /api/vehicles/:id
    ✓ returns 204 with an empty body and removes only that vehicle (25 ms)
    ✓ returns 404 when the same vehicle is deleted a second time (14 ms)
    ✓ returns 404 when no vehicle has that id (11 ms)
    ✓ returns 400 when the id is a word (8 ms)
    ✓ returns 400 when the id is "search" (7 ms)
    ✓ returns 400 when the id is zero (7 ms)
    ✓ returns 401 without a token, and deletes nothing (8 ms)
    ✓ returns 403 for a logged-in USER, and deletes nothing (8 ms)

 PASS  tests/integration/app.errors.test.ts
  malformed JSON body
    ✓ returns 400 JSON { error } for cut-off JSON (7 ms)
    ✓ returns 400 JSON { error } for a bare string (not an object) (1 ms)
  unknown routes
    ✓ returns 404 JSON { error } for an unknown path (1 ms)
    ✓ returns 404 JSON { error } for the site root
    ✓ returns 404 JSON { error } for a method no route uses (PATCH) (1 ms)
    ✓ returns 404 JSON { error } for an unknown path under a real route
  unexpected errors
    ✓ returns 500 JSON { error } without leaking details or a stack trace, and logs the real error (26 ms)
    ✓ returns 500 (not 404 or 409) when PUT /:id (update) hits a database error other than "not found" (11 ms)
    ✓ returns 500 (not 404 or 409) when DELETE /:id (delete) hits a database error other than "not found" (10 ms)
    ✓ returns 500 (not 404 or 409) when POST /:id/purchase hits a database error other than "not found" (9 ms)
    ✓ returns 500 (not 404 or 409) when POST /:id/restock hits a database error other than "not found" (9 ms)

 PASS  tests/integration/vehicles.list.test.ts
  GET /api/vehicles
    ✓ returns 200 with all vehicles for a logged-in USER (not only admins) (27 ms)
    ✓ returns 200 for an ADMIN too (12 ms)
    ✓ includes sold-out vehicles (quantity 0) so the UI can show them with Purchase disabled (10 ms)
    ✓ returns an empty list when there are no vehicles (9 ms)
    ✓ orders vehicles newest first (by createdAt), not by insertion order (10 ms)
    ✓ breaks ties on the same createdAt by id (higher id first), so the order is always the same (9 ms)
    ✓ returns 401 without a token (5 ms)

 PASS  tests/integration/auth.login.test.ts
  POST /api/auth/login
    ✓ returns 200 with a token and the user (no password fields) (26 ms)
    ✓ issues a JWT signed with JWT_SECRET containing the user id and role, valid for 1 hour (10 ms)
    ✓ accepts the email with different case and surrounding spaces (8 ms)
    ✓ returns 401 when the password is wrong (8 ms)
    ✓ returns 401 with the same message when the email is not registered (5 ms)
    ✓ returns 400 when email is missing (4 ms)
    ✓ returns 400 when password is missing (5 ms)

 PASS  tests/integration/db.constraints.test.ts
  vehicles table constraints
    ✓ rejects a negative quantity on insert (28 ms)
    ✓ rejects an update that would make quantity negative (12 ms)
    ✓ rejects a 0 price (7 ms)
    ✓ rejects a negative price (9 ms)
    ✓ accepts the boundary values quantity 0 and price 1 (5 ms)

 PASS  tests/integration/health.test.ts
  GET /api/health
    ✓ responds 200 with status "ok" so we know the API is running (1 ms)

 PASS  tests/unit/env.test.ts
  assertRequiredEnv
    ✓ does not throw when JWT_SECRET and DATABASE_URL are set
    ✓ throws when JWT_SECRET is missing (1 ms)
    ✓ throws when JWT_SECRET is empty
    ✓ throws when JWT_SECRET is only spaces
    ✓ throws when DATABASE_URL is missing (1 ms)

------------------------|---------|----------|---------|---------|-------------------
File                    | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
------------------------|---------|----------|---------|---------|-------------------
All files               |   98.28 |    94.44 |      95 |   98.23 |                   
 src                    |     100 |      100 |     100 |     100 |                   
  app.ts                |     100 |      100 |     100 |     100 |                   
 src/config             |      75 |       50 |   57.14 |      75 |                   
  env.ts                |      75 |       50 |   57.14 |      75 | 7,17-20           
 src/controllers        |     100 |      100 |     100 |     100 |                   
  auth.controller.ts    |     100 |      100 |     100 |     100 |                   
  vehicle.controller.ts |     100 |      100 |     100 |     100 |                   
 src/errors             |     100 |      100 |     100 |     100 |                   
  HttpError.ts          |     100 |      100 |     100 |     100 |                   
 src/lib                |     100 |      100 |     100 |     100 |                   
  jwt.ts                |     100 |      100 |     100 |     100 |                   
  password.ts           |     100 |      100 |     100 |     100 |                   
  prisma.ts             |     100 |      100 |     100 |     100 |                   
  prismaErrors.ts       |     100 |      100 |     100 |     100 |                   
 src/middleware         |   94.73 |    93.33 |     100 |   94.44 |                   
  auth.ts               |     100 |      100 |     100 |     100 |                   
  errorHandler.ts       |   85.71 |    88.88 |     100 |   85.71 | 29-30             
  notFound.ts           |     100 |      100 |     100 |     100 |                   
 src/routes             |     100 |      100 |     100 |     100 |                   
  auth.routes.ts        |     100 |      100 |     100 |     100 |                   
  vehicles.routes.ts    |     100 |      100 |     100 |     100 |                   
 src/seed               |     100 |      100 |     100 |     100 |                   
  sampleVehicles.ts     |     100 |      100 |     100 |     100 |                   
  seed.ts               |     100 |      100 |     100 |     100 |                   
 src/services           |     100 |      100 |     100 |     100 |                   
  auth.service.ts       |     100 |      100 |     100 |     100 |                   
  vehicle.service.ts    |     100 |      100 |     100 |     100 |                   
 src/utils              |     100 |      100 |     100 |     100 |                   
  normalizeEmail.ts     |     100 |      100 |     100 |     100 |                   
 src/validation         |     100 |      100 |     100 |     100 |                   
  auth.schemas.ts       |     100 |      100 |     100 |     100 |                   
  fields.ts             |     100 |      100 |     100 |     100 |                   
  parse.ts              |     100 |      100 |     100 |     100 |                   
  vehicle.schemas.ts    |     100 |      100 |     100 |     100 |                   
------------------------|---------|----------|---------|---------|-------------------
Test Suites: 16 passed, 16 total
Tests:       190 passed, 190 total
Snapshots:   0 total
Time:        5.076 s
Ran all test suites.
```
