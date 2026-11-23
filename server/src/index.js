import express from "express";
import bookingRoutes from "./routes/bookingRoutes.js";

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());

app.use("/bookings", bookingRoutes);

app.use((request, response) => {
  response.status(404).json({ error: "Route not found" });
});

app.use((error, request, response, next) => {
  if (error.type === "entity.parse.failed") {
    response.status(400).json({ error: "Invalid JSON body" });
    return;
  }
  console.error(error);
  response.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Booking service running on http://localhost:${PORT}`);
});
