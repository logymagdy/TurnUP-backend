const express = require("express");
const router = express.Router();
// #swagger.tags = ['Payments']

const {
  initiatePayment,
  paymobWebhook,
  confirmPayAtStore,
  confirmCashCollected,
  getMyPayments,
  sendTip,
} = require("../controllers/paymentController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

// ─── CLIENT ───────────────────────────────────────────────────────────────────
router.post("/initiate", protect, allowRoles("CLIENT"), initiatePayment);
router.post("/pay-at-store", protect, allowRoles("CLIENT"), confirmPayAtStore);
router.get("/my-payments", protect, allowRoles("CLIENT"), getMyPayments);

// ✅ Digital tip — client tips stylist via Instapay after service is DONE
router.post("/tip", protect, allowRoles("CLIENT"), sendTip);

// ─── RECEPTIONIST ─────────────────────────────────────────────────────────────
router.put(
  "/:appointmentId/collected",
  protect,
  allowRoles("RECEPTIONIST"),
  confirmCashCollected
);

// ─── PAYMOB WEBHOOK — no auth, HMAC verified ──────────────────────────────────
router.post("/webhook/paymob", paymobWebhook);

module.exports = router;