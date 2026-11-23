# Handover

All work gets recorded in docs/HANDOVER.md, docs/LEGACY.md, docs/ISSUES.md at the end of each task.

## Done
- Express backend (JS, ESM) in `server/`, in-memory store, nodemon dev script.
- Seed (fixed UUID ids, see store.js): users Asha (3 credits), Ben (0 credits); venues Mumbai Gym, Bangalore Gym (cap 10 each, price 1). Venues hold `currentPeopleCount` (bookings so far).
- `POST /bookings` with validation, 404s, credit + capacity (`totalCapacity`) checks, redemption code.
- `POST /bookings/redeem`: marks booking redeemed; 404 unknown, 409 already redeemed, 410 expired (codes live 10 min).
- `GET /users/:id`: user + credits + all bookings; 404 unknown.

## Left
- No further endpoints requested yet.

## Next steps
- Run: `cd server && npm run dev` (port 3000, `PORT` env overrides).
- Test: `cd server && npm test` (node:test, no extra deps; API test spawns server on port 3999).

## Key files
- `assumptions.txt` — business assumptions.
- `server/src/index.js` — bootstrap, JSON parse error + 404/500 handlers.
- `server/src/configs/store.js` — seed data / in-memory store.
- `server/src/routes/bookingRoutes.js`, `controllers/bookingController.js`, `services/bookingService.js`.
- `server/src/routes/userRoutes.js`, `controllers/userController.js`, `services/userService.js`.
- `server/src/utils/httpError.js` — error with status.
- `server/src/testing/bookingService.test.js` (service rules + expiry via mocked Date), `server/src/testing/api.test.js` (HTTP status codes).
