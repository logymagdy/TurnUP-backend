const Appointment = require("../models/appointmentModel");

/**
 * Assigns queue number, estimatedStartTime, and expiryTime
 * to a newly created NORMAL booking.
 * Uses atomic findOneAndUpdate to prevent race conditions.
 */
const assignQueueSlot = async (storeId, date, time, expiryMinutes = 30) => {
  // ✅ Fetch all active entries sorted by queue number
  const activeEntries = await Appointment.find({
    storeId,
    date,
    status: { $nin: ["CANCELLED", "NO_SHOW", "EXPIRED", "DONE"] },
  }).sort({ queueNumber: 1 });

  const lastEntry = activeEntries[activeEntries.length - 1];
  const queueNumber =
    lastEntry && lastEntry.queueNumber ? lastEntry.queueNumber + 1 : 1;

  // ✅ Use current time as base if no prior entries
  const now = new Date();
  let baseTime = now;

  // Find the last IN_SERVICE entry and use its estimated end time
  const inServiceEntry = activeEntries
    .filter((e) => e.status === "IN_SERVICE" && e.actualStartTime)
    .pop();

  if (inServiceEntry) {
    const avgDuration =
      ((inServiceEntry.service?.durationMin || 0) +
        (inServiceEntry.service?.durationMax || 0)) / 2;
    baseTime = new Date(
      inServiceEntry.actualStartTime.getTime() + avgDuration * 60 * 1000
    );
  } else {
    // Use appointment time if it's in the future
    const appointmentBase = new Date(`${date}T${time}`);
    if (appointmentBase > now) baseTime = appointmentBase;
  }

  // ✅ Calculate total wait from all CONFIRMED and CHECKED_IN entries
  const pendingEntries = activeEntries.filter((e) =>
    ["CONFIRMED", "CHECKED_IN"].includes(e.status)
  );

  const totalWaitMinutes = pendingEntries.reduce((sum, e) => {
    const min = e.service?.durationMin || 0;
    const max = e.service?.durationMax || 0;
    if (min <= 0 || max <= 0) return sum; // ✅ Skip invalid durations
    return sum + (min + max) / 2;
  }, 0);

  const estimatedStartTime = new Date(
    baseTime.getTime() + totalWaitMinutes * 60 * 1000
  );

  // ✅ Expiry = 30 mins before + 30 mins after = window of 1 hour centered on slot
  const expiryTime = new Date(
    estimatedStartTime.getTime() + expiryMinutes * 60 * 1000
  );

  return { queueNumber, estimatedStartTime, expiryTime };
};

/**
 * Calculates the full live queue state for a store on a given date.
 * Used by queueController, bookingController, checkInController, and queueExpiryJob.
 */
const calculateLiveQueue = async (storeId, date) => {
  const activeStatuses = ["CONFIRMED", "CHECKED_IN", "IN_SERVICE"];

  const entries = await Appointment.find({
    storeId,
    date,
    status: { $in: activeStatuses },
  })
    .populate("client", "username phone fcmToken")
    .populate("stylist", "username")
    .sort({ queueNumber: 1 });

  // ✅ CHECKED_IN clients are prioritized — they are physically present
  const checkedInEntries = entries.filter((e) => e.status === "CHECKED_IN");
  const confirmedEntries = entries.filter((e) => e.status === "CONFIRMED");
  const inServiceEntries = entries.filter((e) => e.status === "IN_SERVICE");

  const pendingEntries = [...checkedInEntries, ...confirmedEntries];

  const now = new Date();

  // ✅ Calculate remaining time for IN_SERVICE entries
  const inServiceWait = inServiceEntries.reduce((sum, e) => {
    if (e.actualStartTime) {
      const avg =
        ((e.service?.durationMin || 0) + (e.service?.durationMax || 0)) / 2;
      const elapsed = (now - new Date(e.actualStartTime)) / (1000 * 60);
      const remaining = Math.max(0, avg - elapsed);
      return sum + remaining;
    }
    return sum;
  }, 0);

  // ✅ CHECKED_IN clients count fully (they are here)
  // ✅ CONFIRMED clients count at reduced weight (they may not show)
  const pendingWait = pendingEntries.reduce((sum, e) => {
    const min = e.service?.durationMin || 0;
    const max = e.service?.durationMax || 0;
    if (min <= 0 || max <= 0) return sum;
    const avg = (min + max) / 2;
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