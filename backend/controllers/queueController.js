const Appointment = require("../models/appointmentModel");

// ─── GET LIVE QUEUE ───────────────────────────────────────────────────────────
// Read-only — displays today's live queue sorted by queue number
// Excludes NO_SHOW, CANCELLED, and EXPIRED entries
// All core logic (queue number assignment, check-in, expiry, penalties)
// is handled in bookingController, checkInController, and background jobs
exports.getLiveQueue = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const entries = await Appointment.find({
      storeId: req.user.storeId,
      date: today,
      status: { $nin: ["NO_SHOW", "CANCELLED", "EXPIRED"] },
    })
      .populate("client", "name photo")
      .populate("stylist", "name")
      .sort({ queueNumber: 1 });

    if (!entries || entries.length === 0) {
      return res.status(404).json({ message: "No active queue for today." });
    }

    // Calculate total wait time from entries still waiting or checked in
    const pendingEntries = entries.filter((e) =>
      ["PENDING", "CONFIRMED", "CHECKED_IN"].includes(e.status)
    );

    const totalWaitMinutes = pendingEntries.reduce((sum, e) => {
      const avg =
        ((e.service.durationMin || 0) + (e.service.durationMax || 0)) / 2;
      return sum + avg;
    }, 0);

    const hours = Math.floor(totalWaitMinutes / 60);
    const minutes = Math.round(totalWaitMinutes % 60);
    const totalWaitTime =
      hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    // Emit real-time queue update to store dashboard
    const io = req.app.get("io");
    if (io) {
      io.to(`store:${req.user.storeId}`).emit("queueUpdated", {
        type: "QUEUE_UPDATED",
        totalWaitTime,
        totalInQueue: pendingEntries.length,
        entries,
      });
    }

    return res.status(200).json({
      totalWaitTime,
      totalInQueue: pendingEntries.length,
      entries,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};