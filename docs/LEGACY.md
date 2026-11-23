# Legacy (fixed and verified)

## 2026-11-23 — POST /bookings
- Body `{ userId, venueId }` (strings). Returns 201 + booking `{ id, userId, venueId, date, redemptionCode, redeemed, createdAt }`.
- Errors: 400 missing/invalid ids or bad JSON; 404 user/venue not found; 402 no credits; 409 venue at `totalCapacity`.
- All checks run before deducting credit, so failed requests change nothing.
- Venue tracks `currentPeopleCount`; capacity check uses it. Verified: count increments, 409 at cap leaves count/credits unchanged.
- Redemption code: 8 hex chars uppercase, unique across bookings.
- Verified via curl against `node` and `nodemon` runs: success, capacity full, no credits, unknown user/venue, missing field, bad JSON, unknown route.

## 2026-11-23 — POST /bookings/redeem
- Body `{ redemptionCode }` (string, exact match). Sets `redeemed: true`, returns 200 + booking.
- Errors: 400 missing/non-string code or bad JSON; 404 code not found; 409 already redeemed.
- Verified via curl: redeem ok, second redeem 409, unknown code 404, empty body 400, number code 400, bad JSON 400, booking route still works.

## 2026-11-23 — GET /users/:id
- Returns 200 + `{ id, name, visitCredits, bookings: [...] }` (all user's bookings, redeemed or not).
- Errors: 404 unknown user.
- Verified via curl: fresh user empty bookings, credits drop + bookings listed after 2 bookings + 1 redeem, zero-credit user, unknown id 404.

## 2026-11-23 — Redemption code 10 min expiry
- Booking gets `expiresAt` = `createdAt` + 10 min (`REDEMPTION_CODE_LIFETIME_MS` in bookingService.js).
- Redeem after `expiresAt` → 410 "Redemption code has expired"; booking stays unredeemed. Check order: 404 → 409 → 410.
- Expired booking: no credit refund, `currentPeopleCount` not lowered.
- Verified: lifetime 10 min, fresh redeem ok, expired 410, 1s-left ok, POST /bookings returns `expiresAt`.

## 2026-11-23 — Tests
- `npm test` runs node:test over `src/testing/**/*.test.js`. 19 tests, all pass.
- `bookingService.test.js`: store reset from seed clone before each test; covers credits, 402/404/409 capacity (sets own capacity), unique codes, redeem/409/404, expiry (10 min exact ok, +1ms → 410) with `mock.timers` Date, getUserWithBookings.
- `api.test.js`: spawns server on 3999; covers 400/402/404, book → redeem → 409 → GET user flow.
