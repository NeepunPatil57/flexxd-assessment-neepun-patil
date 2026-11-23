import { Router } from "express";
import { postBooking, postRedeemBooking } from "../controllers/bookingController.js";

const bookingRoutes = Router();

bookingRoutes.post("/", postBooking);
bookingRoutes.post("/redeem", postRedeemBooking);

export default bookingRoutes;
