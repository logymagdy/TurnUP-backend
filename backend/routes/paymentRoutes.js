const express = require("express");
const router = express.Router();
// #swagger.tags = ['Payments']
const {
  initiatePayment,
  paymobWebhook,
  confirmCashPayment,
  confirmCashCollected,
  getMyPayments,
} = require("../controllers/paymentController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

// ─── CLIENT ROUTES ────────────────────────────────────────────────────────────
router.post("/initiate", protect, allowRoles("CLIENT"), initiatePayment);
router.post("/cash", protect, allowRoles("CLIENT"), confirmCashPayment);
router.get("/my-payments", protect, allowRoles("CLIENT"), getMyPayments);

// ─── RECEPTIONIST ROUTES ──────────────────────────────────────────────────────
router.put(
  "/:appointmentId/cash-collected",
  protect,
  allowRoles("RECEPTIONIST"),
  confirmCashCollected
);

// ─── PAYMOB WEBHOOK — no auth, HMAC verified inside controller ────────────────
router.post("/webhook/paymob", paymobWebhook);

module.exports = router;