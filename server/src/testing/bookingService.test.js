import { describe, test, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import store from "../configs/store.js";
import { createBooking, redeemBooking } from "../services/bookingService.js";
import { getUserWithBookings } from "../services/userService.js";

const ASHA_ID = "0d7e1728-e8f9-4cd8-a172-64107d409ed3";
const BEN_ID = "727aa029-b720-42cb-b770-67d3595f9e6d";
const MUMBAI_GYM_ID = "1b2fdfad-2898-444d-b545-863eec2a08c4";
const BANGALORE_GYM_ID = "ee257e4e-4538-4ad3-ad36-460d4a9950b2";
const TEN_MINUTES_MS = 10 * 60 * 1000;

const seed = structuredClone(store);

function findUser(userId) {
  return store.users.find((user) => user.id === userId);
}

function findVenue(venueId) {
  return store.venues.find((venue) => venue.id === venueId);
}

beforeEach(() => {
  Object.assign(store, structuredClone(seed));
});

describe("createBooking", () => {
  test("deducts one credit, counts the person and returns a booking with a code", () => {
    const booking = createBooking(ASHA_ID, MUMBAI_GYM_ID);

    assert.equal(findUser(ASHA_ID).visitCredits, 2);
    assert.equal(findVenue(MUMBAI_GYM_ID).currentPeopleCount, 1);
    assert.equal(booking.userId, ASHA_ID);
    assert.equal(booking.venueId, MUMBAI_GYM_ID);
    assert.equal(booking.redeemed, false);
    assert.match(booking.redemptionCode, /^[0-9A-F]{8}$/);
    assert.equal(store.bookings.length, 1);
  });

  test("rejects a user with no credits and changes nothing", () => {
    assert.throws(() => createBooking(BEN_ID, BANGALORE_GYM_ID), { status: 402 });
    assert.equal(findVenue(BANGALORE_GYM_ID).currentPeopleCount, 0);
    assert.equal(store.bookings.length, 0);
  });

  test("rejects unknown user and unknown venue with 404", () => {
    assert.throws(() => createBooking("missing-user", MUMBAI_GYM_ID), { status: 404 });
    assert.throws(() => createBooking(ASHA_ID, "missing-venue"), { status: 404 });
    assert.equal(findUser(ASHA_ID).visitCredits, 3);
  });

  test("rejects when venue is at full capacity and keeps the credit", () => {
    findVenue(MUMBAI_GYM_ID).totalCapacity = 2;
    createBooking(ASHA_ID, MUMBAI_GYM_ID);
    createBooking(ASHA_ID, MUMBAI_GYM_ID);

    assert.throws(() => createBooking(ASHA_ID, MUMBAI_GYM_ID), { status: 409 });
    assert.equal(findUser(ASHA_ID).visitCredits, 1);
    assert.equal(findVenue(MUMBAI_GYM_ID).currentPeopleCount, 2);
  });

  test("gives every booking a unique redemption code", () => {
    findUser(ASHA_ID).visitCredits = 10;
    const codes = new Set();
    for (let index = 0; index < 10; index += 1) {
      codes.add(createBooking(ASHA_ID, BANGALORE_GYM_ID).redemptionCode);
    }
    assert.equal(codes.size, 10);
  });
});

describe("redeemBooking", () => {
  test("marks the booking as redeemed and returns it", () => {
    const booking = createBooking(ASHA_ID, MUMBAI_GYM_ID);

    const redeemed = redeemBooking(booking.redemptionCode);

    assert.equal(redeemed.id, booking.id);
    assert.equal(redeemed.redeemed, true);
  });

  test("rejects a code that was already redeemed", () => {
    const booking = createBooking(ASHA_ID, MUMBAI_GYM_ID);
    redeemBooking(booking.redemptionCode);

    assert.throws(() => redeemBooking(booking.redemptionCode), { status: 409 });
  });

  test("rejects a code that does not exist", () => {
    assert.throws(() => redeemBooking("ZZZZZZZZ"), { status: 404 });
  });
});

describe("redemption code expiry", () => {
  beforeEach(() => {
    mock.timers.enable({ apis: ["Date"], now: Date.parse("2026-11-23T10:00:00Z") });
  });

  afterEach(() => {
    mock.timers.reset();
  });

  test("sets expiresAt 10 minutes after createdAt", () => {
    const booking = createBooking(ASHA_ID, MUMBAI_GYM_ID);

    const lifetime = Date.parse(booking.expiresAt) - Date.parse(booking.createdAt);
    assert.equal(lifetime, TEN_MINUTES_MS);
  });

  test("accepts a code at exactly 10 minutes", () => {
    const booking = createBooking(ASHA_ID, MUMBAI_GYM_ID);
    mock.timers.tick(TEN_MINUTES_MS);

    assert.equal(redeemBooking(booking.redemptionCode).redeemed, true);
  });

  test("rejects a code after 10 minutes and leaves it unredeemed", () => {
    const booking = createBooking(ASHA_ID, MUMBAI_GYM_ID);
    mock.timers.tick(TEN_MINUTES_MS + 1);

    assert.throws(() => redeemBooking(booking.redemptionCode), { status: 410 });
    assert.equal(booking.redeemed, false);
  });
});

describe("getUserWithBookings", () => {
  test("returns current credits and all the user's bookings", () => {
    const first = createBooking(ASHA_ID, MUMBAI_GYM_ID);
    createBooking(ASHA_ID, BANGALORE_GYM_ID);
    redeemBooking(first.redemptionCode);

    const user = getUserWithBookings(ASHA_ID);

    assert.equal(user.visitCredits, 1);
    assert.equal(user.bookings.length, 2);
    assert.equal(user.bookings[0].redeemed, true);
  });

  test("rejects an unknown user with 404", () => {
    assert.throws(() => getUserWithBookings("missing-user"), { status: 404 });
  });
});
