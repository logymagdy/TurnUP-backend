const Store = require("../models/storeModel");
const { calculateLiveQueue } = require("../services/queueService");
const { emitFullQueueRefresh } = require("../services/queueSocket");

// ─── GET LIVE QUEUE ───────────────────────────────────────────────────────────
// Used by Queue screen for both serviceProvider and RECEPTIONIST
// Returns: isShiftActive, queue stats, current lineup with stylist names resolved
// from store.stylists subdoc (NOT User collection — stylist is a subdoc ObjectId)
exports.getLiveQueue = async (req, res) => {
  try {
    const storeId = String(req.user.storeId);
    const today = new Date().toISOString().split("T")[0];

    // ✅ Load store to resolve stylist names and get shift status
    const store = await Store.findById(storeId).select(
      "stylists isOpen isPaused isWorkDayActive"
    );
    if (!store) return res.status(404).json({ message: "Store not found." });

    const queueData = await calculateLiveQueue(storeId, today);

    // ✅ Emit queue refresh on every fetch so dashboard stays live
    const io = req.app.get("io");
    emitFullQueueRefresh(io, storeId, queueData);

    // ✅ Resolve stylist name/photo from store.stylists subdoc
    // appointmentModel.stylist is ObjectId pointing to stylist subdoc _id
    // .populate("stylist") returns null because it's not a User — resolve manually
    const enrichedEntries = queueData.entries.map((entry) => {
      const appt = entry.toObject ? entry.toObject() : entry;

      const stylistMatch = store.stylists.find(
        (s) => String(s._id) === String(appt.stylist)
      );

      // Client name: registered client username OR walk-in name
      const clientName = appt.isWalkIn
        ? appt.walkInClientName
        : appt.client?.username || "Unknown";

      // Elapsed time in seconds for IN_SERVICE countdown timer
      let elapsedSeconds = null;
      if (appt.status === "IN_SERVICE" && appt.actualStartTime) {
        elapsedSeconds = Math.floor(
          (Date.now() - new Date(appt.actualStartTime).getTime()) / 1000
        );
      }

      return {
        appointmentId: appt._id,
        queueNumber: appt.queueNumber,
        clientName,
        clientAvatar: appt.client?.avatar || null,
        isWalkIn: appt.isWalkIn || false,
        serviceName: appt.service?.name || null,
        serviceDurationMin: appt.service?.durationMin || null,
        serviceDurationMax: appt.service?.durationMax || null,
        stylistId: appt.stylist,
        stylistName: stylistMatch?.fullName || null,
        stylistPhoto: stylistMatch?.photo || null,
        status: appt.status,
        estimatedStartTime: appt.estimatedStartTime,
        expiryTime: appt.expiryTime,
        actualStartTime: appt.actualStartTime,
        elapsedSeconds, // for IN_SERVICE timer on screen
        checkedIn: appt.checkedIn || false,
      };
    });

    return res.status(200).json({
      isShiftActive: store.isOpen && store.isWorkDayActive,
      isOpen: store.isOpen,
      isPaused: store.isPaused,
      stats: {
        totalInQueue: queueData.pendingEntries.length,
        activeCount: queueData.inServiceEntries.length,
        totalWaitTime: queueData.totalWaitTime,
      },
      entries: enrichedEntries,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};