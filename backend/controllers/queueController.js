const { calculateLiveQueue } = require("../services/queueService");
const { emitFullQueueRefresh } = require("../services/queueSocket");

// ─── GET LIVE QUEUE ───────────────────────────────────────────────────────────
// Response layer only — all calculations handled by queueService
// Excludes NO_SHOW, CANCELLED, EXPIRED, and DONE entries
exports.getLiveQueue = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const queueData = await calculateLiveQueue(
      String(req.user.storeId),
      today
    );

    if (!queueData.entries || queueData.entries.length === 0) {
      return res.status(404).json({ message: "No active queue for today." });
    }

    // Emit full queue refresh to store dashboard
    const io = req.app.get("io");
    emitFullQueueRefresh(io, String(req.user.storeId), queueData);

    return res.status(200).json({
      totalWaitTime: queueData.totalWaitTime,
      totalInQueue: queueData.pendingEntries.length,
      entries: queueData.entries,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};