import { getUserWithBookings } from "../services/userService.js";

export function getUser(request, response) {
  try {
    const user = getUserWithBookings(request.params.id);
    response.status(200).json(user);
  } catch (error) {
    if (error.status) {
      response.status(error.status).json({ error: error.message });
      return;
    }
    console.error(error);
    response.status(500).json({ error: "Internal server error" });
  }
}
