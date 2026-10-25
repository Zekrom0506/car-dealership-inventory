# Backend test report

- **Date:** 25 October 2026
- **Command:** `cd backend && npx jest --runInBand --coverage --verbose` (same as `npm run test:coverage`, plus `--verbose` to list every test; Jest 30 + Supertest)
- **Run on:** the developer's Mac (Mac mini), with PostgreSQL 16 in Docker (`docker compose`, image `postgres:16`)
- **Database:** PostgreSQL 16 (separate `dealership_test` database, emptied before each test)
- **Result:** 16 test suites, **218 tests passed, 0 failed**
- **Coverage:** 98.34% statements · 94.44% branches · 95.23% functions · 98.28% lines

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
    ✓ creates an ADMIN with a bcrypt-hashed password (198 ms)
    ✓ normalises ADMIN_EMAIL like register does (trim + lowercase) (69 ms)
    ✓ creates only one admin when run twice (114 ms)
    ✓ promotes an existing USER with that email (any case) and resets their password to ADMIN_PASSWORD (166 ms)
    ✓ updates an existing admin password when ADMIN_PASSWORD changes (.env is the source of truth) (167 ms)
    ✓ creates an admin who can log in through the API (130 ms)
    ✓ refuses to run, and creates nothing, when ADMIN_PASSWORD is missing (12 ms)
    ✓ refuses to run, and creates nothing, when ADMIN_PASSWORD is blank (8 ms)
    ✓ refuses to run, and creates nothing, when ADMIN_PASSWORD is shorter than 8 characters (8 ms)
    ✓ refuses to run, and creates nothing, when ADMIN_EMAIL is missing (6 ms)
    ✓ refuses to run, and creates nothing, when ADMIN_EMAIL is not a valid email (6 ms)
  seedSampleVehicles
    ✓ adds 12 vehicles to an empty table (11 ms)
    ✓ covers every category and the requested brands (7 ms)
    ✓ includes exactly two sold-out vehicles and one with only 1 left (9 ms)
    ✓ gives every vehicle a photo path /cars/<make>-<model>.jpg (lowercase, spaces → -) (12 ms)
    ✓ uses a wide range of rupee prices (under ₹10 lakh up to over ₹1 crore) (6 ms)
    ✓ adds nothing if the table already has vehicles (4 ms)
    ✓ does not duplicate vehicles when run twice (6 ms)
  npm run db:seed (src/seed/run.ts)
    ✓ exits with code 1, explains why, and writes nothing when ADMIN_PASSWORD is too short (172 ms)

 PASS  tests/integration/auth.register.test.ts
  POST /api/auth/register
    ✓ returns 201 with the new user and no password fields (83 ms)
    ✓ stores a bcrypt hash of the password, never the plain password (115 ms)
    ✓ ignores a role sent in the body, so nobody can self-register as ADMIN (67 ms)
    ✓ returns 409 when the email is already registered (68 ms)
    ✓ trims and lowercases the email before saving it (63 ms)
    ✓ returns 409 when the same email is registered with different case or spaces (65 ms)
    ✓ returns 400 when email is missing, with a clear message (12 ms)
    ✓ returns 400 when email is not a valid email address, with a clear message (8 ms)
    ✓ returns 400 when password is missing, with a clear message (8 ms)
    ✓ returns 400 when password is shorter than 8 characters, with a clear message (7 ms)

 PASS  tests/integration/server.startup.test.ts
  server startup
    ✓ refuses to start (exit code 1) and says why when JWT_SECRET is missing (246 ms)
    ✓ starts normally when the required variables are set (231 ms)

 PASS  tests/integration/vehicles.update.test.ts
  PUT /api/vehicles/:id
    ✓ changes only the fields that are sent and returns 200 with the updated vehicle (47 ms)
    ✓ sets imageUrl (trimmed) and keeps the other fields (14 ms)
    ✓ removes the image when imageUrl is null (13 ms)
    ✓ keeps the image when imageUrl is not sent (12 ms)
    ✓ can change make, model and category together, trimming make and model (11 ms)
    ✓ updates updatedAt but keeps createdAt (11 ms)
    ✓ ignores id and unknown fields in the body (10 ms)
    ✓ returns 400 when quantity is sent, because stock only changes via purchase and restock (9 ms)
    ✓ returns 400 when the body is empty (10 ms)
    ✓ returns 400 when the body has only unknown fields (8 ms)
    ✓ returns 400 when make is only spaces, and changes nothing (9 ms)
    ✓ returns 400 when model is only spaces, and changes nothing (8 ms)
    ✓ returns 400 when make is not a string, and changes nothing (9 ms)
    ✓ returns 400 when category is not in the fixed list, and changes nothing (10 ms)
    ✓ returns 400 when price is 0, and changes nothing (9 ms)
    ✓ returns 400 when price has decimals, and changes nothing (9 ms)
    ✓ returns 400 when price is a string, and changes nothing (10 ms)
    ✓ returns 400 when price is above the maximum, and changes nothing (10 ms)
    ✓ returns 400 when imageUrl is not a URL, and changes nothing (9 ms)
    ✓ returns 400 when imageUrl uses javascript:, and changes nothing (9 ms)
    ✓ returns 400 when imageUrl is longer than 2048 characters, and changes nothing (9 ms)
    ✓ returns 400 when the id is a word (8 ms)
    ✓ returns 400 when the id is "search" (must never be treated as an id) (8 ms)
    ✓ returns 400 when the id is a decimal (8 ms)
    ✓ returns 400 when the id is zero (7 ms)
    ✓ returns 400 when the id is negative (9 ms)
    ✓ returns 400 when the id is above the database integer limit (7 ms)
    ✓ returns 404 when no vehicle has that id (21 ms)
    ✓ returns 401 without a token (11 ms)
    ✓ returns 403 for a logged-in USER, and changes nothing (11 ms)

 PASS  tests/integration/vehicles.create.test.ts
  POST /api/vehicles
    ✓ returns 201 with the new vehicle when called by an admin (34 ms)
    ✓ trims extra spaces from make and model (13 ms)
    ✓ accepts a quantity of 0 (a vehicle can be added before stock arrives) (9 ms)
    ✓ accepts the largest allowed price and quantity (2147483647, the database integer limit) (8 ms)
    ✓ saves imageUrl when it is a full https URL (10 ms)
    ✓ saves imageUrl when it is a full http URL (7 ms)
    ✓ saves imageUrl when it is a path on our own site (8 ms)
    ✓ trims spaces around imageUrl (8 ms)
    ✓ stores null when imageUrl is missing or null (no image) (10 ms)
    ✓ accepts an imageUrl of exactly 2048 characters (8 ms)
    ✓ ignores an id sent in the body (ids are generated by the database) (8 ms)
    ✓ returns 401 without a token (6 ms)
    ✓ returns 403 for a logged-in USER (7 ms)
    ✓ returns 400 when make is missing (8 ms)
    ✓ returns 400 when make is only spaces (8 ms)
    ✓ returns 400 when model is missing (8 ms)
    ✓ returns 400 when model is only spaces (7 ms)
    ✓ returns 400 when category is missing (7 ms)
    ✓ returns 400 when category is not in the fixed list (8 ms)
    ✓ returns 400 when category has the wrong case (7 ms)
    ✓ returns 400 when price is missing (7 ms)
    ✓ returns 400 when price is 0 (7 ms)
    ✓ returns 400 when price is negative (7 ms)
    ✓ returns 400 when price has decimals (8 ms)
    ✓ returns 400 when price is a string (7 ms)
    ✓ returns 400 when price is above the maximum (8 ms)
    ✓ returns 400 when quantity is missing (8 ms)
    ✓ returns 400 when quantity is negative (7 ms)
    ✓ returns 400 when quantity has decimals (8 ms)
    ✓ returns 400 when quantity is a string (7 ms)
    ✓ returns 400 when quantity is above the maximum (8 ms)
    ✓ returns 400 when imageUrl is not a URL (8 ms)
    ✓ returns 400 when imageUrl is only spaces (7 ms)
    ✓ returns 400 when imageUrl is not a string (8 ms)
    ✓ returns 400 when imageUrl uses javascript: (7 ms)
    ✓ returns 400 when imageUrl uses ftp: (8 ms)
    ✓ returns 400 when imageUrl starts with // (another site) (7 ms)
    ✓ returns 400 when imageUrl is longer than 2048 characters (7 ms)

 PASS  tests/integration/vehicles.search.test.ts
  GET /api/vehicles/search
    ✓ returns every vehicle, newest first, when no filters are given (34 ms)
    ✓ matches make partially and case-insensitively, including sold-out vehicles (12 ms)
    ✓ matches model partially and case-insensitively (9 ms)
    ✓ matches category exactly (10 ms)
    ✓ treats minPrice as inclusive (9 ms)
    ✓ treats maxPrice as inclusive (8 ms)
    ✓ filters by a price range (9 ms)
    ✓ combines filters with AND (9 ms)
    ✓ returns 200 with an empty list when nothing matches (10 ms)
    ✓ trims spaces around search terms (9 ms)
    ✓ ignores empty filters (e.g. a blank search box) (9 ms)
    ✓ ignores unknown query parameters instead of failing (13 ms)
    ✓ returns 400 when category is not in the fixed list (9 ms)
    ✓ returns 400 when minPrice is not a number (10 ms)
    ✓ returns 400 when minPrice has decimals (9 ms)
    ✓ returns 400 when maxPrice is negative (10 ms)
    ✓ returns 400 when maxPrice is above the maximum (9 ms)
    ✓ returns 400 when minPrice is greater than maxPrice (8 ms)
    ✓ returns 401 without a token (8 ms)
  GET /api/vehicles/search?q= (make OR model)
    ✓ matches a make, case-insensitive, newest first (10 ms)
    ✓ matches a model, case-insensitive, newest first (9 ms)
    ✓ matches part of a make or model, case-insensitive, newest first (10 ms)
    ✓ matches "make model" together, case-insensitive, newest first (10 ms)
    ✓ matches spaces around it (trimmed), case-insensitive, newest first (9 ms)
    ✓ combines q with the other filters (AND) (9 ms)
    ✓ ignores a blank q (8 ms)
    ✓ returns an empty list when nothing matches (9 ms)

 PASS  tests/integration/vehicles.restock.test.ts
  POST /api/vehicles/:id/restock
    ✓ adds the quantity to the stock and returns 200 with the updated vehicle (31 ms)
    ✓ brings a sold-out vehicle back into stock (10 ms)
    ✓ loses no units when several restocks happen at the same moment (19 ms)
    ✓ allows restocking up to exactly the maximum stock (10 ms)
    ✓ returns 400 and keeps the stock when the restock would exceed the maximum stock (13 ms)
    ✓ returns 400 when no body is sent, and keeps the stock (9 ms)
    ✓ returns 400 when quantity is missing, and keeps the stock (7 ms)
    ✓ returns 400 when quantity is 0, and keeps the stock (7 ms)
    ✓ returns 400 when quantity is negative, and keeps the stock (7 ms)
    ✓ returns 400 when quantity has decimals, and keeps the stock (8 ms)
    ✓ returns 400 when quantity is a string, and keeps the stock (8 ms)
    ✓ returns 400 when quantity is above the maximum, and keeps the stock (7 ms)
    ✓ returns 400 when the id is a word (7 ms)
    ✓ returns 400 when the id is "search" (9 ms)
    ✓ returns 404 when no vehicle has that id (8 ms)
    ✓ returns 401 without a token, and keeps the stock (7 ms)
    ✓ returns 403 for a logged-in USER, and keeps the stock (10 ms)

 PASS  tests/integration/vehicles.purchase.test.ts
  POST /api/vehicles/:id/purchase
    ✓ buys 1 by default when no body is sent, and returns 200 with the new stock (46 ms)
    ✓ buys the requested quantity (13 ms)
    ✓ allows buying exactly the remaining stock (down to 0) (12 ms)
    ✓ lets an ADMIN purchase too (11 ms)
    ✓ ignores unknown fields in the body (9 ms)
    ✓ returns 409 and keeps the stock when asking for more than is left (13 ms)
    ✓ returns 409 "Out of stock" for a sold-out vehicle (e.g. someone else bought the last one) (7 ms)
    ✓ never oversells when many buyers purchase the last car at the same moment (16 ms)
    ✓ sells exactly the available stock when parallel buyers outnumber it (14 ms)
    ✓ returns 400 when quantity is 0, and keeps the stock (9 ms)
    ✓ returns 400 when quantity is negative, and keeps the stock (7 ms)
    ✓ returns 400 when quantity has decimals, and keeps the stock (7 ms)
    ✓ returns 400 when quantity is a string, and keeps the stock (7 ms)
    ✓ returns 400 when quantity is above the maximum, and keeps the stock (6 ms)
    ✓ returns 400 when the id is a word (7 ms)
    ✓ returns 400 when the id is "search" (6 ms)
    ✓ returns 404 when no vehicle has that id (8 ms)
    ✓ returns 401 without a token, and keeps the stock (7 ms)

 PASS  tests/integration/vehicles.delete.test.ts
  DELETE /api/vehicles/:id
    ✓ returns 204 with an empty body and removes only that vehicle (35 ms)
    ✓ returns 404 when the same vehicle is deleted a second time (16 ms)
    ✓ returns 404 when no vehicle has that id (11 ms)
    ✓ returns 400 when the id is a word (8 ms)
    ✓ returns 400 when the id is "search" (9 ms)
    ✓ returns 400 when the id is zero (7 ms)
    ✓ returns 401 without a token, and deletes nothing (9 ms)
    ✓ returns 403 for a logged-in USER, and deletes nothing (10 ms)

 PASS  tests/integration/auth.middleware.test.ts
  requireAuth
    ✓ lets a request with a valid Bearer token through and attaches the user (39 ms)
    ✓ returns 401 when there is no Authorization header (8 ms)
    ✓ returns 401 when the token has no "Bearer " prefix (11 ms)
    ✓ returns 401 when the header is "Bearer" with no token (9 ms)
    ✓ returns 401 when a different scheme is used (10 ms)
    ✓ returns 401 when the token is not a valid JWT (6 ms)
    ✓ returns 401 when the token was signed with a different secret (8 ms)
    ✓ returns 401 (and does not crash) when the token has expired (12 ms)
    ✓ returns 401 when a correctly signed token has a subject that is not a user id (8 ms)
    ✓ returns 401 when the token is valid but the user has since been deleted (9 ms)
  requireAdmin
    ✓ lets an ADMIN through (9 ms)
    ✓ returns 403 for a logged-in USER (8 ms)
    ✓ uses the current role from the database: a demoted admin gets 403 with their old token (8 ms)

 PASS  tests/integration/vehicles.list.test.ts
  GET /api/vehicles
    ✓ returns 200 with all vehicles for a logged-in USER (not only admins) (31 ms)
    ✓ returns 200 for an ADMIN too (11 ms)
    ✓ includes sold-out vehicles (quantity 0) so the UI can show them with Purchase disabled (10 ms)
    ✓ returns an empty list when there are no vehicles (8 ms)
    ✓ orders vehicles newest first (by createdAt), not by insertion order (12 ms)
    ✓ breaks ties on the same createdAt by id (higher id first), so the order is always the same (9 ms)
    ✓ returns 401 without a token (6 ms)

 PASS  tests/integration/auth.login.test.ts
  POST /api/auth/login
    ✓ returns 200 with a token and the user (no password fields) (39 ms)
    ✓ issues a JWT signed with JWT_SECRET containing the user id and role, valid for 1 hour (13 ms)
    ✓ accepts the email with different case and surrounding spaces (11 ms)
    ✓ returns 401 when the password is wrong (10 ms)
    ✓ returns 401 with the same message when the email is not registered (9 ms)
    ✓ returns 400 when email is missing (6 ms)
    ✓ returns 400 when password is missing (6 ms)

 PASS  tests/integration/app.errors.test.ts
  malformed JSON body
    ✓ returns 400 JSON { error } for cut-off JSON (15 ms)
    ✓ returns 400 JSON { error } for a bare string (not an object) (1 ms)
  unknown routes
    ✓ returns 404 JSON { error } for an unknown path (1 ms)
    ✓ returns 404 JSON { error } for the site root (1 ms)
    ✓ returns 404 JSON { error } for a method no route uses (PATCH) (1 ms)
    ✓ returns 404 JSON { error } for an unknown path under a real route
  unexpected errors
    ✓ returns 500 JSON { error } without leaking details or a stack trace, and logs the real error (26 ms)
    ✓ returns 500 (not 404 or 409) when PUT /:id (update) hits a database error other than "not found" (13 ms)
    ✓ returns 500 (not 404 or 409) when DELETE /:id (delete) hits a database error other than "not found" (11 ms)
    ✓ returns 500 (not 404 or 409) when POST /:id/purchase hits a database error other than "not found" (14 ms)
    ✓ returns 500 (not 404 or 409) when POST /:id/restock hits a database error other than "not found" (12 ms)

 PASS  tests/integration/db.constraints.test.ts
  vehicles table constraints
    ✓ rejects a negative quantity on insert (35 ms)
    ✓ rejects an update that would make quantity negative (13 ms)
    ✓ rejects a 0 price (8 ms)
    ✓ rejects a negative price (10 ms)
    ✓ accepts the boundary values quantity 0 and price 1 (7 ms)

 PASS  tests/integration/health.test.ts
  GET /api/health
    ✓ responds 200 with status "ok" so we know the API is running (7 ms)

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
All files               |   98.34 |    94.44 |   95.23 |   98.28 |                   
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
Tests:       218 passed, 218 total
Snapshots:   0 total
Time:        5.746 s, estimated 6 s
Ran all test suites.
```
