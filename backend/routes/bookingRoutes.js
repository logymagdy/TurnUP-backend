const express = require("express");
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getStoreBookings,
  cancelBooking,
} = require("../controllers/bookingController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

// ─── CLIENT ROUTES ────────────────────────────────────────────────────────────
router.post("/create", protect, allowRoles("CLIENT"), createBooking);
router.get("/my-bookings", protect, allowRoles("CLIENT"), getMyBookings);
router.put("/:bookingId/cancel", protect, allowRoles("CLIENT"), cancelBooking);

// ─── STORE ROUTES ─────────────────────────────────────────────────────────────
router.get(
  "/store-bookings",
  protect,
  allowRoles("serviceProvider", "RECEPTIONIST"),
  getStoreBookings
);

module.exports = router;