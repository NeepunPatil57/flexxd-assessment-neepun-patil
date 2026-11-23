import crypto from "node:crypto";
import store from "../configs/store.js";
import HttpError from "../utils/httpError.js";

const REDEMPTION_CODE_LIFETIME_MS = 10 * 60 * 1000;

function getTodayUtcDate() {
  return new Date().toISOString().slice(0, 10);
}

function generateRedemptionCode() {
  let code = crypto.randomBytes(4).toString("hex").toUpperCase();
  while (store.bookings.some((booking) => booking.redemptionCode === code)) {
    code = crypto.randomBytes(4).toString("hex").toUpperCase();
  }
  return code;
}

export function createBooking(userId, venueId) {
  const user = store.users.find((storedUser) => storedUser.id === userId);
  if (!user) {
    throw new HttpError(404, `User '${userId}' not found`);
  }

  const venue = store.venues.find((storedVenue) => storedVenue.id === venueId);
  if (!venue) {
    throw new HttpError(404, `Venue '${venueId}' not found`);
  }

  if (user.visitCredits < 1) {
    throw new HttpError(402, "User has no visit credits left");
  }

  const today = getTodayUtcDate();
  if (venue.currentPeopleCount >= venue.totalCapacity) {
    throw new HttpError(409, "Venue is at full capacity");
  }

  user.visitCredits -= 1;
  venue.currentPeopleCount += 1;

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + REDEMPTION_CODE_LIFETIME_MS);

  const booking = {
    id: crypto.randomUUID(),
    userId,
    venueId,
    date: today,
    redemptionCode: generateRedemptionCode(),
    redeemed: false,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  store.bookings.push(booking);

  return booking;
}

export function redeemBooking(redemptionCode) {
  const booking = store.bookings.find(
    (storedBooking) => storedBooking.redemptionCode === redemptionCode
  );
  if (!booking) {
    throw new HttpError(404, `Redemption code '${redemptionCode}' not found`);
  }

  if (booking.redeemed) {
    throw new HttpError(409, "Booking has already been redeemed");
  }

  if (Date.now() > new Date(booking.expiresAt).getTime()) {
    throw new HttpError(410, "Redemption code has expired");
  }

  booking.redeemed = true;

  return booking;
}
