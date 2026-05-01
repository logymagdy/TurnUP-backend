const express = require("express");
const router = express.Router();
const { checkIn } = require("../controllers/checkInController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

// CLIENT scans QR code to check in
router.post("/", protect, allowRoles("CLIENT"), checkIn);

module.exports = router;