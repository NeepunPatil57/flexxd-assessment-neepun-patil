import { createBooking, redeemBooking } from "../services/bookingService.js";

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

export function postBooking(request, response) {
  const { userId, venueId } = request.body ?? {};

  if (!isNonEmptyString(userId) || !isNonEmptyString(venueId)) {
    response.status(400).json({ error: "userId and venueId are required strings" });
    return;
  }

  try {
    const booking = createBooking(userId, venueId);
    response.status(201).json(booking);
  } catch (error) {
    if (error.status) {
      response.status(error.status).json({ error: error.message });
      return;
    }
    console.error(error);
    response.status(500).json({ error: "Internal server error" });
  }
}

export function postRedeemBooking(request, response) {
  const { redemptionCode } = request.body ?? {};

  if (!isNonEmptyString(redemptionCode)) {
    response.status(400).json({ error: "redemptionCode is a required string" });
    return;
  }

  try {
    const booking = redeemBooking(redemptionCode);
    response.status(200).json(booking);
  } catch (error) {
    if (error.status) {
      response.status(error.status).json({ error: error.message });
      return;
    }
    console.error(error);
    response.status(500).json({ error: "Internal server error" });
  }
}
