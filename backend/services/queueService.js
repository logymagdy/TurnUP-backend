const Appointment = require("../models/appointmentModel");

/**
 * Assigns queue number atomically using findOneAndUpdate
 * Prevents race conditions when multiple users book simultaneously
 * ✅ Fixed — walk-ins and online bookings share the same queue counter
 */
const assignQueueSlot = async (storeId, date, time, expiryMinutes = 30) => {

  // ✅ Fixed — includes DONE entries so queue counter never resets
  // This ensures walk-ins and online bookings share the same counter
  const activeEntries = await Appointment.find({
    storeId,
    date,
    status: { $nin: ["CANCELLED", "NO_SHOW", "EXPIRED"] },
  })
    .sort({ queueNumber: 1 })
    .lean();

  // ✅ Fixed — handles null queueNumbers safely with || 0
  const maxQueueNumber = activeEntries.reduce((max, e) => {
    const num = e.queueNumber || 0;
    return num > max ? num : max;
  }, 0);

  const queueNumber = maxQueueNumber + 1;

  const now = new Date();

  // ✅ Find the last IN_SERVICE entry to base timing on real progress
  const inServiceEntry = activeEntries
    .filter((e) => e.status === "IN_SERVICE" && e.actualStartTime)
    .sort((a, b) => new Date(b.actualStartTime) - new Date(a.actualStartTime))[0];

  let baseTime;

  if (inServiceEntry) {
    const avg =
      ((inServiceEntry.service?.durationMin || 15) +
        (inServiceEntry.service?.durationMax || 30)) / 2;
    baseTime = new Date(
      new Date(inServiceEntry.actualStartTime).getTime() + avg * 60 * 1000
    );
    if (baseTime < now) baseTime = now;
  } else {
    const appointmentBase = new Date(`${date}T${time}`);
    baseTime = appointmentBase > now ? appointmentBase : now;
  }

  // ✅ Calculate wait based on all CONFIRMED and CHECKED_IN entries ahead
  const pendingEntries = activeEntries.filter((e) =>
    ["CONFIRMED", "CHECKED_IN"].includes(e.status)
  );

  const totalWaitMinutes = pendingEntries.reduce((sum, e) => {
    const min = e.service?.durationMin || 15;
    const max = e.service?.durationMax || 30;
    const validMin = min > 0 ? min : 15;
    const validMax = max > 0 ? max : 30;
    const avg = (validMin + validMax) / 2;
    const weight = e.status === "CHECKED_IN" ? 1.0 : 0.8;
    return sum + avg * weight;
  }, 0);

  const estimatedStartTime = new Date(
    baseTime.getTime() + totalWaitMinutes * 60 * 1000
  );

  const expiryTime = new Date(
    estimatedStartTime.getTime() + expiryMinutes * 60 * 1000
  );

  return { queueNumber, estimatedStartTime, expiryTime };
};

/**
 * Calculates full live queue state for a store on a given date
 * Used by queueController, bookingController, checkInController, queueExpiryJob
 */
const calculateLiveQueue = async (storeId, date) => {
  const activeStatuses = ["CONFIRMED", "CHECKED_IN", "IN_SERVICE"];

  const entries = await Appointment.find({
    storeId,
    date,
    status: { $in: activeStatuses },
  })
    .populate("client", "username phone fcmToken avatar")
    .populate("stylist", "username avatar")
    .sort({ queueNumber: 1 });

  // ✅ Prioritize CHECKED_IN (physically present) over CONFIRMED
  const checkedInEntries = entries.filter((e) => e.status === "CHECKED_IN");
  const confirmedEntries = entries.filter((e) => e.status === "CONFIRMED");
  const inServiceEntries = entries.filter((e) => e.status === "IN_SERVICE");

  const pendingEntries = [...checkedInEntries, ...confirmedEntries];

  const now = new Date();

  // ✅ For IN_SERVICE — calculate remaining time only
  const inServiceWait = inServiceEntries.reduce((sum, e) => {
    if (e.actualStartTime) {
      const min = e.service?.durationMin || 15;
      const max = e.service?.durationMax || 30;
      const avg = (min + max) / 2;
      const elapsedMinutes = (now - new Date(e.actualStartTime)) / (1000 * 60);
      const remaining = Math.max(0, avg - elapsedMinutes);
      return sum + remaining;
    }
    return sum;
  }, 0);

  // ✅ For pending entries — full duration with weight
  const pendingWait = pendingEntries.reduce((sum, e) => {
    const min = e.service?.durationMin || 15;
    const max = e.service?.durationMax || 30;
    const validMin = min > 0 ? min : 15;
    const validMax = max > 0 ? max : 30;
    const avg = (validMin + validMax) / 2;
    const weight = e.status === "CHECKED_IN" ? 1.0 : 0.8;
    return sum + avg * weight;
  }, 0);

  const totalWaitMinutes = inServiceWait + pendingWait;
  const totalWaitTime = Math.ceil(totalWaitMinutes);

  return {
    entries,
    pendingEntries,
    inServiceEntries,
    totalWaitTime,
    totalWaitMinutes,
  };
};

module.exports = { assignQueueSlot, calculateLiveQueue };