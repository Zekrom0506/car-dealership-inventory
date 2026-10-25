# Frontend test report

- **Date:** 25 October 2026
- **Command:** `cd frontend && npm run test:coverage` (`vitest run --coverage`, Vitest 5 + React Testing Library, jsdom, coverage via v8)
- **Run on:** the developer's Mac (Mac mini). No real network: every test fakes `fetch` with the backend's responses.
- **Result:** 17 test files, **122 tests passed, 0 failed**
- **Coverage:** 96.77% statements · 88.74% branches · 97.88% functions · 98.93% lines

## Uncovered lines

Mostly defensive code that the UI can't normally reach. A few small untested paths are noted honestly; the clearest gap is marked.

| File | Lines | Why |
|---|---|---|
| `src/api/client.ts` | 37 | Error body that is JSON but has no string `error` field; the backend always sends `{ error }`. (Non-JSON bodies are tested.) |
| `src/api/vehicles.ts` | 45 | Pressing Filter with every field blank (no query string) isn't tested; it calls the same search endpoint without parameters. |
| `src/auth/session.ts` | 28 | A stored token whose payload can't be decoded at all (corrupt JSON and expired tokens are tested). |
| `src/auth/useAuth.ts` | 8 | Error thrown when `useAuth` is used outside `<AuthProvider>` — a programming mistake, not a user path. |
| `src/hooks/useSubmitAction.ts`, `LoginPage.tsx` 27, `RegisterPage.tsx` 47, `VehicleFormDialog.tsx` 86, `RestockDialog.tsx` 39, `DeleteDialog.tsx` 22 | — | "Already submitting" guards and the generic "Something went wrong" fallback for non-API errors. The busy/disabled button already blocks a second click, and every API failure arrives as an `ApiError`. |
| `RestockDialog.tsx` 46, `VehicleFormDialog.tsx` 96 | — | Same generic fallback message for a non-`ApiError` failure. |
| `src/pages/RegisterPage.tsx` | 32 | One branch of the password check (combination not exercised separately). |
| `src/pages/DashboardPage.tsx` | 149 | "Clear all filters" when reloading the list fails. |
| `src/components/dashboard/FilterForm.tsx` | 35 | **Real gap:** no test types into the Model filter (Make, category and price are tested; Model uses the same code). |

## Coverage table (from the Mac run)

```
--------------------------|---------|----------|---------|---------|-------------------
File                      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
--------------------------|---------|----------|---------|---------|-------------------
All files                 |   96.77 |    88.74 |   97.88 |   98.93 |                   
 src                      |     100 |      100 |     100 |     100 |                   
  App.tsx                 |     100 |      100 |     100 |     100 |                   
  AppRoutes.tsx           |     100 |      100 |     100 |     100 |                   
 src/api                  |     100 |     90.9 |     100 |     100 |                   
  client.ts               |     100 |    94.44 |     100 |     100 | 37                
  vehicles.ts             |     100 |       75 |     100 |     100 | 45                
 src/auth                 |   95.45 |    93.75 |     100 |   94.87 |                   
  AuthProvider.tsx        |     100 |      100 |     100 |     100 |                   
  authContext.ts          |     100 |      100 |     100 |     100 |                   
  session.ts              |   95.23 |      100 |     100 |   94.73 | 28                
  useAuth.ts              |      75 |       50 |     100 |      75 | 8                 
 src/components/auth      |     100 |      100 |     100 |     100 |                   
  AuthLayout.tsx          |     100 |      100 |     100 |     100 |                   
 src/components/dashboard |   96.63 |    93.54 |   97.36 |   99.02 |                   
  AppHeader.tsx           |     100 |      100 |     100 |     100 |                   
  AppLayout.tsx           |     100 |      100 |     100 |     100 |                   
  DeleteDialog.tsx        |   91.66 |       75 |     100 |     100 | 22-28             
  FilterForm.tsx          |   91.66 |      100 |      90 |      90 | 35                
  RestockDialog.tsx       |   96.29 |     87.5 |     100 |     100 | 39,46             
  VehicleCard.tsx         |     100 |      100 |     100 |     100 |                   
  VehicleFormDialog.tsx   |   98.18 |       96 |     100 |     100 | 86,96             
  VehiclePhoto.tsx        |     100 |      100 |     100 |     100 |                   
 src/components/ui        |     100 |      100 |     100 |     100 |                   
  Banner.tsx              |     100 |      100 |     100 |     100 |                   
  Button.tsx              |     100 |      100 |     100 |     100 |                   
  StripLabel.tsx          |     100 |      100 |     100 |     100 |                   
  TextField.tsx           |     100 |      100 |     100 |     100 |                   
 src/hooks                |   94.44 |       50 |     100 |     100 |                   
  useSubmitAction.ts      |   94.44 |       50 |     100 |     100 | 24-32             
 src/lib                  |     100 |      100 |     100 |     100 |                   
  formatInr.ts            |     100 |      100 |     100 |     100 |                   
  validation.ts           |     100 |      100 |     100 |     100 |                   
 src/pages                |    95.7 |    80.32 |   96.66 |   99.25 |                   
  DashboardPage.tsx       |   95.79 |    76.92 |   95.23 |      99 | 149               
  LoginPage.tsx           |      95 |    91.66 |     100 |     100 | 27                
  RegisterPage.tsx        |   95.83 |    89.47 |     100 |     100 | 32,47             
--------------------------|---------|----------|---------|---------|-------------------
```

## Every test

Listed with `npx vitest run --reporter=verbose` (same 122 tests as the Mac run above).

```
 ✓ src/App.test.tsx (1 tests)
    ✓ App > shows the log in page at / when logged out

 ✓ src/AppRoutes.test.tsx (7 tests)
    ✓ routing guards > when logged out > sends / to /login
    ✓ routing guards > when logged out > treats an expired stored session as logged out
    ✓ routing guards > when logged out > lets the user open /register
    ✓ routing guards > when logged in > sends /login to the dashboard
    ✓ routing guards > when logged in > sends /register to the dashboard
    ✓ routing guards > when logged in > sends an unknown path to the dashboard
    ✓ routing guards > when logged in > stays on the dashboard at /

 ✓ src/api/client.test.ts (10 tests)
    ✓ apiRequest > calls /api + path and returns the parsed JSON
    ✓ apiRequest > sends no Authorization header when logged out
    ✓ apiRequest > attaches the stored token as "Authorization: Bearer <token>"
    ✓ apiRequest > sends a body as JSON with the method given
    ✓ apiRequest > returns undefined for 204 No Content (e.g. delete)
    ✓ apiRequest > throws an ApiError with the status and the server's error message
    ✓ apiRequest > throws a friendly ApiError when the error response is not JSON (e.g. a proxy page)
    ✓ apiRequest > throws an ApiError with status 0 when the server cannot be reached
    ✓ apiRequest > on 401 with a token: clears the stored session and tells listeners (so the app logs out)
    ✓ apiRequest > on 401 without a token (wrong password at login): does not trigger a logout

 ✓ src/auth/AuthProvider.test.tsx (10 tests)
    ✓ AuthProvider / useAuth > starts logged out when nothing is stored
    ✓ AuthProvider / useAuth > login() calls POST /api/auth/login, then exposes and stores the user and token
    ✓ AuthProvider / useAuth > isAdmin is true for an ADMIN user
    ✓ AuthProvider / useAuth > stays logged out when login fails
    ✓ AuthProvider / useAuth > register() creates the account, then logs in with the same details
    ✓ AuthProvider / useAuth > stays logged in after a page refresh (session restored from storage)
    ✓ AuthProvider / useAuth > ignores a stored token that has already expired, and clears it
    ✓ AuthProvider / useAuth > ignores a stored session that is not valid JSON
    ✓ AuthProvider / useAuth > logout() forgets the user and clears storage
    ✓ AuthProvider / useAuth > logs out when any API call is rejected with 401 (e.g. the token expired mid-session)

 ✓ src/components/ui/Banner.test.tsx (4 tests)
    ✓ Banner > announces a success message politely (role="status")
    ✓ Banner > announces an error message immediately (role="alert")
    ✓ Banner > shows a Dismiss button that calls onDismiss
    ✓ Banner > has no Dismiss button when onDismiss is not given

 ✓ src/components/ui/Button.test.tsx (7 tests)
    ✓ Button > renders its text as a button
    ✓ Button > is type="button" by default, so it never submits a form by accident
    ✓ Button > can be a submit button when asked
    ✓ Button > calls onClick when clicked
    ✓ Button > does not call onClick when disabled (e.g. "Sold out")
    ✓ Button > shows an icon next to the text without changing the accessible name
    ✓ Button > when busy: is disabled, tells screen readers it is busy, and ignores clicks

 ✓ src/components/ui/TextField.test.tsx (6 tests)
    ✓ TextField > connects the label to the input
    ✓ TextField > passes input props through (type, value, onChange)
    ✓ TextField > is not marked invalid and shows no message when there is no error
    ✓ TextField > shows the error, marks the input invalid, and links the message for screen readers
    ✓ TextField > links a hint (e.g. "Only when adding") as the input description
    ✓ TextField > gives each field its own id, so two fields with the same label stay separate

 ✓ src/lib/formatInr.test.ts (5 tests)
    ✓ formatInr > formats 9999 as ₹9,999 (Indian digit grouping, no paise)
    ✓ formatInr > formats 100000 as ₹1,00,000 (Indian digit grouping, no paise)
    ✓ formatInr > formats 750000 as ₹7,50,000 (Indian digit grouping, no paise)
    ✓ formatInr > formats 12000000 as ₹1,20,00,000 (Indian digit grouping, no paise)
    ✓ formatInr > formats 2147483647 as ₹2,14,74,83,647 (Indian digit grouping, no paise)

 ✓ src/pages/DashboardPage.add.test.tsx (11 tests)
    ✓ DashboardPage — add vehicle (admin) > shows Add vehicle only to admins
    ✓ DashboardPage — add vehicle (admin) > opens a dialog with the form, and Cancel closes it
    ✓ DashboardPage — add vehicle (admin) > shows errors and sends nothing when everything is empty
    ✓ DashboardPage — add vehicle (admin) > shows errors and sends nothing when price is 0
    ✓ DashboardPage — add vehicle (admin) > shows errors and sends nothing when price has decimals
    ✓ DashboardPage — add vehicle (admin) > shows errors and sends nothing when quantity is negative
    ✓ DashboardPage — add vehicle (admin) > shows errors and sends nothing when the photo URL is not a link or /path
    ✓ DashboardPage — add vehicle (admin) > saves the vehicle, closes the dialog, shows it first and confirms
    ✓ DashboardPage — add vehicle (admin) > sends the photo URL trimmed when it is a full link
    ✓ DashboardPage — add vehicle (admin) > sends the photo URL trimmed when it is a site path
    ✓ DashboardPage — add vehicle (admin) > keeps the dialog open and shows the server’s message when saving fails

 ✓ src/pages/DashboardPage.delete.test.tsx (4 tests)
    ✓ DashboardPage — delete (admin) > shows the Delete button only to admins
    ✓ DashboardPage — delete (admin) > asks for confirmation, and Cancel keeps the vehicle
    ✓ DashboardPage — delete (admin) > deletes, removes the card, updates the count and confirms
    ✓ DashboardPage — delete (admin) > keeps the dialog open and shows the server’s message when deleting fails

 ✓ src/pages/DashboardPage.edit.test.tsx (6 tests)
    ✓ DashboardPage — edit vehicle (admin) > shows Edit on cards only to admins
    ✓ DashboardPage — edit vehicle (admin) > opens "Edit vehicle" prefilled, without a Quantity field
    ✓ DashboardPage — edit vehicle (admin) > sends only the changed fields, updates the card and confirms
    ✓ DashboardPage — edit vehicle (admin) > sends imageUrl: null when the Photo URL is cleared
    ✓ DashboardPage — edit vehicle (admin) > just closes, sending nothing, when nothing changed
    ✓ DashboardPage — edit vehicle (admin) > validates like Add and keeps server errors in the dialog

 ✓ src/pages/DashboardPage.purchase.test.tsx (6 tests)
    ✓ DashboardPage — purchase > buys one, shows the confirmation and updates the stock
    ✓ DashboardPage — purchase > turns the card into Sold out after buying the last one
    ✓ DashboardPage — purchase > sends only one request while a purchase is in progress
    ✓ DashboardPage — purchase > shows the server’s message when the car sold out meanwhile (409)
    ✓ DashboardPage — purchase > reloads the list after a 409 so the card shows Sold out
    ✓ DashboardPage — purchase > can dismiss the confirmation

 ✓ src/pages/DashboardPage.restock.test.tsx (7 tests)
    ✓ DashboardPage — restock (admin) > shows Restock on cards only to admins
    ✓ DashboardPage — restock (admin) > shows current stock, a −/+ quantity (starting at 1) and the new-stock preview
    ✓ DashboardPage — restock (admin) > adds the stock, updates the card and confirms
    ✓ DashboardPage — restock (admin) > shows an error and sends nothing when the quantity is empty
    ✓ DashboardPage — restock (admin) > shows an error and sends nothing when the quantity is 0
    ✓ DashboardPage — restock (admin) > shows an error and sends nothing when the quantity is decimals
    ✓ DashboardPage — restock (admin) > keeps the dialog open and shows the server’s 400 message

 ✓ src/pages/DashboardPage.search.test.tsx (4 tests)
    ✓ DashboardPage — search and filter > shows the filter form with every category
    ✓ DashboardPage — search and filter > searches with only the filled-in filters (on Filter or Enter) and shows "Showing X of Y"
    ✓ DashboardPage — search and filter > shows the empty state when nothing matches, and Clear all filters brings everything back
    ✓ DashboardPage — search and filter > shows the server’s message when a search is rejected

 ✓ src/pages/DashboardPage.test.tsx (17 tests)
    ✓ DashboardPage — header > shows the brand, the user’s email and a Log out button
    ✓ DashboardPage — header > Log out clears the session and goes to /login
    ✓ DashboardPage — header > shows the ADMIN badge and "Manage inventory" only for an admin
    ✓ DashboardPage — header > shows the "Inventory" label and the page heading for a normal user
    ✓ DashboardPage — list > asks the API for the vehicles with the login token
    ✓ DashboardPage — list > shows a loading state until the vehicles arrive
    ✓ DashboardPage — list > shows "Showing X of Y vehicles"
    ✓ DashboardPage — list > shows each card’s category, make, model, rupee price and stock
    ✓ DashboardPage — list > marks a sold-out car and disables its button
    ✓ DashboardPage — list > marks a car with one left as "Only 1 left"
    ✓ DashboardPage — list > shows the car’s photo when it has one
    ✓ DashboardPage — list > shows the placeholder when a car has no photo
    ✓ DashboardPage — list > swaps to the placeholder when a photo fails to load
    ✓ DashboardPage — list > shows the server’s error in a banner when loading fails
    ✓ DashboardPage — empty inventory > tells a user there are no vehicles yet
    ✓ DashboardPage — empty inventory > gives an admin a hint to add the first vehicle
    ✓ DashboardPage — empty inventory > does not show the empty message when there are vehicles

 ✓ src/pages/LoginPage.test.tsx (8 tests)
    ✓ LoginPage > shows the brand, heading, fields, tabs and a link to register
    ✓ LoginPage > shows "required" errors and sends nothing when submitted empty
    ✓ LoginPage > shows the design’s message for an invalid email and sends nothing
    ✓ LoginPage > clears a field’s error as soon as the user edits it
    ✓ LoginPage > logs in with the typed details and goes to the dashboard
    ✓ LoginPage > submits when Enter is pressed in the form
    ✓ LoginPage > shows "Logging in…" and disables the button while logging in, so it cannot be submitted twice
    ✓ LoginPage > shows the server’s error in a banner, keeps the email and lets the user try again

 ✓ src/pages/RegisterPage.test.tsx (9 tests)
    ✓ RegisterPage > shows the brand, heading, three fields, tabs and a link to log in
    ✓ RegisterPage > shows an error and sends nothing when the email is invalid
    ✓ RegisterPage > shows an error and sends nothing when the password is shorter than 8 characters
    ✓ RegisterPage > shows an error and sends nothing when the passwords don’t match
    ✓ RegisterPage > shows an error and sends nothing when the confirmation is empty
    ✓ RegisterPage > creates the account, logs in and goes to the dashboard
    ✓ RegisterPage > submits when Enter is pressed in the form
    ✓ RegisterPage > shows "Creating account…" and disables the button while creating the account, so it cannot be submitted twice
    ✓ RegisterPage > shows the server’s error in a banner (e.g. email already registered)
```
