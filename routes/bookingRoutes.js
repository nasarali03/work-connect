import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  setAvailability,
  getAvailability,
  createBooking,
  getWorkerBookings,
  getClientBookings,
  updateBookingStatus,
} from "../controllers/bookingController.js";

const router = express.Router();

// Worker availability routes
router.post("/availability", authMiddleware, setAvailability);
router.get("/availability/:workerId", authMiddleware, getAvailability);

// Booking routes
router.post("/", authMiddleware, createBooking);
router.get("/worker", authMiddleware, getWorkerBookings);
router.get("/client", authMiddleware, getClientBookings);
router.put("/:bookingId/status", authMiddleware, updateBookingStatus);

export default router;
