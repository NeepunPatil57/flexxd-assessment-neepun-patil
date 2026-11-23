import store from "../configs/store.js";
import HttpError from "../utils/httpError.js";

export function getUserWithBookings(userId) {
  const user = store.users.find((storedUser) => storedUser.id === userId);
  if (!user) {
    throw new HttpError(404, `User '${userId}' not found`);
  }

  const bookings = store.bookings.filter((booking) => booking.userId === userId);

  return { ...user, bookings };
}
