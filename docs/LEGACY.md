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
