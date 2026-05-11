const express = require("express");
const router = express.Router();
// #swagger.tags = ['Complaints']

const {
  submitComplaint,
  getMyComplaints,
  getStoreComplaints,
  respondToComplaint,
  getAllComplaints,
  updateComplaintStatus,
} = require("../controllers/complaintController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

// ─── CLIENT ROUTES ────────────────────────────────────────────────────────────
router.post("/submit", protect, allowRoles("CLIENT"), submitComplaint);
router.get("/my-complaints", protect, allowRoles("CLIENT"), getMyComplaints);

// ─── STORE ROUTES ─────────────────────────────────────────────────────────────
router.get(
  "/store-complaints",
  protect,
  allowRoles("serviceProvider"),
  getStoreComplaints
);
router.post(
  "/:complaintId/respond",
  protect,
  allowRoles("serviceProvider"),
  respondToComplaint
);

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────
router.get("/all", protect, allowRoles("ADMIN"), getAllComplaints);
router.patch(
  "/:complaintId/status",
  protect,
  allowRoles("ADMIN"),
  updateComplaintStatus
);

module.exports = router;