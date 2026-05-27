const express = require("express");
const router = express.Router();
// #swagger.tags = ['Payments']

const {
  initiatePayment,
  paymobWebhook,
  payAtStore,
  confirmPayAtStoreCollected,
  getMyPayments,
} = require("../controllers/paymentController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

// ─── CLIENT ───────────────────────────────────────────────────────────────────
router.post("/initiate", protect, allowRoles("CLIENT"), initiatePayment);
router.post("/pay-at-store", protect, allowRoles("CLIENT"), payAtStore);
router.get("/my-payments", protect, allowRoles("CLIENT"), getMyPayments);

// ─── RECEPTIONIST ─────────────────────────────────────────────────────────────
router.put(
  "/:appointmentId/collected",
  protect,
  allowRoles("RECEPTIONIST"),
  confirmPayAtStoreCollected
);

// ─── PAYMOB WEBHOOK — no auth, HMAC verified ──────────────────────────────────
router.post("/webhook/paymob", paymobWebhook);

module.exports = router;