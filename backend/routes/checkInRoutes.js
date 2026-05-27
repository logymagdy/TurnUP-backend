const express = require("express");
const router = express.Router();
// #swagger.tags = ['Check-In']

const { checkIn, addWalkIn } = require("../controllers/checkInController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

// ✅ CLIENT scans QR code to check in
router.post("/", protect, allowRoles("CLIENT"), checkIn);

// ✅ RECEPTIONIST adds walk-in client to queue
router.post("/walk-in", protect, allowRoles("RECEPTIONIST"), addWalkIn);

module.exports = router;