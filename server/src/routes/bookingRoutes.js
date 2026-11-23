import { Router } from "express";
import { postBooking } from "../controllers/bookingController.js";

const bookingRoutes = Router();

bookingRoutes.post("/", postBooking);

export default bookingRoutes;
