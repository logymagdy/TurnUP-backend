const Appointment = require("../models/appointmentModel");
const Store = require("../models/storeModel");
const { sendNotification } = require("../services/notificationService");
const { calculateLiveQueue } = require("../services/queueService");
const { emitQueueUpdate, emitFullQueueRefresh } = require("../services/queueSocket");

// ─── QR CHECK-IN ──────────────────────────────────────────────────────────────
// Called when client scans the store QR code
// QR contains storeId — system matches it to client's active booking
exports.checkIn = async (req, res) => {
  try {
    const { storeId } = req.body;
    const clientId = req.user.id;
    const today = new Date().toISOString().split("T")[0];

    // ── 1. Find client's active booking for today at this store ────────
    const appointment = await Appointment.findOne({
      storeId,
      client: clientId,
      date: today,
      status: { $in: ["PENDING", "CONFIRMED"] },
    });

    if (!appointment) {
      return res.status(404).json({
        message: "No active booking found for today at this store.",
      });
    }

    // ── 2. Prevent double check-in ─────────────────────────────────────
    if (appointment.checkedIn) {
      return res.status(400).json({
        message: "You have already checked in for this booking.",
      });
    }

    // ── 3. Check booking has not expired ───────────────────────────────
    const now = new Date();